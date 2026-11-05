// 기능 화면 맨 아래의 "원티드에 필요할까요? → 어디서 동작하나요? → 더 알아보기"예요. 내용(Tech)은 각 샘플의 src/report.tsx에 있어요.
import type { ReactNode } from 'react'

export type Verdict = 'try' | 'with' | 'wait' | 'no'

export type Tech = {
  name: string
  verdict: Verdict
  verdictLabel: string
  /** try면 "기대할 수 있는 것", no면 "필요 없는 이유", 나머지는 "얻을 수 있는 것"으로 보여요. */
  reason: string
  limit?: string
  measure?: string
  revisit?: string
  docs: [label: string, href: string][]
  /** [이름, 크롬·엣지 데스크톱, 크롬 안드로이드, 사파리 macOS, 사파리 iOS, 파이어폭스] */
  support: [string, string, string, string, string, string][]
  supportNote?: string
}

const VERDICT_STYLE: Record<Verdict, string> = {
  try: 'bg-primary-weak text-primary',
  with: 'bg-grey-100 text-grey-800',
  wait: 'bg-grey-100 text-grey-500',
  no: 'bg-grey-100 text-grey-500',
}

const REASON_LABEL: Record<Verdict, string> = {
  try: '기대할 수 있는 것',
  with: '얻을 수 있는 것',
  wait: '얻을 수 있는 것',
  no: '필요 없는 이유',
}

const BROWSERS = ['크롬·엣지\n데스크톱', '크롬\n안드로이드', '사파리\nmacOS', '사파리\niOS', '파이어\n폭스']

function SupportValue({ value }: { value: string }) {
  if (value === '❌')
    return (
      <span className="text-grey-300" aria-label="지원 안 함">
        ✕
      </span>
    )
  return <span className="font-medium text-grey-800">{value}</span>
}

const sectionTitle = 'mt-4 text-[20px] font-bold tracking-[-0.01em] text-grey-900'
const label = 'text-[14px] font-semibold text-grey-500'
const body = 'mt-1 text-[15px] leading-[1.65] text-grey-700'

/** intro는 "원티드에 필요할까요?" 앞에 넣을 설명이에요. 기술을 이해하는 데 필요한 배경을 여기에 둬요. */
export function Report({ tech, intro }: { tech: Tech; intro?: ReactNode }) {
  return (
    <>
      <hr className="-mx-6 mt-6 h-3 border-0 bg-grey-100" />
      {intro}

      <h2 className={sectionTitle}>원티드에 필요할까요?</h2>
      <section className="rounded-3xl border border-grey-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[17px] font-semibold text-grey-900">{tech.name}</h3>
          <span className={`rounded-lg px-2 py-1 text-[13px] font-semibold ${VERDICT_STYLE[tech.verdict]}`}>{tech.verdictLabel}</span>
        </div>
        <dl className="mt-4 flex flex-col gap-4">
          {(
            [
              [REASON_LABEL[tech.verdict], tech.reason],
              ['한계', tech.limit],
              ['이렇게 확인해요', tech.measure],
              ['다시 볼 때', tech.revisit],
            ] as const
          )
            .filter(([, text]) => text)
            .map(([title, text]) => (
              <div key={title}>
                <dt className={label}>{title}</dt>
                <dd className={body}>{text}</dd>
              </div>
            ))}
        </dl>
      </section>

      <h2 className={sectionTitle}>어디서 동작하나요?</h2>
      <div className="-mx-6 overflow-x-auto px-6">
        <table className="w-full min-w-[400px] text-[13px]">
          <thead>
            <tr className="text-grey-500">
              <th className="w-[36%] pb-2 text-left font-medium">기술</th>
              {BROWSERS.map((browser) => (
                <th key={browser} className="px-1 pb-2 text-center leading-[1.3] font-medium whitespace-pre">
                  {browser}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tech.support.map(([name, ...values]) => (
              <tr key={name} className="border-t border-grey-100">
                <th scope="row" className="py-3 pr-2 text-left font-medium break-words text-grey-800">
                  {name}
                </th>
                {values.map((value, i) => (
                  <td key={i} className="px-1 py-3 text-center">
                    <SupportValue value={value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-1.5 px-1 text-[13px] leading-[1.6] text-grey-500">
        <li>MDN 호환성 데이터(2026-11-02) 기준이에요. 숫자는 처음 지원한 버전이에요.</li>
        {tech.supportNote && <li>{tech.supportNote}</li>}
      </ul>

      <h2 className={sectionTitle}>더 알아보기</h2>
      <ul className="-mx-6">
        {tech.docs.map(([title, href]) => (
          <li key={href}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-6 py-3 transition hover:bg-grey-50 active:bg-grey-100 focus-visible:bg-grey-50 focus-visible:outline-none"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-grey-900">{title}</span>
                <span className="block truncate text-[13px] text-grey-500">{new URL(href).host}</span>
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-grey-400">
                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}
