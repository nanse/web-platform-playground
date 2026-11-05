import { StrictMode, useLayoutEffect, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { Anchor } from './anchor'
import { Popover } from './popover'
import { Button, FeatureIcon, NavContext, Note, Screen, useNav, useRouter } from './ui'
import { ViewTransitions } from './view-transitions'

type Feature = {
  id: string
  icon: string
  screen: ComponentType<{ feature: { id: string; icon: string } }>
  title: string
  summary: string
  supported: boolean
}

// README의 결론 순서대로 묶어요: 원티드에서 바로 해볼 만한 것 먼저, 기다릴 것은 아래에.
const SECTIONS: { title: string; features: Feature[] }[] = [
  {
    title: '원티드에서 해볼 만해요',
    features: [
      {
        id: 'view-transitions',
        icon: '✨',
        screen: ViewTransitions,
        title: '화면을 부드럽게 잇기',
        summary: '공고 목록과 상세를 자연스럽게 이어요',
        supported: 'startViewTransition' in document,
      },
    ],
  },
  {
    title: 'Montage를 손볼 때 봐요',
    features: [
      {
        id: 'popover',
        icon: '💬',
        screen: Popover,
        title: 'JavaScript 없이 바텀시트 열기',
        summary: 'Portal 없이 맨 위 층에 띄워요',
        supported: 'popover' in HTMLElement.prototype,
      },
    ],
  },
  {
    title: '조금 더 기다려요',
    features: [
      {
        id: 'anchor',
        icon: '📍',
        screen: Anchor,
        title: '말풍선이 버튼 따라가기',
        summary: '구형 iOS 때문에 아직 floating-ui가 필요해요',
        supported: CSS.supports('anchor-name', '--a'),
      },
    ],
  },
]

const FEATURES = SECTIONS.flatMap((section) => section.features)

function Home() {
  const { go } = useNav()

  return (
    <Screen
      title={'부드러운 화면,\n직접 느껴볼까요?'}
      description="원티드에서 바로 해볼 만한 건 View Transitions예요. 나머지 둘은 Montage가 이미 JavaScript로 하고 있는 일이라 서두르지 않아도 돼요."
      cta={<Button onClick={() => go(FEATURES[0].id)}>하나씩 해보기</Button>}
    >
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
                  <FeatureIcon id={feature.id} icon={feature.icon} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold text-grey-900">{feature.title}</span>
                    <span className="block truncate text-[14px] text-grey-500">{feature.summary}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-lg px-2 py-1 text-[13px] font-semibold ${
                      feature.supported ? 'bg-primary-weak text-primary' : 'bg-grey-100 text-grey-500'
                    }`}
                  >
                    {feature.supported ? '바로 가능' : '미지원'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Note>기능을 누르면 화면이 옆으로 밀리며 바뀌어요. 그 움직임도 이 샘플이 보여주는 View Transitions예요.</Note>
    </Screen>
  )
}

function App() {
  const { route, nav } = useRouter()
  // 레이아웃 단계에서 맨 위로 올려야, 새 화면의 스냅샷이 맨 위에서 찍혀요.
  useLayoutEffect(() => {
    scrollTo(0, 0)
  }, [route])

  const feature = FEATURES.find((f) => f.id === route)
  return (
    <NavContext value={nav}>{feature ? <feature.screen feature={{ id: feature.id, icon: feature.icon }} /> : <Home />}</NavContext>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
