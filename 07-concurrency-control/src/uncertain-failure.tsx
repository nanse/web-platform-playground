import { useState } from 'react'
import { bullets, Code, ExplainTitle, Lead, numbered, strong, Topic } from '../../shared/explain'
import { Button, Card, Note, Screen, useNav } from '../../shared/ui'
import { applyApi, JOBS, LABEL, Steps, wait, type Reply, type Step } from './apply'
import { Diagram } from './diagram'
import { COOLDOWN_ALT } from './failure-cooldown'

// 2-4. 지원 상태는 0.5초부터 두 배씩 늘려 물어보고, 6초를 넘기면 그만 물어봐요.
const BACKOFF_MS = [500, 1000, 2000, 4000]
const MAX_WAIT_MS = 6000

const CASES = {
  lost: { title: '채용 시스템 응답만 잃어버림', summary: '지원서는 들어갔는데 응답이 안 왔어요(타임아웃)', jobId: 1001, faults: ['lost'] },
  down: { title: '채용 시스템이 잠깐 오류', summary: '두 번 실패하고 세 번째에 받아요', jobId: 1001, faults: ['down', 'down'] },
  outage: { title: '채용 시스템이 계속 오류', summary: '다시 보내기 상한(3초)을 넘겨요', jobId: 1001, faults: Array(8).fill('down') },
  closed: { title: '마감된 공고', summary: '확정 실패예요. 화면은 같은 공고로 다시 보내지 않아요', jobId: 2001, faults: [] },
}
type Case = keyof typeof CASES

type View = 'idle' | 'PENDING' | 'slow' | 'SUBMITTED' | 'FAILED' | 'MANUAL_REVIEW'

const VIEW: Record<View, { title: string; body: string }> = {
  idle: { title: '지원서를 보낼 준비가 됐어요', body: '지원하기를 누르면 기업에 지원서를 보내요.' },
  PENDING: { title: '지원서를 보내는 중이에요', body: '기업에 잘 들어갔는지 확인하고 있어요.' },
  slow: { title: '지원서를 확인하고 있어요', body: '조금 오래 걸리고 있어요. 확인되면 알림으로 알려 드릴게요.' },
  SUBMITTED: { title: '지원을 마쳤어요', body: '지원 현황에서 진행 상황을 볼 수 있어요.' },
  FAILED: { title: '마감된 공고예요', body: '비슷한 공고를 찾아 드릴게요.' },
  MANUAL_REVIEW: { title: '지원서를 확인하고 있어요', body: '담당자가 확인하고 있어요. 확인되면 알림으로 알려 드릴게요.' },
}

const RECONCILE_CODE = `async function reconcile(application) {
  // 진실의 원천(기업 채용 시스템)부터 다시 봐요
  if (await ats.has(application.applicationId)) return markSubmitted(application)
  try {
    await ats.send(application.applicationId, resume) // 같은 application_id(멱등키)로 다시 보내요
    markSubmitted(application)
  } catch (error) {
    if (classify(error) === 'definitive') return markFailed(application, error.code)
    retryLater(application) // 0.3초 → 0.6 → 1.2초, 최대 4번·3초 안에서
  }
}

function retryLater(application) {
  const delay = baseMs * 2 ** application.retries
  if (application.retries >= maxAttempts || elapsed(application) + delay > maxTotalMs) {
    application.status = 'MANUAL_REVIEW' // 수동 확인 대상
    return notifyOps(application)        // 운영팀에 알려요
  }
  setTimeout(() => reconcile(application), delay)
}`

const POLL_CODE = `const backoff = [500, 1000, 2000, 4000]
let waited = 0

for (const delay of backoff) {
  if (waited + delay > MAX_WAIT_MS) break // 최대 대기를 넘기면 그만 물어봐요
  await wait(delay)
  waited += delay
  const { status } = await getApplication(applicationId)
  if (status !== 'PENDING') return show(status)
}
show('지원서를 확인하고 있어요') // 실패가 아니에요`

function Explainer() {
  return (
    <>
      <ExplainTitle>불확정은 실패로 굳히지 않아요</ExplainTitle>
      <Lead>
        이 화면도 다시 맞추는 일은 <strong className={strong}>서버</strong>가 해요. 기업 채용 시스템이 타임아웃을 냈다고 지원서가 안 들어간 건 아니에요. 들어갔는데 응답만 잃어버렸을 수 있어요. 여기서 "지원 실패"로 굳히면 사용자가
        다시 지원하다 중복 지원이 되고, 그냥 다시 보내면 기업이 같은 지원서를 두 번 받을 수 있어요. 그래서 <strong className={strong}>PENDING으로 두고,
        채용 시스템부터 다시 본 뒤</strong> 같은 application_id로 다시 보내요.
      </Lead>
      <Diagram name="failure-cooldown" alt={COOLDOWN_ALT} />
      <Topic icon="🔁" title="2-3. (서버) 다시 맞추는 순서">
        <ol className={numbered}>
          <li>지원서를 PENDING으로 남기고, 화면에는 202(접수했고 확인 중)로 답해요.</li>
          <li>다시 보내기 전에 기업 채용 시스템에 그 application_id가 있는지 먼저 봐요. 있으면 SUBMITTED로 맞추고 끝내요.</li>
          <li>없으면 같은 application_id(멱등키)로 다시 보내요. 채용 시스템은 같은 application_id를 한 번만 받아요.</li>
          <li>다시 보내기는 지수 백오프로 하고, 최대 횟수와 총 시간 상한을 둬요. 넘기면 수동 확인으로 넘기고 운영팀에 알려요.</li>
        </ol>
        <Code code={RECONCILE_CODE} />
      </Topic>
      <Topic icon="📱" title="2-4. (프론트엔드) 화면 쪽 쿨다운">
        <ul className={bullets}>
          <li>지원 상태는 백오프로 물어보고, 최대 대기 시간을 둬요. 이 화면은 0.5 → 1 → 2초 간격으로 묻고 6초 전에 멈춰요. 끝난 상태를 받으면 바로 멈춰요.</li>
          <li>PENDING이 길어져도 실패라고 하지 않아요. "지원서를 확인하고 있어요"를 보여줘요.</li>
          <li>확정 실패(4xx)를 받으면 같은 공고로 다시 보내지 않아요.</li>
        </ul>
        <Code code={POLL_CODE} />
      </Topic>
    </>
  )
}

export function UncertainFailure({ feature }: { feature: { id: string; icon: string } }) {
  const { back } = useNav()
  const [mode, setMode] = useState<Case>('lost')
  const [busy, setBusy] = useState(false)
  const [view, setView] = useState<View>('idle')
  const [steps, setSteps] = useState<Step[]>([])
  const [server, setServer] = useState<Reply['body'] | null>(null)

  async function start() {
    const { jobId, faults } = CASES[mode]
    setBusy(true)
    setSteps([])
    setServer(null)
    const add = (step: Step) => setSteps((prev) => [...prev, step])
    const finish = (next: View) => {
      setView(next)
      setBusy(false)
    }

    await applyApi.prepare({ faults })
    const t0 = performance.now()
    const applied = await applyApi.apply(jobId)
    const { code, status, applicationId } = applied.body
    add({
      label: '지원',
      detail: `POST /api/applications → ${applied.status} ${LABEL[status ?? code!]}${status && code ? ` (${LABEL[code]})` : ''}`,
      tone: applied.status >= 400 ? 'fail' : applied.status === 202 ? 'wait' : 'done',
      at: performance.now() - t0,
    })
    if (applied.status >= 400) {
      // 확정 실패예요. 같은 공고로 다시 보내지 않아요.
      add({ label: '멈춤', detail: '확정 실패라 같은 공고로 다시 보내지 않아요', tone: 'fail', at: performance.now() - t0 })
      return finish('FAILED')
    }
    if (status === 'SUBMITTED') return finish('SUBMITTED')

    // 202 PENDING: 다시 보내는 건 서버가 해요. 화면은 상태만 백오프로 물어봐요.
    setView('PENDING')
    let waited = 0
    for (const delay of BACKOFF_MS) {
      if (waited + delay > MAX_WAIT_MS) break
      await wait(delay)
      waited += delay
      const { body } = await applyApi.status(applicationId!)
      setServer(body)
      add({
        label: '조회',
        detail: `GET /api/applications/${applicationId} → ${LABEL[body.status!]}`,
        tone: body.status === 'PENDING' ? 'wait' : body.status === 'SUBMITTED' ? 'done' : 'fail',
        at: performance.now() - t0,
      })
      if (body.status !== 'PENDING') return finish(body.status as View)
    }
    // 최대 대기를 넘겼어요. 실패가 아니라 "확인하고 있어요"로 둬요.
    add({ label: '멈춤', detail: `다음 조회는 최대 대기(${MAX_WAIT_MS / 1000}초)를 넘겨서 그만 물어봐요`, tone: 'wait', at: performance.now() - t0 })
    finish('slow')
  }

  const job = JOBS[CASES[mode].jobId]

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['서버 · PENDING', '서버 · application_id', '화면 · 백오프 폴링']}
      title={'채용 시스템이 답하지 않으면\n지원은 어떻게 될까요?'}
      description="지원하기를 누르면 원티드 서버가 지원서를 만들어 기업 채용 시스템에 보내요. 실패를 다시 맞추는 건 서버(2-3)가, 지원 상태를 백오프로 물어보는 건 화면(2-4)이 해요. 채용 시스템 상태를 골라 보세요."
      cta={
        <Button onClick={start} disabled={busy}>
          {busy ? '지원서를 확인하는 중이에요' : '지원하기'}
        </Button>
      }
    >
      <Card title={`원티드랩 · ${job.title}`}>
        <p className="text-[20px] font-bold text-grey-900">{VIEW[view].title}</p>
        <p className="mt-1 text-[15px] text-grey-600">{VIEW[view].body}</p>
      </Card>
      <fieldset className="flex flex-col gap-2" disabled={busy}>
        <legend className="mb-2 text-[15px] font-semibold text-grey-700">기업 채용 시스템 상태</legend>
        {(Object.keys(CASES) as Case[]).map((key) => (
          <label
            key={key}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
              mode === key ? 'border-primary bg-primary-weak' : 'border-grey-200 hover:bg-grey-50'
            }`}
          >
            <input
              type="radio"
              name="ats"
              checked={mode === key}
              onChange={() => {
                setMode(key)
                setView('idle')
              }}
              className="size-5 shrink-0 accent-primary"
            />
            <span>
              <span className="block text-[15px] font-semibold text-grey-900">{CASES[key].title}</span>
              <span className="mt-0.5 block text-[14px] text-grey-500">{CASES[key].summary}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <Steps title="화면이 보낸 요청 · 프론트엔드(2-4)" steps={steps} />
      {server?.events && (
        <Card title="서버 기록 · 서버(2-3) · 조회 응답에 학습용으로 실려 와요">
          <ol className="flex flex-col gap-1.5 text-[14px] leading-[1.6]">
            {server.events.map((event, i) => (
              <li key={i} className="flex gap-3 text-grey-700">
                <span className="w-10 shrink-0 text-grey-500 tabular-nums">{(event.at / 1000).toFixed(1)}초</span>
                <span>{event.text}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[14px] text-grey-500">
            채용 시스템에 보낸 횟수 {server.atsSends}번 · 채용 시스템에 {server.inAts ? '들어가 있어요' : '없어요'}
          </p>
          {server.alerts?.map((alert) => (
            <p key={alert} className="mt-2 text-[14px] text-danger">
              🔔 운영팀 알림: {alert}
            </p>
          ))}
        </Card>
      )}
      <Note>채용 시스템 장애는 서버가 일부러 일으켜요. 버튼을 누르면 실험 준비 요청(/api/lab/scenario)이 먼저 한 번 나가요.</Note>
      <hr className="-mx-6 mt-6 h-3 border-0 bg-grey-100" />
      <Explainer />
    </Screen>
  )
}
