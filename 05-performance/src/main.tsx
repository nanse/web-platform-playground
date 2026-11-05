import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App, Button, FeatureSections, Note, Screen, useNav, type Section } from '../../shared/ui'
import { Bfcache } from './bfcache'
import { Speculation } from './speculation'
import { WebVitals } from './web-vitals'
import { support } from './vitals'

// README의 결론 순서대로 묶어요: 원티드에서 해볼 만한 것 먼저, 필요 없는 것은 아래에.
const SECTIONS: Section[] = [
  {
    title: '원티드에서 해볼 만해요',
    features: [
      {
        id: 'web-vitals',
        icon: '⏱️',
        screen: WebVitals,
        title: '웹 성능 점수 재기',
        summary: '공고 상세의 첫인상을 숫자로 봐요',
        supported: support.lcp || support.inp,
      },
      {
        id: 'bfcache',
        icon: '↩️',
        screen: Bfcache,
        title: '뒤로 가기를 바로 보여주기',
        summary: '막는 원인만 없애면 돼요',
        supported: 'onpageshow' in window,
      },
    ],
  },
  {
    title: '지금은 필요 없어요',
    features: [
      {
        id: 'speculation',
        icon: '🚀',
        screen: Speculation,
        title: '다음 페이지 미리 그려 두기',
        summary: 'Next.js 화면 이동에는 끼어들 자리가 없어요',
        supported: HTMLScriptElement.supports?.('speculationrules') ?? false,
      },
    ],
  },
]

function Home() {
  const { go } = useNav()

  return (
    <Screen
      brand="Performance Lab"
      title={'빠르게 보이고,\n바로 반응하게 해 볼까요?'}
      description="원티드에서 해볼 만한 건 성능 점수(Core Web Vitals) 재기와 뒤로 가기를 막는 원인 없애기예요. 다음 페이지를 미리 그리는 Speculation Rules는 Next.js 화면 이동에는 필요 없어요."
      cta={<Button onClick={() => go(SECTIONS[0].features[0].id)}>하나씩 해보기</Button>}
    >
      <FeatureSections sections={SECTIONS} />
      <Note>
        숫자를 정확하게 보려면 <code>build</code> 후 <code>preview</code>로 열어요. 뒤로 가기와 미리 그리기는 다른 페이지(<code>other.html</code>)로 이동했다가
        확인해요.
      </Note>
    </Screen>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App sections={SECTIONS} home={<Home />} />
  </StrictMode>,
)
