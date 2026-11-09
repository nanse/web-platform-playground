import { useState } from 'react'
import { Button, Card, InfoList, Note, Result, Screen, useNav, type FeatureRef } from '../../shared/ui'
import { bullets, Code, ExplainTitle, Lead, numbered, strong, Topic } from '../../shared/explain'
import { freeze, MainThreadMeter, nextFrame, useMainThreadMeter } from './meter'
import { Report } from './report'

const COUNT = 100_000
type Done = { rows: number; bytes: number; workerMs: number; moveMs: number; longest: number; preview: string[] }
type Reply = { type: 'progress'; done: number } | { type: 'done'; buffer: ArrayBuffer; ms: number; preview: string[]; sentAt: number }

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`

/** 워커에 "지원자 n명 CSV로 만들어 줘"를 보내고, 다 만든 바이트(ArrayBuffer)를 옮겨 받아요. */
function buildInWorker(count: number, onProgress: (done: number) => void) {
  return new Promise<Extract<Reply, { type: 'done' }> & { arrivedAt: number }>((resolve) => {
    const worker = new Worker(new URL('./workers/export.ts', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }: MessageEvent<Reply>) => {
      if (data.type === 'progress') return onProgress(data.done)
      resolve({ ...data, arrivedAt: performance.timeOrigin + performance.now() })
      worker.terminate()
    }
    worker.postMessage({ count }) // 숫자 하나라 복사해도 괜찮아요
  })
}

/** 받은 바이트로 파일을 만들어 내려받아요. 바이트를 다시 글자로 바꾸지 않아요. */
function download(buffer: ArrayBuffer, filename: string) {
  const url = URL.createObjectURL(new Blob([buffer], { type: 'text/csv;charset=utf-8' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: filename })
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const CODE = `// export-worker.js: 무거운 일은 전부 여기서 해요.
self.onmessage = async ({ data }) => {
  const applicants = await loadApplicants(data.count) // fetch로 페이지마다 불러요
  const csv = applicants.map(toCsvRow).join('\\r\\n')
  const bytes = new TextEncoder().encode('\\uFEFF' + csv) // 글자 → 바이트(ArrayBuffer)
  self.postMessage({ buffer: bytes.buffer }, [bytes.buffer]) // 복사하지 않고 옮겨요
}

// 화면: 받은 바이트로 파일을 만들어 바로 내려받아요.
worker.onmessage = ({ data }) => {
  const url = URL.createObjectURL(new Blob([data.buffer], { type: 'text/csv' }))
  Object.assign(document.createElement('a'), { href: url, download: '지원자.csv' }).click()
}`

const CELL_CODE = `function cell(value) {
  // =, +, -, @로 시작하면 엑셀이 수식으로 실행해요. 앞에 '를 붙여요.
  const safe = /^[=+\\-@]/.test(value) ? \`'\${value}\` : value
  // 쉼표·따옴표·줄바꿈이 있으면 따옴표로 감싸고, 안의 따옴표는 두 번 써요.
  return /[",\\r\\n]/.test(safe) ? \`"\${safe.replaceAll('"', '""')}"\` : safe
}`

function Explainer() {
  return (
    <>
      <ExplainTitle>워커, ArrayBuffer, Transferable을 이렇게 엮어요</ExplainTitle>
      <Lead>
        셋은 따로가 아니라 한 줄로 이어져요. <strong className={strong}>워커</strong>가 무거운 일을 하고, 결과를 <strong className={strong}>ArrayBuffer</strong>
        (바이트)로 만들고, <strong className={strong}>transfer</strong>로 복사 없이 화면에 돌려줘요.
      </Lead>
      <Topic icon="🔁" title="이 화면은 이렇게 흘러가요">
        <ol className={numbered}>
          <li>화면이 워커에 "지원자 10만 명 CSV로 만들어 줘"라고 보내요. 숫자 하나라 복사해도 괜찮아요.</li>
          <li>워커가 CSV 글자를 만들면서, 1만 명마다 진행률을 보내요. 화면은 막대만 늘려요.</li>
          <li>다 만들면 TextEncoder로 바이트(ArrayBuffer)로 바꾸고, transfer로 옮겨요. 10MB가 넘는 데이터를 복사하지 않아요.</li>
          <li>화면은 받은 ArrayBuffer로 Blob을 만들어 바로 내려받아요. 글자로 다시 바꾸지 않아요.</li>
        </ol>
        <Code code={CODE} />
      </Topic>
      <Topic icon="🧾" title="엑셀에서 안 깨지고, 안전하게">
        <ul className={bullets}>
          <li>
            <strong className={strong}>맨 앞에 BOM({'\\uFEFF'})을 붙여요.</strong> 없으면 엑셀이 UTF-8 파일을 다른 인코딩으로 읽어서 한글이 깨져요.
          </li>
          <li>
            <strong className={strong}>지원자가 쓴 글은 수식으로 실행되지 않게 막아요.</strong> 자기소개가 =로 시작하면 엑셀이 수식으로 실행해요(CSV
            인젝션). 이 화면의 3번 지원자가 그 예예요.
          </li>
          <li>쉼표, 따옴표, 줄바꿈이 섞인 칸은 따옴표로 감싸요.</li>
        </ul>
        <Code code={CELL_CODE} />
      </Topic>
      <Topic icon="🏢" title="실제 서비스로 옮길 때">
        <ul className={bullets}>
          <li>워커가 지원자 API를 직접 불러요. fetch는 워커에서도 되고, 같은 출처면 로그인 쿠키도 같이 가요.</li>
          <li>엑셀(XLSX) 파일이 필요하면 SheetJS 같은 라이브러리를 워커 안에서 써요. 압축까지 해서 CSV보다 훨씬 무거워요.</li>
          <li>
            수십만 행을 넘으면 브라우저 메모리가 모자랄 수 있어요. 그때는 <strong className={strong}>서버에서 만들어 내려주는 게</strong> 나아요.
          </li>
          <li>같은 방법으로 반대 방향도 돼요. 올린 CSV를 file.arrayBuffer()로 읽어 워커에 옮기고, 워커가 인코딩(UTF-8·EUC-KR)을 가려 읽어요.</li>
        </ul>
      </Topic>
    </>
  )
}

export function ApplicantExport({ feature }: { feature: FeatureRef }) {
  const { back } = useNav()
  const meter = useMainThreadMeter()
  const [progress, setProgress] = useState<number | null>(null)
  const [done, setDone] = useState<Done | null>(null)

  async function run() {
    setProgress(0)
    setDone(null)
    await nextFrame()
    meter.reset()
    const result = await buildInWorker(COUNT, setProgress)
    download(result.buffer, '지원자-목록.csv')
    await nextFrame()
    setDone({
      rows: COUNT,
      bytes: result.buffer.byteLength,
      workerMs: Math.round(result.ms),
      moveMs: result.arrivedAt - result.sentAt,
      longest: meter.read(),
      preview: result.preview,
    })
    setProgress(null)
  }

  const busy = progress !== null

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['Worker', 'ArrayBuffer', 'Transferable', 'TextEncoder', 'Blob']}
      title={'지원자 10만 명을\n멈춤 없이 내려받을까요?'}
      description="기업 대시보드의 '지원자 목록 내려받기'를 흉내 내요. 워커가 CSV를 만들어 ArrayBuffer로 옮겨 주고, 화면은 그동안 멈추지 않아요."
      cta={
        <Button onClick={run} disabled={busy}>
          {busy ? '파일을 만드는 중이에요' : '지원자 10만 명 내려받기'}
        </Button>
      }
    >
      {done && (
        <Result>
          지원자 {done.rows.toLocaleString()}명을 {mb(done.bytes)} CSV로 만들어 내려받았어요. 워커가 {done.workerMs.toLocaleString()}ms 동안 만드는 사이, 화면은{' '}
          {freeze(done.longest)}.
        </Result>
      )}
      {busy && (
        <div className="rounded-3xl bg-grey-50 p-5" aria-live="polite">
          <p className="text-[15px] font-semibold text-grey-800">지원자 {progress.toLocaleString()}명 만들었어요</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(progress / COUNT) * 100}%` }} />
          </div>
        </div>
      )}
      <MainThreadMeter dot={meter.dot} />
      <Card title="이렇게 흘러갔어요">
        <InfoList
          items={[
            ['워커가 만든 시간', done ? `${done.workerMs.toLocaleString()}ms` : '-'],
            ['옮겨 받은 ArrayBuffer', done ? mb(done.bytes) : '-'],
            ['화면으로 옮기는 데', done ? `${done.moveMs < 1 ? done.moveMs.toFixed(2) : Math.round(done.moveMs)}ms (복사 없음)` : '-'],
            ['화면이 가장 길게 멈춘 시간', done ? `${done.longest}ms` : '-'],
          ]}
        />
      </Card>
      {done && (
        <Card title="파일 앞부분">
          <pre className="overflow-x-auto rounded-2xl bg-white p-4 text-[12px] leading-[1.7] text-grey-800">{done.preview.join('\n')}</pre>
          <p className="mt-3 text-[14px] leading-[1.6] text-grey-500">
            3번 지원자의 자기소개는 =로 시작해요. 엑셀이 수식으로 실행하지 않게 앞에 '를 붙였어요.
          </p>
        </Card>
      )}
      <Note>
        지원자는 워커가 지어낸 가짜 데이터예요. 실제로는 워커가 지원자 API를 불러요. 워커 코드는 <code>src/workers/export.ts</code>에 있어요.
      </Note>
      <Report id="export" intro={<Explainer />} />
    </Screen>
  )
}
