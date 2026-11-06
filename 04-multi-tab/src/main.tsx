import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App, Button, FeatureSections, Note, Screen, useNav, type Section } from '../../shared/ui'
import { BroadcastChannelScreen } from './broadcast-channel'
import { WebLocks } from './web-locks'

// README의 결론 순서대로 묶어요: 원티드에서 바로 해볼 만한 것 먼저, 조건이 맞을 때만 쓸 것은 아래에.
const SECTIONS: Section[] = [
  {
    title: '원티드에서 해볼 만해요',
    features: [
      {
        id: 'broadcast-channel',
        icon: '📣',
        screen: BroadcastChannelScreen,
        title: '로그아웃을 모든 탭에 알리기',
        summary: '쿠키를 지운 뒤 남은 탭 화면을 맞춰요',
        supported: 'BroadcastChannel' in window,
      },
    ],
  },
  {
    title: '여러 탭이 같은 일을 겹쳐 할 때만 써요',
    features: [
      {
        id: 'web-locks',
        icon: '🔐',
        screen: WebLocks,
        title: '토큰 갱신을 한 탭만 하게 하기',
        summary: '탭마다 갱신을 불러 로그아웃되는 걸 막아요',
        supported: 'locks' in navigator,
      },
    ],
  },
]

function Home() {
  const { go } = useNav()

  return (
    <Screen
      brand="Multi-tab Lab"
      title={'탭을 여러 개 열어도\n하나처럼 움직이게 해 볼까요?'}
      description="원티드처럼 httpOnly 쿠키로 로그인하는 서비스에서 해볼 만한 건, 로그아웃하고 돌아온 뒤 BroadcastChannel로 다른 탭 화면을 맞추는 거예요. Web Locks는 여러 탭이 같은 일을 겹쳐 할 때만 필요해요."
      cta={<Button onClick={() => go(SECTIONS[0].features[0].id)}>하나씩 해보기</Button>}
    >
      <FeatureSections sections={SECTIONS} />
      <Note>두 기능 모두 탭을 두 개 이상 열어야 차이가 보여요. 화면마다 같은 화면을 새 탭으로 여는 링크가 있어요.</Note>
    </Screen>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App sections={SECTIONS} home={<Home />} />
  </StrictMode>,
)
