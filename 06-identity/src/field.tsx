import type { ComponentProps } from 'react'

export function Field({ label, ...props }: ComponentProps<'input'> & { label: string }) {
  return (
    <label className="block">
      <span className="text-[14px] font-medium text-grey-600">{label}</span>
      <input
        {...props}
        className="mt-1 w-full border-b-2 border-grey-200 bg-transparent py-2 text-[20px] font-semibold text-grey-900 transition outline-none focus:border-primary"
      />
    </label>
  )
}
