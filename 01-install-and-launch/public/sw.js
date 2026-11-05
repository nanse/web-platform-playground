// 설치 가능한 PWA의 최소 서비스 워커: 네트워크 우선, 끊기면 마지막으로 받은 응답.
// 오프라인 전략은 03-offline-and-storage에서 깊게 다뤄요.
const CACHE = 'install-lab-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone()
        event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)))
        return response
      })
      .catch(() => caches.match(request)),
  )
})
