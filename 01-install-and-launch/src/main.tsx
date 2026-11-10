import { StrictMode, useEffect, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { Badging } from './badging'
import { Launch } from './launch'
import { Pwa, useInstallPrompt } from './pwa'
import { Button, go, inAppWindow, Note, Screen, useRoute } from './ui'
import { WebInstall } from './web-install'
import { WebShare } from './web-share'
import { WindowControls } from './window-controls'
import { WindowManagement } from './window-management'

navigator.serviceWorker?.register('/sw.js')

type Feature = {
  id: string
  screen: ComponentType
  icon: string
  title: string
  summary: string
  supported: boolean
  needsInstall: boolean
}

// README의 결론 순서대로 묶어요: 원티드에 필요한 것 먼저, 알아만 두면 되는 것은 아래에.
const SECTIONS: { title: string; features: Feature[] }[] = [
  {
    title: '원티드에서 해볼 만해요',
    features: [
      { id: 'pwa', screen: Pwa, icon: '📲', title: '앱으로 설치하기', summary: '기업 대시보드를 Dock에 둘 수 있어요', supported: 'serviceWorker' in navigator, needsInstall: false },
      { id: 'badging', screen: Badging, icon: '🔴', title: '앱 아이콘에 숫자 띄우기', summary: '확인할 지원자 수를 보여줄 수 있어요', supported: 'setAppBadge' in navigator, needsInstall: true },
      { id: 'web-share', screen: WebShare, icon: '📤', title: '공고 공유하기', summary: '늘 쓰는 메신저로 바로 보내요', supported: 'share' in navigator, needsInstall: false },
    ],
  },
  {
    title: '지금은 필요 없어요',
    features: [
      { id: 'launch', screen: Launch, icon: '📂', title: '파일·링크·공유로 열기', summary: 'Launch Handler만 PWA와 같이 넣어요', supported: 'launchQueue' in window, needsInstall: true },
      { id: 'web-install', screen: WebInstall, icon: '🧩', title: '버튼 하나로 설치하기', summary: '앱 하나는 기본기로 설치할 수 있어요', supported: 'install' in navigator || 'HTMLInstallElement' in window, needsInstall: false },
      { id: 'window-controls', screen: WindowControls, icon: '🪟', title: '타이틀바까지 화면 쓰기', summary: '보기 좋게 꾸미는 기능이에요', supported: !!navigator.windowControlsOverlay, needsInstall: true },
      { id: 'window-management', screen: WindowManagement, icon: '🖥️', title: '다른 모니터에 창 열기', summary: '창은 직접 옮겨도 충분해요', supported: 'getScreenDetails' in window, needsInstall: false },
    ],
  },
]

const SCREENS = Object.fromEntries(SECTIONS.flatMap((s) => s.features).map((f) => [f.id, f.screen]))

/** 지금 이 브라우저에서 바로 써볼 수 있는지 알려줘요. */
function Status({ feature }: { feature: Feature }) {
  const [label, style] = !feature.supported
    ? ['미지원', 'bg-grey-100 text-grey-500']
    : feature.needsInstall && !inAppWindow
      ? ['설치 후 가능', 'bg-grey-100 text-grey-700']
      : ['바로 가능', 'bg-primary-weak text-primary']
  return <span className={`shrink-0 rounded-lg px-2 py-1 text-[13px] font-semibold ${style}`}>{label}</span>
}

function Home() {
  const { canInstall, install } = useInstallPrompt()

  return (
    <Screen
      title={inAppWindow ? '설치했어요!\n이제 하나씩 써봐요' : '웹을 앱처럼 쓰는 기술,\n직접 써볼까요?'}
      description={
        inAppWindow
          ? '앱 창에서만 되는 기능도 이제 모두 써볼 수 있어요.'
          : '원티드에서 해볼 만한 건 설치, 배지, 공유 세 가지예요. 대부분 설치한 앱 창에서 동작하니 먼저 설치하고 시작해요.'
      }
      cta={
        !inAppWindow && (
          <Button onClick={() => (canInstall ? install() : go('pwa'))}>
            {canInstall ? 'Install Lab 설치하기' : '설치 방법 보기'}
          </Button>
        )
      }
    >
      {!isSecureContext && (
        <p className="rounded-2xl bg-[#fff0f1] px-5 py-4 text-[15px] leading-[1.6] font-medium text-danger">
          https://localhost로 열어야 대부분의 기능이 동작해요
        </p>
      )}
      {SECTIONS.map((section) => (
        <section key={section.title} className="-mx-6">
          <h2 className="px-6 pt-2 pb-1 text-[14px] font-semibold text-grey-500">{section.title}</h2>
          <ul>
            {section.features.map((feature) => (
              <li key={feature.id}>
                <button
                  onClick={() => go(feature.id)}
                  className="flex w-full items-center gap-4 px-6 py-3.5 text-left transition hover:bg-grey-50 active:bg-grey-100 focus-visible:bg-grey-50 focus-visible:outline-none"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-grey-100 text-[22px]" aria-hidden>
                    {feature.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold text-grey-900">{feature.title}</span>
                    <span className="block truncate text-[14px] text-grey-500">{feature.summary}</span>
                  </span>
                  <Status feature={feature} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Note>기능마다 맨 아래에 원티드에 필요한지, 어디서 동작하는지, 참고 문서를 정리해 두었어요.</Note>
    </Screen>
  )
}

function App() {
  const route = useRoute()
  useEffect(() => {
    scrollTo(0, 0)
  }, [route])
  const Current = SCREENS[route] ?? Home
  return <Current />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
