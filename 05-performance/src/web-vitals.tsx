import { useState } from 'react'
import { Button, Card, InfoList, Note, Screen, useNav, yesNo, type FeatureRef } from '../../shared/ui'
import { bullets, ExplainTitle, Lead, strong, Topic } from '../../shared/explain'
import { Report } from './report'
import { rate, support, useVitals, type Rating } from './vitals'

const RATING: Record<Rating, { label: string; style: string }> = {
  good: { label: '좋아요', style: 'bg-[#e5f8ef] text-[#03804b]' },
  'needs-improvement': { label: '개선이 필요해요', style: 'bg-[#fff4e5] text-[#c25e00]' },
  poor: { label: '나빠요', style: 'bg-[#fff0f1] text-danger' },
}

function Metric({ name, meaning, value, text, metric, supported }: {
  name: string
  meaning: string
  value?: number
  text: string
  metric: 'lcp' | 'inp' | 'cls'
  supported: boolean
}) {
  const rating = value === undefined ? undefined : RATING[rate(metric, value)]
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-grey-50 p-3">
      <span className="text-[13px] font-semibold text-grey-500">{name}</span>
      <span className="text-[12px] text-grey-500">{meaning}</span>
      <span className="mt-1 text-[22px] font-bold tracking-[-0.02em] text-grey-900">{supported ? (value === undefined ? '—' : text) : '✕'}</span>
      <span className={`self-start rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${rating?.style ?? 'bg-grey-100 text-grey-500'}`}>
        {!supported ? '잴 수 없어요' : (rating?.label ?? '아직 없어요')}
      </span>
    </div>
  )
}

function Explainer() {
  return (
    <>
      <ExplainTitle>LCP·INP·CLS를 쉽게 말하면</ExplainTitle>
      <Lead>
        구글이 "사용자가 느끼는 빠르기"를 세 숫자로 정리한 게 Core Web Vitals예요. 실제 사용자 값을 모아서 <strong className={strong}>75번째 백분위</strong>로,
        모바일과 데스크톱을 나눠서 봐요.
      </Lead>
      <Topic icon="🖼️" title="LCP · 첫 화면이 보이기까지">
        <p>페이지에서 가장 큰 이미지나 글 덩어리가 그려진 시각이에요. 식당에 들어가서 메인 요리가 나오기까지 걸린 시간과 비슷해요.</p>
        <p>
          <strong className={strong}>2.5초 이하면 좋아요</strong>, 4초가 넘으면 나빠요. 사용자가 누르거나 스크롤하면 그 뒤로는 더 재지 않아요.
        </p>
      </Topic>
      <Topic icon="👆" title="INP · 눌렀을 때 반응하기까지">
        <p>클릭·탭·키 입력을 한 순간부터 화면이 바뀌어 보이기까지 걸린 시간 중, 가장 느렸던 값이에요. 마우스를 올리거나 스크롤하는 건 세지 않아요.</p>
        <ul className={bullets}>
          <li>기다린 시간: 브라우저가 다른 일을 하느라 내 클릭을 바로 못 받은 시간</li>
          <li>처리한 시간: 클릭 처리 코드가 돈 시간</li>
          <li>그린 시간: 처리가 끝나고 바뀐 화면이 나오기까지</li>
        </ul>
        <p>
          <strong className={strong}>200ms 이하면 좋아요</strong>, 500ms가 넘으면 나빠요.
        </p>
      </Topic>
      <Topic icon="📐" title="CLS · 화면이 흔들린 정도">
        <p>읽던 글이 갑자기 아래로 밀려서 엉뚱한 걸 누르게 되는 경험을 숫자로 만든 거예요. 1초 안에 이어진 흔들림을 한 묶음으로 더하고, 가장 큰 묶음의 점수를 써요.</p>
        <p>
          <strong className={strong}>0.1 이하면 좋아요</strong>, 0.25가 넘으면 나빠요. 내가 누른 직후 0.5초 안의 움직임은 예상한 것이라 빼요. 그래서 이 화면은
          배너를 누른 즉시가 아니라 조금 뒤에 끼워 넣어요.
        </p>
      </Topic>
    </>
  )
}

export function WebVitals({ feature }: { feature: FeatureRef }) {
  const { back } = useNav()
  const vitals = useVitals()
  const [banner, setBanner] = useState(false)
  const [presses, setPresses] = useState(0)

  function pressSlowly() {
    // 일부러 0.3초 동안 메인 스레드를 막아요. 그동안 화면이 멈춰서 INP가 나빠져요.
    const end = performance.now() + 300
    while (performance.now() < end) {
      // 기다려요
    }
    setPresses((n) => n + 1)
    // 누른 직후의 움직임은 CLS에서 빠지니까, 0.8초 뒤에 배너를 끼워 넣어 아래 내용을 밀어요.
    setBanner(false)
    setTimeout(() => setBanner(true), 800)
  }

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['PerformanceObserver', 'LCP', 'INP', 'CLS']}
      title={'성능 점수가 바뀌는 걸\n직접 볼까요?'}
      description="버튼을 누르면 0.3초 동안 화면이 멈추고(INP), 조금 뒤 배너가 끼어들며 아래 내용을 밀어내요(CLS). 숫자가 어떻게 바뀌는지 봐요."
      cta={<Button onClick={pressSlowly}>느리게 반응하는 버튼 누르기</Button>}
    >
      {banner && (
        // 키가 클수록 많이 밀려서 CLS가 커져요. 이 높이면 "개선이 필요해요"까지 올라가요.
        <div className="grid min-h-52 place-items-center rounded-2xl bg-[#fff4e5] px-5 text-center text-[15px] leading-[1.6] font-medium text-[#c25e00]">
          🎁 끼어든 배너예요. 자리를 미리 비워 두지 않아서 아래 내용이 모두 밀렸어요.
        </div>
      )}
      <div className="grid grid-cols-3 gap-2" aria-live="polite">
        <Metric
          name="LCP"
          meaning="첫 화면"
          metric="lcp"
          value={vitals.lcp}
          text={`${((vitals.lcp ?? 0) / 1000).toFixed(2)}초`}
          supported={support.lcp}
        />
        <Metric name="INP" meaning="반응" metric="inp" value={vitals.inp} text={`${Math.round(vitals.inp ?? 0)}ms`} supported={support.inp} />
        <Metric name="CLS" meaning="흔들림" metric="cls" value={vitals.cls} text={(vitals.cls ?? 0).toFixed(3)} supported={support.cls} />
      </div>
      <Card title="지금 상태">
        <InfoList
          items={[
            ['LCP 재기', yesNo(support.lcp)],
            ['INP 재기', yesNo(support.inp)],
            ['CLS 재기', yesNo(support.cls)],
            ['잰 상호작용', `${vitals.interactions}번`],
            ['느린 버튼을 누른 횟수', `${presses}번`],
          ]}
        />
      </Card>
      <Note>
        이 숫자는 지금 이 브라우저에서 한 번 잰 값이에요. 정확하게 보려면 <code>build</code> 후 <code>preview</code>로 열어요. dev 서버는 코드를 바꿔
        끼우느라 원래보다 느려요.
      </Note>
      <Report id="web-vitals" intro={<Explainer />} />
    </Screen>
  )
}
