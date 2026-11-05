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
