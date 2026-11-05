import { useSyncExternalStore, type ComponentProps, type ReactNode } from 'react'

// 화면이 몇 개뿐이라 라우터 없이 해시로만 바꿔요.
const routeListeners = new Set<() => void>()
const notifyRoute = () => routeListeners.forEach((listener) => listener())
addEventListener('popstate', notifyRoute)

export function useRoute() {
  return useSyncExternalStore(
    (listener) => (routeListeners.add(listener), () => routeListeners.delete(listener)),
    () => location.hash.slice(1),
  )
}

export function go(id: string) {
  history.pushState({ fromHome: true }, '', `#${id}`)
  notifyRoute()
}

export function back() {
  if (history.state?.fromHome) return history.back()
  // 주소로 바로 들어왔다면 뒤로 갈 곳이 없어서 첫 화면으로 바꿔요.
  history.replaceState(null, '', location.pathname + location.search)
  notifyRoute()
}

export const inAppWindow = matchMedia('(display-mode: standalone), (display-mode: window-controls-overlay)').matches

export function TopBar({ onBack }: { onBack?: () => void }) {
  return (
    <header className="titlebar z-10 bg-white/90 backdrop-blur">
      {/* 끄는 영역은 창 전체 너비, 안의 내용은 본문과 같은 칸에 맞춰요. */}
      <div className="mx-auto flex h-full max-w-[480px] items-center px-3">
        {onBack ? (
        <button
          onClick={onBack}
          aria-label="뒤로 가기"
          className="grid size-10 place-items-center rounded-full text-grey-900 hover:bg-grey-100 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        <span className="px-3 text-[15px] font-bold text-grey-900">Install Lab</span>
        )}
      </div>
    </header>
  )
}

type ScreenProps = {
  title: ReactNode
  description?: ReactNode
  apis?: string[]
  children?: ReactNode
  cta?: ReactNode
  onBack?: () => void
}

/** 한 화면 = 제목 하나 + 할 일 하나(cta). */
export function Screen({ title, description, apis, children, cta, onBack }: ScreenProps) {
  return (
    <>
      <TopBar onBack={onBack} />
      <main className="mx-auto max-w-[480px] px-6 pt-[calc(var(--titlebar-height)+20px)] pb-36">
        {apis && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {apis.map((api) => (
              <code key={api} className="rounded-md bg-grey-100 px-2 py-0.5 text-[13px] font-medium text-grey-600">
                {api}
              </code>
            ))}
          </div>
        )}
        <h1 className="text-[26px] leading-[1.4] font-bold tracking-[-0.02em] whitespace-pre-line text-grey-900">{title}</h1>
        {description && <p className="mt-3 text-[17px] leading-[1.6] text-grey-600">{description}</p>}
        <div className="mt-8 flex flex-col gap-4">{children}</div>
      </main>
      {cta && (
        <div className="fixed inset-x-0 bottom-0 bg-linear-to-t from-white from-70% to-white/0 px-6 pt-6 pb-[max(20px,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-[432px] flex-col gap-2">{cta}</div>
        </div>
      )}
    </>
  )
}

const buttonStyles = {
  primary: 'bg-primary text-white hover:bg-primary-strong',
  weak: 'bg-primary-weak text-primary hover:bg-[#d6e8ff]',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: keyof typeof buttonStyles }) {
  return (
    <button
      {...props}
      className={`h-14 w-full rounded-2xl text-[17px] font-semibold transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:bg-grey-100 disabled:text-grey-400 ${buttonStyles[variant]} ${className}`}
    />
  )
}

/** 버튼처럼 생긴 링크. 프로토콜 링크처럼 a여야 하는 행동에 써요. */
export function LinkButton(props: ComponentProps<'a'>) {
  return (
    <a
      {...props}
      className="grid h-14 w-full place-items-center rounded-2xl bg-primary text-[17px] font-semibold text-white transition hover:bg-primary-strong active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    />
  )
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-grey-50 p-5">
      {title && <h2 className="mb-3 text-[15px] font-semibold text-grey-700">{title}</h2>}
      {children}
    </section>
  )
}

/** 이름: 값 목록. 상태를 한눈에 보여줄 때 써요. */
export function InfoList({ items }: { items: [label: ReactNode, value: ReactNode][] }) {
  return (
    <dl className="flex flex-col gap-3 text-[15px]">
      {items.map(([label, value], i) => (
        <div key={i} className="flex items-start justify-between gap-4">
          <dt className="shrink-0 text-grey-500">{label}</dt>
          <dd className="text-right font-medium break-all text-grey-800">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export const yesNo = (ok: boolean, no = '지원 안 함') => (ok ? '지원해요' : no)

/** 결과 한 줄. 버튼을 누른 뒤 무슨 일이 있었는지 알려줘요. */
export function Result({ children }: { children: ReactNode }) {
  return (
    <output className="block rounded-2xl bg-primary-weak px-5 py-4 text-[15px] leading-[1.6] font-medium break-all text-primary-strong">
      {children}
    </output>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="px-1 text-[14px] leading-[1.6] text-grey-500">{children}</p>
}

/** 설치해야 동작하는 화면에서, 아직 브라우저 탭이면 보여줘요. */
export function InstallNotice() {
  if (inAppWindow) return null
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-grey-200 px-5 py-4">
      <p className="text-[15px] leading-[1.5] text-grey-700">설치한 앱 창에서 동작해요</p>
      <button
        onClick={() => go('pwa')}
        className="shrink-0 rounded-lg px-2 py-1 text-[15px] font-semibold text-primary hover:bg-primary-weak focus-visible:outline-2 focus-visible:outline-primary"
      >
        설치하러 가기
      </button>
    </div>
  )
}
