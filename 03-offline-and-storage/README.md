# 03 · Offline & Storage

Service Worker, IndexedDB, OPFS로 "인터넷이 끊겨도 열리고, 창을 닫아도 남는" 화면을 만들어 봐요.

```sh
pnpm --filter 03-offline-and-storage dev   # https://localhost:5103
```

## 결론부터 말할게요

- **원티드에 지금 꼭 필요한 건 없어요.** 구직과 채용은 서버 데이터가 있어야 하는 일이라, 오프라인으로 쓸 수 있는 기능이 거의 없어요.
- **Service Worker는 PWA를 하면 같이 넣어요.** `01`에서 해볼 만하다고 본 기업 대시보드 PWA에서 Web Push(앱이 닫혀 있을 때 배지 바꾸기)를 하려면 꼭 필요해요.
- **IndexedDB는 localStorage로 부족할 때 써요.** 이력서 초안처럼 서버에 보내기 전 데이터를 잃지 않게 붙잡아 둘 때예요.
- **OPFS는 필요 없어요.** 원티드에는 큰 파일을 브라우저 안에서 다루는 기능이 없어요.

## 한눈에 보기

| 기술 | 원티드에 필요할까요? | 이유 |
| --- | --- | --- |
| Service Worker | ➕ PWA를 하면 같이 넣어요 | Web Push를 받으려면 필요해요. 오프라인 자체는 쓸 곳이 거의 없어요 |
| IndexedDB | ➕ localStorage로 부족할 때 써요 | 객체와 파일을 크게 담을 수 있어서, 잃으면 안 되는 초안에 맞아요 |
| OPFS | ❌ 필요 없어요 | 이력서와 포트폴리오는 서버에 올려야 의미가 있어요 |

## 어디서 동작하나요?

[MDN 호환성 데이터](https://github.com/mdn/browser-compat-data)(2026-11-02) 기준이에요. 숫자는 처음 지원한 버전이에요.

| 기술 | 크롬·엣지 데스크톱 | 크롬 안드로이드 | 사파리 macOS | 사파리 iOS | 파이어폭스 |
| --- | --- | --- | --- | --- | --- |
| Service Worker | 40+ | 40+ | 11.1+ | 11.3+ | 44+ |
| Cache Storage | 43+ | 43+ | 11.1+ | 11.3+ | 41+ |
| IndexedDB | 24+ | 25+ | 8+ | 8+ | 16+ |
| 저장 공간 확인 (`storage.estimate`) | 61+ | 61+ | 17+ | 17+ | 57+ |
| 지우지 말아 달라고 요청 (`storage.persist`) | 55+ | 55+ | 15.2+ | 15.2+ | 57+ |
| OPFS (`storage.getDirectory`) | 86+ | 109+ | 15.2+ | 15.2+ | 111+ |
| 메인 스레드에서 쓰기 (`createWritable`) | 86+ | 109+ | 26+ | 26+ | 111+ |
| 워커에서 빠르게 쓰기 (`createSyncAccessHandle`) | 102+ | 109+ | 15.2+ | 15.2+ | 111+ |

- 사파리는 26 전까지 메인 스레드에서 OPFS 파일을 쓸 수 없어서, 워커에서 `createSyncAccessHandle`로 써야 했어요.
- 사파리는 7일 동안 방문하지 않은 사이트의 저장 데이터를 지울 수 있어요([WebKit 블로그](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)).

## 직접 해보기

첫 화면에서 기능을 고르면, 화면마다 할 일이 하나씩 나와요.

| 기술 | 코드 | 해보는 방법 |
| --- | --- | --- |
| Service Worker | `public/sw.js`, `src/service-worker.tsx` | 인터넷이 끊겨도 열리게 하기 → "이 화면 오프라인용으로 담기" → DevTools Network 탭에서 "Offline"을 켜고 새로고침 |
| IndexedDB | `src/indexed-db.tsx` | 관심 공고 브라우저에 담기 → "관심 공고 하나 담기" → 새로고침해도 남아 있는지 확인 |
| OPFS | `src/opfs.tsx` | 브라우저 안에 파일 저장하기 → 메모를 고치고 "OPFS에 저장하기" → 새로고침해도 불러오는지 확인 |

처음 상태로 되돌리려면 DevTools → Application → Storage에서 "Clear site data"를 눌러요. Service Worker, 담아 둔 파일, IndexedDB, OPFS가 함께 지워져요.

## 기술별로 자세히

### Service Worker · ➕ PWA를 하면 같이 넣어요

- **무엇인가요:** 페이지와 네트워크 사이에 서는 작은 스크립트예요. 요청을 가로채서 담아 둔 응답을 주거나, 페이지가 닫혀 있어도 푸시를 받아요. 이 샘플은 네트워크를 먼저 쓰고, 끊기면 담아 둔 응답을 줘요.
- **문서:** [MDN · Service Worker API](https://developer.mozilla.org/docs/Web/API/Service_Worker_API) · [web.dev · 오프라인 쿡북](https://web.dev/articles/offline-cookbook) · [web.dev · Learn PWA: Service Worker](https://web.dev/learn/pwa/service-workers) · [MDN · Push API](https://developer.mozilla.org/docs/Web/API/Push_API)
- **얻을 수 있는 것:** `01`에서 해볼 만하다고 본 기업 대시보드 PWA에서, 앱이 닫혀 있을 때도 배지를 바꾸려면 Web Push가 필요해요. Web Push는 Service Worker가 받아요. 인터넷이 끊겼을 때 "연결이 끊겼어요" 안내 화면을 보여줄 수도 있어요.
- **한계:** 구직과 채용은 서버 데이터가 있어야 하는 일이라, 오프라인으로 쓸 수 있는 기능은 거의 없어요. 잘못 배포한 Service Worker는 사용자 브라우저에 남아 옛 화면을 계속 보여줄 수 있어서, 업데이트와 해제 방법을 먼저 정해야 해요.

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
