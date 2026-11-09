import { useState } from 'react'
import { Button, Card, Note, Result, Screen, useNav, type FeatureRef } from '../../shared/ui'
import { bullets, Code, ExplainTitle, Lead, strong, Topic } from '../../shared/explain'
import { Choice } from './choice'
import { freeze, MainThreadMeter, nextFrame, useMainThreadMeter } from './meter'
import { countPrimes } from './primes'
import { Report } from './report'

const LIMIT = 5_000_000
const CHUNK = 50_000 // 한 조각에 10ms 안팎이 걸리는 크기예요
type Mode = 'once' | 'timeout' | 'yield'
type Run = { total: number; longest: number; others: number; clickWait: number | null }

// 사파리에는 scheduler가 없어요. 타입도 아직 없는 브라우저가 있어서 필요한 것만 적어요.
const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler
export const yieldSupported = typeof scheduler?.yield === 'function'

const pause: Record<Exclude<Mode, 'once'>, () => Promise<unknown>> = {
  timeout: () => new Promise((resolve) => setTimeout(resolve, 0)), // 다음 조각이 줄 맨 뒤에 서요
  yield: () => scheduler!.yield!(), // 다음 조각이 줄 맨 앞에 서요
}

/** 광고·분석 스크립트처럼 16ms마다 8ms씩 메인 스레드를 쓰는 일을 흉내 내요. 멈추면 그동안 몇 번 돌았는지 돌려줘요. */
function startOtherScript() {
  let runs = 0
  const id = setInterval(() => {
    runs++
    const end = performance.now() + 8
    while (performance.now() < end) {
      // 일부러 바쁘게 기다려요
    }
  }, 16)
  return () => {
    clearInterval(id)
    return runs
  }
}

async function countInChunks(mode: Mode) {
  let count = 0
  for (let from = 2; from < LIMIT; from += CHUNK) {
    count += countPrimes(Math.min(from + CHUNK, LIMIT), from)
    if (mode !== 'once') await pause[mode]()
  }
  return count
}

const CODE = `// 1. 긴 반복을 쪼개요
for (const applicant of applicants) {
  score(applicant)
  await scheduler.yield()   // 잠깐 쉬었다가 이어서 해요
}

// 2. 클릭하면 화면 먼저, 무거운 일은 나중에
button.addEventListener('click', async () => {
  showSpinner()             // 사용자가 바로 볼 반응
  await scheduler.yield()   // 여기서 바뀐 화면이 그려져요
  saveAndSendLogs()         // 무거운 뒷일
})`

const DEADLINE_CODE = `let deadline = performance.now() + 50
for (const item of items) {
  process(item)
  if (performance.now() > deadline) {
    await yieldToMain()
    deadline = performance.now() + 50
  }
}`

const FALLBACK_CODE = `function yieldToMain() {
  if (globalThis.scheduler?.yield) return scheduler.yield()
  // 사파리: setTimeout으로 쉬어요. 대신 줄 맨 뒤에 서요.
  return new Promise((resolve) => setTimeout(resolve, 0))
}`

function Explainer() {
  return (
    <>
      <ExplainTitle>scheduler.yield()는 뭐예요?</ExplainTitle>
      <Lead>
        긴 작업 중간에 <strong className={strong}>"잠깐 쉴게요"</strong> 하고 메인 스레드를 내주는 함수예요. 쉬는 동안 브라우저는 화면을 그리고 클릭을
        처리하고, 그다음 내 일을 이어서 해요. 화면을 만지는 일처럼 워커로 옮길 수 없는 일도 쪼갤 수 있어요.
      </Lead>
      <Topic icon="🧩" title="이렇게 써요">
        <p>await 한 줄이면 돼요. 특히 클릭에 대한 반응을 먼저 그리고 무거운 뒷일을 미루면, INP가 바로 좋아져요.</p>
        <Code code={CODE} />
        <p>React에서도 같아요. setState로 화면을 먼저 바꾸고 await scheduler.yield() 뒤에 무거운 일을 하면, 바뀐 화면이 먼저 그려져요.</p>
      </Topic>
      <Topic icon="🚦" title="setTimeout으로 쉬는 것과 뭐가 달라요?">
        <ul className={bullets}>
          <li>
            <strong className={strong}>setTimeout(0)</strong>은 내 다음 조각을 줄 <strong className={strong}>맨 뒤</strong>에 세워요. 그사이 광고·분석
            스크립트 같은 다른 일이 먼저 돌아서, 다 끝나는 시간이 늘어나요.
          </li>
          <li>
            <strong className={strong}>scheduler.yield()</strong>는 내 다음 조각을 같은 우선순위 줄의 <strong className={strong}>맨 앞</strong>에
            세워요. 화면 그리기와 클릭은 끼어들 수 있지만, 다른 일반 작업보다 내 일이 먼저 이어져요.
          </li>
          <li>
            대신 크롬은 내 일이 이어지는 동안 <strong className={strong}>화면 그리기를 조금 미뤄요.</strong> 이 화면에서 재 보면 100ms쯤에 한 번씩
            그렸고, 클릭은 6ms 안에 받았어요. 그래서 매끄러운 애니메이션보다 클릭 반응(INP)과 빨리 끝내는 게 중요한 일에 맞아요.
          </li>
        </ul>
      </Topic>
      <Topic icon="⏱️" title="얼마나 자주 쉬어요?">
        <p>
          긴 작업 기준인 50ms를 넘기 전에 쉬어요. 반복할 때마다 쉬면 쉬는 비용이 쌓이니까, 시간으로 끊는 게 좋아요.
        </p>
        <Code code={DEADLINE_CODE} />
      </Topic>
      <Topic icon="🧭" title="사파리에서는 setTimeout으로 대신해요">
        <p>사파리는 아직 scheduler가 없어요. 있으면 쓰고 없으면 setTimeout으로 쉬는 함수를 하나 두고, 이 함수만 불러요.</p>
        <Code code={FALLBACK_CODE} />
      </Topic>
      <Topic icon="⚖️" title="Web Worker와 언제 나눠 써요?">
        <ul className={bullets}>
          <li>
            <strong className={strong}>화면(DOM)을 만지거나 React 상태를 바꾸는 일</strong>은 워커로 못 옮겨요. scheduler.yield로 쪼개요.
          </li>
          <li>
            <strong className={strong}>화면과 상관없는 오래 걸리는 계산</strong>은 워커로 옮겨요. 쪼개도 메인 스레드가 하는 일의 총량은 그대로예요.
          </li>
          <li>React 렌더링 자체는 startTransition이 알아서 쪼개요. scheduler.yield는 내가 쓴 코드(이벤트 핸들러, 데이터 가공)에 써요.</li>
        </ul>
      </Topic>
    </>
  )
}

const LABEL: Record<Mode, string> = { once: '한 번에', timeout: 'setTimeout으로 쪼개기', yield: 'scheduler.yield로 쪼개기' }
const SHORT: Record<Mode, string> = { once: '한 번에', timeout: 'setTimeout', yield: 'yield' }

export function Yield({ feature }: { feature: FeatureRef }) {
  const { back } = useNav()
  const meter = useMainThreadMeter()
  const [mode, setMode] = useState<Mode>('once')
  const [busy, setBusy] = useState(false)
  const [runs, setRuns] = useState<Partial<Record<Mode, Run>>>({})
  const [last, setLast] = useState<Mode | null>(null)
  const blocked = mode === 'yield' && !yieldSupported

  async function run() {
    setBusy(true)
    await nextFrame()
    meter.reset()
    // 세는 동안 누른 클릭이 처리되기까지 기다린 시간(INP의 입력 지연)을 재요.
    const waits: number[] = []
    const onPointerDown = (event: PointerEvent) => waits.push(performance.now() - event.timeStamp)
    addEventListener('pointerdown', onPointerDown)
    const stopOther = startOtherScript()
    const startedAt = performance.now()
    await countInChunks(mode)
    const total = Math.round(performance.now() - startedAt)
    const others = stopOther()
    await nextFrame()
    removeEventListener('pointerdown', onPointerDown)
    const clickWait = waits.length ? Math.round(Math.max(...waits)) : null
    setRuns((prev) => ({ ...prev, [mode]: { total, longest: meter.read(), others, clickWait } }))
    setLast(mode)
    // 아직 안 해 본 방법으로 넘어가서, 이어서 비교하게 해요.
    const next = (['once', 'timeout', 'yield'] as const).find((key) => key !== mode && !runs[key])
    if (next) setMode(next)
    setBusy(false)
  }

  const result = last && runs[last]
  const clickText = (run: Run) => (run.clickWait === null ? '' : ` 세는 동안 누른 클릭은 가장 오래 ${run.clickWait.toLocaleString()}ms 기다렸어요.`)

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['scheduler.yield()', 'setTimeout']}
      title={'긴 작업을 쪼개서\n화면이 숨 쉴 틈을 줄까요?'}
      description="500만까지 소수 세기를 화면(메인 스레드)에서 해요. 그동안 광고·분석 스크립트 같은 다른 일도 계속 끼어들어요. 세 방법을 하나씩 해 보고 비교해요."
      cta={
        <Button onClick={run} disabled={busy || blocked}>
          {busy ? '소수를 세는 중이에요' : blocked ? '이 브라우저는 scheduler.yield가 없어요' : `${LABEL[mode]} 해 보기`}
        </Button>
      }
    >
      {result && last === 'once' && (
        <Result>
          한 번에 했더니 화면이 {freeze(result.longest)}. 끝날 때까지 클릭도, 다른 스크립트도 기다렸어요.{clickText(result)}
        </Result>
      )}
      {result && last === 'timeout' && (
        <Result>
          화면은 {freeze(result.longest)}. 대신 쉴 때마다 다른 스크립트가 {result.others}번 먼저 끼어들어서, 다 끝나는 데 {result.total.toLocaleString()}ms
          걸렸어요.{clickText(result)}
        </Result>
      )}
      {result && last === 'yield' && (
        <Result>
          다른 스크립트에 밀리지 않고 {result.total.toLocaleString()}ms 만에 끝났어요.{' '}
          {result.longest >= 50
            ? `내 일이 먼저 이어지는 동안 크롬은 화면을 가끔(가장 길게 ${result.longest}ms 만에) 그렸지만, 클릭은 바로 받아요.`
            : '화면도 멈추지 않았어요.'}
          {clickText(result)}
        </Result>
      )}
      <Choice
        label="어떻게 할까요?"
        value={mode}
        options={[
          ['once', '한 번에'],
          ['timeout', 'setTimeout'],
          ['yield', 'yield'],
        ]}
        onChange={setMode}
        disabled={busy}
      />
      <MainThreadMeter dot={meter.dot} />
      <Card title="세 방법을 비교해요">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="text-[13px] text-grey-500">
              <th className="pb-2 text-left font-medium">방법</th>
              <th className="pb-2 text-right font-medium">다 끝난 시간</th>
              <th className="pb-2 text-right font-medium">가장 긴 멈춤</th>
              <th className="pb-2 text-right font-medium">끼어든 일</th>
            </tr>
          </thead>
          <tbody>
            {(['once', 'timeout', 'yield'] as const).map((key) => (
              <tr key={key} className="border-t border-grey-200">
                <th scope="row" className="py-2.5 text-left font-medium text-grey-700">
                  {SHORT[key]}
                </th>
                <td className="py-2.5 text-right font-semibold text-grey-900">{runs[key] ? `${runs[key].total.toLocaleString()}ms` : '-'}</td>
                <td className="py-2.5 text-right font-semibold text-grey-900">{runs[key] ? `${runs[key].longest.toLocaleString()}ms` : '-'}</td>
                <td className="py-2.5 text-right font-semibold text-grey-900">{runs[key] ? `${runs[key].others}번` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Note>
        세는 동안 화면 아무 데나 눌러 보면, 클릭이 기다린 시간도 재요. 소수는 {(CHUNK / 10_000).toLocaleString()}만 개씩 나눠 세고, 다른 스크립트는 16ms마다
        8ms씩 메인 스레드를 써요. 코드는 <code>src/yield.tsx</code>에 있어요.
      </Note>
      <Report id="yield" intro={<Explainer />} />
    </Screen>
  )
}
