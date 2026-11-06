# 04 · Multi-tab

탭을 여러 개 열어도 하나처럼 움직이게 해 봐요. 원티드처럼 **httpOnly 쿠키로 로그인하는 서비스**를 기준으로, BroadcastChannel로 로그아웃 뒤 다른 탭 화면을 맞추고 Web Locks로 한 번에 한 탭만 일하게 해요.

```sh
pnpm --filter 04-multi-tab dev   # https://localhost:5104
```

## 결론부터 말할게요

- **원티드에서 해볼 만한 건 BroadcastChannel이에요.** 원티드는 로그아웃 응답이 httpOnly 쿠키를 지워서, 서버 기준으로는 모든 탭이 한 번에 로그아웃돼요. 남는 건 다른 탭의 화면이에요. 인증 서버에서 redirect로 돌아온 페이지가 BroadcastChannel로 알리면, 다른 탭이 서버에 다시 물어보고 바로 로그아웃 화면으로 바뀌어요.
- **그 전에 401 공통 처리와 "탭이 다시 보일 때 세션 확인"을 먼저 갖춰요.** BroadcastChannel은 같은 주소의 탭끼리만 통해서, 다른 서브도메인 탭은 이 두 가지로 맞춰야 해요.
- **Web Locks는 여러 탭이 같은 일을 겹쳐 할 때만 써요.** 토큰 갱신은 쿠키로 로그인하면 서버가 `Set-Cookie`로 처리해서 대부분 필요 없어요. 탭마다 알림 폴링이나 실시간 연결을 따로 연다면, 한 탭만 연결하게 할 때 써 볼 만해요.

## 한눈에 보기

| 기술 | 원티드에 필요할까요? | 이유 |
| --- | --- | --- |
| BroadcastChannel | ✅ 로그아웃 뒤 다른 탭 화면을 맞출 때 써요 | 쿠키는 서버가 지웠는데 다른 탭 화면은 남아요. 몇 줄로 바로 맞춰요 |
| Web Locks API | ➕ 여러 탭이 같은 일을 겹쳐 할 때만 써요 | 토큰 갱신은 대부분 필요 없어요. 탭마다 여는 폴링·실시간 연결을 한 탭으로 모을 때 써요 |

## 어디서 동작하나요?

[MDN 호환성 데이터](https://github.com/mdn/browser-compat-data)(2026-11-02) 기준이에요. 숫자는 처음 지원한 버전이에요.

| 기술 | 크롬·엣지 데스크톱 | 크롬 안드로이드 | 사파리 macOS | 사파리 iOS | 파이어폭스 |
| --- | --- | --- | --- | --- | --- |
| BroadcastChannel | 54+ | 54+ | 15.4+ | 15.4+ | 38+ |
| 탭이 다시 보일 때 (`visibilitychange`) | 62+ | 62+ | 14.1+ | 14.5+ | 56+ |
| Web Locks (`navigator.locks`) | 69+ | 69+ | 15.4+ | 15.4+ | 96+ |
| 자물쇠 상태 보기 (`locks.query`) | 69+ | 69+ | 15.4+ | 15.4+ | 96+ |

- 모두 사파리 15.4(2022년)부터 모든 주요 브라우저가 지원해요.

## 직접 해보기

첫 화면에서 기능을 고르면, 화면마다 할 일이 하나씩 나와요. 두 기능 모두 **탭을 두 개 이상 열어야** 차이가 보여요. 화면마다 "이 화면을 새 탭으로 열기" 링크가 있어요.

| 기술 | 코드 | 해보는 방법 |
| --- | --- | --- |
| BroadcastChannel | `src/broadcast-channel.tsx`, `mock-auth.ts` | 로그아웃을 모든 탭에 알리기 → 새 탭을 하나 더 열고, 한쪽에서 "로그인하기" → 다른 탭도 로그인 화면으로 바뀌어요 → 이번엔 "로그아웃하기" → 다른 탭도 로그아웃 화면으로 바뀌어요 |
| Web Locks | `src/web-locks.tsx` | 토큰 갱신을 한 탭만 하게 하기 → 새 탭을 하나 더 열고, 두 탭에서 3초 안에 차례로 "토큰 갱신하기" → 토큰 숫자는 한 번만 올라가요 |

- 로그인·로그아웃은 Vite 서버에 붙인 가짜 인증 서버(`mock-auth.ts`)가 처리해요. 원티드처럼 `GET /v1/auth/login` 또는 `/v1/auth/logout`에 `redirect_url`을 붙여 이동하면, 응답 헤더로 httpOnly 쿠키를 만들거나 지우고 돌려보내요. `/v1/me`는 쿠키가 없으면 401이에요. dev와 preview 모두에서 동작해요.
- 진짜 원티드는 인증 서버가 다른 서브도메인에 있고, 쿠키를 서브도메인끼리 나눠 써요. 이 샘플은 모두 같은 주소(`https://localhost:5104`)에 있어요.
- 탭마다 이름(예: `탭(EBFB)`)이 붙어서, 어느 탭이 무엇을 했는지 볼 수 있어요. sessionStorage에 둬서, 인증 서버에 다녀와도 같은 탭이면 이름이 그대로예요.
- Web Locks 화면의 토큰 갱신은 흉내만 내요. 일부러 3초가 걸리게 해서, 두 탭이 겹치는 상황을 손으로 만들 수 있게 했어요.

## 탭이 여러 개면 왜 문제가 생겨요?

같은 내용이 각 기능 화면 아래쪽에도 있어요.

### 쿠키로 로그아웃해도 다른 탭 화면은 남아요

세션 쿠키는 같은 브라우저의 모든 탭이 같이 써요. 그래서 로그아웃 응답이 쿠키를 지우는 순간, 서버 기준으로는 모든 탭이 이미 로그아웃이에요. 그런데 다른 탭의 **화면**(이름, 프로필 메뉴, 작성 중인 글)은 그대로 남아요. 다음 요청에서 401을 받고 나서야 이상하게 동작해요. BroadcastChannel은 이 남은 화면을 바로 맞춰요.

#### 원티드 로그아웃은 이렇게 흘러가요

1. 로그아웃 버튼을 누르면 인증 서버의 로그아웃 주소(`/v1/auth/logout?redirect_url=…`)로 이동해요.
2. 서버가 응답 헤더(`Set-Cookie`)로 세션 쿠키를 만료시키고, `redirect_url`로 돌려보내요.
3. 돌아온 페이지가 "방금 로그아웃됐어요"를 BroadcastChannel로 알려요.
4. 다른 탭은 소식을 받으면 서버에 세션을 다시 물어보고(401), 로그아웃 화면으로 바꿔요.

```js
const channel = new BroadcastChannel('auth')

// 1. 로그아웃 버튼: 인증 서버로 이동해요. 쿠키는 서버가 지워요.
location.assign(
  '/v1/auth/logout?redirect_url=' +
    encodeURIComponent(location.origin + '/?auth=logout')
)

// 2. redirect로 돌아온 페이지: 쿠키가 지워진 뒤라 이때 알려요.
if (new URLSearchParams(location.search).get('auth') === 'logout') {
  channel.postMessage({ type: 'logout' })
}

// 3. 다른 탭: 소식만 믿지 않고 서버에 다시 물어봐요.
channel.onmessage = async () => {
  const response = await fetch('/v1/me')
  if (response.status === 401) showLoggedOut()
}
```

"방금 로그아웃됐다"는 걸 아는 방법은 두 가지예요.

- **`redirect_url`에 표시를 붙여요.** 예: `redirect_url=https://nextweek.wanted.co.kr/?auth=logout`. 인증 서버가 `redirect_url`에 쿼리를 허용하는지 먼저 확인해요.
- **돌아온 페이지가 세션을 확인해요.** `/v1/me`가 401인데 직전까지 로그인 상태였다면 로그아웃으로 봐요.

#### 왜 돌아온 뒤에 알려요?

- 로그아웃 주소로 가기 전에는 쿠키가 아직 살아 있어요. 그때 알리면, 다른 탭이 새로고침했을 때 다시 로그인된 화면이 나올 수 있어요.
- 로그아웃이 실패하면, 실제로는 로그인 상태인데 다른 탭만 로그아웃된 것처럼 보여요.
- 그래서 받는 탭도 소식만 믿지 않고 서버에 다시 물어봐요. 소식은 "한번 확인해 봐"라는 신호예요.

#### 먼저 갖출 안전장치

- **API가 401을 주면 한 곳에서 처리해요.** 어느 탭이든 다음 요청에서 로그인 화면으로 보내요.
- **탭이 다시 보일 때(`visibilitychange`) 세션을 물어봐요.** 소식을 못 받는 다른 서브도메인 탭도 이걸로 맞춰요. 이 샘플의 화면도 그렇게 해요.
- BroadcastChannel은 이 둘 위에 얹어서, 같은 주소의 탭을 기다림 없이 바로 맞추는 데 써요.

#### 알아둘 것

- 같은 출처(예: `nextweek.wanted.co.kr`)의 탭끼리만 통해요. 쿠키가 `.wanted.co.kr`로 공유돼 다른 서브도메인 탭도 서버 기준으로는 로그아웃되지만, 소식은 받지 못해요.
- httpOnly 쿠키는 `document.cookie`로도, 쿠키가 바뀔 때 알려주는 Cookie Store API로도 보이지 않아요([명세](https://cookiestore.spec.whatwg.org/): 스크립트에는 http-only가 아닌 쿠키만 보여요). 쿠키 변화를 직접 감지할 수는 없어요.
- 보낸 탭 자신은 메시지를 받지 않아요. 다른 기기나 네이티브 앱에도 가지 않아요.

### Web Locks는 어떤 문제를 풀어요?

같은 브라우저, 같은 출처의 탭과 워커가 함께 쓰는 **이름 붙은 자물쇠**예요. 탭 하나 안에서는 JavaScript가 한 줄씩 실행돼서 "동시에" 걱정이 적어요. 그런데 탭이 여러 개면 탭마다 따로 실행되면서, **같은 저장소(localStorage, IndexedDB)와 같은 서버 계정**을 진짜로 동시에 건드려요. Web Locks는 "이 일은 한 번에 한 탭만" 하게 해요.

#### 예전에는 이렇게 막았어요

localStorage에 "작업 중" 표시를 적고, 표시가 있으면 기다렸어요. 그런데 두 가지가 안 됐어요.

1. **동시에 확인하면 둘 다 통과해요.** 두 탭이 거의 같은 순간 "표시 없네?" 하고 읽으면, 둘 다 표시를 적고 둘 다 일해요. HTML 명세에 탭끼리 localStorage를 막는 장치(storage mutex)가 있었지만, 브라우저들이 구현하지 않아서 빠졌어요.
2. **잡은 탭이 죽으면 표시가 남아요.** 표시를 적은 탭이 닫히거나 멈추면 아무도 일을 못 해요. 그래서 "10초 지나면 무시" 같은 땜질을 덧대야 했어요.

#### Web Locks는 브라우저가 직접 맡아요

- 자물쇠는 한 번에 한 탭만 잡아요. 확인과 잡기가 한 번에 일어나요.
- 잡은 함수가 끝나면 저절로 풀려요.
- 잡은 탭이 닫히거나 멈춰도 저절로 풀려요. 다른 탭이 영원히 기다리지 않아요.
- 기다리는 탭은 줄 선 순서대로 받아요.

[명세 설명서](https://github.com/w3c/web-locks/blob/main/EXPLAINER.md)가 드는 예도 같아요. 두 탭에서 연 문서를 한 탭만 고치고 저장하기, 한 탭(primary tab)만 동기화하기, IndexedDB의 "읽기는 여럿, 쓰기는 하나" 트랜잭션 방식을 다른 일에도 쓰기예요.

```js
await navigator.locks.request('token-refresh', async () => {
  // 이 안은 한 번에 한 탭만 들어와요. 다른 탭은 여기서 기다려요.
  await refreshToken()
})
// 함수(Promise)가 끝나면 자물쇠가 저절로 풀려요.
```

| 옵션 | 하는 일 | 언제 써요? |
| --- | --- | --- |
| `ifAvailable: true` | 누가 잡고 있으면 기다리지 않고 바로 넘어가요 (`lock`이 `null`) | "누가 하고 있으면 나는 안 해도 돼"일 때 |
| `mode: 'shared'` | 여러 탭이 같이 잡아요. `exclusive` 자물쇠와는 서로 막아요 | 읽기는 여럿이, 쓰기는 하나만 할 때 |
| `signal` | 기다리기를 그만둬요 (예: `AbortSignal.timeout(5000)`) | 기다리는 시간에 제한을 둘 때 |
| `steal: true` | 잡고 있는 탭에게서 뺏어요 | 거의 안 써요 |

`navigator.locks.query()`로 지금 누가 잡고 있고 몇 탭이 기다리는지 볼 수 있어요.

#### 쓰는 곳 1 · 토큰 갱신 (Web Locks 화면)

로그인을 오래 유지하는 서비스는 짧게 쓰는 토큰(access token)과, 그걸 다시 받는 데 쓰는 토큰(refresh token)을 함께 써요. refresh token을 한 번만 받아주는 서버에서 두 탭이 동시에 갱신하면 문제가 생겨요.

**자물쇠가 없으면**

1. 탭 A와 탭 B가 동시에 "토큰이 만료됐네" 하고 알아채요.
2. 둘 다 같은 refresh token으로 갱신을 요청해요.
3. 서버는 먼저 온 A에게 새 토큰을 주고, 이미 쓴 refresh token을 다시 보낸 B는 거절해요.
4. B는 로그아웃되고, 사용자는 이유를 몰라요.

**자물쇠를 걸면**

1. 탭 A가 `token-refresh` 자물쇠를 먼저 잡고 갱신해요.
2. 탭 B는 자물쇠가 풀릴 때까지 기다려요.
3. 자물쇠를 잡은 B는 토큰이 이미 바뀐 걸 보고, 갱신하지 않고 새 토큰을 그대로 써요.

```js
const before = readToken()

await navigator.locks.request('token-refresh', async () => {
  // 기다리는 동안 다른 탭이 이미 갱신했으면 그대로 써요
  if (readToken() !== before) return
  await refreshToken()
})
```

**원티드처럼 쿠키로 로그인하면** 세션 갱신도 서버가 응답 헤더(`Set-Cookie`)로 처리해서, 이 문제가 잘 생기지 않아요. 브라우저 JavaScript가 갱신 API를 직접 부르고, 서버가 refresh token을 한 번만 받아주는 경우에만 생겨요. Web Locks 화면은 그 경우를 흉내 내요.

#### 쓰는 곳 2 · 한 탭만 서버와 연결하기 (리더 탭)

탭 10개가 각자 30초마다 알림을 물어보면 서버 요청도 10배예요. 한 탭(리더)만 서버와 연결하고, 받은 걸 BroadcastChannel로 다른 탭에 나눠 주면 돼요.

```js
// 끝나지 않는 Promise로 자물쇠를 계속 잡고 있으면, 그 탭이 리더예요.
navigator.locks.request('notification-leader', () => {
  startPolling() // 리더만 서버에 물어봐요
  return new Promise(() => {}) // 탭이 닫힐 때까지 놓지 않아요
})
```

리더 탭이 닫히면 자물쇠가 풀리고, 기다리던 다음 탭이 자동으로 리더가 돼요. 살아 있는지 확인하는 신호(하트비트)도, 타임아웃도 필요 없어요. 원티드가 탭마다 알림 폴링이나 실시간 연결을 따로 연다면 **토큰 갱신보다 이쪽이 더 쓸 만해요.**

#### 쓰는 곳 3 · 한 탭만 하면 되는 일

- **대기열 비우기:** 보내지 못한 분석 이벤트를 IndexedDB에 모아 뒀다가 보낼 때, 여러 탭이 동시에 비우면 같은 이벤트를 두 번 보내요. IndexedDB 트랜잭션은 중간에 `await fetch()`가 끼면 지켜 주지 못해서, "읽기 → 보내기 → 지우기" 전체를 자물쇠로 감싸요.
- **정리 작업:** 오래된 캐시 지우기, 저장소 데이터 옮기기처럼 탭마다 할 필요 없는 일은 `ifAvailable`로 건너뛰어요.

```js
// 다른 탭이 이미 하고 있으면 기다리지 않고 건너뛰어요.
await navigator.locks.request('cleanup', { ifAvailable: true }, async (lock) => {
  if (!lock) return
  await deleteOldCache()
})
```

#### 이럴 땐 안 써도 돼요

- **탭 하나 안에서 중복 요청 막기:** 버튼 연타나 같은 API 동시 호출은, 진행 중인 Promise 하나를 같이 쓰면 충분해요.
- **다른 기기, 다른 브라우저, 다른 서브도메인 사이:** 자물쇠는 같은 브라우저의 같은 출처 안에서만 통해요. 이건 서버가 막아요. 같은 요청을 두 번 받아도 한 번만 처리하는 Idempotency-Key가 그 예예요.
- **서버에서 풀 수 있을 때:** 서버가 직전 refresh token을 몇 초 더 받아주면(유예 시간) 토큰 갱신이 겹치는 문제는 생기지 않아요. 예를 들어 Auth0는 이 설정을 [Reuse Interval](https://auth0.com/docs/secure/tokens/refresh-tokens/configure-refresh-token-rotation)이라고 부르고, 동시 요청 문제를 막으려고 둔다고 설명해요.

#### 조심할 것

- 함수가 끝나지 않으면 다른 탭은 계속 기다려요. 리더처럼 일부러 잡는 게 아니면 `signal`로 시간 제한을 둬요.
- 자물쇠 두 개를 탭마다 다른 순서로 잡으면 서로를 영원히 기다려요(교착). 한 번에 하나만 잡거나 잡는 순서를 정해요.

#### 원티드 기준으로 다시 보면

| 쓰는 곳 | 판단 |
| --- | --- |
| 토큰 갱신 | 쿠키 기반이라 대부분 필요 없어요 |
| 리더 탭 (알림, 실시간 연결) | 탭마다 연결을 연다면 써 볼 만해요. 사용자당 탭 수와 겹치는 폴링 요청 수를 먼저 재요 |
| 대기열 비우기, 정리 작업 | 그런 기능이 생기면 써요 |

## 기술별로 자세히

### BroadcastChannel · ✅ 로그아웃 뒤 다른 탭 화면을 맞출 때 써요

- **무엇인가요:** 같은 이름의 채널을 연 탭(과 iframe, 워커)끼리 메시지를 주고받는 API예요. `postMessage`로 보내고 `message` 이벤트로 받아요.
- **문서:** [MDN · Broadcast Channel API](https://developer.mozilla.org/docs/Web/API/Broadcast_Channel_API) · [MDN · Set-Cookie (HttpOnly)](https://developer.mozilla.org/docs/Web/HTTP/Reference/Headers/Set-Cookie) · [MDN · visibilitychange 이벤트](https://developer.mozilla.org/docs/Web/API/Document/visibilitychange_event) · [OWASP · 열린 리다이렉트 막기](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html) · [Chrome for Developers · BroadcastChannel](https://developer.chrome.com/blog/broadcastchannel)
- **기대할 수 있는 것:** 원티드는 httpOnly 쿠키로 로그인하고, 로그아웃 응답이 쿠키를 지워요. 서버 기준으로는 모든 탭이 한 번에 로그아웃되지만, 다른 탭 화면은 그대로 남아요. redirect로 돌아온 페이지가 BroadcastChannel로 알리면, 같은 주소의 다른 탭이 서버에 다시 물어보고 바로 로그아웃 화면으로 바뀌어요. 몇 줄이면 되고 모든 주요 브라우저가 지원해요.
- **한계:** 같은 출처(예: `nextweek.wanted.co.kr`)의 탭끼리만 통해요. 다른 서브도메인 탭, 다른 기기, 네이티브 앱에는 가지 않아요. 그래서 401 공통 처리와 탭이 다시 보일 때 세션 확인을 먼저 갖추고, BroadcastChannel은 그 위에 얹어요. `redirect_url`에 표시(`?auth=logout`)를 붙이려면 인증 서버가 그 주소를 허용하는지 먼저 확인해요.
- **이렇게 확인해요:** 로그아웃한 뒤 다른 탭에서 401 오류가 나는 횟수가 줄어드는지 봐요.

### Web Locks API · ➕ 여러 탭이 같은 일을 겹쳐 할 때만 써요

- **무엇인가요:** 이름을 붙인 자물쇠를 같은 출처의 탭과 워커가 함께 써요. `navigator.locks.request(이름, 할 일)`로 자물쇠를 잡고, 할 일이 끝나거나 탭이 닫히면 저절로 풀려요. 다른 탭은 그동안 기다려요.
- **문서:** [MDN · Web Locks API](https://developer.mozilla.org/docs/Web/API/Web_Locks_API) · [MDN · LockManager.request() (옵션)](https://developer.mozilla.org/docs/Web/API/LockManager/request) · [MDN · LockManager.query()](https://developer.mozilla.org/docs/Web/API/LockManager/query) · [W3C · Web Locks 설명서](https://github.com/w3c/web-locks/blob/main/EXPLAINER.md) · [Auth0 · Refresh token rotation 설정(유예 시간)](https://auth0.com/docs/secure/tokens/refresh-tokens/configure-refresh-token-rotation) · [IETF · OAuth 2.0 보안 모범 사례 (RFC 9700)](https://datatracker.ietf.org/doc/html/rfc9700)
- **얻을 수 있는 것:** 탭마다 알림 폴링이나 실시간 연결을 따로 연다면, 한 탭(리더)만 서버와 연결하고 다른 탭은 BroadcastChannel로 나눠 받게 할 수 있어요. 탭 수만큼 늘던 요청이 하나로 줄어요. 토큰 갱신은 원티드처럼 쿠키로 로그인하면 서버가 `Set-Cookie`로 처리해서 대부분 필요 없어요. 브라우저가 갱신 API를 직접 부르고 서버가 refresh token을 한 번만 받아줄 때만 필요해요.
- **한계:** 같은 브라우저, 같은 출처의 탭끼리만 막아요. 다른 기기나 다른 서브도메인 사이는 서버가 막아야 해요(refresh token 유예 시간, Idempotency-Key). 탭 하나 안의 중복 요청은 진행 중인 Promise를 같이 쓰면 충분해요.
- **이렇게 확인해요:** 사용자당 열린 탭 수와, 탭마다 겹쳐 나가는 폴링 요청 수를 먼저 재요. 겹치는 요청이 적으면 넣지 않아도 돼요.
- **다시 볼 때:** 탭을 여러 개 띄운 사용자에게서 갑작스러운 로그아웃이 보고되면, 원인이 토큰 갱신 경쟁인지 먼저 확인해요.

## 알아두면 좋은 것

- 로그인 상태는 서버(`/v1/me`)에 물어서 정해요. httpOnly 쿠키는 JavaScript로 읽을 수 없어서, 물어보는 수밖에 없어요. 화면의 "JavaScript로 보이나요?" 줄에서 직접 확인할 수 있어요.
- 가짜 인증 서버는 `redirect_url`을 같은 주소로만 허용해요. 아무 주소로나 돌려보내면 피싱에 쓰일 수 있어서예요(열린 리다이렉트). 다른 주소를 넣으면 400을 돌려줘요.
- HTTPS로 띄운 Vite 서버는 HTTP/2로 응답해요. HTTP/2 요청에는 `Host` 헤더 대신 `:authority`가 와서, `mock-auth.ts`는 둘 다 읽어요.
- 돌아온 주소에 붙은 표시(`?auth=logout`)는 바로 지워요. 그래야 새로고침해도 다른 탭에 다시 알리지 않아요.
- Web Locks 화면의 토큰은 localStorage에 저장해요. 다른 탭이 토큰을 바꾸면 `storage` 이벤트로 화면을 바꿔요. 자물쇠는 바뀔 때 오는 이벤트가 없어서, 0.5초마다 `locks.query()`로 상태를 물어봐요. `locks.query()`는 누가 잡았는지 알려주지 않아서, 잡은 탭이 자기 이름을 적어 둬요.
- 처음 상태로 되돌리려면 DevTools → Application → Storage에서 "Clear site data"를 눌러요. 로그인 쿠키도 함께 지워져요.
- 화면은 [Tailwind CSS](https://tailwindcss.com) v4로 만들었어요. 화면 틀과 판단 화면은 다른 샘플과 같이 `../shared/`를 써요.
- "원티드에 필요할까요?", "어디서 동작하나요?", 참고 문서는 앱의 기능 화면 맨 아래에도 있어요. 내용은 `src/report.tsx`에 모여 있으니, 고칠 때 이 README와 함께 고쳐요.
