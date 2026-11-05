// 기능 화면 아래쪽 "왜 필요해요? / 어떻게 동작해요?" 설명에 같이 쓰는 조각이에요.
// 판단 화면(shared/report.tsx)의 intro 자리에 넣어요.
import type { ReactNode } from 'react'

export const strong = 'font-semibold text-grey-900'
export const bullets = 'flex list-disc flex-col gap-1.5 pl-5 marker:text-grey-400'
export const numbered = 'flex list-decimal flex-col gap-1.5 pl-5 marker:font-semibold marker:text-primary'

export function ExplainTitle({ children }: { children: ReactNode }) {
  return <h2 className="mt-4 text-[20px] font-bold tracking-[-0.01em] text-grey-900">{children}</h2>
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="text-[17px] leading-[1.6] text-grey-700">{children}</p>
}

export function Topic({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-grey-50 p-5">
      <h3 className="flex items-center gap-2 text-[17px] font-semibold text-grey-900">
        <span aria-hidden>{icon}</span>
        {title}
      </h3>
      <div className="mt-3 flex flex-col gap-3 text-[15px] leading-[1.65] text-grey-700">{children}</div>
    </section>
  )
}

/** 어두운 코드 블록. label을 주면 위에 "전에는/이제는" 같은 이름을 달아요. */
export function Code({ label, code }: { label?: string; code: string }) {
  const block = (
    <pre className="overflow-x-auto rounded-2xl bg-grey-900 p-4 text-[12.5px] leading-[1.6] text-grey-100">
      <code>{code}</code>
    </pre>
  )
  if (!label) return block
  return (
    <figure>
      <figcaption className="mb-1.5 text-[13px] font-semibold text-grey-500">{label}</figcaption>
      {block}
    </figure>
  )
}
