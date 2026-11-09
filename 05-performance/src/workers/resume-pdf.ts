// 이력서 PDF 화면: 이력서 JSON을 받아 PDF를 그리고, 다 만든 바이트(ArrayBuffer)를 화면으로 옮겨 줘요(transfer).
import { create } from 'fontkit'
import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib'
import { careerMeta, educationMeta, projectMeta, totalCareer, type Resume } from '../resume'

// 서버 PDF처럼 굵기 두 개만 써요. WOFF2는 fontkit이 쓴 글자만 골라 담지(subset) 못해서, 그다음으로 작은 OTF를 받아요.
const FONT_URLS = {
  medium: new URL('../../node_modules/pretendard/dist/public/static/Pretendard-Medium.otf', import.meta.url).href,
  bold: new URL('../../node_modules/pretendard/dist/public/static/Pretendard-Bold.otf', import.meta.url).href,
}
const FONT_CACHE = 'resume-fonts'

// pdf-lib 1.17은 옛 fontkit의 encodeStream()을 불러요. 옛 fontkit(@pdf-lib/fontkit)은 subset한 글자 일부가 비어 보여서,
// 고쳐진 fontkit 2를 쓰고 encode() 결과를 encodeStream() 모양으로 감싸요.
const fontkit = {
  create(bytes: Uint8Array) {
    const font = create(bytes)
    const createSubset = font.createSubset.bind(font)
    font.createSubset = () => {
      const subset = createSubset()
      subset.encodeStream = () => {
        const out = subset.encode()
        const stream = {
          on(event: string, listener: (data?: Uint8Array) => void) {
            if (event === 'data') listener(out)
            if (event === 'end') listener()
            return stream
          },
        }
        return stream
      }
      return subset
    }
    return font
  },
} as unknown as Parameters<PDFDocument['registerFontkit']>[0]

/** 글꼴을 Cache Storage에서 먼저 찾고, 없으면 받아서 담아 둬요. 두 번째부터는 네트워크를 쓰지 않아요. */
async function loadFonts() {
  const cache = await caches.open(FONT_CACHE)
  let downloaded = 0
  const load = async (url: string) => {
    const cached = await cache.match(url)
    if (cached) return new Uint8Array(await cached.arrayBuffer())
    const response = await fetch(url)
    await cache.put(url, response.clone())
    const bytes = new Uint8Array(await response.arrayBuffer())
    downloaded += bytes.byteLength
    return bytes
  }
  const [medium, bold] = await Promise.all([load(FONT_URLS.medium), load(FONT_URLS.bold)])
  // 배포하면 파일 이름(해시)이 바뀌어요. 지금 쓰지 않는 옛 글꼴은 지워서 저장 공간이 쌓이지 않게 해요.
  const current = Object.values(FONT_URLS)
  for (const request of await cache.keys()) if (!current.includes(request.url)) await cache.delete(request)
  return { medium, bold, downloaded, total: medium.byteLength + bold.byteLength }
}

// A4(pt). 여백과 크기는 서버 PDF를 재서 맞췄어요.
const W = 595.28
const H = 841.89
const LEFT = 38
const RIGHT = W - 38
const TOP = 44
const BOTTOM = 44
const INDENT = 76
const INK = rgb(0.09, 0.09, 0.1)
const GREY = rgb(0.53, 0.53, 0.55)
const LINE = rgb(0.88, 0.89, 0.9)

type Style = { font: PDFFont; size: number; lineHeight: number; color?: RGB }

// 한글은 글자 사이 어디서나, 영어·숫자는 단어 단위로 줄을 바꿔요(브라우저의 word-break: normal과 비슷해요). 닫는 부호는 앞 글자에 붙여요.
const ATOM = /[ㄱ-ㆎ가-힣][.,;:!?)\]}%·]*|[^\sㄱ-ㆎ가-힣]+|\s+/g

function wrap(text: string, width: number, { font, size }: Style) {
  const lines: string[] = []
  let current = ''
  for (const atom of text.match(ATOM) ?? []) {
    const next = current + atom
    if (!current.trim() || font.widthOfTextAtSize(next, size) <= width) {
      current = next
      continue
    }
    lines.push(current.trimEnd())
    current = atom.trimStart()
  }
  if (current.trim()) lines.push(current.trimEnd())
  return lines
}

/** 위에서 아래로 흘려 쓰다가, 자리가 모자라면 새 쪽을 만들어요. HTML/CSS가 없으니 줄바꿈과 쪽 나누기를 직접 해요. */
class Writer {
  page!: PDFPage
  y = 0

  constructor(private doc: PDFDocument) {
    this.newPage()
  }

  newPage() {
    this.page = this.doc.addPage([W, H])
    this.y = H - TOP
  }

  ensure(height: number) {
    if (this.y - height < BOTTOM) this.newPage()
  }

  gap(height: number) {
    this.y -= height
  }

  /** y는 줄의 위쪽이에요. 글자는 줄 높이 가운데에 놓아요. */
  draw(text: string, x: number, style: Style) {
    this.page.drawText(text, { x, y: this.y - style.lineHeight / 2 - style.size * 0.35, size: style.size, font: style.font, color: style.color ?? INK })
  }

  line(text: string, x: number, style: Style) {
    this.ensure(style.lineHeight)
    this.draw(text, x, style)
    this.y -= style.lineHeight
  }

  paragraph(text: string, x: number, style: Style) {
    for (const raw of text.split('\n')) {
      if (!raw.trim()) this.gap(style.lineHeight)
      else for (const line of wrap(raw, RIGHT - x, style)) this.line(line, x, style)
    }
  }

  /** "2020.03 - 재직중 | 정규직 | 프론트엔드"처럼 사이에 얇은 세로선을 그어요. */
  meta(parts: string[], x: number, style: Style) {
    this.ensure(style.lineHeight)
    const middle = this.y - style.lineHeight / 2
    let cursor = x
    parts.forEach((part, i) => {
      if (i) {
        cursor += 7
        this.page.drawLine({ start: { x: cursor, y: middle - 4 }, end: { x: cursor, y: middle + 4 }, thickness: 0.6, color: LINE })
        cursor += 7
      }
      this.draw(part, cursor, style)
      cursor += style.font.widthOfTextAtSize(part, style.size)
    })
    this.y -= style.lineHeight
  }

  rule(x: number, thickness: number, color: RGB) {
    this.page.drawLine({ start: { x, y: this.y }, end: { x: RIGHT, y: this.y }, thickness, color })
  }

  /** 회사·학교 로고 자리예요. 로고는 다른 출처 이미지라 CORS 헤더가 없으면 담을 수 없어서, 첫 글자를 넣은 상자로 그려요. */
  logo(initial: string, style: Style) {
    const size = 26
    this.page.drawSvgPath('M5 0H21Q26 0 26 5V21Q26 26 21 26H5Q0 26 0 21V5Q0 0 5 0Z', {
      x: LEFT,
      y: this.y,
      color: rgb(0.97, 0.97, 0.98),
      borderColor: LINE,
      borderWidth: 0.6,
    })
    const width = style.font.widthOfTextAtSize(initial, style.size)
    this.page.drawText(initial, { x: LEFT + (size - width) / 2, y: this.y - size / 2 - style.size * 0.35, size: style.size, font: style.font, color: GREY })
  }
}

async function build(data: Resume, fonts: { medium: Uint8Array; bold: Uint8Array }) {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  doc.setTitle(`${data.resume.name} 이력서`)
  doc.setLanguage('ko-KR')
  doc.setCreator('web-platform-playground · 05-performance')
  // subset: true면 이력서에 쓴 글자만 PDF에 담아요. 1.6MB 글꼴이 몇십 KB가 돼요.
  // Pretendard는 '->'를 화살표(→)로 바꿔요(calt, clig). 쓴 글자 그대로 나오게 합자 기능을 꺼요. 인쇄용 화면도 같이 꺼요.
  const features = { calt: false, clig: false, liga: false }
  const medium = await doc.embedFont(fonts.medium, { subset: true, features })
  const bold = await doc.embedFont(fonts.bold, { subset: true, features })

  const S = {
    name: { font: bold, size: 18, lineHeight: 26 },
    contact: { font: medium, size: 8.5, lineHeight: 14, color: GREY },
    about: { font: medium, size: 10, lineHeight: 17 },
    section: { font: bold, size: 12, lineHeight: 18 },
    sectionNote: { font: medium, size: 9, lineHeight: 18, color: GREY },
    title: { font: bold, size: 10.5, lineHeight: 17 },
    meta: { font: medium, size: 9.5, lineHeight: 16 },
    body: { font: medium, size: 9, lineHeight: 16 },
    logo: { font: bold, size: 11, lineHeight: 26 },
  } satisfies Record<string, Style>

  const w = new Writer(doc)
  const section = (title: string, note?: string) => {
    w.ensure(60)
    w.draw(title, LEFT, S.section)
    if (note) w.draw(note, LEFT + bold.widthOfTextAtSize(title, S.section.size) + 8, S.sectionNote)
    w.gap(S.section.lineHeight + 8)
    w.rule(LEFT, 0.75, INK)
    w.gap(16)
  }

  w.line(data.resume.name, LEFT, S.name)
  w.gap(2)
  w.meta([data.resume.mobile, data.resume.email], LEFT, S.contact)
  w.gap(20)
  w.paragraph(data.resume.about, LEFT, S.about)
  w.gap(44)

  section('경력', totalCareer(data))
  for (const career of data.careers) {
    w.ensure(60)
    w.logo(career.company.name[0], S.logo)
    w.line(career.company.name, INDENT, S.title)
    w.meta(careerMeta(career), INDENT, S.meta)
    w.gap(10)
    w.rule(INDENT, 0.5, LINE)
    w.gap(14)
    for (const project of career.projects) {
      w.ensure(S.title.lineHeight + S.meta.lineHeight + S.body.lineHeight * 2) // 제목만 쪽 끝에 남지 않게요
      w.line(project.title, INDENT, S.title)
      w.meta(projectMeta(project), INDENT, S.meta)
      w.gap(4)
      w.paragraph(project.description, INDENT, S.body)
      w.gap(22)
    }
  }

  // 서버 PDF처럼 학력은 새 쪽에서 시작해요.
  w.newPage()
  section('학력')
  for (const education of data.educations) {
    w.ensure(40)
    w.logo(education.school_name[0], S.logo)
    w.line(education.school_name, INDENT, S.title)
    w.meta(educationMeta(education), INDENT, S.meta)
    w.gap(16)
  }

  const bytes = await doc.save()
  return { bytes, pages: doc.getPageCount() }
}

self.onmessage = async (event: MessageEvent<{ resume: Resume }>) => {
  try {
    const fontStartedAt = performance.now()
    const fonts = await loadFonts()
    const fontMs = performance.now() - fontStartedAt
    const buildStartedAt = performance.now()
    const { bytes, pages } = await build(event.data.resume, fonts)
    const buildMs = performance.now() - buildStartedAt
    // bytes가 더 큰 버퍼의 일부라면 .buffer를 옮길 때 전체가 넘어가요. 딱 맞는 크기일 때만 그대로 옮겨요.
    const buffer = bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength ? bytes.buffer : bytes.slice().buffer
    self.postMessage(
      {
        type: 'done',
        buffer,
        pages,
        fontMs,
        fontBytes: fonts.total,
        downloaded: fonts.downloaded,
        buildMs,
        sentAt: performance.timeOrigin + performance.now(),
      },
      { transfer: [buffer] }, // 다 만든 PDF를 복사하지 않고 옮겨요
    )
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error) })
  }
}
