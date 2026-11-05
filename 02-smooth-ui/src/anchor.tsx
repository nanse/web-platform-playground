import { startTransition, useState, ViewTransition } from 'react'
import { Report } from './report'
import { Button, Card, InfoList, Note, Screen, useNav, yesNo } from '../../shared/ui'

// 버튼 자리는 grid 정렬로만 바꿔요. transform으로 옮기면 말풍선이 따라오지 않을 수 있어요.
const SPOTS = [
  { label: '가운데', className: 'self-center justify-self-center' },
  { label: '위쪽 끝', className: 'self-start justify-self-center' },
  { label: '오른쪽 끝', className: 'self-center justify-self-end' },
  { label: '왼쪽 아래 끝', className: 'self-end justify-self-start' },
]

export function Anchor({ feature }: { feature: { id: string; icon: string } }) {
  const { back } = useNav()
  const [spot, setSpot] = useState(0)
  const supported = CSS.supports('anchor-name', '--a')

  // 위치 바꾸기도 <ViewTransition>으로 움직여서, 버튼과 말풍선이 순간이동하지 않고 미끄러져요.
  const move = () => startTransition(() => setSpot((s) => (s + 1) % SPOTS.length))

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['anchor-name', 'position-area', 'position-try-fallbacks']}
      title={'말풍선이 버튼을\n따라가게 해 볼까요?'}
      description="버튼을 옮겨도 말풍선이 따라가요. 위가 모자라면 아래로, 옆이 모자라면 반대쪽으로 뒤집혀요. 위치 계산은 CSS가 해요."
      cta={<Button onClick={move}>버튼 옮기기</Button>}
    >
      <div className="relative grid h-72 overflow-hidden rounded-3xl bg-grey-50 p-3">
        <ViewTransition>
          <span className={`anchor-chip rounded-xl bg-primary px-4 py-2.5 text-[15px] font-semibold text-white ${SPOTS[spot].className}`}>
            지원하기
          </span>
        </ViewTransition>
        <ViewTransition>
          <span data-spot={spot} className="anchor-tip rounded-xl bg-grey-900 px-3 py-2 text-[14px] leading-[1.5] text-white">
            여기서 바로 지원할 수 있어요
          </span>
        </ViewTransition>
      </div>
      <p className="text-center text-[15px] text-grey-600" aria-live="polite">
        지금 위치: <strong className="font-semibold text-grey-900">{SPOTS[spot].label}</strong>
      </p>
      <Card title="지금 상태">
        <InfoList
          items={[
            ['anchor-name', yesNo(supported)],
            ['position-area', yesNo(CSS.supports('position-area', 'top'))],
            ['position-try-fallbacks', yesNo(CSS.supports('position-try-fallbacks', 'flip-block'))],
          ]}
        />
      </Card>
      {!supported && <Note>이 브라우저는 아직 Anchor Positioning을 지원하지 않아서, 말풍선이 버튼을 따라가지 않아요.</Note>}
      <Note>
        말풍선 위치는 <code>src/style.css</code>의 <code>.anchor-tip</code> 몇 줄이 전부예요. 같은 일을 지금은 floating-ui 같은 라이브러리가
        JavaScript로 해요.
      </Note>
      <Report id="anchor" />
    </Screen>
  )
}
