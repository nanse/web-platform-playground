import { useState } from 'react'
import { Button, Card, InfoList, Note, Result, Screen, useNav, type FeatureRef } from '../../shared/ui'
import { bullets, Code, ExplainTitle, Lead, strong, Topic } from '../../shared/explain'
import { Choice } from './choice'
import { freeze, MainThreadMeter, nextFrame, useMainThreadMeter } from './meter'
import { countPrimes } from './primes'
import { Report } from './report'

const LIMIT = 5_000_000
type Where = 'main' | 'worker'
type Run = { count: number; ms: number; longest: number }

function countInWorker(limit: number) {
  return new Promise<number>((resolve) => {
    // Vite와 Next.js 모두 new URL(..., import.meta.url) 모양을 보고 워커 파일을 따로 묶어 줘요.
    const worker = new Worker(new URL('./workers/prime.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (event: MessageEvent<{ count: number }>) => {
      resolve(event.data.count)
      worker.terminate()
    }
    worker.postMessage({ limit })
  })
}

const CODE = `// 화면: 워커를 만들고 일을 보내요.
const worker = new Worker(new URL('./prime-worker.js', import.meta.url), { type: 'module' })
worker.postMessage({ limit: 5_000_000 })
worker.onmessage = (event) => showResult(event.data.count)

// prime-worker.js: 이 파일은 워커에서 돌아요.
self.onmessage = (event) => {
  const count = countPrimes(event.data.limit) // 오래 걸려도 화면은 멀쩡해요
  self.postMessage({ count })
}`

function Explainer() {
  return (
    <>
      <ExplainTitle>Web Worker는 뭐예요?</ExplainTitle>
      <Lead>
        탭에는 화면을 그리고 클릭을 받는 일꾼이 <strong className={strong}>하나(메인 스레드)</strong>뿐이에요. 이 일꾼이 오래 걸리는 계산을 하면, 그동안
        클릭도 스크롤도 애니메이션도 멈춰요. Web Worker는 뒤에서 따로 일하는 일꾼을 하나 더 두는 거예요.
      </Lead>
      <Topic icon="🧵" title="이렇게 써요">
        <p>워커 파일을 따로 만들고, postMessage로 일을 보내고 결과를 받아요. 주고받는 건 메시지뿐이에요.</p>
        <Code code={CODE} />
      </Topic>
      <Topic icon="🚫" title="워커가 못 하는 것">
        <ul className={bullets}>
          <li>
            <strong className={strong}>화면을 못 만져요.</strong> document, window, React 렌더링은 메인 스레드에서만 돼요. 그래서 렌더링이 느린 건 워커로
            못 옮겨요.
          </li>
          <li>localStorage도 못 써요. fetch, IndexedDB, 타이머, WebSocket은 돼요.</li>
          <li>
            주고받는 데이터는 <strong className={strong}>복사</strong>돼요. 몇 MB가 넘는 바이너리는 복사가 비싸서, Transferable로 옮겨요.
          </li>
        </ul>
      </Topic>
      <Topic icon="🎯" title="이럴 때 써요">
        <ul className={bullets}>
          <li>올리기 전에 프로필 사진·포트폴리오 이미지 줄이기 (OffscreenCanvas)</li>
          <li>큰 CSV·엑셀 만들기와 읽기 (지원자 목록 내려받기·올리기)</li>
          <li>수천 개가 넘는 목록을 브라우저에서 검색·정렬하기</li>
          <li>압축, 암호화, 마크다운·코드 하이라이트처럼 라이브러리가 오래 도는 일</li>
        </ul>
        <p>
          INP가 나쁜데 원인이 React 렌더링이라면 워커로는 못 고쳐요. 그때는 startTransition, 긴 목록 가상화, 작업 쪼개기(scheduler.yield)를 봐요. 그래서 DevTools
          Performance 패널에서 긴 작업이 <strong className={strong}>계산</strong> 때문인지 먼저 확인해요.
        </p>
      </Topic>
      <Topic icon="⚖️" title="알아둘 것">
        <ul className={bullets}>
          <li>워커를 띄우는 데도 수십 ms가 들어요. 금방 끝나는 일은 그냥 메인 스레드에서 하는 게 빨라요.</li>
          <li>다 쓴 워커는 terminate()로 닫아요. 워커마다 메모리를 따로 써요.</li>
          <li>postMessage를 주고받는 코드가 번거로우면, 함수 부르듯 쓰게 해 주는 Comlink 같은 작은 라이브러리를 써요.</li>
        </ul>
      </Topic>
    </>
  )
}

export function WebWorker({ feature }: { feature: FeatureRef }) {
  const { back } = useNav()
  const meter = useMainThreadMeter()
  const [where, setWhere] = useState<Where>('main')
  const [busy, setBusy] = useState(false)
  const [runs, setRuns] = useState<Partial<Record<Where, Run>>>({})
  const [last, setLast] = useState<Where | null>(null)

  async function run() {
    setBusy(true)
    await nextFrame()
    meter.reset()
    const startedAt = performance.now()
    const count = where === 'main' ? countPrimes(LIMIT) : await countInWorker(LIMIT)
    const ms = Math.round(performance.now() - startedAt)
    await nextFrame() // 멈췄다가 다시 그린 첫 프레임까지 기다려야 멈춘 시간이 잡혀요
    setRuns((prev) => ({ ...prev, [where]: { count, ms, longest: meter.read() } }))
    setLast(where)
    // 아직 안 해 본 쪽으로 바꿔 둬서, 이어서 비교해 보게 해요.
    const other: Where = where === 'main' ? 'worker' : 'main'
    if (!runs[other]) setWhere(other)
    setBusy(false)
  }

  const result = last && runs[last]

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['Worker', 'postMessage']}
      title={'무거운 계산을 해도\n화면이 안 멈추게 할까요?'}
      description="500만까지의 소수를 세는 같은 계산을, 화면(메인 스레드)과 워커에서 한 번씩 해 봐요. 화면에서 하면 계산하는 동안 파란 점이 멈춰요."
      cta={
        <Button onClick={run} disabled={busy}>
          {busy ? '소수를 세는 중이에요' : where === 'main' ? '화면에서 소수 세기' : '워커에서 소수 세기'}
        </Button>
      }
    >
      {result && (
        <Result>
          {last === 'main' ? '화면' : '워커'}에서 소수 {result.count.toLocaleString()}개를 세는 데 {result.ms.toLocaleString()}ms 걸렸어요. 그동안 화면은{' '}
          {freeze(result.longest)}.
        </Result>
      )}
      <Choice
        label="어디서 계산할까요?"
        value={where}
        options={[
          ['main', '화면에서'],
          ['worker', '워커에서'],
        ]}
        onChange={setWhere}
        disabled={busy}
      />
      <MainThreadMeter dot={meter.dot} />
      <Card title="두 곳을 비교해요">
        <InfoList
          items={(['main', 'worker'] as const).map((key) => [
            key === 'main' ? '화면에서' : '워커에서',
            runs[key] ? `${runs[key].ms.toLocaleString()}ms 걸림 · ${freeze(runs[key].longest)}` : '아직 안 했어요',
          ])}
        />
      </Card>
      <Note>
        소수는 일부러 느린 방법(하나씩 나눠 보기)으로 세요. 워커 코드는 <code>src/workers/prime.ts</code>에 있고, 화면과 같은 함수(
        <code>src/primes.ts</code>)를 써요.
      </Note>
      <Report id="web-worker" intro={<Explainer />} />
    </Screen>
  )
}
