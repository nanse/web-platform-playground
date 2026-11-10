import { useEffect, useState } from 'react'
import { bullets, Code, ExplainTitle, Lead, numbered, strong, Topic } from '../../shared/explain'
import { Card, Note, Result, Screen, useNav } from '../../shared/ui'
import { ensureWorker, type Job } from './offline-data'
import { Report } from './report'
import { OnlineStatus, Steps, useOnline } from './service-worker'

type Like = { jobId: number; liked: boolean; likedAt: string }
type Received = Like & { receivedAt: string }
// TypeScript의 DOM 타입에는 아직 sync가 없어요. 크롬 계열에만 있어요.
type SyncRegistration = ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } }

/** Service Worker에 묻고 답을 기다려요. MessageChannel로 보내면 같은 채널로 답이 와요. */
async function ask<T>(message: object) {
  const { active } = await navigator.serviceWorker.ready
  return new Promise<T>((resolve) => {
    const channel = new MessageChannel()
    channel.port1.onmessage = (event) => resolve(event.data)
    active!.postMessage(message, [channel.port2])
  })
}

const time = (iso: string) => new Date(iso).toLocaleTimeString('ko-KR')

// sync가 없는 브라우저(사파리·파이어폭스)는 화면이 Service Worker에 지금 보내 달라고 해요.
const flush = () => navigator.serviceWorker.ready.then((registration) => registration.active?.postMessage({ type: 'flush' }))

const STEPS = [
  'DevTools → Application → Service Workers에서 "Offline"을 켜요.',
  '공고에 좋아요를 눌러요. 하트는 바로 켜지고 "보낼 차례를 기다려요"가 붙어요.',
  '이 탭을 닫아요. DevTools가 같이 닫히면서 연결이 돌아오고, 브라우저가 탭 없이 Service Worker만 깨워서 보내요.',
  '다시 열면 서버가 받은 시각이 누른 시각보다 늦게 찍혀 있어요.',
]

const CODE = `// 화면: 보낼 좋아요를 Service Worker에 맡기고 sync를 등록해요.
await ask({ type: 'queue-like', like })     // sw.js가 IndexedDB(outbox)에 담아요
const registration = await navigator.serviceWorker.ready
if ('sync' in registration) {
  await registration.sync.register('send-likes')
} else {
  // 사파리·파이어폭스: 탭이 열린 채 연결되면(online 이벤트) 직접 보내요.
}

// sw.js: 연결되면 브라우저가 깨워 줘요. 탭을 닫았어도요.
self.addEventListener('sync', (event) => {
  if (event.tag === 'send-likes') event.waitUntil(sendLikes())
})

async function sendLikes() {
  for (const like of await getAllFromOutbox()) {
    // 아직 끊겼으면 여기서 오류가 나요. 오류를 던지면 브라우저가 나중에 다시 sync를 줘요.
    await fetch('/api/likes', { method: 'POST', body: JSON.stringify(like) })
    await deleteFromOutbox(like.jobId)
  }
}`

function Explainer() {
  return (
    <>
      <ExplainTitle>Background Sync는 어떻게 동작해요?</ExplainTitle>
      <Lead>
        끊긴 동안 누른 버튼을 잃지 않게, 보낼 요청을 담아 뒀다가 연결되면 보내는 기능이에요. 탭이 열려 있다면 online 이벤트로도 할 수 있어요.
        Background Sync만 할 수 있는 건, 탭을 닫은 뒤에 연결돼도 브라우저가 Service Worker를 깨워서 보내 준다는 점이에요.
      </Lead>
      <Topic icon="🔁" title="좋아요 하나가 이렇게 흘러가요">
        <ol className={numbered}>
          <li>하트는 서버 답을 기다리지 않고 바로 켜요.</li>
          <li>보낼 좋아요를 Service Worker에 맡기면 IndexedDB(outbox)에 담아요. Service Worker는 언제든 꺼졌다 켜져서 메모리에 두면 사라져요.</li>
          <li>sync.register(&apos;send-likes&apos;)로 "연결되면 깨워 줘"라고 등록해요. 연결돼 있으면 바로 깨워요.</li>
          <li>Service Worker가 sync 이벤트를 받아 outbox를 보내고, 보낸 것은 지워요.</li>
          <li>보내다 실패하면 오류를 던져요. 브라우저가 시간을 두고 다시 sync를 줘요. 마지막 시도에는 event.lastChance가 true예요.</li>
        </ol>
        <Code code={CODE} />
      </Topic>
      <Topic icon="🧭" title="이런 요청에 맞아요">
        <ul className={bullets}>
          <li>
            <strong className={strong}>맞아요:</strong> 좋아요, 관심 공고 저장, 읽음 표시처럼 조금 늦게 가도 되고 같은 값을 두 번 보내도 괜찮은
            요청이에요.
          </li>
          <li>
            <strong className={strong}>안 맞아요:</strong> 지원하기, 결제처럼 결과를 바로 알아야 하는 요청이에요. 사용자는 이미 떠났는데 나중에
            실패하면 알려줄 곳이 없어요.
          </li>
        </ul>
      </Topic>
      <Topic icon="⚠️" title="이건 꼭 챙겨요">
        <ul className={bullets}>
          <li>같은 공고를 여러 번 누르면 마지막 값 하나만 보내요. outbox의 키를 공고 번호로 둬서 덮어써요.</li>
          <li>보내는 사이 다시 누른 값은 지우지 않아요. 누른 시각이 같을 때만 outbox에서 지워요.</li>
          <li>
            로그아웃하면 outbox를 비워요. 보낼 때의 쿠키로 보내져서, 그대로 두면 다음에 로그인한 사람 계정으로 좋아요가 갈 수 있어요.
          </li>
          <li>사파리와 파이어폭스에는 sync가 없어요. 탭이 열린 채 연결되면 화면이 대신 보내 달라고 해요. 탭을 닫으면 다음에 열 때까지 기다려요.</li>
        </ul>
      </Topic>
    </>
  )
}

export function BackgroundSync({ feature }: { feature: { id: string; icon: string } }) {
  const { back } = useNav()
  const online = useOnline()
  const supported = 'serviceWorker' in navigator
  const syncSupported = 'SyncManager' in window
  const [jobs, setJobs] = useState<Job[]>([])
  const [outbox, setOutbox] = useState<Like[]>([])
  const [received, setReceived] = useState<Received[]>([])
  const [message, setMessage] = useState<string | null>(null)

  async function refresh() {
    await ensureWorker()
    setOutbox((await ask<{ likes: Like[] }>({ type: 'outbox' })).likes)
    try {
      setReceived(await (await fetch('/api/likes')).json())
    } catch {
      // 끊겼으면 서버에 물을 수 없어요. 마지막으로 받은 값을 그대로 둬요.
    }
  }

  useEffect(() => {
    if (!supported) return
    void fetch('/api/jobs.json')
      .then((response) => response.json())
      .then(setJobs)
    void refresh()
    // Service Worker가 보냈거나 못 보냈다고 알려주면 다시 읽어요. 탭을 닫았다가 열면 이 알림 없이 처음부터 읽어요.
    const onMessage = ({ data }: MessageEvent) => {
      if (data?.type === 'likes-sent') setMessage(`Service Worker가 ${data.by}를 받고 좋아요 ${data.count}개를 보냈어요.`)
      if (data?.type === 'likes-failed') setMessage(`${data.by}를 받았지만 아직 끊겨 있어서 못 보냈어요. 브라우저가 시간을 두고 다시 보내요.`)
      void refresh()
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [])

  // sync가 없는 브라우저는 화면을 열 때와 연결이 돌아왔을 때 대신 보내 달라고 해요. 탭이 닫혀 있으면 못 보내요.
  useEffect(() => {
    if (supported && !syncSupported && online) void flush()
  }, [online])

  const isLiked = (jobId: number) => outbox.find((l) => l.jobId === jobId)?.liked ?? received.some((r) => r.jobId === jobId)

  async function toggle(jobId: number) {
    const like: Like = { jobId, liked: !isLiked(jobId), likedAt: new Date().toISOString() }
    // 서버 답을 기다리지 않고 하트부터 바꿔요.
    setOutbox((list) => [...list.filter((l) => l.jobId !== jobId), like])
    await ensureWorker()
    await ask({ type: 'queue-like', like })
    const registration: SyncRegistration = await navigator.serviceWorker.ready
    if (registration.sync) {
      await registration.sync.register('send-likes')
      setMessage('좋아요를 outbox에 담고 sync를 등록했어요. 연결돼 있으면 바로, 끊겨 있으면 연결될 때 보내요.')
    } else {
      setMessage('이 브라우저는 Background Sync가 없어요. 좋아요를 담아 두고, 이 탭이 열린 채 연결되면 보내요.')
      if (navigator.onLine) void flush()
    }
  }

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['Background Sync', 'Service Worker', 'IndexedDB']}
      title={'끊긴 동안 누른 좋아요,\n연결되면 보내 볼까요?'}
      description="하트는 바로 켜지고, 보낼 요청은 Service Worker가 맡아요. 연결이 돌아오면 탭을 닫았어도 브라우저가 Service Worker를 깨워서 보내요."
    >
      {message && <Result>{message}</Result>}
      <OnlineStatus offline="지금은 오프라인이에요. 누른 좋아요는 연결되면 보내요" />
      <Card title="공고">
        <ul className="divide-y divide-grey-200">
          {jobs.map((job) => {
            const waiting = outbox.find((l) => l.jobId === job.id)
            const got = received.find((r) => r.jobId === job.id)
            const liked = isLiked(job.id)
            return (
              <li key={job.id} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-semibold text-grey-900">{job.title}</span>
                  <span className={`block text-[14px] ${waiting ? 'text-[#c25e00]' : 'text-grey-500'}`}>
                    {waiting
                      ? `${time(waiting.likedAt)}에 ${waiting.liked ? '눌렀어요' : '취소했어요'} · 보낼 차례를 기다려요`
                      : got
                        ? `${time(got.likedAt)}에 눌렀고, 서버가 ${time(got.receivedAt)}에 받았어요`
                        : job.company}
                  </span>
                </span>
                <button
                  onClick={() => toggle(job.id)}
                  disabled={!supported}
                  aria-pressed={liked}
                  aria-label={`${job.title} 좋아요`}
                  className="grid size-11 shrink-0 place-items-center rounded-full transition hover:bg-grey-100 active:scale-90 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40"
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden className={liked ? 'text-danger' : 'text-grey-400'}>
                    <path
                      d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3Z"
                      fill={liked ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </li>
            )
          })}
        </ul>
      </Card>
      {!syncSupported && (
        <Note>이 브라우저는 Background Sync가 없어요. 이 탭이 열린 채 연결되면 화면이 대신 보내요. 탭을 닫으면 다음에 열 때 보내요.</Note>
      )}
      <Steps title="끊긴 채로 좋아요 눌러 보기" steps={STEPS} />
      <Note>
        보내는 코드는 <code>public/sw.js</code>의 <code>sync</code> 이벤트와 <code>sendLikes</code>에 있어요. 받는 쪽은{' '}
        <code>vite.config.ts</code>의 <code>/api/likes</code>예요. 서버 메모리에 둬서 서버를 다시 켜면 사라져요.
      </Note>
      <Report id="background-sync" intro={<Explainer />} />
    </Screen>
  )
}
