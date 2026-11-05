import { useEffect, useState, useSyncExternalStore } from 'react'
import { back, Button, Card, inAppWindow, InfoList, Note, Result, Screen } from './ui'
import { Report } from './report'

// 크롬 계열은 설치 조건(manifest + HTTPS)이 맞으면 이 이벤트를 줘요. 막아두면 원하는 때에 띄울 수 있어요.
// 화면이 그려지기 전에 올 수도 있어서, 어느 화면에 있든 받도록 모듈에서 바로 받아둬요.
let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferred = e
  listeners.forEach((listener) => listener())
})

export function useInstallPrompt() {
  const prompt = useSyncExternalStore(
    (listener) => (listeners.add(listener), () => listeners.delete(listener)),
    () => deferred,
  )

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    // 한 번 쓴 이벤트는 다시 못 써요.
    deferred = null
    listeners.forEach((listener) => listener())
    return outcome
  }

  return { canInstall: prompt !== null, install }
}

export function Pwa() {
  const { canInstall, install } = useInstallPrompt()
  const [sw, setSw] = useState('등록하는 중')
  const [result, setResult] = useState('')

  useEffect(() => {
    navigator.serviceWorker?.ready.then((reg) => setSw(`동작 중 (scope: ${reg.scope})`))
    const onInstalled = () => setResult('설치가 끝났어요 (appinstalled 이벤트)')
    addEventListener('appinstalled', onInstalled)
    return () => removeEventListener('appinstalled', onInstalled)
  }, [])

  async function onInstall() {
    const outcome = await install()
    if (outcome) setResult(`${outcome === 'accepted' ? '설치를 선택했어요' : '설치를 취소했어요'} (userChoice: ${outcome})`)
  }

  return (
    <Screen
      onBack={back}
      apis={['manifest', 'Service Worker', 'beforeinstallprompt']}
      title={inAppWindow ? '이미 앱 창에서\n열려 있어요' : 'Install Lab을\n앱으로 설치해 볼까요?'}
      description="설치하면 Dock이나 작업 표시줄에서 바로 열 수 있어요. 이 페이지의 기능 대부분은 설치한 앱 창에서 동작해요."
      cta={
        !inAppWindow && (
          <Button onClick={onInstall} disabled={!canInstall}>
            앱으로 설치하기
          </Button>
        )
      }
    >
      {result && <Result>{result}</Result>}
      <Card title="지금 상태">
        <InfoList
          items={[
            ['지금 열린 곳', inAppWindow ? '설치된 앱 창' : '브라우저 탭'],
            ['Service Worker', sw],
            ['isSecureContext', isSecureContext ? '안전한 환경이에요' : 'https://localhost로 열어야 해요'],
            [
              'Manifest',
              <a href="/manifest.webmanifest" className="text-primary underline-offset-2 hover:underline">
                /manifest.webmanifest
              </a>,
            ],
          ]}
        />
      </Card>
      {!canInstall && !inAppWindow && !result && (
        <Note>설치 버튼이 꺼져 있다면 이미 설치했거나 크롬 계열 브라우저가 아니에요. 이미 설치했다면 앱 창에서 열어요.</Note>
      )}
      <Note>
        사파리는 공유 → Dock에 추가(macOS) 또는 홈 화면에 추가(iOS)로 설치해요. 파이어폭스 데스크톱은 아직 설치를 지원하지 않아요. Manifest는
        DevTools → Application → Manifest에서도 볼 수 있어요.
      </Note>
      <Report ids={['pwa']} />
    </Screen>
  )
}
