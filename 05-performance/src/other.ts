// 두 번째 페이지. 어디서 왔는지(from)에 따라 안내를 바꿔요. React 없이 몇 줄이면 돼요.
export {}

type NavigationTiming = PerformanceNavigationTiming & { activationStart?: number }
const from = new URLSearchParams(location.search).get('from')
const $ = (id: string) => document.getElementById(id)!

function render() {
  const nav = performance.getEntriesByType('navigation')[0] as NavigationTiming | undefined
  const activationStart = Math.round(nav?.activationStart ?? 0)

  if (from === 'bfcache') {
    $('description').textContent = '아래 버튼으로 돌아가 봐요. 처음부터 다시 불러오지 않고, 떠날 때 모습 그대로 나오는지 보면 돼요.'
    $('result').textContent = '원래 화면은 지금 브라우저 안에 얼려 둔 상태예요.'
    return
  }

  $('description').textContent = '이전 화면이 Speculation Rules로 이 페이지를 미리 그려 두라고 브라우저에 알려 줬어요. 실제로 미리 그려 뒀는지 아래에서 알려줘요.'
  $('result').textContent =
    activationStart > 0
      ? `미리 그려 둔 페이지였어요. 그리기 시작한 지 ${(activationStart / 1000).toFixed(1)}초 뒤에, 기다림 없이 바로 보여 줬어요. (activationStart: ${activationStart}ms)`
      : '평범하게 불러온 페이지예요. 미리 그려 두지 않았어요. (activationStart: 0ms)'
}

render()
// 미리 그려지는 동안에는 activationStart가 아직 0이라, 실제로 보여질 때 다시 그려요.
document.addEventListener('prerenderingchange', render)

$('back').addEventListener('click', () => (history.length > 1 ? history.back() : location.assign('/')))
