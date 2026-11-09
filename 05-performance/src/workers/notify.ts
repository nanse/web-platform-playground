// Shared Worker 화면: 같은 주소의 탭들이 이 워커 하나에 붙어요.
// 알림 확인(서버 요청)은 탭 수와 상관없이 여기서만 해요. 결과는 붙어 있는 모든 탭에 나눠 줘요.
type State = { tabs: number; checks: number; unread: number; checkedAt: string; by: string }

const ports = new Set<MessagePort>()
const state: State = { tabs: 0, checks: 0, unread: 0, checkedAt: '', by: '' }
let timer: ReturnType<typeof setInterval> | undefined

function broadcast() {
  state.tabs = ports.size
  ports.forEach((port) => port.postMessage(state))
}

// 진짜라면 여기서 fetch('/api/notifications')를 불러요. 이 샘플은 새 알림 1개가 왔다고 쳐요.
function check(by: string) {
  state.checks += 1
  state.unread += 1
  state.checkedAt = new Date().toLocaleTimeString('ko-KR')
  state.by = by
  broadcast()
}

// SharedWorkerGlobalScope 타입은 DOM 타입과 같이 못 써서, 필요한 것만 적어요.
const scope = self as unknown as { onconnect: (event: MessageEvent) => void }

scope.onconnect = (event) => {
  const port = event.ports[0]
  ports.add(port)
  port.onmessage = ({ data }: MessageEvent<{ type: 'check' | 'bye'; tab: string }>) => {
    if (data.type === 'check') check(`탭(${data.tab})이 눌렀어요`)
    if (data.type === 'bye') ports.delete(port)
    if (!ports.size) {
      clearInterval(timer)
      timer = undefined
    }
    broadcast()
  }
  // 탭이 하나라도 붙어 있으면 10초마다 한 번만 물어봐요.
  timer ??= setInterval(() => check('10초마다 워커가 물어봤어요'), 10_000)
  broadcast()
}
