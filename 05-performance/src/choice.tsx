/** 둘 중 하나를 고르는 버튼 묶음이에요. 고른 값에 따라 아래 버튼(cta)이 할 일이 바뀌어요. */
export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string
  value: T
  options: [T, string][]
  onChange: (value: T) => void
  disabled?: boolean
}) {
  return (
    <fieldset disabled={disabled} className="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-grey-100 p-1 disabled:opacity-60">
      <legend className="sr-only">{label}</legend>
      {options.map(([key, text]) => (
        <label
          key={key}
          className="cursor-pointer rounded-xl py-2.5 text-center text-[15px] font-semibold text-grey-500 transition has-checked:bg-white has-checked:text-grey-900 has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-primary"
        >
          <input type="radio" className="sr-only" name={label} checked={value === key} onChange={() => onChange(key)} />
          {text}
        </label>
      ))}
    </fieldset>
  )
}
