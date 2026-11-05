# 03 · Offline & Storage

Service Worker, IndexedDB, OPFS로 "인터넷이 끊겨도 열리고, 창을 닫아도 남는" 화면을 만들어 봐요.

```sh
pnpm --filter 03-offline-and-storage dev   # https://localhost:5103
```

## 결론부터 말할게요

- **원티드에 지금 꼭 필요한 건 없어요.** 구직과 채용은 서버 데이터가 있어야 하는 일이라, 오프라인으로 쓸 수 있는 기능이 거의 없어요.
- **Service Worker는 PWA를 하면 같이 넣어요.** `01`에서 해볼 만하다고 본 기업 대시보드 PWA에서 Web Push(앱이 닫혀 있을 때 배지 바꾸기)를 하려면 꼭 필요해요.
- **fetch로 받는 데이터는 공개 데이터만 담아요.** 끊겼을 때 마지막 공고 목록을 보여줄 수 있어요. 내 지원 현황 같은 개인 데이터는 담으면 안 돼요.
- **IndexedDB는 localStorage로 부족할 때 써요.** 이력서 초안처럼 서버에 보내기 전 데이터를 잃지 않게 붙잡아 둘 때예요.
- **OPFS는 필요 없어요.** 원티드에는 큰 파일을 브라우저 안에서 다루는 기능이 없어요.

## 한눈에 보기

| 기술 | 원티드에 필요할까요? | 이유 |
| --- | --- | --- |
| Service Worker | ➕ PWA를 하면 같이 넣어요 | Web Push를 받으려면 필요해요. 오프라인 자체는 쓸 곳이 거의 없어요 |
| Service Worker로 API 응답 담기 | ➕ PWA를 하면 공개 데이터만 담아요 | 끊겼을 때 마지막 공고 목록을 보여줘요. 개인 데이터는 담으면 안 돼요 |
| IndexedDB | ➕ localStorage로 부족할 때 써요 | 객체와 파일을 크게 담을 수 있어서, 잃으면 안 되는 초안에 맞아요 |
| OPFS | ❌ 필요 없어요 | 이력서와 포트폴리오는 서버에 올려야 의미가 있어요 |

## 어디서 동작하나요?

[MDN 호환성 데이터](https://github.com/mdn/browser-compat-data)(2026-11-02) 기준이에요. 숫자는 처음 지원한 버전이에요.

| 기술 | 크롬·엣지 데스크톱 | 크롬 안드로이드 | 사파리 macOS | 사파리 iOS | 파이어폭스 |
| --- | --- | --- | --- | --- | --- |
| Service Worker | 40+ | 40+ | 11.1+ | 11.3+ | 44+ |
| Cache Storage | 43+ | 43+ | 11.1+ | 11.3+ | 41+ |
| 끊긴 동안 보낸 요청 나중에 보내기 (Background Sync) | 49+ | 49+ | ❌ | ❌ | ❌ |
| IndexedDB | 24+ | 25+ | 8+ | 8+ | 16+ |
| 저장 공간 확인 (`storage.estimate`) | 61+ | 61+ | 17+ | 17+ | 57+ |
| 지우지 말아 달라고 요청 (`storage.persist`) | 55+ | 55+ | 15.2+ | 15.2+ | 57+ |
| OPFS (`storage.getDirectory`) | 86+ | 109+ | 15.2+ | 15.2+ | 111+ |
| 메인 스레드에서 쓰기 (`createWritable`) | 86+ | 109+ | 26+ | 26+ | 111+ |
| 워커에서 빠르게 쓰기 (`createSyncAccessHandle`) | 102+ | 109+ | 15.2+ | 15.2+ | 111+ |

- Background Sync는 크롬 계열에서만 돼요. 사파리와 파이어폭스에서는 연결된 뒤 다시 보내게 안내해요.
- 사파리는 26 전까지 메인 스레드에서 OPFS 파일을 쓸 수 없어서, 워커에서 `createSyncAccessHandle`로 써야 했어요.
- 사파리는 7일 동안 방문하지 않은 사이트의 저장 데이터를 지울 수 있어요([WebKit 블로그](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)).

## 직접 해보기

첫 화면에서 기능을 고르면, 화면마다 할 일이 하나씩 나와요.

| 기술 | 코드 | 해보는 방법 |
| --- | --- | --- |
| Service Worker | `public/sw.js`, `src/service-worker.tsx` | 인터넷이 끊겨도 열리게 하기 → "이 화면 오프라인용으로 담기" → DevTools Network 탭에서 "Offline"을 켜고 새로고침 |
| API 응답 담기 | `public/sw.js`, `src/offline-data.tsx`, `public/api/jobs.json` | 끊겨도 받아 둔 공고 보여주기 → "공고 불러오기" → "Offline"을 켜고 다시 "공고 불러오기" → "Offline"을 끄면 알아서 새로 불러와요 |
| IndexedDB | `src/indexed-db.tsx` | 관심 공고 브라우저에 담기 → "관심 공고 하나 담기" → 새로고침해도 남아 있는지 확인 |
| OPFS | `src/opfs.tsx` | 브라우저 안에 파일 저장하기 → 메모를 고치고 "OPFS에 저장하기" → 새로고침해도 불러오는지 확인 |

처음 상태로 되돌리려면 DevTools → Application → Storage에서 "Clear site data"를 눌러요. Service Worker, 담아 둔 파일, IndexedDB, OPFS가 함께 지워져요.

## 기술별로 자세히

### Service Worker · ➕ PWA를 하면 같이 넣어요

- **무엇인가요:** 페이지와 네트워크 사이에 서는 작은 스크립트예요. 요청을 가로채서 담아 둔 응답을 주거나, 페이지가 닫혀 있어도 푸시를 받아요. 이 샘플은 네트워크를 먼저 쓰고, 끊기면 담아 둔 응답을 줘요.
- **문서:** [MDN · Service Worker API](https://developer.mozilla.org/docs/Web/API/Service_Worker_API) · [web.dev · 오프라인 쿡북](https://web.dev/articles/offline-cookbook) · [web.dev · Learn PWA: Service Worker](https://web.dev/learn/pwa/service-workers) · [MDN · Push API](https://developer.mozilla.org/docs/Web/API/Push_API)
- **얻을 수 있는 것:** `01`에서 해볼 만하다고 본 기업 대시보드 PWA에서, 앱이 닫혀 있을 때도 배지를 바꾸려면 Web Push가 필요해요. Web Push는 Service Worker가 받아요. 인터넷이 끊겼을 때 "연결이 끊겼어요" 안내 화면을 보여줄 수도 있어요.
- **한계:** 구직과 채용은 서버 데이터가 있어야 하는 일이라, 오프라인으로 쓸 수 있는 기능은 거의 없어요. 잘못 배포한 Service Worker는 사용자 브라우저에 남아 옛 화면을 계속 보여줄 수 있어서, 업데이트와 해제 방법을 먼저 정해야 해요.

### Service Worker로 API 응답 담기 · ➕ PWA를 하면 공개 데이터만 담아요

- **무엇인가요:** 화면 파일(JS·CSS)처럼, fetch로 받는 데이터(API 응답)도 Service Worker가 담아 둘 수 있어요. 화면 코드는 평소처럼 `fetch`를 부르고, 끊겼을 때 할 일은 Service Worker가 정해요.
- **문서:** [web.dev · 오프라인 쿡북](https://web.dev/articles/offline-cookbook) · [Chrome · Workbox 캐싱 전략](https://developer.chrome.com/docs/workbox/caching-strategies-overview) · [MDN · Cache](https://developer.mozilla.org/docs/Web/API/Cache) · [MDN · Background Synchronization API](https://developer.mozilla.org/docs/Web/API/Background_Synchronization_API) · [TanStack Query · persistQueryClient](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient)
- **얻을 수 있는 것:** 지하철이나 엘리베이터처럼 잠깐 끊기는 곳에서, 오류 화면 대신 마지막에 받은 공고 목록을 보여줄 수 있어요. 받은 시각을 같이 보여주면 사용자가 옛 정보와 헷갈리지 않아요.
- **한계:** 담아 둔 공고는 그사이 마감됐을 수 있어서, 지원하기 같은 행동은 늘 서버에 다시 확인해야 해요. 내 지원 현황, 이력서 같은 개인 데이터는 담으면 안 돼요. Cache Storage는 `Cache-Control: no-store`를 보지 않아서, 로그아웃한 뒤에도 남아요.
- **이렇게 확인해요:** 네트워크 오류로 목록을 못 그린 횟수와 그 뒤 떠난 비율을 먼저 재요. 이 숫자가 작으면 넣지 않아도 돼요.

#### fetch로 받는 데이터는 어떻게 다뤄요?

화면 파일은 배포할 때만 바뀌지만, 공고 목록 같은 데이터는 계속 바뀌어요. 그래서 데이터는 늘 서버에 먼저 물어보고, 끊겼을 때만 마지막으로 받은 응답을 꺼내요.

1. 화면이 `fetch('/api/jobs.json')`를 부르면 Service Worker가 먼저 받아요.
2. Service Worker가 서버에 물어봐요. 답이 오면 화면에 주고, 사본을 Cache Storage에 담아요.
3. 인터넷이 끊겨 실패하면, 담아 둔 사본에 `X-From-Cache: true` 표시를 붙여서 줘요.
4. 담아 둔 사본도 없으면 화면의 `fetch`가 실패해요(`TypeError`). 화면은 "아직 담아 둔 공고가 없어요"를 보여줘요.

```js
// sw.js: 서버에 먼저 묻고, 끊기면 담아 둔 응답을 줘요.
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
const receivedAt = new Date(response.headers.get('Date'))
```

**데이터마다 담는 방법이 달라요**

| 방법 | 언제 써요? | 예 |
| --- | --- | --- |
| 서버 먼저 (Network First) | 새 정보가 중요할 때 | 공고 목록, 알림. 이 샘플이 이 방식이에요 |
| 담아 둔 것 먼저, 뒤에서 새로 받기 (Stale-While-Revalidate) | 조금 늦어도 바로 보여주는 게 나을 때 | 직군, 지역 같은 필터 목록 |
| 담아 둔 것만 (Cache First) | 바뀌지 않을 때 | 파일 이름에 해시가 붙은 JS·CSS, 폰트 |

**언제 받은 데이터인지 알려줘요**

- 담아 둔 응답은 처음 받았을 때의 `Date` 헤더를 그대로 갖고 있어요. 그래서 "오후 3:02에 받은 공고예요"처럼 보여줄 수 있어요.
- 끊겼는지는 `navigator.onLine`보다 응답에 붙은 표시로 판단해요. `navigator.onLine`은 와이파이에 붙어 있기만 하면 `true`라서, 서버에 못 닿아도 온라인이라고 해요.
- 연결이 돌아오면(`online` 이벤트) 새로 불러와요. TanStack Query의 `refetchOnReconnect`가 하는 일과 같아요.

**담으면 안 되는 것도 있어요**

- **개인 데이터:** 내 지원 현황, 이력서, 프로필이에요. Cache Storage는 `Cache-Control: no-store`를 보지 않아서, 코드가 담으면 그대로 남아요. 로그아웃한 뒤에도, 같은 PC를 쓰는 다른 사람에게도 보일 수 있어요. 그래서 담을 주소를 목록(`PUBLIC_DATA`)으로 정해요.
- **오류 응답:** 404나 500을 담으면 멀쩡하게 담아 둔 응답을 덮어써요. `response.ok`일 때만 담아요.
- **보내는 요청(POST):** 지원하기, 저장하기는 담을 수 없어요. 끊긴 동안 보낸 요청을 나중에 보내주는 Background Sync는 크롬 계열에서만 돼요. 보통은 연결된 뒤 다시 보내게 안내해요.

**TanStack Query 캐시와는 뭐가 달라요?**

- TanStack Query의 캐시는 메모리에 있어요. 새로고침하거나 탭을 닫으면 사라져요.
- Service Worker가 담은 응답은 Cache Storage에 남아서, 오프라인에서 새로고침해도 꺼낼 수 있어요.
- 그래서 둘은 같이 써요. 화면 안의 캐시는 TanStack Query가, 새로고침과 오프라인은 Service Worker가 맡아요. TanStack Query 캐시를 저장소에 남기고 싶다면 `persistQueryClient`를 써요.

### IndexedDB · ➕ localStorage로 부족할 때 써요

- **무엇인가요:** 브라우저 안의 작은 데이터베이스예요. 객체, `Date`, 파일(Blob)을 그대로 담고 키로 찾아요. 비동기라서 큰 데이터를 다뤄도 화면이 멈추지 않아요.
- **문서:** [MDN · IndexedDB API](https://developer.mozilla.org/docs/Web/API/IndexedDB_API) · [web.dev · 웹 저장소 고르기](https://web.dev/articles/storage-for-the-web) · [GitHub · idb](https://github.com/jakearchibald/idb)
- **얻을 수 있는 것:** localStorage는 문자열만, 동기로, 몇 MB까지만 담아요. IndexedDB는 객체와 파일을 비동기로 크게 담을 수 있어서, 이력서 초안처럼 서버에 보내기 전 데이터를 잃지 않게 붙잡아 둘 때 쓸 만해요.
- **한계:** API가 불편해서 보통 idb 같은 작은 래퍼를 써요. 브라우저 저장소는 언제든 지워질 수 있어서, 원본은 늘 서버에 둬요.

### OPFS · ❌ 필요 없어요

- **무엇인가요:** 이 사이트만 쓸 수 있는 숨은 폴더(Origin Private File System)예요. 파일을 만들고 읽고 써요. 워커에서는 `createSyncAccessHandle`로 아주 빠르게 쓸 수 있어서 SQLite(WASM) 같은 데 써요.
- **문서:** [MDN · Origin private file system](https://developer.mozilla.org/docs/Web/API/File_System_API/Origin_private_file_system) · [web.dev · OPFS](https://web.dev/articles/origin-private-file-system)
- **필요 없는 이유:** OPFS는 사진·영상 편집기나 브라우저 안 SQLite처럼, 큰 파일을 브라우저 안에서 빠르게 읽고 쓰는 용도예요. 원티드가 다루는 이력서와 포트폴리오는 서버에 올려야 의미가 있어서, 브라우저에만 두는 파일은 쓸 곳이 없어요.
- **다시 볼 때:** 브라우저 안에서 큰 데이터를 직접 다뤄야 할 때 다시 봐요. 예를 들어 SQLite(WASM)로 오프라인 검색을 만드는 경우예요.

## 알아두면 좋은 것

- 저장한 데이터는 origin(`https://localhost:5103`)마다 따로 남아요. 포트가 바뀌면 브라우저는 다른 사이트로 봐서, 담아 둔 데이터를 찾지 못해요.
- 오프라인 확인은 `pnpm --filter 03-offline-and-storage build && pnpm --filter 03-offline-and-storage preview`로 하는 게 정확해요. dev 서버는 HMR 때문에 파일 주소가 계속 바뀌어요.
- `public/sw.js`는 담아 둔 응답을 찾을 때 `ignoreVary: true`를 써요. Vite 서버가 `Vary: Origin`을 붙이는데, 모듈 스크립트 요청에는 `Origin` 헤더가 붙어서 그냥 찾으면 담아 둔 JS를 못 찾아요.
- `cache.addAll()`은 하나만 실패해도 아무것도 담지 않아요. 크롬이 알아서 요청하는 없는 `favicon.ico`처럼 실패하는 주소가 섞일 수 있어서, 파일마다 따로 담아요.
- 화면은 [Tailwind CSS](https://tailwindcss.com) v4로 만들었어요. 화면 틀과 판단 화면은 `02`와 같이 `../shared/`를 써요.
- "원티드에 필요할까요?", "어디서 동작하나요?", 참고 문서는 앱의 기능 화면 맨 아래에도 있어요. 내용은 `src/report.tsx`에 모여 있으니, 고칠 때 이 README와 함께 고쳐요.
