import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, Card, InfoList, Note, Result, Screen, useNav, type FeatureRef } from '../../shared/ui'
import { bullets, Code, ExplainTitle, Lead, numbered, strong, Topic } from '../../shared/explain'
import { Choice } from './choice'
import { freeze, MainThreadMeter, nextFrame, useMainThreadMeter } from './meter'
import { Report } from './report'
import { RESUME } from './resume'
import { printResume, ResumeDocument } from './resume-document'

type Mode = 'worker' | 'print'
type Done = { pages: number; bytes: number; fontMs: number; fontBytes: number; downloaded: number; buildMs: number; moveMs: number; longest: number; url: string }
type Reply =
  | { type: 'done'; buffer: ArrayBuffer; pages: number; fontMs: number; fontBytes: number; downloaded: number; buildMs: number; sentAt: number }
  | { type: 'error'; message: string }

// 원티드 서버가 만든 같은 이력서 PDF예요. PDF 속 정보로 Chromium(Skia/PDF m133)이 만든 걸 확인했어요.
const SERVER = { bytes: 588.6 * 1024, pages: 6 }

const kb = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.round(bytes / 1024)}KB`)
const ms = (value: number) => `${Math.round(value).toLocaleString()}ms`

function buildInWorker() {
  return new Promise<Extract<Reply, { type: 'done' }> & { arrivedAt: number }>((resolve, reject) => {
    const worker = new Worker(new URL('./workers/resume-pdf.ts', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }: MessageEvent<Reply>) => {
      worker.terminate()
      if (data.type === 'error') reject(new Error(data.message))
      else resolve({ ...data, arrivedAt: performance.timeOrigin + performance.now() })
    }
    worker.postMessage({ resume: RESUME }) // 이력서 JSON은 작아서 복사해도 괜찮아요
  })
}

const CODE = `// resume-pdf-worker.js
import { PDFDocument } from 'pdf-lib'

self.onmessage = async ({ data }) => {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const font = await doc.embedFont(await loadFont(), { subset: true }) // 쓴 글자만 담아요
  const page = doc.addPage([595.28, 841.89]) // A4
  page.drawText(data.resume.name, { x: 38, y: 790, size: 18, font })
  // … 줄바꿈과 쪽 나누기를 직접 계산하며 그려요
  const bytes = await doc.save()
  self.postMessage({ buffer: bytes.buffer }, [bytes.buffer]) // 복사하지 않고 옮겨요
}

// 화면
worker.onmessage = ({ data }) => {
  const url = URL.createObjectURL(new Blob([data.buffer], { type: 'application/pdf' }))
  Object.assign(document.createElement('a'), { href: url, download: '이력서.pdf' }).click()
}`

const PRINT_CODE = `@media print {
  @page { size: A4; margin: 15mm 13mm; }
  .no-print { display: none; }
  .project-title { break-after: avoid; }  /* 제목만 쪽 끝에 남지 않게 */
  .education { break-before: page; }      /* 새 쪽에서 시작 */
}

document.title = '홍길동_이력서' // 저장할 PDF의 기본 파일 이름이 돼요
window.print()`

function Explainer() {
  return (
    <>
      <ExplainTitle>서버 대신 브라우저가 PDF를 만들 수 있을까요?</ExplainTitle>
      <Lead>
        만들 수 있어요. 지금 원티드 서버는 <strong className={strong}>크롬(Chromium)으로 이력서 HTML을 PDF로 인쇄</strong>해요. 서버 PDF 안에 그 정보가
        남아 있어요(Chromium, Skia/PDF m133). 브라우저에서는 두 가지 방법이 있어요.
      </Lead>
      <Topic icon="🧵" title="방법 1 · 워커가 PDF를 직접 그려요">
        <ol className={numbered}>
          <li>화면이 이력서 JSON을 워커에 보내요. 작아서 복사해도 괜찮아요.</li>
          <li>워커가 글꼴을 준비해요. 처음엔 받고, 다음부터는 Cache Storage에 담아 둔 걸 써요.</li>
          <li>pdf-lib로 글자를 그리고 쪽을 나눠요. 글꼴은 이력서에 쓴 글자만 골라 담아서(subset) PDF가 작아요.</li>
          <li>다 만든 PDF 바이트(ArrayBuffer)를 transfer로 옮기고, 화면은 Blob으로 바로 내려받아요.</li>
        </ol>
        <Code code={CODE} />
      </Topic>
      <Topic icon="🖨️" title="방법 2 · 브라우저 인쇄 기능을 써요">
        <p>
          인쇄용 CSS를 붙이고 window.print()를 불러요. 크롬이면 서버와 <strong className={strong}>같은 엔진</strong>으로 PDF를 만들어요. 받을 라이브러리도, 새로 그릴
          레이아웃도 없어요. 대신 인쇄 창에서 "PDF로 저장"을 한 번 골라야 하고, 브라우저마다 결과가 조금 달라요.
        </p>
        <Code code={PRINT_CODE} />
      </Topic>
      <Topic icon="🧱" title="만들며 부딪힌 것">
        <ul className={bullets}>
          <li>
            <strong className={strong}>처음 받을 게 많아요.</strong> Pretendard 굵기 하나가 OTF로 1.6MB이고, PDF 라이브러리가 gzip으로 330KB예요. 더 작은
            WOFF2(0.76MB)는 fontkit이 subset하지 못해서 못 써요.
          </li>
          <li>
            pdf-lib가 쓰는 옛 fontkit(@pdf-lib/fontkit)은 subset한 글자 일부가 PDF에서 비어 보여요. 고쳐진 fontkit 2를 감싸서 썼어요.
          </li>
          <li>
            Pretendard는 '-&gt;'를 화살표(→)로 바꾸는 합자 기능(calt, clig)이 있어요. 그대로 두면 이력서 내용이 바뀌어서, PDF와 인쇄용 화면 모두 꺼요.
          </li>
          <li>회사·학교 로고는 다른 출처 이미지인데 CORS 헤더가 없어서, 브라우저에서는 PDF에 담을 수 없어요. 서버는 담을 수 있어요.</li>
          <li>HTML·CSS가 없어서 줄바꿈, 쪽 나누기, 여백을 좌표로 직접 계산해요. 서버 PDF와 똑같이 맞추려면 손이 많이 가요.</li>
        </ul>
      </Topic>
      <Topic icon="🏢" title="원티드에 옮긴다면">
        <ul className={bullets}>
          <li>
            기업에 제출되는 이력서 PDF는 누가 열어도 같아야 해서 <strong className={strong}>서버에 둬요.</strong> "내가 내려받는 내 이력서"만 브라우저로 옮겨요.
          </li>
          <li>화면을 열 때 워커와 글꼴을 미리 받아 두면, 버튼을 누른 뒤에는 그리기만 해서 더 빨라요.</li>
          <li>글꼴은 brotli로 압축해 내려주면 1.6MB가 0.8MB쯤으로 줄어요. 해시가 붙은 파일에 긴 Cache-Control을 주면 브라우저 캐시도 같은 일을 해요.</li>
          <li>받을 게 하나도 없어야 한다면 방법 2(인쇄)가 가장 싸요. 이미 있는 이력서 화면에 인쇄용 CSS만 더하면 돼요.</li>
        </ul>
      </Topic>
    </>
  )
}

export function ResumePdf({ feature }: { feature: FeatureRef }) {
  const { back } = useNav()
  const meter = useMainThreadMeter()
  const [mode, setMode] = useState<Mode>('worker')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<Done | null>(null)
  const [printed, setPrinted] = useState(false)
  const [error, setError] = useState('')
  const lastUrl = useRef('')

  // 만든 PDF 주소는 화면을 떠날 때 지워요.
  useEffect(() => () => URL.revokeObjectURL(lastUrl.current), [])

  async function run() {
    setError('')
    if (mode === 'print') {
      await printResume(RESUME)
      setPrinted(true)
      return
    }
    setBusy(true)
    await nextFrame()
    meter.reset()
    try {
      const result = await buildInWorker()
      URL.revokeObjectURL(lastUrl.current)
      const url = URL.createObjectURL(new Blob([result.buffer], { type: 'application/pdf' }))
      lastUrl.current = url
      Object.assign(document.createElement('a'), { href: url, download: `${RESUME.resume.name}_이력서.pdf` }).click()
      await nextFrame()
      setDone({
        pages: result.pages,
        bytes: result.buffer.byteLength,
        fontMs: result.fontMs,
        fontBytes: result.fontBytes,
        downloaded: result.downloaded,
        buildMs: result.buildMs,
        moveMs: result.arrivedAt - result.sentAt,
        longest: meter.read(),
        url,
      })
    } catch (e) {
      setError(`PDF를 만들지 못했어요. 새로고침하고 다시 눌러요. (${e})`)
    }
    setBusy(false)
  }

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['Worker', 'pdf-lib', 'Cache Storage', 'Transferable', 'window.print()']}
      title={'이력서 PDF를\n브라우저에서 만들어 볼까요?'}
      description="서버가 하던 '이력서 PDF 내려받기'를 브라우저가 해요. 워커가 PDF를 직접 그려서 바로 내려받거나, 브라우저 인쇄 기능으로 저장해요."
      cta={
        <Button onClick={run} disabled={busy}>
          {busy ? 'PDF를 만드는 중이에요' : mode === 'worker' ? '이력서 PDF 내려받기' : '인쇄 창 열기'}
        </Button>
      }
    >
      {error && <Result>{error}</Result>}
      {mode === 'worker' && done && (
        <Result>
          {done.pages}쪽짜리 PDF({kb(done.bytes)})를 {ms(done.buildMs)} 만에 그려서 내려받았어요.{' '}
          {done.downloaded ? `처음이라 글꼴 ${kb(done.downloaded)}를 받았어요.` : '글꼴은 담아 둔 걸 써서 받지 않았어요.'} 그동안 화면은 {freeze(done.longest)}.
        </Result>
      )}
      {mode === 'print' && printed && (
        <Result>인쇄 창에서 대상을 "PDF로 저장"으로 고르면 돼요. 파일 이름은 "{RESUME.resume.name}_이력서"로 채워져요.</Result>
      )}
      <Choice
        label="어떻게 만들까요?"
        value={mode}
        options={[
          ['worker', '바로 내려받기'],
          ['print', '인쇄 창으로 저장'],
        ]}
        onChange={setMode}
        disabled={busy}
      />
      {mode === 'worker' && <MainThreadMeter dot={meter.dot} />}
      <Card title="서버 PDF와 비교해요">
        <InfoList
          items={[
            ['서버 (지금)', `${kb(SERVER.bytes)} · ${SERVER.pages}쪽 · 서버의 크롬이 만들어요`],
            ['워커로 바로 내려받기', done ? `${kb(done.bytes)} · ${done.pages}쪽 · 글꼴 ${kb(done.fontBytes)}` : '아직 안 만들었어요'],
            ['인쇄 창으로 저장', '받을 것 없음 · 크롬이면 서버와 같은 엔진'],
          ]}
        />
      </Card>
      {mode === 'worker' && done && (
        <Card title="이렇게 흘러갔어요">
          <InfoList
            items={[
              ['글꼴 준비', `${ms(done.fontMs)} · ${done.downloaded ? '네트워크에서 받았어요' : 'Cache Storage에서 꺼냈어요'}`],
              ['PDF 그리기 (워커)', ms(done.buildMs)],
              ['화면으로 옮기기', `${done.moveMs < 1 ? done.moveMs.toFixed(2) : Math.round(done.moveMs)}ms (복사 없음)`],
              ['화면이 가장 길게 멈춘 시간', `${done.longest}ms`],
            ]}
          />
          <a href={done.url} target="_blank" rel="noreferrer" className="mt-4 block rounded-2xl bg-white py-3 text-center text-[15px] font-semibold text-primary">
            만든 PDF 열어 보기
          </a>
        </Card>
      )}
      <Note>
        이력서는 원티드 이력서 API 응답과 같은 모양이에요(<code>src/resume.ts</code>). 휴대폰 번호는 가짜로 바꿨어요. PDF를 그리는 코드는{' '}
        <code>src/workers/resume-pdf.ts</code>, 인쇄용 화면은 <code>src/resume-document.tsx</code>에 있어요.
      </Note>
      <Report id="resume-pdf" intro={<Explainer />} />
      {createPortal(
        <div id="resume-print">
          <ResumeDocument data={RESUME} />
        </div>,
        document.body,
      )}
    </Screen>
  )
}
