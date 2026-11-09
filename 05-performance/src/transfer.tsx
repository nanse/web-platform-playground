import { useState } from 'react'
import { Button, Card, InfoList, Note, Result, Screen, useNav, type FeatureRef } from '../../shared/ui'
import { bullets, Code, ExplainTitle, Lead, strong, Topic } from '../../shared/explain'
import { Choice } from './choice'
import { PassingDiagram } from './diagram'
import { nextFrame } from './meter'
import { Report } from './report'

const MB = 100
type Mode = 'copy' | 'transfer'
type Run = { sendMs: number; arriveMs: number; left: number }

const now = () => performance.timeOrigin + performance.now()
const ms = (value: number) => (value < 1 ? `${value.toFixed(2)}ms` : `${Math.round(value).toLocaleString()}ms`)

async function send(mode: Mode): Promise<Run> {
  const worker = new Worker(new URL('./workers/receive.ts', import.meta.url), { type: 'module' })
  const reply = () => new Promise<{ receivedAt: number }>((resolve) => (worker.onmessage = (event) => resolve(event.data)))
  // 빈 메시지를 먼저 주고받아요. 워커를 띄우는 시간이 섞이지 않게요.
  worker.postMessage({ buffer: new ArrayBuffer(0) })
  await reply()

  const buffer = new ArrayBuffer(MB * 1024 * 1024)
  new Uint8Array(buffer).fill(1)
  const sentAt = now()
  worker.postMessage({ buffer }, mode === 'transfer' ? [buffer] : [])
  const sendMs = now() - sentAt // 이 시간 동안 메인 스레드가 묶여 있어요
  const { receivedAt } = await reply()
  worker.terminate()
  return { sendMs, arriveMs: receivedAt - sentAt, left: buffer.byteLength }
}

const CODE = `const buffer = new ArrayBuffer(100 * 1024 * 1024)

worker.postMessage({ buffer })            // 복사해요. 100MB를 한 번 더 만들어요
worker.postMessage({ buffer }, [buffer])  // 옮겨요. 두 번째 칸이 "옮길 목록"이에요
buffer.byteLength                         // 0. 이제 워커 거예요

// 워커에서 돌려줄 때도 같아요
self.postMessage({ result }, [result.buffer])

// 메시지 없이, 같은 스레드 안에서 주인만 바꿀 때
const moved = structuredClone(bytes, { transfer: [bytes.buffer] })
const next = buffer.transfer()            // ES2024`

function Explainer() {
  return (
    <>
      <ExplainTitle>Transferable objects는 뭐예요?</ExplainTitle>
      <Lead>
        워커와 주고받는 데이터는 기본으로 <strong className={strong}>복사</strong>돼요(구조화된 복제, structured clone). 작은 객체는 괜찮지만 큰 바이너리는
        복사가 비싸요. Transferable은 복사하는 대신 <strong className={strong}>주인을 넘겨요</strong>. 넘긴 쪽은 그 데이터를 더 쓸 수 없어요.
      </Lead>
      <PassingDiagram />
      <Topic icon="📮" title="이렇게 써요">
        <p>ArrayBuffer는 바이트를 담는 메모리예요. postMessage의 두 번째 칸에 옮길 것을 적으면, 복사하지 않고 넘어가요.</p>
        <Code code={CODE} />
      </Topic>
      <Topic icon="🧳" title="옮길 수 있는 것">
        <ul className={bullets}>
          <li>ArrayBuffer (Uint8Array 같은 TypedArray는 .buffer를 옮겨요)</li>
          <li>MessagePort: 워커끼리 직접 이야기할 전화선</li>
          <li>ImageBitmap, OffscreenCanvas: 이미지와 캔버스를 워커에서 그릴 때</li>
          <li>ReadableStream, WritableStream: 큰 데이터를 조금씩 흘려보낼 때</li>
          <li>VideoFrame, AudioData: 영상과 소리를 다룰 때</li>
        </ul>
        <p>
          File과 Blob은 옮길 필요가 없어요. 넘겨도 내용이 아니라 <strong className={strong}>가리키는 정보</strong>만 넘어가서 원래 빨라요. 업로드할 파일은 그냥
          넘기고, 워커 안에서 arrayBuffer()로 읽어요.
        </p>
      </Topic>
      <Topic icon="⚠️" title="조심할 것">
        <ul className={bullets}>
          <li>옮긴 뒤 원래 변수를 쓰면 빈 버퍼(byteLength 0)라서 조용히 틀린 값이 나와요.</li>
          <li>
            subarray로 만든 작은 Uint8Array도 .buffer를 옮기면 <strong className={strong}>원래 큰 버퍼 전체</strong>가 넘어가요. 필요한 부분만 slice로 잘라서
            옮겨요.
          </li>
          <li>JSON처럼 작은 데이터는 그냥 복사해도 충분히 빨라요. 몇 MB가 넘는 바이너리부터 의미가 있어요.</li>
          <li>SharedArrayBuffer는 옮기는 대상이 아니에요. 같이 쓰는 메모리라 그냥 보내면 돼요.</li>
        </ul>
      </Topic>
    </>
  )
}

export function Transfer({ feature }: { feature: FeatureRef }) {
  const { back } = useNav()
  const [mode, setMode] = useState<Mode>('copy')
  const [busy, setBusy] = useState(false)
  const [runs, setRuns] = useState<Partial<Record<Mode, Run>>>({})
  const [last, setLast] = useState<Mode | null>(null)

  async function run() {
    setBusy(true)
    await nextFrame()
    const result = await send(mode)
    setRuns((prev) => ({ ...prev, [mode]: result }))
    setLast(mode)
    const other: Mode = mode === 'copy' ? 'transfer' : 'copy'
    if (!runs[other]) setMode(other)
    setBusy(false)
  }

  const result = last && runs[last]

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['postMessage', 'Transferable', 'ArrayBuffer']}
      title={'큰 데이터를 복사하지 않고\n워커에 넘겨 볼까요?'}
      description={`${MB}MB짜리 ArrayBuffer를 워커에 보내요. 복사하면 같은 크기를 한 번 더 만들고, 옮기면(transfer) 주인만 바뀌어서 거의 바로 끝나요.`}
      cta={
        <Button onClick={run} disabled={busy}>
          {busy ? '보내는 중이에요' : mode === 'copy' ? `${MB}MB 복사해서 보내기` : `${MB}MB 옮겨서 보내기`}
        </Button>
      }
    >
      {result && last === 'copy' && (
        <Result>
          복사해서 보냈어요. 워커가 받기까지 {ms(result.arriveMs)} 걸렸고, 이 탭에는 {MB}MB가 그대로 남아서 잠깐 {MB * 2}MB를 썼어요.
        </Result>
      )}
      {result && last === 'transfer' && (
        <Result>
          옮겨서 보냈어요. 워커가 받기까지 {ms(result.arriveMs)} 걸렸어요. 이 탭의 버퍼는 0바이트가 됐어요. 이제 워커 거예요.
        </Result>
      )}
      <Choice
        label="어떻게 보낼까요?"
        value={mode}
        options={[
          ['copy', '복사해서'],
          ['transfer', '옮겨서'],
        ]}
        onChange={setMode}
        disabled={busy}
      />
      <div className="grid grid-cols-2 gap-2" aria-live="polite">
        {(['copy', 'transfer'] as const).map((key) => (
          <div key={key} className={`rounded-3xl p-5 ${last === key ? 'bg-primary-weak' : 'bg-grey-50'}`}>
            <p className="text-[14px] font-medium text-grey-500">{key === 'copy' ? '복사해서' : '옮겨서'}</p>
            <p className="mt-1 text-[24px] font-bold text-grey-900">{runs[key] ? ms(runs[key].arriveMs) : '-'}</p>
            <p className="mt-1 text-[13px] text-grey-500">워커가 받기까지</p>
          </div>
        ))}
      </div>
      <Card title="자세히 보기">
        <InfoList
          items={(['copy', 'transfer'] as const).flatMap((key) => {
            const run = runs[key]
            const name = key === 'copy' ? '복사' : '옮기기'
            return [
              [`${name} · 메인 스레드가 묶인 시간`, run ? ms(run.sendMs) : '-'],
              [`${name} · 보낸 뒤 이 탭에 남은 크기`, run ? (run.left ? `${MB}MB` : '0바이트') : '-'],
            ] as [string, string][]
          })}
        />
      </Card>
      <Note>
        시각은 화면과 워커가 같은 기준(performance.timeOrigin)으로 재요. 워커 코드는 <code>src/workers/receive.ts</code>에 있어요.
      </Note>
      <Report id="transferable" intro={<Explainer />} />
    </Screen>
  )
}
