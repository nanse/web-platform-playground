import { useState } from 'react'
import { back, Button, Card, Note, Screen } from './ui'
import { Report } from './report'

export function WindowManagement() {
  const [screens, setScreens] = useState<readonly ScreenDetailed[]>([])
  const [error, setError] = useState('')
  const supported = 'getScreenDetails' in window

  async function loadScreens() {
    try {
      // 처음 호출할 때 "창 관리" 권한을 물어요.
      setScreens((await window.getScreenDetails!()).screens)
      setError('')
    } catch (e) {
      setError(`모니터 목록을 가져오지 못했어요. 사이트 설정에서 "창 관리" 권한을 허용하고 다시 눌러요. (${e})`)
    }
  }

  function openOn(screen: ScreenDetailed) {
    window.open('/', '_blank', `popup,left=${screen.availLeft + 40},top=${screen.availTop + 40},width=480,height=360`)
  }

  return (
    <Screen
      onBack={back}
      apis={['Window Management API']}
      title={screens.length ? '어느 모니터에\n창을 열까요?' : '다른 모니터에\n창을 열어 볼까요?'}
      description={
        screens.length
          ? '고른 모니터의 왼쪽 위에 작은 창이 열려요.'
          : '연결된 모니터 목록을 읽고, 고른 모니터에 새 창을 열어요. 처음 한 번 "창 관리" 권한을 물어봐요.'
      }
      cta={
        screens.length === 0 && (
          <Button onClick={loadScreens} disabled={!supported}>
            모니터 목록 가져오기
          </Button>
        )
      }
    >
      {screens.length > 0 && (
        <ul className="flex flex-col">
          {screens.map((screen, i) => (
            <li key={i} className="flex items-center gap-4 py-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-grey-100 text-[22px]" aria-hidden>
                🖥️
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-semibold text-grey-900">{screen.label || `모니터 ${i + 1}`}</p>
                <p className="text-[14px] text-grey-500">
                  {screen.width}×{screen.height}
                  {screen.isPrimary && ' · 기본 모니터'}
                </p>
              </div>
              <button
                onClick={() => openOn(screen)}
                className="shrink-0 rounded-xl bg-primary-weak px-4 py-2 text-[15px] font-semibold text-primary transition hover:bg-[#d6e8ff] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-primary"
              >
                여기에 열기
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <Card>
          <p className="text-[15px] leading-[1.6] text-grey-700">{error}</p>
        </Card>
      )}
      {!supported && <Note>이 브라우저는 아직 Window Management API를 지원하지 않아요. 데스크톱 크롬·엣지에서 열어요.</Note>}
      <Report ids={['window-management']} />
    </Screen>
  )
}
