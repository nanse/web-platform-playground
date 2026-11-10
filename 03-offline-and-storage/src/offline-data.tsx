import { useEffect, useState } from 'react'
import { bullets, Code, ExplainTitle, Lead, numbered, strong, Topic } from '../../shared/explain'
import { Button, Card, Note, Result, Screen, useNav } from '../../shared/ui'
import { Report } from './report'
import { OnlineStatus, Steps, useOnline } from './service-worker'

export type Job = { id: number; title: string; company: string }
type Loaded = { jobs: Job[]; receivedAt: Date; fromCache: boolean }
type Status = 'idle' | 'loading' | 'fresh' | 'cached' | 'empty'

/** Service Worker가 이 페이지를 맡을 때까지 기다려요. 맡기 전에 보낸 fetch는 Service Worker를 거치지 않아서 담기지 않아요. */
export async function ensureWorker() {
  await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  if (navigator.serviceWorker.controller) return
  await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
}

/** 평소처럼 fetch해요. 끊겼을 때 어떻게 할지는 Service Worker(public/sw.js)가 정해요. */
async function loadJobs(): Promise<Loaded> {
  const response = await fetch('/api/jobs.json')
  return {
    jobs: await response.json(),
    // 서버가 붙인 Date 헤더예요. 담아 둔 응답도 처음 받았을 때의 Date를 그대로 갖고 있어요.
    receivedAt: new Date(response.headers.get('Date') ?? Date.now()),
    fromCache: response.headers.get('X-From-Cache') === 'true',
  }
}

const MESSAGE: Partial<Record<Status, string>> = {
  fresh: '서버에서 새로 받았어요. Service Worker가 이 응답을 담아 뒀어요.',
  cached: '인터넷이 끊겨서 Service Worker가 담아 둔 응답을 대신 줬어요. 연결되면 새로 불러올게요.',
  empty: '아직 담아 둔 공고가 없어요. 연결되면 다시 불러올게요.',
}

const STEPS = [
  '"공고 불러오기"를 눌러요. 서버에서 받은 응답을 Service Worker가 담아 둬요.',
  'DevTools → Network 탭에서 "Offline"을 켜요.',
  '다시 "공고 불러오기"를 눌러요. 담아 둔 응답과 처음 받은 시각이 보여요.',
  '"Offline"을 끄면 알아서 새로 불러와요.',
]

const CODE = `// sw.js: 서버에 먼저 묻고, 끊기면 담아 둔 응답을 줘요.
// 담아도 되는 공개 데이터만 적어요.
const PUBLIC_DATA = ['/api/jobs.json']

self.addEventListener('fetch', (event) => {
  const { pathname } = new URL(event.request.url)
  if (!PUBLIC_DATA.includes(pathname)) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open('v1').then((cache) => cache.put(event.request, copy))
        }
        return response
      })
      .catch(async () => {
        const cached = await caches.match(event.request)
        // 담아 둔 것도 없으면 화면의 fetch가 실패해요.
        if (!cached) return Response.error()
        // "담아 둔 응답"이라는 표시를 붙여요.
        const headers = new Headers(cached.headers)
        headers.set('X-From-Cache', 'true')
        return new Response(cached.body, { status: cached.status, headers })
      }),
  )
})

// 화면: 평소처럼 fetch하고, 표시만 하나 더 봐요.
const response = await fetch('/api/jobs.json')
const jobs = await response.json()
const fromCache = response.headers.get('X-From-Cache') === 'true'
const receivedAt = new Date(response.headers.get('Date'))`

function Explainer() {
  return (
    <>
      <ExplainTitle>fetch로 받는 데이터는 어떻게 다뤄요?</ExplainTitle>
      <Lead>
        화면 파일(JS·CSS)은 배포할 때만 바뀌지만, 공고 목록 같은 데이터는 계속 바뀌어요. 그래서 데이터는 늘 서버에 먼저 물어보고, 끊겼을 때만
        마지막으로 받은 응답을 꺼내요. 화면 코드는 평소처럼 fetch를 부르고, 끊겼을 때 할 일은 Service Worker가 정해요.
      </Lead>
      <Topic icon="🔁" title="fetch 한 번이 이렇게 흘러가요">
        <ol className={numbered}>
          <li>화면이 fetch를 부르면 Service Worker가 먼저 받아요.</li>
          <li>Service Worker가 서버에 물어봐요. 답이 오면 화면에 주고, 사본을 Cache Storage에 담아요.</li>
          <li>인터넷이 끊겨 실패하면, 담아 둔 사본에 "담아 둔 응답(X-From-Cache)" 표시를 붙여서 줘요.</li>
          <li>담아 둔 사본도 없으면 화면의 fetch가 실패해요(TypeError). 화면은 "아직 담아 둔 공고가 없어요"를 보여줘요.</li>
        </ol>
        <Code code={CODE} />
      </Topic>
      <Topic icon="🧭" title="데이터마다 담는 방법이 달라요">
        <ul className={bullets}>
          <li>
            <strong className={strong}>서버 먼저 (Network First):</strong> 새 정보가 중요할 때예요. 공고 목록, 알림이 그래요. 이 화면이 이
            방식이에요.
          </li>
          <li>
            <strong className={strong}>담아 둔 것 먼저, 뒤에서 새로 받기 (Stale-While-Revalidate):</strong> 조금 늦은 정보라도 바로 보여주는 게
            나을 때예요. 직군이나 지역 같은 필터 목록이 그래요.
          </li>
          <li>
            <strong className={strong}>담아 둔 것만 (Cache First):</strong> 바뀌지 않는 것이에요. 파일 이름에 해시가 붙은 JS·CSS, 폰트가 그래요.
          </li>
        </ul>
      </Topic>
      <Topic icon="🕒" title="언제 받은 데이터인지 알려줘요">
        <ul className={bullets}>
          <li>담아 둔 응답은 처음 받았을 때의 Date 헤더를 그대로 갖고 있어요. 그래서 "오후 3:02에 받은 공고예요"처럼 보여줄 수 있어요.</li>
          <li>
            끊겼는지는 navigator.onLine보다 응답에 붙은 표시로 판단해요. navigator.onLine은 와이파이에 붙어 있기만 하면 true라서, 서버에 못
            닿아도 온라인이라고 해요.
          </li>
          <li>연결이 돌아오면(online 이벤트) 새로 불러와요. TanStack Query의 refetchOnReconnect가 하는 일과 같아요.</li>
        </ul>
      </Topic>
      <Topic icon="🔒" title="담으면 안 되는 것도 있어요">
        <ul className={bullets}>
          <li>
            <strong className={strong}>개인 데이터:</strong> 내 지원 현황, 이력서, 프로필이에요. Cache Storage는 Cache-Control: no-store를 보지
            않아서, 코드가 담으면 그대로 남아요. 로그아웃한 뒤에도, 같은 PC를 쓰는 다른 사람에게도 보일 수 있어요. 그래서 담을 주소를
            목록(PUBLIC_DATA)으로 정해요.
          </li>
          <li>
            <strong className={strong}>오류 응답:</strong> 404나 500을 담으면 멀쩡하게 담아 둔 응답을 덮어써요. response.ok일 때만 담아요.
          </li>
          <li>
            <strong className={strong}>보내는 요청(POST):</strong> 지원하기, 저장하기는 담을 수 없어요. 끊긴 동안 누른 걸 나중에 보내는 방법은
            &apos;끊긴 동안 누른 좋아요 나중에 보내기&apos;(Background Sync)에서 해 봐요.
          </li>
        </ul>
      </Topic>
      <Topic icon="⚖️" title="TanStack Query 캐시와는 뭐가 달라요?">
        <ul className={bullets}>
          <li>TanStack Query의 캐시는 메모리에 있어요. 새로고침하거나 탭을 닫으면 사라져요.</li>
          <li>Service Worker가 담은 응답은 Cache Storage에 남아서, 오프라인에서 새로고침해도 꺼낼 수 있어요.</li>
          <li>그래서 둘은 같이 써요. 화면 안의 캐시는 TanStack Query가, 새로고침과 오프라인은 Service Worker가 맡아요.</li>
        </ul>
      </Topic>
    </>
  )
}

export function OfflineData({ feature }: { feature: { id: string; icon: string } }) {
  const { back } = useNav()
  const online = useOnline()
  const supported = 'serviceWorker' in navigator
  const [status, setStatus] = useState<Status>('idle')
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  async function load() {
    setStatus('loading')
    try {
      await ensureWorker()
      const next = await loadJobs()
      setLoaded(next)
      setStatus(next.fromCache ? 'cached' : 'fresh')
    } catch {
      // 끊겼는데 담아 둔 응답도 없으면 fetch가 실패해요.
      setStatus('empty')
    }
  }

  // 연결이 돌아오면, 담아 둔 걸 보여주던 중이거나 못 불러왔을 때 새로 불러와요.
  useEffect(() => {
    if (online && (status === 'cached' || status === 'empty')) void load()
  }, [online])

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['Service Worker', 'Cache Storage', 'fetch']}
      title={'인터넷이 끊겨도\n공고 목록을 보여줄까요?'}
      description="fetch로 받는 데이터도 Service Worker가 마지막 응답을 담아 둬요. 끊기면 담아 둔 응답을 대신 주고, 화면은 언제 받은 공고인지 알려줘요."
      cta={
        <Button onClick={load} disabled={!supported || status === 'loading'}>
          {status === 'loading' ? '불러오는 중이에요' : '공고 불러오기'}
        </Button>
      }
    >
      {MESSAGE[status] && <Result>{MESSAGE[status]}</Result>}
      <OnlineStatus offline="지금은 오프라인이에요" />
      <Card title="받은 공고">
        {loaded ? (
          <>
            <p className="flex items-center gap-2 text-[14px] text-grey-600">
              <span
                className={`rounded-lg px-2 py-0.5 text-[13px] font-semibold ${
                  loaded.fromCache ? 'bg-[#fff4e5] text-[#c25e00]' : 'bg-primary-weak text-primary'
                }`}
              >
                {loaded.fromCache ? '담아 둔 응답' : '서버 응답'}
              </span>
              {loaded.receivedAt.toLocaleTimeString('ko-KR')}에 받았어요
            </p>
            <ul className="mt-2 divide-y divide-grey-200">
              {loaded.jobs.map((job) => (
                <li key={job.id} className="py-3">
                  <span className="block text-[16px] font-semibold text-grey-900">{job.title}</span>
                  <span className="block text-[14px] text-grey-500">{job.company}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-[15px] text-grey-500">아직 불러오지 않았어요</p>
        )}
      </Card>
      <Steps title="끊긴 채로 불러와 보기" steps={STEPS} />
      <Note>
        공고는 <code>public/api/jobs.json</code>이에요. 진짜 API처럼 fetch로 받아요. 데이터를 다루는 코드는 <code>public/sw.js</code>의{' '}
        <code>PUBLIC_DATA</code>와 <code>markFromCache</code>에 있어요.
      </Note>
      <Report id="offline-data" intro={<Explainer />} />
    </Screen>
  )
}
