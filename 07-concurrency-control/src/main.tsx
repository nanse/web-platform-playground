import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import { App, Button, FeatureSections, Note, Screen, useNav, type Section } from '../../shared/ui'
import { CancelRefetch } from './cancel-refetch'
import { Diagram } from './diagram'
import { FailureCooldown } from './failure-cooldown'
import { KeyChange } from './key-change'
import { Mutation } from './mutation'
import { MutationSingleFlight } from './mutation-single-flight'
import { SingleFlight } from './single-flight'
import { UncertainFailure } from './uncertain-failure'

const queryClient = new QueryClient({
  // 탭을 오가면 포커스 리패치가 나가서 네트워크 기록에 섞여요. 그래서 이것만 꺼요.
  // 포커스 리패치가 진행 중인 요청을 기다리는지는 proof.ts에서 확인해요.
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
})

const SECTIONS: Section[] = [
  {
    title: '기본은 같이 기다려요',
    features: [
      {
        id: 'single-flight',
        icon: '🤝',
        screen: SingleFlight,
        title: '같은 키로 두 번 부르기',
        summary: '요청은 한 번만 나가고 결과를 나눠 가져요',
        supported: true,
      },
    ],
  },
  {
    title: '이럴 때만 앞 요청을 끊어요',
    features: [
      {
        id: 'key-change',
        icon: '🔀',
        screen: KeyChange,
        title: '불러오는 중에 키 바꾸기',
        summary: "['user', 1]을 기다리다 ['user', 2]로 바꿔요",
        supported: 'AbortController' in window,
      },
      {
        id: 'cancel-refetch',
        icon: '🔁',
        screen: CancelRefetch,
        title: '불러오는 중에 다시 부르기',
        summary: 'refetch()가 앞 요청을 끊는지 기다리는지 봐요',
        supported: 'AbortController' in window,
      },
    ],
  },
  {
    title: 'useMutation은 합치지 않아요',
    features: [
      {
        id: 'mutation',
        icon: '💾',
        screen: Mutation,
        title: '저장 버튼 두 번 누르기',
        summary: '누른 만큼 나가고, scope로 줄을 세워요',
        supported: true,
      },
      {
        id: 'mutation-single-flight',
        icon: '🧩',
        screen: MutationSingleFlight,
        title: '같은 저장은 한 번만 보내기',
        summary: 'POST·PUT·PATCH·DELETE를 single-flight로 합쳐요',
        supported: true,
      },
    ],
  },
  {
    title: '서버 쪽 구현 · 실패 쿨다운 캐시',
    features: [
      {
        id: 'failure-cooldown',
        icon: '🧊',
        screen: FailureCooldown,
        title: '서버의 실패 쿨다운 캐시',
        summary: '서버가 마감·중복 지원 같은 확정 실패만 잠깐 기억해요',
        supported: true,
      },
      {
        id: 'uncertain-failure',
        icon: '🧾',
        screen: UncertainFailure,
        title: '불확정 실패 다시 맞추기',
        summary: '서버가 다시 맞추고, 화면은 백오프로 물어봐요',
        supported: true,
      },
    ],
  },
]

function Home() {
  const { go } = useNav()

  return (
    <Screen
      brand="Concurrency Lab"
      title={'같은 요청이 겹치거나\n실패하면 어떻게 할까요?'}
      description="useQuery는 같은 queryKey면 앞 요청을 같이 기다려요. useMutation은 합치지 않아서, 필요하면 single-flight로 감싸요. 실패한 요청은 서버가 확정 실패만 잠깐 캐시하고(실패 쿨다운 캐시), 불확정 실패는 다시 맞춰요. 진짜 HTTP 요청을 보내서 몇 번 나가는지 세어 봐요."
      cta={<Button onClick={() => go(SECTIONS[0].features[0].id)}>하나씩 해보기</Button>}
    >
      <FeatureSections sections={SECTIONS} />
      <Diagram
        name="overview"
        alt="useQuery로 같은 키를 또 부를 때: 받은 데이터가 없으면 같이 기다려요. 데이터가 있어도 cancelRefetch가 false면 같이 기다리고, true면 앞 요청을 끊고 새로 보내요. 키가 바뀌거나 화면을 떠나 구독자가 0이 될 때: queryFn이 signal을 읽었으면 앞 요청을 끊고, 아니면 끝까지 받아 캐시에 둬요. useMutation으로 저장 중에 또 부를 때: scope.id가 같으면 줄 서서 하나씩 보내고, 아니면 둘 다 바로 보내요."
      />
      <Note>가짜 API는 1.5초 늦게 답해요. DevTools Network 탭을 같이 열어 두면, 끊긴 요청은 (canceled)로 보여요.</Note>
      <Note>화면 없이 같은 내용을 확인하려면 pnpm --filter 07-concurrency-control proof를 실행해요.</Note>
    </Screen>
  )
}

// StrictMode는 개발 모드에서 구독을 끊었다 다시 붙여요. signal을 쓰는 쿼리는 그때 첫 요청이 끊기고 다시 나가서(보냄 → 끊음 → 보냄),
// 요청 수를 세는 이 샘플에서는 켜지 않아요.
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App sections={SECTIONS} home={<Home />} />
  </QueryClientProvider>,
)
