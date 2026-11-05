import { startTransition, useState, ViewTransition } from 'react'
import { Report } from './report'
import { bullets, Code, ExplainTitle, Lead, numbered, strong, Topic } from '../../shared/explain'
import { Button, Card, InfoList, Note, Screen, useNav, yesNo } from '../../shared/ui'

const JOBS = [
  { id: 1, icon: '🎨', title: '프로덕트 디자이너', meta: '경력 3년 이상' },
  { id: 2, icon: '🧑‍💻', title: '프론트엔드 개발자', meta: '경력 무관' },
  { id: 3, icon: '📊', title: '데이터 분석가', meta: '경력 5년 이상' },
  { id: 4, icon: '📣', title: '퍼포먼스 마케터', meta: '경력 2년 이상' },
  { id: 5, icon: '🤝', title: 'HR 매니저', meta: '경력 4년 이상' },
]

// ── "<ViewTransition>은 무엇을 쉽게 해주나요?" README의 같은 섹션을 화면에 옮겼어요(출처: React 19.3 블로그). ──

const SIMPLER = [
  {
    title: '사라질 때 움직이기',
    before:
      '요소를 바로 지우면 애니메이션을 보여줄 수 없어서, "사라지는 중" 상태를 하나 더 두고 애니메이션이 끝나면 지웠어요. AnimatePresence나 react-transition-group이 하던 일이에요.',
    after: '브라우저가 이전 화면을 사진(스냅샷)으로 찍어 두고 움직여요. 요소는 바로 지워도 돼요.',
  },
  {
    title: '목록 썸네일이 상세 이미지로 이어지기',
    before:
      '바뀌기 전후 위치를 getBoundingClientRect로 재고, 거꾸로 옮겼다가 되돌리는 FLIP을 직접 짰어요. 서로 다른 컴포넌트끼리 좌표도 주고받아야 했어요.',
    after: '같은 name의 <ViewTransition>이 한 곳에서 사라지고 다른 곳에 나타나면 알아서 이어져요.',
  },
  {
    title: '방향마다 다르게 움직이기',
    before: '"앞으로/뒤로"를 상태로 저장하고 props로 내려서 className을 나눴어요.',
    after: 'addTransitionType으로 "왜 바뀌었는지"를 업데이트에 붙이면 돼요. 상태가 늘지 않아요.',
  },
  {
    title: '로딩할 때 깜빡이지 않기',
    before: '이미지와 폰트마다 onLoad 플래그를 두고, 다 됐는지 모아서 확인했어요.',
    after: '<ViewTransition>과 <Suspense>로 감싸면, 이미지와 폰트까지 다 준비된 뒤 한 번에 넘어가요.',
  },
  {
    title: '그리는 타이밍 맞추기',
    before:
      'document.startViewTransition을 직접 쓰면 콜백 안에서 flushSync로 바로 그려야 해서, React의 동시성 렌더링·Suspense와 부딪혔어요.',
    after: 'React가 화면을 그리는 순간에 맞춰 알아서 불러요. 직접 부르지 않아요.',
  },
]

const BEFORE_CODE = `// 애니메이션 때문에 상태가 하나 더 생겨요
const [show, setShow] = useState(true)
const [exiting, setExiting] = useState(false)

{(show || exiting) && (
  <div
    className={exiting ? 'fade-out' : ''}
    onAnimationEnd={() => {
      if (exiting) {
        setExiting(false)
        setShow(false)
      }
    }}
  >
    <Video />
  </div>
)}`

const AFTER_CODE = `// 마지막 모습만 적어요
startTransition(() => setShow(false))

{show && (
  <ViewTransition>
    <Video />
  </ViewTransition>
)}`

function Explainer() {
  return (
    <>
      <ExplainTitle>{'<ViewTransition>은 무엇을 쉽게 해주나요?'}</ExplainTitle>
      <Lead>
        화면이 A에서 B로 바뀌는 <strong className={strong}>"중간 과정"</strong>을 React 상태가 아니라 브라우저가 맡아요. 개발자는 마지막 모습만
        적으면 되고, 사용자는 화면이 바뀌어도 무엇이 어디로 갔는지 놓치지 않아요.
      </Lead>

      <Topic icon="🧹" title="코드가 이렇게 줄어요">
        <p>핵심은 애니메이션 때문에 생기던 "중간 상태"를 컴포넌트에서 없애는 거예요.</p>
        <ol className="flex flex-col gap-4">
          {SIMPLER.map((item, i) => (
            <li key={item.title} className="rounded-2xl bg-white p-4">
              <p className={strong}>
                {i + 1}. {item.title}
              </p>
              <dl className="mt-2 flex flex-col gap-2 text-[14px] leading-[1.6]">
                <div>
                  <dt className="font-semibold text-grey-500">전에는</dt>
                  <dd>{item.before}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-primary">이제는</dt>
                  <dd className="text-grey-900">{item.after}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
        <p>예를 들어 사라지는 애니메이션은 이렇게 달라져요.</p>
        <Code label="전에는" code={BEFORE_CODE} />
        <Code label="이제는" code={AFTER_CODE} />
      </Topic>

      <Topic icon="🙂" title="사용자는 이렇게 느껴요">
        <ul className={bullets}>
          <li>
            <strong className={strong}>무엇이 바뀌었는지 놓치지 않아요.</strong> 화면이 툭 바뀌면 "방금 누른 게 어디 갔지?" 하고 다시 찾아야 해요.
            썸네일이 상세 이미지로 커지거나 다음 화면이 옆에서 들어오면, 무엇이 왜 바뀌었는지 눈에 보여요.
          </li>
          <li>
            <strong className={strong}>덜 깜빡이고 덜 흔들려요.</strong> 이미지와 폰트가 따로따로 튀어나오지 않고, 로딩 화면에서 완성된 화면으로 한
            번에 넘어가요.
          </li>
          <li>
            <strong className={strong}>입력은 기다리지 않아요.</strong> startTransition, Suspense, useDeferredValue로 생긴 업데이트만 움직여요.
            타이핑 같은 급한 업데이트는 바로 반영돼요.
          </li>
        </ul>
      </Topic>

      <Topic icon="📏" title="React가 권하는 원칙">
        <p>React 19.3 블로그가 Suspense와 함께 쓸 때 권하는 원칙이에요.</p>
        <ol className={numbered}>
          <li>로딩 화면은 애니메이션 없이 바로 보여줘요.</li>
          <li>로딩 화면이 완성된 화면으로 바뀔 때만 움직여요.</li>
          <li>기다릴 필요가 없는 부분은 애니메이션 없이 바로 보여줘요.</li>
        </ol>
      </Topic>

      <Topic icon="⚖️" title="대신 조심할 것">
        <ul className={bullets}>
          <li>아직 웹(DOM)에서만 돼요. React Native는 지원을 준비하고 있어요.</li>
          <li>많이 쓰면 오히려 느려 보여요. 블로그도 Suspense 애니메이션은 아껴 쓰라고 해요.</li>
          <li>전환하는 동안에는 화면 사진(스냅샷)이 위를 덮고 있어요. 애니메이션은 짧게 해요. 이 샘플의 화면 이동은 0.28초예요.</li>
        </ul>
      </Topic>
    </>
  )
}

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
      <Report id="view-transitions" intro={<Explainer />} />
    </Screen>
  )
}
