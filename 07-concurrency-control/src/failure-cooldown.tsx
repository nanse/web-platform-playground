import { useState } from 'react'
import { bullets, Code, ExplainTitle, Lead, numbered, strong, Topic } from '../../shared/explain'
import { Button, Note, Result, Screen, useNav } from '../../shared/ui'
import { applyApi, JOBS, LABEL, remaining, Steps, wait, type Reply, type Step } from './apply'
import { Diagram } from './diagram'

// 같은 요청 사이 간격. 0.3초 만에 다시 와도 캐시가 바로 답하는지 봐요.
const GAP_MS = 300

const CASES = {
  closed: {
    title: '마감된 공고에 지원',
    summary: '①②③ 마감된 프로덕트 디자이너 공고 · ④ 프론트엔드 개발자 공고',
    jobs: [2001, 2001, 2001, 1001],
  },
  applied: {
    title: '이미 지원한 공고에 또 지원',
    summary: '①②③ 지원을 마친 프론트엔드 개발자 공고 · ④ 백엔드 개발자 공고',
    jobs: [1001, 1001, 1001, 1002],
    setup: { applied: [1001] },
  },
  limit: {
    title: '오늘 지원 한도를 넘김',
    summary: '오늘 이미 3곳에 지원했어요 · ①②③ 같은 공고 · ④ 다른 공고',
    jobs: [1001, 1001, 1001, 1002],
    setup: { dailyUsed: 3 },
  },
  macro: {
    title: '매크로처럼 연달아 지원',
    summary: '지원서를 하나 만들면 2초 동안 새 지원을 막아요 · ①②③ 서로 다른 공고에 0.3초 간격 · ④ 2초 쉬고',
    jobs: [1001, 1002, 1003, 1004],
    lastWaitMs: 2100,
  },
}
type Case = keyof typeof CASES

const CLASSIFY_CODE = `// 2-1. 모든 실패를 둘 중 하나로 나눠요
function classify(error) {
  if (!(error instanceof ApplyError)) return 'indeterminate' // 모르는 오류는 들어갔을 수도 있어요
  switch (error.code) {
    case 'JOB_CLOSED': case 'NO_RESUME': case 'NOT_OWNER': // 입력이 틀렸어요
    case 'DAILY_LIMIT': case 'RATE_LIMITED':               // 정책에 걸렸어요
    case 'ALREADY_APPLIED':                                 // 이미 끝났어요
      return 'definitive'
    case 'DB_TIMEOUT': case 'ATS_TIMEOUT':                  // 닿았는지 몰라요
    case 'ATS_5XX': case 'COMMIT_LOST':
      return 'indeterminate'
  }
}`

const CACHE_CODE = `// 실패를 만든 입력이 키예요: 공고 때문이면 사람+공고, 사람 때문이면 사람
const cached = cooldown.get(\`user:\${userId}:job:\${jobId}\`) ?? cooldown.get(\`user:\${userId}\`)
if (cached) return { status: httpOf(cached.code), code: cached.code } // 처리하지 않고 바로

try {
  await submit(userId, jobId)
  cooldown.delete(\`user:\${userId}:job:\${jobId}\`)   // 성공하면 바로 지워요
} catch (error) {
  if (classify(error) === 'definitive') {
    cooldown.set(cooldownKey(error.code, userId, jobId), error.code, cooldownUntil(error.code))
    return { status: httpOf(error.code) }              // 4xx: 다시 보내도 같아요
  }
  return { status: 202 }                               // 불확정: 캐시하지 않고 PENDING으로 둬요
}`

export const COOLDOWN_ALT =
  '지원하기 API 서버 안에서 일어나는 일이에요. 지원하기 요청이 오면 쿨다운 캐시부터 봐요. 있으면 처리하지 않고 캐시된 실패를 4xx로 돌려줘요. 없으면 처리하고, 실패하면 확정인지 불확정인지 나눠요. 확정 실패만 정책에 맞는 TTL로 캐시하고 4xx로 답해요. 불확정 실패는 캐시하지 않고 지원서를 PENDING으로 둔 채 202로 답한 뒤, 기업 채용 시스템에 application_id가 있는지부터 확인해요. 있으면 SUBMITTED, 없으면 같은 application_id로 지수 백오프 재전송을 하고, 상한을 넘기면 수동 확인과 운영팀 알림으로 넘겨요.'

function Explainer() {
  return (
    <>
      <ExplainTitle>서버가 실패도 캐시해요. 단, 확정 실패만요</ExplainTitle>
      <Lead>
        실패 쿨다운 캐시는 <strong className={strong}>서버 쪽 구현</strong>이에요. 지원하기는 버튼을 여러 번 누르거나, 앱이 다시 보내거나, 매크로가
        계속 보내서 같은 요청이 여러 번 올 수 있어요. 서버는 다시 해도 결과가 같은 실패를 잠깐 기억해 뒀다가 <strong className={strong}>처리하지 않고
        바로</strong> 돌려줘요. DB와 기업 채용 시스템을 아끼고, 같은 답을 빠르게 줘요.
      </Lead>
      <Diagram name="failure-cooldown" alt={COOLDOWN_ALT} />
      <Topic icon="🖥️" title="왜 서버에서 해요?">
        <ul className={bullets}>
          <li>
            <strong className={strong}>같은 요청이 여러 곳에서 와요.</strong> 버튼 연타, 앱의 재시도, 다른 탭과 기기, 매크로까지요. 화면 하나가 기억해도 다른
            곳에서 온 요청은 막지 못해요. 모든 요청이 지나는 서버가 막아요.
          </li>
          <li>
            <strong className={strong}>매크로·어뷰징 막기는 클라이언트를 믿을 수 없어요.</strong> 화면 코드는 고치거나 건너뛸 수 있어서, 연달아 지원 막기도
            서버가 해요.
          </li>
          <li>
            <strong className={strong}>아끼려는 게 서버 자원이에요.</strong> 마감된 공고를 매번 DB에서 다시 확인하거나, 채용 시스템에 다시 묻지 않게 해요.
          </li>
        </ul>
        <p>
          프론트엔드는 서버가 준 답을 따라요. 4xx면 같은 공고로 다시 보내지 않고, 202면 지원 상태를 백오프로 물어봐요(2-4, "불확정 실패 다시 맞추기"
          화면).
        </p>
      </Topic>
      <Topic icon="🗂️" title="2-1. (서버) 실패를 두 종류로 나눠요">
        <ul className={bullets}>
          <li>
            <strong className={strong}>확정 실패:</strong> 다시 해도 결과가 같아요. 마감된 공고, 이력서 없음, 내 이력서가 아님, 하루 지원 한도 초과,
            너무 빨리 연달아 지원, 이미 지원함.
          </li>
          <li>
            <strong className={strong}>불확정:</strong> 실제로는 지원서가 들어갔을 수도 있어요. DB 타임아웃, 기업 채용 시스템 타임아웃·5xx, 저장 응답
            유실. 모르는 오류도 여기에 넣어요.
          </li>
        </ul>
        <Code code={CLASSIFY_CODE} />
      </Topic>
      <Topic icon="🧊" title="2-2. (서버) 확정 실패만 쿨다운 캐시해요">
        <ol className={numbered}>
          <li>
            캐시 키는 실패를 만든 입력 그 자체예요. 마감·중복처럼 <strong className={strong}>공고 때문이면 사람+공고</strong>(user_id + job_id)라서, 다른
            공고는 캐시를 거치지 않아요. 하루 한도처럼 <strong className={strong}>사람 때문이면 사람</strong>(user_id)이라서, 다른 공고도 막아요.
          </li>
          <li>쿨다운은 짧게(설정값, 이 샘플은 5초) 둬요. 그 키로 지원이 성공하면 바로 지워요.</li>
          <li>하루 지원 한도는 정책에 맞춰 자정까지 둬요.</li>
          <li>연달아 지원(매크로) 막기도 같은 캐시로 해요. 지원서를 하나 만들면 그 사람 키에 2초짜리 RATE_LIMITED를 미리 넣어 둬요.</li>
        </ol>
        <Code code={CACHE_CODE} />
      </Topic>
      <Topic icon="📮" title="(서버 → 화면) 응답 코드로 다시 보낼지 알려줘요">
        <ul className={bullets}>
          <li>확정 실패는 4xx예요. 화면은 같은 공고로 다시 보내지 않아요.</li>
          <li>불확정은 202예요. "접수했고 들어갔는지 확인 중이에요"라는 뜻이에요. 다시 보내는 건 서버가 맡고, 화면은 상태만 물어봐요.</li>
          <li>
            원래 설계(광고 보상)는 광고 네트워크가 보내는 콜백이라 확정은 2xx, 불확정은 5xx로 답해서 광고 네트워크가 다시 보내게 했어요. 지원하기는 화면이
            부르는 API라 4xx와 202로 같은 뜻을 전해요.
          </li>
        </ul>
      </Topic>
    </>
  )
}

export function FailureCooldown({ feature }: { feature: { id: string; icon: string } }) {
  const { back } = useNav()
  const [mode, setMode] = useState<Case>('closed')
  const [busy, setBusy] = useState(false)
  const [steps, setSteps] = useState<(Step & { fromCache: boolean })[]>([])

  async function start() {
    const plan = CASES[mode]
    setBusy(true)
    setSteps([])
    await applyApi.prepare('setup' in plan ? plan.setup : {})
    const t0 = performance.now()
    const add = (label: string, jobId: number, { status, body }: Reply) => {
      const result = body.code ? LABEL[body.code] : LABEL[body.status!]
      const how = body.fromCache
        ? `서버 쿨다운 캐시가 답함 (${remaining(body.cooldownMs!)} 남음)`
        : body.cooldownMs
          ? `서버가 처리함 → 쿨다운 캐시에 ${remaining(body.cooldownMs)} 저장`
          : '서버가 처리함'
      const step = {
        label,
        detail: `${JOBS[jobId].title} → ${status} ${result} · ${how}`,
        tone: body.fromCache ? 'cache' : status >= 400 ? 'fail' : 'done',
        at: performance.now() - t0,
        fromCache: Boolean(body.fromCache),
      } as const
      setSteps((prev) => [...prev, step])
    }

    for (const [i, jobId] of plan.jobs.entries()) {
      if (i === 3) await wait('lastWaitMs' in plan ? plan.lastWaitMs : 0)
      else if (i > 0) await wait(GAP_MS)
      add('①②③④'[i], jobId, await applyApi.apply(jobId))
    }
    setBusy(false)
  }

  const cachedCount = steps.slice(0, 3).filter((step) => step.fromCache).length
  const done = !busy && steps.length === 4

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['서버', '쿨다운 캐시', '확정 실패']}
      title={'안 되는 지원이 또 오면\n서버가 또 처리해야 할까요?'}
      description="실패 쿨다운 캐시는 서버 쪽 구현이에요. 화면은 평소처럼 지원하기를 보내요. 0.3초 간격으로 세 번(①②③), 공고를 바꿔 한 번(④) 보내서, 서버가 실제로 처리하는지 쿨다운 캐시가 바로 답하는지 봐요."
      cta={
        <Button onClick={start} disabled={busy}>
          {busy ? '지원하는 중이에요' : '지원하기 세 번, 다른 공고 한 번'}
        </Button>
      }
    >
      {done && (
        <Result>
          서버는 ①②③ 중 {3 - cachedCount}번만 실제로 처리했고, {cachedCount}번은 서버 쿨다운 캐시가 바로 답했어요. ④는{' '}
          {steps[3].fromCache ? '사람 키라서 다른 공고도 캐시가 답했어요.' : '캐시를 거치지 않고 서버가 처리했어요.'}
        </Result>
      )}
      <fieldset className="flex flex-col gap-2" disabled={busy}>
        <legend className="mb-2 text-[15px] font-semibold text-grey-700">어떤 실패인가요?</legend>
        {(Object.keys(CASES) as Case[]).map((key) => (
          <label
            key={key}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
              mode === key ? 'border-primary bg-primary-weak' : 'border-grey-200 hover:bg-grey-50'
            }`}
          >
            <input type="radio" name="case" checked={mode === key} onChange={() => setMode(key)} className="size-5 shrink-0 accent-primary" />
            <span>
              <span className="block text-[15px] font-semibold text-grey-900">{CASES[key].title}</span>
              <span className="mt-0.5 block text-[14px] text-grey-500">{CASES[key].summary}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <Steps title="화면이 보낸 지원하기와 서버의 답" steps={steps} />
      <Note>버튼을 누르면 실험 준비 요청(/api/lab/scenario)이 먼저 한 번 나가요. 그다음 지원하기(/api/applications) 네 번만 나가요.</Note>
      <hr className="-mx-6 mt-6 h-3 border-0 bg-grey-100" />
      <Explainer />
    </Screen>
  )
}
