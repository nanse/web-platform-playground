import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App, Button, FeatureSections, Note, Screen, useNav, type Section } from '../../shared/ui'
import { BackgroundSync } from './background-sync'
import { IndexedDb } from './indexed-db'
import { OfflineData } from './offline-data'
import { Opfs } from './opfs'
import { ServiceWorker } from './service-worker'

// README의 결론 순서대로 묶어요: 원티드에서 쓸 때가 있는 것 먼저, 필요 없는 것은 아래에.
const SECTIONS: Section[] = [
  {
    title: 'PWA를 하면 같이 넣어요',
    features: [
      {
        id: 'service-worker',
        icon: '📶',
        screen: ServiceWorker,
        title: '인터넷이 끊겨도 열리게 하기',
        summary: 'Web Push와 오프라인 안내 화면에 필요해요',
        supported: 'serviceWorker' in navigator,
      },
      {
        id: 'offline-data',
        icon: '📰',
        screen: OfflineData,
        title: '끊겨도 받아 둔 공고 보여주기',
        summary: 'fetch로 받은 데이터는 공개 데이터만 담아요',
        supported: 'serviceWorker' in navigator,
      },
    ],
  },
  {
    title: 'localStorage로 부족할 때 써요',
    features: [
      {
        id: 'indexed-db',
        icon: '🗂️',
        screen: IndexedDb,
        title: '관심 공고 브라우저에 담기',
        summary: '이력서 초안처럼 잃으면 안 되는 데이터를 담아요',
        supported: 'indexedDB' in window,
      },
    ],
  },
  {
    title: '지금은 필요 없어요',
    features: [
      {
        id: 'opfs',
        icon: '📁',
        screen: Opfs,
        title: '브라우저 안에 파일 저장하기',
        summary: '큰 파일을 다루는 기능이 없어서 쓸 곳이 없어요',
        supported: 'getDirectory' in (navigator.storage ?? {}),
      },
      {
        id: 'background-sync',
        icon: '🔄',
        screen: BackgroundSync,
        title: '끊긴 동안 누른 좋아요 나중에 보내기',
        summary: '탭이 열려 있으면 online 이벤트로 충분해요',
        supported: 'SyncManager' in window,
      },
    ],
  },
]

function Home() {
  const { go } = useNav()

  return (
    <Screen
      brand="Offline Lab"
      title={'끊겨도 열리고,\n닫아도 남게 해 볼까요?'}
      description="원티드에 지금 꼭 필요한 건 없어요. Service Worker는 PWA를 할 때, IndexedDB는 localStorage로 부족할 때 꺼내 써요."
      cta={<Button onClick={() => go(SECTIONS[0].features[0].id)}>하나씩 해보기</Button>}
    >
      <FeatureSections sections={SECTIONS} />
      <Note>저장한 데이터는 이 주소(https://localhost:5103)에만 남아요. 포트를 고정한 이유도 이거예요.</Note>
    </Screen>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App sections={SECTIONS} home={<Home />} />
  </StrictMode>,
)
