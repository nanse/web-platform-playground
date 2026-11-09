// 실무 예제: 지원자 목록을 CSV로 만들고, 바이트(ArrayBuffer)로 바꿔서 화면에 옮겨 줘요(transfer).
// 실제로는 여기서 fetch로 지원자 API를 페이지 단위로 불러요. 이 샘플은 지원자를 지어내요.
const FAMILY = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임']
const GIVEN = ['민준', '서연', '도윤', '하은', '지호', '수아', '예준', '지우', '현우', '유나']
const POSITIONS = ['프론트엔드 개발자', '백엔드 개발자', '프로덕트 디자이너', '데이터 분석가', '프로덕트 매니저']
const STATUSES = ['서류 검토', '서류 합격', '면접 예정', '최종 합격', '불합격']
const HEADER = ['번호', '이름', '지원 포지션', '상태', '지원일', '자기소개']

/**
 * 엑셀이 =, +, -, @로 시작하는 칸을 수식으로 실행하지 않게 앞에 '를 붙여요(CSV 인젝션).
 * 쉼표·따옴표·줄바꿈이 있으면 따옴표로 감싸고, 안의 따옴표는 두 번 써요.
 */
function cell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}

const appliedOn = (i: number) => new Date(Date.UTC(2026, 9, 1) + (i % 30) * 86_400_000).toISOString().slice(0, 10)

self.onmessage = (event: MessageEvent<{ count: number }>) => {
  const startedAt = performance.now()
  const { count } = event.data
  const lines = [HEADER.join(',')]
  for (let i = 1; i <= count; i++) {
    const name = FAMILY[i % 10] + GIVEN[(i * 7) % 10]
    // 지원자가 직접 쓴 글에는 쉼표, 따옴표, 수식이 섞일 수 있어요. 3번 지원자는 일부러 수식으로 시작해요.
    const intro = i % 1000 === 3 ? '=HYPERLINK("https://example.com","클릭")' : `안녕하세요, ${name}입니다. "함께 성장"하고 싶어요.`
    lines.push([String(i), name, POSITIONS[i % 5], STATUSES[(i * 3) % 5], appliedOn(i), intro].map(cell).join(','))
    if (i % 10_000 === 0) self.postMessage({ type: 'progress', done: i })
  }
  // 맨 앞의 BOM(﻿)이 있어야 엑셀이 UTF-8로 읽어서 한글이 안 깨져요.
  const bytes = new TextEncoder().encode('﻿' + lines.join('\r\n'))
  const ms = performance.now() - startedAt
  self.postMessage(
    { type: 'done', buffer: bytes.buffer, ms, preview: lines.slice(0, 4), sentAt: performance.timeOrigin + performance.now() },
    { transfer: [bytes.buffer] }, // 복사하지 않고 옮겨요. 이 뒤로 워커의 bytes는 비어요.
  )
}
