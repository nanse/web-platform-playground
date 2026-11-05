import { useEffect, useState } from 'react'
import { back, Card, InfoList, InstallNotice, Note, Screen, yesNo } from './ui'
import { Report } from './report'

export function WindowControls() {
  const wco = navigator.windowControlsOverlay
  const [visible, setVisible] = useState(wco?.visible ?? false)

  useEffect(() => {
    if (!wco) return
    const onChange = () => setVisible(wco.visible)
    wco.addEventListener('geometrychange', onChange)
    return () => wco.removeEventListener('geometrychange', onChange)
  }, [wco])

  return (
    <Screen
      onBack={back}
      apis={['Window Controls Overlay', 'window-drag']}
      title={visible ? '타이틀바 자리까지\n화면으로 채웠어요' : '타이틀바 자리까지\n화면으로 채워 볼까요?'}
      description={
        visible
          ? '맨 위 바의 빈 곳을 잡고 끌어 봐요. 창이 함께 움직여요.'
          : '설치한 앱 창의 타이틀바에서 ⌃를 누르면, 맨 위 바가 타이틀바 자리로 올라가요.'
      }
    >
      <InstallNotice />
      <Card title="지금 상태">
        <InfoList
          items={[
            ['windowControlsOverlay', yesNo(!!wco)],
            ['window-drag', yesNo(CSS.supports('window-drag', 'move'), '대신 app-region을 써요')],
            ['오버레이', visible ? '켜졌어요' : '꺼져 있어요'],
          ]}
        />
      </Card>
      <Note>
        스타일은 <code>src/style.css</code>의 <code>.titlebar</code>에 있어요. <code>env(titlebar-area-*)</code>가 OS 창 버튼을 피한 영역을
        알려줘요.
      </Note>
      <Report ids={['wco']} />
    </Screen>
  )
}
