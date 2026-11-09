import { useState } from 'react'
import { Button, Card, InfoList, Note, Result, Screen, useNav, yesNo, type FeatureRef } from '../../shared/ui'
import { bullets, Code, ExplainTitle, Lead, numbered, strong, Topic } from '../../shared/explain'
import { Choice } from './choice'
import { PassingDiagram } from './diagram'
import { nextFrame } from './meter'
import { Report } from './report'

const WORKERS = 4
const TIMES = 5_000_000
const EXPECTED = WORKERS * TIMES
// SharedArrayBuffer는 이 페이지가 다른 출처와 격리됐을 때(COOP·COEP 헤더)만 생겨요.
const available = typeof SharedArrayBuffer !== 'undefined' && crossOriginIsolated

type Mode = 'plain' | 'atomic'
type Run = { total: number; ms: number }

/** 워커 4개에 같은 메모리를 주고, 동시에 출발시켜서 0번 칸을 더하게 해요. */
async function race(atomic: boolean): Promise<Run> {
  const memory = new SharedArrayBuffer(8) // 0번 칸: 더할 숫자, 1번 칸: 출발 신호 (Int32 두 칸)
  const view = new Int32Array(memory)
  const workers = Array.from({ length: WORKERS }, () => new Worker(new URL('./workers/counter.ts', import.meta.url), { type: 'module' }))
  const next = (worker: Worker) => new Promise<MessageEvent>((resolve) => (worker.onmessage = resolve))

  // memory를 보내도 복사되지 않아요. 네 워커와 이 화면이 같은 메모리를 봐요.
  await Promise.all(workers.map((worker) => (worker.postMessage({ memory, times: TIMES, atomic }), next(worker))))
  const finished = Promise.all(workers.map(next))
  const startedAt = performance.now()
  Atomics.store(view, 1, 1)
  Atomics.notify(view, 1) // 기다리던 워커를 한꺼번에 깨워요
  await finished
  workers.forEach((worker) => worker.terminate())
  return { total: Atomics.load(view, 0), ms: Math.round(performance.now() - startedAt) }
}

const BUFFER_CODE = `const buffer = await file.arrayBuffer() // 파일을 바이트로 읽어요
const bytes = new Uint8Array(buffer)     // 1바이트씩 보는 창을 씌워요
bytes.length                             // 파일 크기(바이트)
String.fromCharCode(...bytes.slice(0, 4)) // '%PDF'면 진짜 PDF예요
new TextDecoder().decode(bytes)          // 글자로 바꿔요`

const ATOMICS_CODE = `const memory = new SharedArrayBuffer(4)
worker.postMessage(memory) // 복사가 아니라, 같은 메모리를 같이 봐요

// 워커 안
const view = new Int32Array(memory)
view[0]++                 // ❌ 읽고, 더하고, 쓰는 사이에 다른 워커가 끼어들어요
Atomics.add(view, 0, 1)   // ✅ 셋을 한 번에 해서 끼어들 틈이 없어요`

const HEADERS_CODE = `Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp`

function Explainer() {
  return (
    <>
      <ExplainTitle>ArrayBuffer와 SharedArrayBuffer는 뭐가 달라요?</ExplainTitle>
      <Lead>
        ArrayBuffer는 <strong className={strong}>바이트(0~255 숫자)를 담는, 크기가 정해진 메모리</strong>예요. 파일, 이미지, 네트워크로 받은 바이너리가
        모두 ArrayBuffer로 와요. SharedArrayBuffer는 이 메모리를 여러 워커가 <strong className={strong}>복사하지 않고 같이</strong> 보는 거예요.
      </Lead>
      <Topic icon="📦" title="ArrayBuffer는 이렇게 써요">
        <p>ArrayBuffer는 직접 읽고 쓸 수 없어요. Uint8Array(1바이트씩), Int32Array(4바이트 정수), Float32Array 같은 창(TypedArray)을 씌워서 봐요.</p>
        <Code code={BUFFER_CODE} />
        <ul className={bullets}>
          <li>올린 이력서가 진짜 PDF인지 앞 4바이트로 확인해요.</li>
          <li>엑셀에서 저장한 CSV가 UTF-8인지 EUC-KR인지 TextDecoder로 가려 읽어요.</li>
          <li>올리기 전에 파일 해시(crypto.subtle.digest)를 구하거나, 이미지를 줄여요.</li>
        </ul>
      </Topic>
      <PassingDiagram />
      <Topic icon="🔁" title="워커에 넘길 때 셋이 달라요">
        <ul className={bullets}>
          <li>
            <strong className={strong}>그냥 보내면 복사</strong>돼요. 100MB면 100MB를 한 번 더 만들어요.
          </li>
          <li>
            <strong className={strong}>transfer로 옮기면</strong> 복사 없이 주인만 바뀌고, 보낸 쪽은 비어요. (Transferable 화면)
          </li>
          <li>
            <strong className={strong}>SharedArrayBuffer는</strong> 복사도 옮기기도 아니에요. 양쪽이 같은 메모리를 동시에 봐요.
          </li>
        </ul>
      </Topic>
      <Topic icon="⚔️" title="같이 쓰면 숫자가 사라져요">
        <ol className={numbered}>
          <li>워커 A와 B가 동시에 0번 칸을 읽어요. 둘 다 5를 봐요.</li>
          <li>둘 다 1을 더해서 6을 써요.</li>
          <li>두 번 더했는데 7이 아니라 6이에요. 한 번이 사라졌어요.</li>
        </ol>
        <p>그래서 같이 쓰는 메모리는 Atomics로 고쳐요. Atomics.add, load, store는 한 번에 끝나서 끼어들 틈이 없어요. wait과 notify로 서로 기다리고 깨울 수도 있어요.</p>
        <Code code={ATOMICS_CODE} />
      </Topic>
      <Topic icon="🔒" title="켜려면 사이트 전체를 격리해야 해요">
        <p>
          2018년 Spectre라는 CPU 보안 문제가 알려진 뒤, 브라우저는 SharedArrayBuffer를 막았어요. 지금은 페이지가 다른 출처와 격리됐을 때
          (crossOriginIsolated)만 쓸 수 있어요. 이 샘플도 vite.config.ts에서 두 헤더를 붙였어요.
        </p>
        <Code code={HEADERS_CODE} />
        <ul className={bullets}>
          <li>다른 출처의 이미지, 스크립트, iframe은 CORP나 CORS 헤더가 있어야 불러와요. 유튜브, 광고, 지도, 외부 CDN 이미지가 막힐 수 있어요.</li>
          <li>
            COOP가 same-origin이면 다른 출처 창과 window.opener로 주고받는 흐름이 끊겨요. <strong className={strong}>소셜 로그인 팝업</strong>이 대표적이에요.
          </li>
        </ul>
      </Topic>
      <Topic icon="🎯" title="어디에 써요?">
        <p>
          여러 스레드가 큰 메모리를 함께 계산할 때예요. 브라우저 안 영상 편집(ffmpeg.wasm), 게임과 3D, SQLite 같은 WASM 프로그램을 여러 스레드로 돌릴 때
          써요.
        </p>
      </Topic>
    </>
  )
}

export function SharedMemory({ feature }: { feature: FeatureRef }) {
  const { back } = useNav()
  const [mode, setMode] = useState<Mode>('plain')
  const [busy, setBusy] = useState(false)
  const [runs, setRuns] = useState<Partial<Record<Mode, Run>>>({})
  const [last, setLast] = useState<Mode | null>(null)

  async function run() {
    setBusy(true)
    await nextFrame()
    const result = await race(mode === 'atomic')
    setRuns((prev) => ({ ...prev, [mode]: result }))
    setLast(mode)
    const other: Mode = mode === 'plain' ? 'atomic' : 'plain'
    if (!runs[other]) setMode(other)
    setBusy(false)
  }

  const result = last && runs[last]
  const lost = result ? EXPECTED - result.total : 0

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['ArrayBuffer', 'SharedArrayBuffer', 'Atomics']}
      title={'워커 4개가 메모리 하나를\n같이 써 볼까요?'}
      description="워커 4개가 같은 SharedArrayBuffer의 한 칸을 500만 번씩 더해요. 그냥 더하면 서로 덮어써서 숫자가 사라지고, Atomics로 더하면 정확해요."
      cta={
        <Button onClick={run} disabled={!available || busy}>
          {busy ? '워커 4개가 더하는 중이에요' : mode === 'plain' ? '그냥 더해 보기' : 'Atomics로 더해 보기'}
        </Button>
      }
    >
      {!available && (
        <Result>이 페이지는 격리되지 않아서 SharedArrayBuffer를 쓸 수 없어요. pnpm --filter 05-performance dev로 띄우면 헤더가 붙어요.</Result>
      )}
      {result && last === 'plain' && lost > 0 && (
        <Result>
          {lost.toLocaleString()}번 더한 게 사라졌어요. 워커들이 같은 칸을 동시에 읽고 쓰면서 서로 덮어썼어요. 이번엔 Atomics로 더해 봐요.
        </Result>
      )}
      {result && last === 'plain' && lost === 0 && <Result>이번엔 우연히 겹치지 않아서 하나도 안 사라졌어요. 다시 해 보면 사라질 수 있어요.</Result>}
      {result && last === 'atomic' && (
        <Result>
          하나도 사라지지 않고 기대한 값 그대로예요. Atomics.add가 읽고-더하고-쓰기를 한 번에 해 줬어요. 대신 {result.ms.toLocaleString()}ms로 더 오래
          걸려요.
        </Result>
      )}
      <Choice
        label="어떻게 더할까요?"
        value={mode}
        options={[
          ['plain', '그냥 더하기'],
          ['atomic', 'Atomics로 더하기'],
        ]}
        onChange={setMode}
        disabled={busy || !available}
      />
      <div className="grid grid-cols-2 gap-2" aria-live="polite">
        <div className="rounded-3xl bg-grey-50 p-5">
          <p className="text-[14px] font-medium text-grey-500">기대한 값</p>
          <p className="mt-1 text-[24px] font-bold text-grey-900">{EXPECTED.toLocaleString()}</p>
          <p className="mt-1 text-[13px] text-grey-500">
            워커 {WORKERS}개 × {(TIMES / 10_000).toLocaleString()}만 번
          </p>
        </div>
        <div className={`rounded-3xl p-5 ${result && lost > 0 ? 'bg-[#fff4e5]' : 'bg-grey-50'}`}>
          <p className="text-[14px] font-medium text-grey-500">나온 값</p>
          <p className="mt-1 text-[24px] font-bold text-grey-900">{result ? result.total.toLocaleString() : '-'}</p>
          <p className="mt-1 text-[13px] text-grey-500">{result ? (lost > 0 ? `${lost.toLocaleString()}번 사라졌어요` : '정확해요') : '아직 안 했어요'}</p>
        </div>
      </div>
      <Card title="두 방법을 비교해요">
        <InfoList
          items={(['plain', 'atomic'] as const).map((key) => [
            key === 'plain' ? '그냥 더하기' : 'Atomics로 더하기',
            runs[key] ? `${runs[key].total.toLocaleString()} · ${runs[key].ms.toLocaleString()}ms` : '아직 안 했어요',
          ])}
        />
      </Card>
      <Card title="지금 상태">
        <InfoList
          items={[
            ['crossOriginIsolated', crossOriginIsolated ? '격리됐어요' : '격리되지 않았어요'],
            ['SharedArrayBuffer', yesNo(available)],
          ]}
        />
      </Card>
      <Note>
        워커 코드는 <code>src/workers/counter.ts</code>에 있어요. 네 워커가 동시에 출발하도록, 같은 메모리의 다른 칸을 출발 신호로 써요(Atomics.wait·notify).
      </Note>
      <Report id="shared-array-buffer" intro={<Explainer />} />
    </Screen>
  )
}
