import { useState } from 'react'
import { back, Button, InstallNotice, Note, Screen } from './ui'
import { Report } from './report'

export function Badging() {
  const [count, setCount] = useState(0)
  const supported = 'setAppBadge' in navigator

  function update(next: number) {
    setCount(next)
    void (next ? navigator.setAppBadge(next) : navigator.clearAppBadge())
  }

  return (
    <Screen
      onBack={back}
      apis={['Badging API']}
      title={'앱 아이콘에\n숫자를 띄워 볼까요?'}
      description="누를 때마다 Dock·작업 표시줄의 Install Lab 아이콘 숫자가 하나씩 올라가요."
      cta={
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <Button variant="weak" onClick={() => update(0)} disabled={!supported || count === 0}>
            배지 지우기
          </Button>
          <Button onClick={() => update(count + 1)} disabled={!supported}>
            배지 +1
          </Button>
        </div>
      }
    >
      <InstallNotice />
      {/* 실제 아이콘에 뜨는 모습을 미리 보여줘요. */}
      <div className="grid place-items-center rounded-3xl bg-grey-50 py-12">
        <div className="relative">
          <img src="/icon.svg" alt="" className="size-24 rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.12)]" />
          {count > 0 && (
            <span className="absolute -top-2 -right-2 grid h-8 min-w-8 place-items-center rounded-full bg-danger px-2 text-[15px] font-bold text-white ring-4 ring-grey-50">
              {count}
            </span>
          )}
        </div>
        <p className="mt-5 text-[15px] text-grey-600" aria-live="polite">
          {count ? `지금 배지는 ${count}이에요` : '아직 배지가 없어요'}
        </p>
      </div>
      <Note>
        {supported
          ? '사파리는 알림 권한을 허용해야 보여요. Linux에서는 보이지 않아요.'
          : '이 브라우저는 아직 Badging API를 지원하지 않아요. 크롬·엣지 데스크톱이나 사파리에서 열어요.'}
      </Note>
      <Report ids={['badging']} />
    </Screen>
  )
}
