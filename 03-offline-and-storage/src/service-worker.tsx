import { useEffect, useState, useSyncExternalStore } from 'react'
import { Button, Card, InfoList, Note, Result, Screen, useNav } from '../../shared/ui'
import { Report } from './report'

const CACHE = 'offline-lab-v1'

export function useOnline() {
  return useSyncExternalStore(
    (listener) => {
      addEventListener('online', listener)
      addEventListener('offline', listener)
      return () => {
        removeEventListener('online', listener)
        removeEventListener('offline', listener)
      }
    },
    () => navigator.onLine,
  )
}

async function cachedPaths() {
  if (!(await caches.has(CACHE))) return []
  const requests = await (await caches.open(CACHE)).keys()
  return requests.map((request) => new URL(request.url).pathname)
}

/** 이 화면을 그릴 때 받은 같은 출처 파일들. 이걸 그대로 담아 두면 다음엔 인터넷 없이도 열려요. */
function pageFiles() {
  const resources = performance.getEntriesByType('resource').map((entry) => entry.name)
  return [...new Set(['/', ...resources.filter((url) => url.startsWith(location.origin))])]
}

/** 온라인·오프라인 표시예요. 오프라인일 때 보여줄 문장은 화면마다 달라서 받아요. */
export function OnlineStatus({ offline }: { offline: string }) {
  const online = useOnline()
  return (
    <div
      className={`flex items-center gap-2 rounded-2xl px-5 py-4 text-[15px] font-semibold ${
        online ? 'bg-grey-50 text-grey-800' : 'bg-[#fff4e5] text-[#c25e00]'
      }`}
      aria-live="polite"
    >
      <span className={`size-2 rounded-full ${online ? 'bg-[#03b26c]' : 'bg-[#ff9500]'}`} aria-hidden />
      {online ? '지금은 온라인이에요' : offline}
    </div>
  )
}

export function Steps({ title, steps }: { title: string; steps: string[] }) {
  return (
    <Card title={title}>
      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3 text-[15px] leading-[1.6] text-grey-700">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-weak text-[13px] font-bold text-primary">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </Card>
  )
}

const STEPS = [
  'DevTools → Network 탭에서 "Offline"을 켜요.',
  '이 화면을 새로고침해요.',
  '인터넷이 끊겼는데도 이 화면이 그대로 열리면 성공이에요.',
]

export function ServiceWorker({ feature }: { feature: { id: string; icon: string } }) {
  const { back } = useNav()
  const supported = 'serviceWorker' in navigator
  const [registered, setRegistered] = useState(false)
  const [paths, setPaths] = useState<string[]>([])
  const [result, setResult] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!supported) return
    void navigator.serviceWorker.getRegistration().then((reg) => setRegistered(!!reg))
    void cachedPaths().then(setPaths)
  }, [supported])

  async function save() {
    setSaving(true)
    try {
      await navigator.serviceWorker.register('/sw.js')
      const { active } = await navigator.serviceWorker.ready
      setRegistered(true)
      const files = pageFiles()
      // MessageChannel로 보내면, Service Worker가 다 담은 뒤 같은 채널로 답해 줘요.
      const reply = await new Promise<{ count?: number; error?: string }>((resolve) => {
        const channel = new MessageChannel()
        channel.port1.onmessage = (event) => resolve(event.data)
        active!.postMessage({ type: 'cache', urls: files }, [channel.port2])
      })
      if (reply.error) throw new Error(reply.error)
      setPaths(await cachedPaths())
      setResult(`이 화면에 쓴 파일 ${reply.count}개를 담았어요. 이제 인터넷이 끊겨도 열려요.`)
    } catch (e) {
      setResult(`담지 못했어요. 새로고침하고 다시 눌러요. (${e})`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['Service Worker', 'Cache Storage']}
      title={'인터넷이 끊겨도\n열리게 해 볼까요?'}
      description="Service Worker가 이 화면에 쓴 파일을 미리 담아 둬요. 담은 뒤에는 인터넷을 끊고 새로고침해도 이 화면이 열려요."
      cta={
        <Button onClick={save} disabled={!supported || saving}>
          {saving ? '담는 중이에요' : registered && paths.length ? '다시 담기' : '이 화면 오프라인용으로 담기'}
        </Button>
      }
    >
      {result && <Result>{result}</Result>}
      <OnlineStatus offline="지금은 오프라인이에요. 담아 둔 파일로 열렸어요" />
      <Steps title="오프라인에서 열어 보기" steps={STEPS} />
      <Card title="지금 상태">
        <InfoList
          items={[
            ['Service Worker', !supported ? '지원 안 함' : registered ? '동작 중이에요' : '아직 등록하지 않았어요'],
            ['담아 둔 파일', `${paths.length}개`],
          ]}
        />
        {paths.length > 0 && (
          <details className="mt-3 text-[13px] text-grey-600">
            <summary className="cursor-pointer font-medium text-grey-700">담아 둔 파일 보기</summary>
            <ul className="mt-2 flex flex-col gap-1 break-all">
              {paths.map((path) => (
                <li key={path}>{path}</li>
              ))}
            </ul>
          </details>
        )}
      </Card>
      <Note>
        처음 상태로 되돌리려면 DevTools → Application → Storage에서 "Clear site data"를 눌러요. Service Worker와 담아 둔 파일이 함께
        지워져요. 코드는 <code>public/sw.js</code>에 있어요.
      </Note>
      <Report id="service-worker" />
    </Screen>
  )
}
