'use client'
// 문서(브라우저가 페이지를 새로 불러온 것) 하나에 한 번만 도는 모듈이에요.
// Next.js가 앱 안에서 화면을 바꿀 때는 다시 돌지 않아서, 여기 값이 그대로면 같은 문서예요.
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Card, InfoList, Note, Result } from '../../shared/ui'

type Navigation = PerformanceNavigationTiming & { notRestoredReasons?: { reasons?: { reason: string }[] | null } | null }
type Doc = { openedAt: string; firstPath: string; type: string; reasons: string[]; restores: number }

let doc: Doc | null = null
const listeners = new Set<() => void>()

if (typeof window !== 'undefined') {
  const nav = performance.getEntriesByType('navigation')[0] as Navigation | undefined
  doc = {
    openedAt: new Date().toLocaleTimeString('ko-KR'),
    firstPath: location.pathname,
    type: nav?.type ?? 'navigate',
    reasons: nav?.notRestoredReasons?.reasons?.map((r) => r.reason) ?? [],
    restores: 0,
  }
  // bfcache로 돌아오면 이 모듈은 다시 돌지 않고 pageshow만 와요. 그때 persisted가 true예요.
  addEventListener('pageshow', (event) => {
    if (!event.persisted) return
    doc = { ...doc!, restores: doc!.restores + 1 }
    listeners.forEach((listener) => listener())
  })
}

/** 서버에서 그릴 때는 문서가 없어서 null이에요. */
export function useDoc() {
  return useSyncExternalStore(
    (listener) => (listeners.add(listener), () => listeners.delete(listener)),
    () => doc,
    () => null,
  )
}

/** 이 화면이 떠 있는 동안 bfcache에서 꺼내졌는지. */
export function useRestored() {
  const [restored, setRestored] = useState(false)
  useEffect(() => {
    const onShow = (event: PageTransitionEvent) => event.persisted && setRestored(true)
    addEventListener('pageshow', onShow)
    return () => removeEventListener('pageshow', onShow)
  }, [])
  return restored
}

const HOW: Record<string, string> = {
  navigate: '주소로 열었어요',
  reload: '새로고침했어요',
  back_forward: '뒤로·앞으로 가기로 왔어요',
}

// 크롬이 알려주는 이유 중 이 샘플에서 볼 수 있는 것만 풀어 써요. 나머지는 받은 그대로 보여줘요.
const REASONS: Record<string, string> = {
  'response-cache-control-no-store': 'no-store가 붙은 문서인데 다녀오는 사이 쿠키가 바뀌었어요',
  websocket: 'WebSocket 연결이 열려 있었어요',
  masked: '브라우저가 이유를 감췄어요',
}

export const reasonText = (reasons: string[]) =>
  reasons.length ? `막힌 이유: ${reasons.map((r) => REASONS[r] ?? r).join(', ')}` : '이 브라우저는 막힌 이유를 알려주지 않아요.'

/** 뒤로 왔는데 bfcache에서 꺼내지 못하고 이 화면을 새로 불러왔을 때 보여줘요. */
export function ReloadedOnBack({ path, children }: { path: string; children: ReactNode }) {
  const d = useDoc()
  if (d?.type !== 'back_forward' || d.firstPath !== path || d.restores > 0) return null
  return (
    <Result>
      {children} {reasonText(d.reasons)}
    </Result>
  )
}

/** 화면마다 가장 먼저 봐야 할 숫자 하나. */
export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint: string }) {
  return (
    <div className="rounded-3xl bg-grey-50 px-5 py-6 text-center">
      <p className="text-[14px] font-semibold text-grey-500">{label}</p>
      <p className="mt-1 text-[28px] font-bold tracking-[-0.02em] text-grey-900">{value}</p>
      <p className="mt-1 text-[14px] text-grey-500">{hint}</p>
    </div>
  )
}

/** 지금 문서의 상태. 앱 안에서 화면을 바꿔도 같은 문서라 값이 그대로예요. */
export function DocumentCard() {
  const d = useDoc()
  return (
    <>
      <Card title="지금 문서">
        <InfoList
          items={[
            ['문서를 연 시각', d?.openedAt ?? '—'],
            ['처음 연 주소', d?.firstPath ?? '—'],
            ['연 방법', d ? (HOW[d.type] ?? d.type) : '—'],
            ['얼려 둔 화면에서 꺼낸 횟수', d ? `${d.restores}번` : '—'],
          ]}
        />
      </Card>
      {process.env.NODE_ENV === 'development' && (
        <Note>
          지금은 개발 서버(<code>next dev</code>)라서 얼려 두지 않아요. <code>pnpm build</code> 후 <code>pnpm start</code>로 열면 볼 수 있어요.
        </Note>
      )}
    </>
  )
}
