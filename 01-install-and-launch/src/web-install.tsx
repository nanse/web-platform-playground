import { useState } from 'react'
import { back, Button, Card, InfoList, Note, Result, Screen, yesNo } from './ui'
import { Report } from './report'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      install: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { manifest?: string }
    }
  }
}

const INSTALL_EVENTS = ['promptaction', 'promptdismiss', 'validationstatuschanged']

export function WebInstall() {
  const [log, setLog] = useState('')
  const supported = 'install' in navigator

  async function install() {
    try {
      setLog(`navigator.install() → ${JSON.stringify(await navigator.install!())}`)
    } catch (e) {
      setLog(`navigator.install()로 설치하지 못했어요 → ${e}`)
    }
  }

  // <install>은 대시 없는 새 태그라 React가 on* prop을 이벤트로 붙이지 않아요. 직접 붙여요.
  const listen = (el: HTMLElement | null) => {
    if (!el) return
    const onEvent = (e: Event) => setLog(`<install> ${e.type}`)
    INSTALL_EVENTS.forEach((type) => el.addEventListener(type, onEvent))
    return () => INSTALL_EVENTS.forEach((type) => el.removeEventListener(type, onEvent))
  }

  return (
    <Screen
      onBack={back}
      apis={['navigator.install()', '<install>']}
      title={'버튼 하나로\n앱을 설치해 볼까요?'}
      description={
        <>
          실험 중인 기능이에요. chrome://flags에서 "Web App Installation API"와 "Web App Install Element"를 켜면 써볼 수 있어요.
        </>
      }
      cta={
        <Button onClick={install} disabled={!supported}>
          navigator.install()로 설치하기
        </Button>
      }
    >
      {log && <Result>{log}</Result>}
      <Card title="지금 상태">
        <InfoList
          items={[
            ['navigator.install', yesNo(supported)],
            ['<install>', yesNo('HTMLInstallElement' in window)],
          ]}
        />
      </Card>
      <Card title="브라우저가 그려주는 설치 버튼">
        <install ref={listen}>
          <span className="text-[15px] leading-[1.6] text-grey-600">
            이 브라우저는 아직 &lt;install&gt;을 지원하지 않아서 대신 이 문구가 보여요. 위 플래그를 켜면 설치 버튼으로 바뀌어요.
          </span>
        </install>
      </Card>
      <Note>
        다른 앱은 <code>navigator.install({'{ manifest: url }'})</code>나 <code>&lt;install manifest=url&gt;</code>로 설치해요.
      </Note>
      <Report ids={['web-install']} />
    </Screen>
  )
}
