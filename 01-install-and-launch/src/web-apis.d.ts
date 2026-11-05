// TS 기본 DOM 타입에 아직 없는 실험·크롬 계열 API

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent
}

interface Navigator {
  // Web Install API. 실험 중이라 인자 모양이 바뀌고 있어요 (예전: install_url, manifest_id).
  install?(options?: { manifest?: string }): Promise<unknown>
  windowControlsOverlay?: WindowControlsOverlay
}

interface WindowControlsOverlay extends EventTarget {
  readonly visible: boolean
  getTitlebarAreaRect(): DOMRect
}

interface ScreenDetailed extends Screen {
  readonly availLeft: number
  readonly availTop: number
  readonly isPrimary: boolean
  readonly label: string
}

interface LaunchParams {
  readonly targetURL?: string
  readonly files: readonly FileSystemFileHandle[]
}

interface Window {
  getScreenDetails?(): Promise<{ readonly screens: readonly ScreenDetailed[] }>
  launchQueue?: { setConsumer(consumer: (params: LaunchParams) => void): void }
}
