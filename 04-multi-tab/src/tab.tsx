import { Card } from '../../shared/ui'

/** 탭마다 다른 이름. 어느 탭이 무엇을 했는지 보여줄 때 써요.
 *  sessionStorage에 둬서, 로그인·로그아웃으로 인증 서버에 다녀와도 같은 탭이면 이름이 그대로예요. */
export const TAB_ID = (() => {
  const saved = sessionStorage.getItem('multi-tab-lab:tab-id')
  if (saved) return saved
  const id = crypto.randomUUID().slice(0, 4).toUpperCase()
  sessionStorage.setItem('multi-tab-lab:tab-id', id)
  return id
})()

export const now = () => new Date().toLocaleTimeString('ko-KR')

/** 두 탭으로 해보는 방법. 첫 단계는 같은 화면을 새 탭으로 여는 링크예요. */
export function TwoTabSteps({ hash, steps }: { hash: string; steps: string[] }) {
  return (
    <Card title={`탭 두 개로 해봐요 · 이 탭은 탭(${TAB_ID})이에요`}>
      <ol className="flex flex-col gap-3">
        <li className="flex gap-3 text-[15px] leading-[1.6] text-grey-700">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-weak text-[13px] font-bold text-primary">1</span>
          <span>
            이 화면을 새 탭으로 하나 더 열어요.
            <a
              href={`${location.pathname}#${hash}`}
              target="_blank"
              rel="noopener"
              className="mt-2 flex h-11 items-center justify-center rounded-xl bg-white text-[15px] font-semibold text-primary transition hover:bg-primary-weak focus-visible:outline-2 focus-visible:outline-primary"
            >
              이 화면을 새 탭으로 열기
            </a>
          </span>
        </li>
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3 text-[15px] leading-[1.6] text-grey-700">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-weak text-[13px] font-bold text-primary">
              {i + 2}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </Card>
  )
}
