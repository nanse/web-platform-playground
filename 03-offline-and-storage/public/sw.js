// 03 샘플용 Service Worker: 네트워크를 먼저 쓰고, 끊기면 담아 둔 응답을 줘요.
const CACHE = 'offline-lab-v1'

// 담아도 되는 데이터(API) 주소예요. 누가 봐도 같은 공개 데이터만 넣어요.
// 내 지원 현황, 이력서 같은 개인 데이터는 담지 않아요. Cache Storage는 Cache-Control: no-store를 보지 않아서, 담으면 로그아웃한 뒤에도 남아요.
const PUBLIC_DATA = ['/api/jobs.json']

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// 페이지가 "이 화면에 쓴 파일들"을 보내면 담아요. 다 담으면 받은 포트로 담은 개수를 알려줘요.
// addAll은 하나만 실패해도(예: 없는 favicon.ico) 아무것도 안 담아서, 파일마다 따로 담고 실패한 건 건너뛰어요.
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'cache') return
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      const results = await Promise.allSettled(event.data.urls.map((url) => cache.add(url)))
      event.ports[0]?.postMessage({ count: results.filter((r) => r.status === 'fulfilled').length })
    }),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return
  const { pathname } = new URL(request.url)
  const isData = pathname.startsWith('/api/')
  if (isData && !PUBLIC_DATA.includes(pathname)) return // 개인 데이터는 Service Worker를 거치지 않고 바로 네트워크로 가요.
  event.respondWith(
    fetch(request)
      .then((response) => {
        // 오류 응답(404, 500)은 담지 않아요. 담으면 멀쩡하게 담아 둔 응답을 덮어써요.
        if (response.ok) {
          const copy = response.clone()
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)))
        }
        return response
      })
      .catch(async () => {
        // 모듈 스크립트 요청에는 Origin 헤더가 붙는데, 서버 응답의 Vary: Origin 때문에 담아 둔 응답과 안 맞을 수 있어요.
        // 같은 출처의 정적 파일이라 Vary는 무시해도 돼요.
        const cached = await caches.match(request, { ignoreVary: true })
        if (cached) return isData ? markFromCache(cached) : cached
        // 처음 여는 주소라도 페이지 이동이면 첫 화면을 줘요. 화면 안의 이동은 #으로 해서 같은 페이지예요.
        if (request.mode === 'navigate') return (await caches.match('/', { ignoreVary: true })) ?? Response.error()
        return Response.error()
      }),
  )
})

// 데이터는 "담아 둔 응답"이라는 표시를 붙여서 줘요. 화면은 이 표시를 보고 언제 받은 데이터인지 알려줘요.
function markFromCache(response) {
  const headers = new Headers(response.headers)
  headers.set('X-From-Cache', 'true')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

// ── Background Sync: 끊긴 동안 누른 좋아요를 연결되면 보내요 ──
// 보낼 좋아요는 IndexedDB(outbox)에 둬요. Service Worker는 언제든 꺼졌다 켜져서, 메모리에 두면 사라져요.
// 같은 공고는 마지막으로 누른 값 하나만 남아요(keyPath: jobId).
const SEND_LIKES = 'send-likes'

function outbox(mode, action) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('offline-lab-outbox', 1)
    open.onupgradeneeded = () => open.result.createObjectStore('likes', { keyPath: 'jobId' })
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const tx = open.result.transaction('likes', mode)
      const request = action(tx.objectStore('likes'))
      tx.oncomplete = () => {
        open.result.close()
        resolve(request.result)
      }
      tx.onerror = () => reject(tx.error)
    }
  })
}

// 화면이 맡긴 좋아요를 담거나, 담아 둔 목록을 알려줘요.
self.addEventListener('message', (event) => {
  const reply = (data) => event.ports[0]?.postMessage(data)
  const { type, like } = event.data ?? {}
  if (type === 'queue-like') event.waitUntil(outbox('readwrite', (store) => store.put(like)).then(() => reply({})))
  if (type === 'outbox') event.waitUntil(outbox('readonly', (store) => store.getAll()).then((likes) => reply({ likes })))
  // Background Sync가 없는 브라우저(사파리·파이어폭스)는 화면이 연결됐을 때 직접 보내 달라고 해요. 탭이 열려 있을 때만 돼요.
  if (type === 'flush') event.waitUntil(sendLikes('online 이벤트').catch(() => {}))
})

// 연결돼 있으면 등록하자마자, 끊겨 있으면 연결될 때 브라우저가 이 Service Worker를 깨워서 보내요. 탭을 닫았어도요.
self.addEventListener('sync', (event) => {
  if (event.tag === SEND_LIKES) event.waitUntil(sendLikes(event.lastChance ? 'sync 이벤트(마지막 시도)' : 'sync 이벤트'))
})

async function sendLikes(by) {
  const likes = await outbox('readonly', (store) => store.getAll())
  try {
    for (const like of likes) {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(like),
      })
      if (!response.ok) throw new Error(`좋아요를 보내지 못했어요 (${response.status})`)
      // 보내는 사이 같은 공고를 다시 눌렀다면 새 값이 담겨 있어요. 그건 지우지 않고 다음에 보내요.
      await outbox('readwrite', (store) => {
        const request = store.get(like.jobId)
        request.onsuccess = () => request.result?.likedAt === like.likedAt && store.delete(like.jobId)
        return request
      })
    }
  } catch (error) {
    // 오류를 던지면 브라우저가 sync를 실패로 보고, 시간을 두고 다시 보내요.
    await tell({ type: 'likes-failed', by })
    throw error
  }
  if (likes.length) await tell({ type: 'likes-sent', count: likes.length, by })
}

async function tell(message) {
  for (const client of await self.clients.matchAll({ type: 'window' })) client.postMessage(message)
}
