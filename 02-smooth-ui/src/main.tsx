import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App, Button, FeatureSections, Note, Screen, useNav, type Section } from '../../shared/ui'
import { Anchor } from './anchor'
import { Popover } from './popover'
import { ViewTransitions } from './view-transitions'

// README의 결론 순서대로 묶어요: 원티드에서 바로 해볼 만한 것 먼저, 기다릴 것은 아래에.
const SECTIONS: Section[] = [
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

function Home() {
  const { go } = useNav()

  return (
    <Screen
      brand="Smooth Lab"
      title={'부드러운 화면,\n직접 느껴볼까요?'}
      description="원티드에서 바로 해볼 만한 건 View Transitions예요. 나머지 둘은 Montage가 이미 JavaScript로 하고 있는 일이라 서두르지 않아도 돼요."
      cta={<Button onClick={() => go(SECTIONS[0].features[0].id)}>하나씩 해보기</Button>}
    >
      <FeatureSections sections={SECTIONS} />
      <Note>기능을 누르면 화면이 옆으로 밀리며 바뀌어요. 그 움직임도 이 샘플이 보여주는 View Transitions예요.</Note>
    </Screen>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App sections={SECTIONS} home={<Home />} />
  </StrictMode>,
)
