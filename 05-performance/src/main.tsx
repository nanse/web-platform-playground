import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App, Button, FeatureSections, Note, Screen, useNav, type Section } from '../../shared/ui'
import { ApplicantExport } from './applicant-export'
import { Bfcache } from './bfcache'
import { ResumePdf } from './resume-pdf'
import { SharedMemory } from './shared-memory'
import { SharedWorkerScreen } from './shared-worker'
import { Speculation } from './speculation'
import { Transfer } from './transfer'
import { WebVitals } from './web-vitals'
import { WebWorker } from './web-worker'
import { Yield, yieldSupported } from './yield'
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
    title: '긴 작업으로 화면이 멈출 때 써요',
    features: [
      {
        id: 'yield',
        icon: '🧩',
        screen: Yield,
        title: '긴 작업을 쪼개서 숨 쉴 틈 주기',
        summary: '워커로 못 옮기는 일도 await 한 줄로 쪼개요',
        supported: yieldSupported,
      },
      {
        id: 'web-worker',
        icon: '🧵',
        screen: WebWorker,
        title: '무거운 계산을 워커로 옮기기',
        summary: '계산하는 동안에도 화면이 멈추지 않아요',
        supported: 'Worker' in window,
      },
      {
        id: 'transferable',
        icon: '📦',
        screen: Transfer,
        title: '큰 데이터를 복사 없이 넘기기',
        summary: '100MB도 주인만 바꿔서 바로 넘겨요',
        supported: 'Worker' in window,
      },
      {
        id: 'export',
        icon: '📊',
        screen: ApplicantExport,
        title: '지원자 10만 명 멈춤 없이 내려받기',
        summary: '세 기술을 엮은 실무 예제예요',
        supported: 'Worker' in window,
      },
    ],
  },
  {
    title: '나중에 다시 봐요',
    features: [
      {
        id: 'shared-worker',
        icon: '🔗',
        screen: SharedWorkerScreen,
        title: '탭들이 워커 하나 같이 쓰기',
        summary: '크롬 안드로이드가 148부터라 아직 일러요',
        supported: 'SharedWorker' in window,
      },
      {
        id: 'resume-pdf',
        icon: '📄',
        screen: ResumePdf,
        title: '이력서 PDF를 브라우저에서 만들기',
        summary: '서버 대신 워커가 그려요. 글꼴을 처음 한 번 받아요',
        supported: 'Worker' in window,
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
      {
        id: 'shared-array-buffer',
        icon: '🧠',
        screen: SharedMemory,
        title: '워커끼리 메모리 같이 쓰기',
        summary: 'ArrayBuffer와 다른 점을 보고, 왜 필요 없는지 봐요',
        supported: typeof SharedArrayBuffer !== 'undefined' && crossOriginIsolated,
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
      description="원티드에서 해볼 만한 건 성능 점수(Core Web Vitals) 재기와 뒤로 가기를 막는 원인 없애기예요. 긴 작업으로 화면이 멈추면 scheduler.yield()로 쪼개거나 Web Worker로 옮기고, 큰 데이터는 Transferable로 복사 없이 넘겨요."
      cta={<Button onClick={() => go(SECTIONS[0].features[0].id)}>하나씩 해보기</Button>}
    >
      <FeatureSections sections={SECTIONS} />
      <Note>
        숫자를 정확하게 보려면 <code>build</code> 후 <code>preview</code>로 열어요. 뒤로 가기와 미리 그리기는 다른 페이지(<code>other.html</code>)로 이동했다가
        확인해요. SharedArrayBuffer를 쓰려고 이 샘플은 COOP·COEP 헤더를 붙여서 띄워요.
      </Note>
    </Screen>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App sections={SECTIONS} home={<Home />} />
  </StrictMode>,
)
