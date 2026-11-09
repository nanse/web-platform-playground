import { useEffect, useRef, type RefObject } from 'react'
import { Card } from '../../shared/ui'

/** 메인 스레드가 움직이는지 보여주는 점을 움직이고, 프레임 사이가 가장 길게 벌어진 시간(= 화면이 멈춘 시간)을 재요. */
export function useMainThreadMeter() {
  const dot = useRef<HTMLSpanElement>(null)
  const longest = useRef(0)

  useEffect(() => {
    let last = performance.now()
    let id = requestAnimationFrame(function loop() {
      // rAF가 넘겨주는 시각은 프레임을 예약한 시각이라, 긴 작업 뒤에 늦게 온 프레임도 이른 시각을 가질 수 있어요. 실제로 불린 시각을 써요.
      const now = performance.now()
      longest.current = Math.max(longest.current, now - last)
      last = now
      // CSS 애니메이션은 메인 스레드가 바빠도 움직일 수 있어서, 일부러 JavaScript로 점을 옮겨요.
      const x = (now / 1500) % 2
      if (dot.current) dot.current.style.left = `${(x < 1 ? x : 2 - x) * 100}%`
      id = requestAnimationFrame(loop)
    })
    return () => cancelAnimationFrame(id)
  }, [])

  return {
    dot,
    reset: () => void (longest.current = 0),
    read: () => Math.round(longest.current),
  }
}

/** 버튼을 누른 뒤 바뀐 화면을 먼저 그리고 나서 다음 일을 시작하게 해요. */
export const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)))

/** 프레임 사이가 50ms(긴 작업 기준)를 넘으면 멈춘 걸로 봐요. */
export const freeze = (ms: number) => (ms >= 50 ? `${ms.toLocaleString()}ms 멈췄어요` : '멈추지 않았어요')

export function MainThreadMeter({ dot }: { dot: RefObject<HTMLSpanElement | null> }) {
  return (
    <Card title="화면이 멈추는지 봐요">
      <div className="rounded-full bg-white px-3 py-1">
        <div className="relative h-6">
          <span ref={dot} className="absolute top-0 size-6 -translate-x-1/2 rounded-full bg-primary" aria-hidden />
        </div>
      </div>
      <p className="mt-3 text-[14px] leading-[1.6] text-grey-500">이 점은 메인 스레드가 움직여요. 메인 스레드가 바쁘면 점도 멈춰요.</p>
    </Card>
  )
}
