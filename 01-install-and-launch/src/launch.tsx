import { useSyncExternalStore } from 'react'
import { back, Card, InfoList, InstallNotice, LinkButton, Note, Screen, go, yesNo } from './ui'
import { Report } from './report'

// 파일 더블클릭, web+playground: 링크, 앱 아이콘 클릭 모두 여기로 들어와요.
// launch_handler가 focus-existing이라 이미 열린 창이 있으면 새 창 대신 이 창으로 와요.
// 어느 화면에 있든 받아야 해서 모듈에서 바로 등록해요.
let launches: string[] = []
const listeners = new Set<() => void>()
window.launchQueue?.setConsumer(async ({ targetURL, files }) => {
  const lines = [`열린 주소: ${targetURL}`]
  for (const handle of files) {
    const file = await handle.getFile()
    lines.push(`파일 ${file.name}: ${(await file.text()).slice(0, 80)}`)
  }
  launches = [...launches, ...lines]
  listeners.forEach((listener) => listener())
  // 파일이나 링크로 열렸다면 받은 걸 바로 보여줘요. 앱 아이콘으로만 열렸다면 그대로 둬요.
  if (files.length || (targetURL && new URL(targetURL).search)) go('launch')
})

const STEPS = [
  { title: '파일로 열기', api: 'File Handling', how: 'Finder에서 .txt 파일 우클릭 → 다음으로 열기 → Install Lab' },
  { title: '링크로 열기', api: 'Protocol Handlers', how: '브라우저 탭에서 아래 버튼을 눌러요' },
  { title: '공유로 열기', api: 'Share Target', how: '안드로이드에 설치한 뒤 다른 앱에서 공유하기 → Install Lab' },
]

export function Launch() {
  const log = useSyncExternalStore(
    (listener) => (listeners.add(listener), () => listeners.delete(listener)),
    () => launches,
  )

  return (
    <Screen
      onBack={back}
      apis={['File Handling', 'Protocol Handlers', 'Launch Handler', 'Share Target']}
      title={'다른 곳에서\nInstall Lab을 열어 볼까요?'}
      description="설치한 뒤 아래 방법으로 열면, 무엇을 받았는지 이 화면에 기록이 쌓여요."
      cta={<LinkButton href="web+playground:hello">web+playground:hello 링크 열기</LinkButton>}
    >
      <InstallNotice />
      <ol className="flex flex-col gap-5">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-weak text-[14px] font-bold text-primary">
              {i + 1}
            </span>
            <div>
              <p className="text-[17px] font-semibold text-grey-900">
                {step.title} <span className="ml-1 text-[13px] font-medium text-grey-500">{step.api}</span>
              </p>
              <p className="mt-1 text-[15px] leading-[1.6] text-grey-600">{step.how}</p>
            </div>
          </li>
        ))}
      </ol>
      <Card title="받은 기록">
        {log.length ? (
          <pre className="font-sans text-[14px] leading-[1.7] whitespace-pre-wrap text-grey-800">{log.join('\n')}</pre>
        ) : (
          <p className="text-[15px] text-grey-500">아직 받은 기록이 없어요</p>
        )}
      </Card>
      <Card title="지금 상태">
        <InfoList
          items={[
            ['launchQueue', yesNo('launchQueue' in window)],
            ['URL 쿼리', location.search || '없어요'],
          ]}
        />
      </Card>
      <Note>앱 창을 연 채로 위 방법을 해보면 새 창이 열리지 않고 이 창에 기록이 쌓여요 (launch_handler: focus-existing).</Note>
      <Report ids={['launch-handler', 'file-handling', 'protocol-handlers', 'share-target']} />
    </Screen>
  )
}
