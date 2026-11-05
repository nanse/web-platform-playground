// 패스키 화면의 "서버라면 이렇게 확인해요" 목록이에요.
/** 서버라면 확인할 항목들. ok가 null이면 "서버가 할 일"이라 이 데모는 하지 않아요. */
export function Checklist({ items }: { items: [label: string, ok: boolean | null][] }) {
  return (
    <ul className="flex flex-col gap-2.5 text-[15px] leading-[1.5]">
      {items.map(([label, ok]) => (
        <li key={label} className="flex items-start gap-3">
          <span
            className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
              ok === null ? 'bg-grey-200 text-grey-500' : ok ? 'bg-primary text-white' : 'bg-danger text-white'
            }`}
            aria-label={ok === null ? '서버가 할 일' : ok ? '맞아요' : '달라요'}
          >
            {ok === null ? '–' : ok ? '✓' : '✕'}
          </span>
          <span className={ok === null ? 'text-grey-500' : 'text-grey-800'}>
            {label}
            {ok === null && <span className="ml-1.5 rounded-md bg-grey-100 px-1.5 py-0.5 text-[12px] font-semibold text-grey-500">서버가 할 일</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}
