import { startTransition, useState, ViewTransition } from 'react'
import { Report } from './report'
import { Button, Card, InfoList, Note, Screen, useNav, yesNo } from '../../shared/ui'

const JOBS = [
  { id: 1, icon: '🎨', title: '프로덕트 디자이너', meta: '경력 3년 이상' },
  { id: 2, icon: '🧑‍💻', title: '프론트엔드 개발자', meta: '경력 무관' },
  { id: 3, icon: '📊', title: '데이터 분석가', meta: '경력 5년 이상' },
  { id: 4, icon: '📣', title: '퍼포먼스 마케터', meta: '경력 2년 이상' },
  { id: 5, icon: '🤝', title: 'HR 매니저', meta: '경력 4년 이상' },
]

function shuffled<T>(list: T[]) {
  let next = list
  // 섞었는데 그대로면 움직임이 안 보여서, 순서가 바뀔 때까지 다시 섞어요.
  while (next.every((item, i) => item === list[i])) next = [...list].sort(() => Math.random() - 0.5)
  return next
}

export function ViewTransitions({ feature }: { feature: { id: string; icon: string } }) {
  const { back } = useNav()
  const [jobs, setJobs] = useState(JOBS)
  const [count, setCount] = useState(0)

  function shuffle() {
    // startTransition 안에서 바꿔야 <ViewTransition>이 움직여요. 그냥 setState하면 바로 바뀌어요.
    startTransition(() => {
      setJobs(shuffled)
      setCount((c) => c + 1)
    })
  }

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['<ViewTransition>', 'startTransition']}
      title={'공고 순서를\n섞어 볼까요?'}
      description="카드가 새 자리로 미끄러지듯 옮겨 가요. 어디서 어디로 움직일지는 브라우저가 계산해요."
      cta={<Button onClick={shuffle}>순서 섞기</Button>}
    >
      <ul className="flex flex-col gap-2">
        {/* 목록 항목마다 <ViewTransition>을 ul 바로 아래에 둬야 항목 하나하나가 움직여요. */}
        {jobs.map((job) => (
          <ViewTransition key={job.id}>
            <li className="flex items-center gap-4 rounded-2xl bg-grey-50 px-4 py-3">
              <span className="grid size-10 place-items-center rounded-xl bg-white text-[20px]" aria-hidden>
                {job.icon}
              </span>
              <span>
                <span className="block text-[16px] font-semibold text-grey-900">{job.title}</span>
                <span className="block text-[14px] text-grey-500">{job.meta}</span>
              </span>
            </li>
          </ViewTransition>
        ))}
      </ul>
      <Card title="지금 상태">
        <InfoList
          items={[
            ['View Transitions', yesNo('startViewTransition' in document)],
            ['섞은 횟수', `${count}번`],
          ]}
        />
      </Card>
      <Note>
        이 앱에서 화면을 오갈 때도 같은 기능을 써요. 첫 화면 목록의 아이콘이 이 화면 위쪽으로 날아오는 게 공유 요소 전환이에요. 움직임 줄이기
        설정을 켜면 애니메이션 없이 바로 바뀌어요.
      </Note>
      <Report id="view-transitions" />
    </Screen>
  )
}
