// LCP·INP·CLS를 PerformanceObserver로 직접 재요. 실제 서비스라면 web-vitals 라이브러리나 RUM 도구를 써요.
// 이 파일을 불러오는 순간부터 재고, buffered: true라서 그 전에 생긴 값도 받아요.
import { useSyncExternalStore } from 'react'

type LayoutShift = PerformanceEntry & { value: number; hadRecentInput: boolean }
type EventTiming = PerformanceEntry & { interactionId?: number }

export type Vitals = { lcp?: number; inp?: number; cls?: number; interactions: number }

const types = PerformanceObserver.supportedEntryTypes ?? []
export const support = {
  lcp: types.includes('largest-contentful-paint'),
  inp: types.includes('event'),
  cls: types.includes('layout-shift'),
}

let vitals: Vitals = { cls: support.cls ? 0 : undefined, interactions: 0 }
const listeners = new Set<() => void>()
function update(patch: Partial<Vitals>) {
  vitals = { ...vitals, ...patch }
  listeners.forEach((listener) => listener())
}

export const useVitals = () =>
  useSyncExternalStore(
    (listener) => (listeners.add(listener), () => listeners.delete(listener)),
    () => vitals,
  )

function observe(type: string, onEntries: (entries: PerformanceEntry[]) => void, options = {}) {
  if (!types.includes(type)) return
  new PerformanceObserver((list) => onEntries(list.getEntries())).observe({ type, buffered: true, ...options })
}

// LCP: 화면에서 가장 큰 내용이 그려진 시각. 사용자가 누르거나 스크롤하면 브라우저가 더 이상 갱신하지 않아요.
observe('largest-contentful-paint', (entries) => update({ lcp: entries.at(-1)!.startTime }))

// INP: 상호작용(클릭·탭·키 입력)마다 가장 오래 걸린 시간을 모아서, 그중 가장 느린 값을 써요.
// ponytail: 상호작용이 50번을 넘으면 50번마다 가장 느린 1개를 빼야 해요. 이 샘플은 그냥 가장 느린 값을 써요.
const interactions = new Map<number, number>()
observe(
  'event',
  (entries) => {
    for (const entry of entries as EventTiming[]) {
      if (!entry.interactionId) continue
      interactions.set(entry.interactionId, Math.max(entry.duration, interactions.get(entry.interactionId) ?? 0))
    }
    if (interactions.size) update({ inp: Math.max(...interactions.values()), interactions: interactions.size })
  },
  { durationThreshold: 16 },
)

// CLS: 1초 안에 이어진 흔들림을 한 묶음(최대 5초)으로 더하고, 가장 큰 묶음의 점수를 써요.
// 사용자가 누른 직후 0.5초 안의 흔들림(hadRecentInput)은 예상한 움직임이라 빼요.
let session = { value: 0, first: 0, last: 0 }
observe('layout-shift', (entries) => {
  for (const shift of entries as LayoutShift[]) {
    if (shift.hadRecentInput) continue
    const startNew = !session.value || shift.startTime - session.last > 1000 || shift.startTime - session.first > 5000
    session = startNew
      ? { value: shift.value, first: shift.startTime, last: shift.startTime }
      : { value: session.value + shift.value, first: session.first, last: shift.startTime }
    if (session.value > (vitals.cls ?? 0)) update({ cls: session.value })
  }
})

// web.dev 기준이에요. [좋아요 이하, 나빠요 초과]
const THRESHOLDS = { lcp: [2500, 4000], inp: [200, 500], cls: [0.1, 0.25] } as const
export type Rating = 'good' | 'needs-improvement' | 'poor'
export function rate(metric: keyof typeof THRESHOLDS, value: number): Rating {
  const [good, poor] = THRESHOLDS[metric]
  return value <= good ? 'good' : value > poor ? 'poor' : 'needs-improvement'
}
