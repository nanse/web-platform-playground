// 샘플들이 같이 쓰는 화면 틀이에요. 화면 이동은 React <ViewTransition>으로 움직여요(애니메이션 CSS는 shared/ui.css).
// 쓰는 샘플의 vite.config.ts에 resolve.dedupe: ['react', 'react-dom']가 있어야 이 폴더에서 react를 찾을 수 있어요.
import {
  addTransitionType,
  createContext,
  startTransition,
  use,
  useEffect,
  useLayoutEffect,
  useState,
  ViewTransition,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from 'react'

export type FeatureRef = { id: string; icon: string }

export type Feature = FeatureRef & {
  screen: ComponentType<{ feature: FeatureRef }>
  title: string
  summary: string
  supported: boolean
}

export type Section = { title: string; features: Feature[] }

/** 해시(#id)로 기능 화면을 고르고, 없으면 home을 보여줘요. */
export function App({ sections, home }: { sections: Section[]; home: ReactNode }) {
  const { route, nav } = useRouter()
  // 레이아웃 단계에서 맨 위로 올려야, 새 화면의 스냅샷이 맨 위에서 찍혀요.
  useLayoutEffect(() => {
    scrollTo(0, 0)
  }, [route])

  const feature = sections.flatMap((section) => section.features).find((f) => f.id === route)
  return <NavContext value={nav}>{feature ? <feature.screen feature={{ id: feature.id, icon: feature.icon }} /> : home}</NavContext>
}

/** 첫 화면의 기능 목록. 묶음 제목은 원티드 판단 순서로 써요. */
export function FeatureSections({ sections }: { sections: Section[] }) {
  const { go } = useNav()
  return sections.map((section) => (
    <section key={section.title} className="-mx-6">
      <h2 className="px-6 pt-2 pb-1 text-[14px] font-semibold text-grey-500">{section.title}</h2>
      <ul>
        {section.features.map((feature) => (
          <li key={feature.id}>
            <button
              onClick={() => go(feature.id)}
              className="flex w-full items-center gap-4 px-6 py-3.5 text-left transition hover:bg-grey-50 active:bg-grey-100 focus-visible:bg-grey-50 focus-visible:outline-none"
            >
              <FeatureIcon id={feature.id} icon={feature.icon} />
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-semibold text-grey-900">{feature.title}</span>
                <span className="block truncate text-[14px] text-grey-500">{feature.summary}</span>
              </span>
              <span
                className={`shrink-0 rounded-lg px-2 py-1 text-[13px] font-semibold ${
                  feature.supported ? 'bg-primary-weak text-primary' : 'bg-grey-100 text-grey-500'
                }`}
              >
                {feature.supported ? '바로 가능' : '미지원'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  ))
}

type Nav = { go: (id: string) => void; back: () => void }
export const NavContext = createContext<Nav>({ go() {}, back() {} })
export const useNav = () => use(NavContext)

// 앱 안의 "뒤로 가기"는 history.back()을 부르는데, 그때 오는 popstate는 이미 처리한 거라 한 번 건너뛰어요.
let skipPop = false

/** 화면 이동. startTransition 안에서 바꿔야 <ViewTransition>이 움직이고, 방향은 addTransitionType으로 알려줘요. */
export function useRouter() {
  const [route, setRoute] = useState(() => location.hash.slice(1))

  useEffect(() => {
    // 브라우저 뒤로 가기(popstate)는 React가 애니메이션 없이 바로 바꿔요.
    const onPop = () => {
      if (skipPop) return void (skipPop = false)
      setRoute(location.hash.slice(1))
    }
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [])

  const navigate = (to: string, type: 'forward' | 'back') =>
    startTransition(() => {
      addTransitionType(type)
      setRoute(to)
    })

  const nav: Nav = {
    go(id) {
      history.pushState({ fromHome: true }, '', `#${id}`)
      navigate(id, 'forward')
    },
    back() {
      navigate('', 'back')
      if (history.state?.fromHome) {
        skipPop = true
        history.back()
      } else {
        // 주소로 바로 들어왔다면 뒤로 갈 곳이 없어서 첫 화면으로 바꿔요.
        history.replaceState(null, '', location.pathname + location.search)
      }
    },
  }
  return { route, nav }
}

const SLIDE_IN = { forward: 'slide-from-right', back: 'slide-from-left', default: 'none' }
const SLIDE_OUT = { forward: 'slide-to-left', back: 'slide-to-right', default: 'none' }

type ScreenProps = {
  /** 첫 화면(뒤로 가기가 없는 화면) 위쪽에 보여줄 샘플 이름. */
  brand?: string
  /** 첫 화면 목록의 아이콘과 같은 이름을 줘서, 아이콘이 이 화면 제목 위로 이어져요(공유 요소 전환). */
  feature?: { id: string; icon: string }
  title: string
  description?: ReactNode
  apis?: string[]
  children?: ReactNode
  cta?: ReactNode
  onBack?: () => void
}

/** 한 화면 = 제목 하나 + 할 일 하나(cta). 위쪽 바와 아래 버튼은 화면이 바뀌어도 제자리에서 바뀌고, 본문만 밀려나요. */
export function Screen({ brand, feature, title, description, apis, children, cta, onBack }: ScreenProps) {
  return (
    <>
      <ViewTransition name="topbar">
        <header className="mx-auto flex h-14 max-w-[480px] items-center px-3">
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
            <span className="px-3 text-[15px] font-bold text-grey-900">{brand}</span>
          )}
        </header>
      </ViewTransition>

      <ViewTransition enter={SLIDE_IN} exit={SLIDE_OUT} default="none">
        <main className="mx-auto max-w-[480px] px-6 pt-5 pb-36">
          {feature && <FeatureIcon {...feature} size="lg" />}
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
      </ViewTransition>

      {cta && (
        <ViewTransition name="cta">
          <div className="fixed inset-x-0 bottom-0 bg-linear-to-t from-white from-70% to-white/0 px-6 pt-6 pb-[max(20px,env(safe-area-inset-bottom))]">
            <div className="mx-auto flex max-w-[432px] flex-col gap-2">{cta}</div>
          </div>
        </ViewTransition>
      )}
    </>
  )
}

/** 첫 화면 목록과 기능 화면에 같은 이름으로 그려서, 화면을 오갈 때 아이콘이 날아가듯 이어져요. */
export function FeatureIcon({ id, icon, size = 'md' }: { id: string; icon: string; size?: 'md' | 'lg' }) {
  return (
    <ViewTransition name={`icon-${id}`}>
      <span
        aria-hidden
        className={
          size === 'lg'
            ? 'mb-4 grid size-16 place-items-center rounded-[22px] bg-grey-100 text-[34px]'
            : 'grid size-11 shrink-0 place-items-center rounded-2xl bg-grey-100 text-[22px]'
        }
      >
        {icon}
      </span>
    </ViewTransition>
  )
}

export function Button({ className = '', ...props }: ComponentProps<'button'>) {
  return (
    <button
      {...props}
      className={`h-14 w-full rounded-2xl bg-primary text-[17px] font-semibold text-white transition hover:bg-primary-strong active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:bg-grey-100 disabled:text-grey-400 ${className}`}
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

export const yesNo = (ok: boolean) => (ok ? '지원해요' : '지원 안 함')

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
