import { useState } from 'react'
import { Report } from './report'
import { Button, Card, InfoList, Note, Result, Screen, useNav, yesNo } from '../../shared/ui'

const FACTS = [
  { icon: '🔝', title: '맨 위 층(top layer)에 떠요', text: 'z-index나 overflow: hidden에 가려지지 않아요.' },
  { icon: '👆', title: '바깥을 누르거나 Esc를 누르면 닫혀요', text: '닫는 코드를 따로 쓰지 않아도 브라우저가 해줘요.' },
  { icon: '🎞️', title: '올라오는 움직임은 CSS예요', text: '@starting-style로 열리기 직전 모습을 정해 줬어요.' },
]

export function Popover({ feature }: { feature: { id: string; icon: string } }) {
  const { back } = useNav()
  const [state, setState] = useState('')
  const supported = 'popover' in HTMLElement.prototype

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['popover', 'popovertarget', '@starting-style']}
      title={'JavaScript 없이\n바텀시트를 열어 볼까요?'}
      description="버튼에 popovertarget만 달면 브라우저가 열고 닫아요. 열린 시트는 바깥을 누르거나 Esc를 누르면 닫혀요."
      cta={
        // 열고 닫는 데 onClick이 없어요. popoverTarget이 가리키는 id를 브라우저가 열어요.
        <Button popoverTarget="sheet" disabled={!supported}>
          바텀시트 열기
        </Button>
      }
    >
      {state && <Result>{state}</Result>}
      <Card title="지금 상태">
        <InfoList
          items={[
            ['Popover API', yesNo(supported)],
            ['@starting-style', yesNo('CSSStartingStyleRule' in window)],
          ]}
        />
      </Card>
      <Note>
        시트 모양과 움직임은 <code>src/style.css</code>의 <code>.sheet</code>에 있어요. 화면의 기록은 시트가 열리고 닫힐 때 오는{' '}
        <code>toggle</code> 이벤트로만 남겨요.
      </Note>

      <div
        id="sheet"
        popover="auto"
        className="sheet bg-white px-6 pt-3 pb-[max(20px,env(safe-area-inset-bottom))]"
        onToggle={(e) => setState(`toggle 이벤트: ${e.newState === 'open' ? '열렸어요' : '닫혔어요'} (newState: ${e.newState})`)}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-grey-200" aria-hidden />
        <h2 className="text-[22px] font-bold tracking-[-0.02em] text-grey-900">JavaScript 없이 열렸어요</h2>
        <ul className="mt-5 mb-6 flex flex-col gap-4">
          {FACTS.map((fact) => (
            <li key={fact.title} className="flex gap-3">
              <span className="text-[22px]" aria-hidden>
                {fact.icon}
              </span>
              <span>
                <span className="block text-[16px] font-semibold text-grey-900">{fact.title}</span>
                <span className="block text-[15px] leading-[1.6] text-grey-600">{fact.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <Button popoverTarget="sheet" popoverTargetAction="hide">
          시트 닫기
        </Button>
      </div>

      <Report id="popover" />
    </Screen>
  )
}
