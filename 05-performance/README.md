# 05 · Performance

"빠르게 보이고, 바로 반응하고, 뒤로 가기가 즉시 되는" 화면을 숫자로 재고 직접 바꿔 봐요. LCP·INP·CLS, bfcache, Speculation Rules를 다뤄요.

```sh
# 숫자를 정확하게 보려면 빌드한 결과로 확인해요.
pnpm --filter 05-performance build
pnpm --filter 05-performance preview   # https://localhost:5105

# 코드를 고치면서 볼 때는
pnpm --filter 05-performance dev
```

## 결론부터 말할게요

- **Core Web Vitals(LCP·INP·CLS)는 공고 상세부터 재 볼 만해요.** 검색으로 처음 들어오는 사람이 많은 페이지라 첫인상이 이 숫자로 드러나요. 이미 RUM 도구를 쓰고 있다면 그 값을, 없다면 Next.js의 `useReportWebVitals`로 모으는 게 가장 가까운 길이에요.
- **bfcache는 막는 원인부터 없애 볼 만해요.** 따로 만들 기능은 없어요. 외부 페이지로 나갔다가 뒤로 돌아올 때 공고 화면이 기다림 없이 나와요.
- **Speculation Rules는 Next.js 화면 이동에는 필요 없어요.** 다음 "문서"를 미리 그리는 기능인데, Next.js는 문서를 새로 불러오지 않고 화면을 바꿔요.

## 한눈에 보기

| 기술 | 원티드에 필요할까요? | 이유 |
| --- | --- | --- |
| Core Web Vitals (LCP·INP·CLS) | ✅ 공고 상세부터 재 볼 만해요 | 실제 사용자 값을 모아야 어디부터 고칠지 정할 수 있어요 |
| bfcache | ✅ 막는 원인부터 없애 볼 만해요 | 뒤로·앞으로 이동이 생각보다 많고, 고칠 것만 고치면 돼요 |
| Speculation Rules | ❌ Next.js 화면 이동에는 필요 없어요 | Next.js `<Link>`는 문서를 새로 불러오지 않아요 |

## 어디서 동작하나요?

[MDN 호환성 데이터](https://github.com/mdn/browser-compat-data)(2026-11-02) 기준이에요. 숫자는 처음 지원한 버전이에요.

| 기술 | 크롬·엣지 데스크톱 | 크롬 안드로이드 | 사파리 macOS | 사파리 iOS | 파이어폭스 |
| --- | --- | --- | --- | --- | --- |
| LCP (`largest-contentful-paint`) | 77+ | 77+ | 26.2+ | 26.2+ | 122+ |
| INP (`event` · `interactionId`) | 96+ | 96+ | 26.2+ | 26.2+ | 144+ |
| CLS (`layout-shift`) | 77+ | 77+ | ❌ | ❌ | ❌ |
| bfcache로 돌아왔는지 (`pageshow` · `persisted`) | 4+ | 18+ | 5+ | 4+ | 11+ |
| 막힌 이유 (`notRestoredReasons`) | 125+ | 125+ | ❌ | ❌ | ❌ |
| 미리 받아 두기 (`prefetch`) | 110+ | 103+ | 🚩 26.2 | 🚩 26.2 | ❌ |
| 미리 그려 두기 (`prerender`) | 105+ | 103+ | ❌ | ❌ | ❌ |
| 미리 그렸는지 확인 (`document.prerendering`) | 108+ | 108+ | ❌ | ❌ | ❌ |

- CLS는 크롬 계열에서만 잴 수 있어요. 사파리는 26.2부터 LCP와 INP를 잴 수 있어요.
- 🚩 사파리는 설정에서 켜야 해요. 파이어폭스는 미리보기 버전에서만 prefetch를 해볼 수 있어요.
- 어떤 페이지를 bfcache에 얼려 둘지는 브라우저마다 조금씩 달라요. 크롬에서 막힌 이유를 고치면 다른 브라우저에서도 대부분 같이 나아져요.

## 직접 해보기

첫 화면에서 기능을 고르면, 화면마다 할 일이 하나씩 나와요.

| 기술 | 코드 | 해보는 방법 |
| --- | --- | --- |
| Core Web Vitals | `src/vitals.ts`, `src/web-vitals.tsx` | 웹 성능 점수 재기 → "느리게 반응하는 버튼 누르기" → 0.3초 멈춘 만큼 INP가, 조금 뒤 끼어든 배너만큼 CLS가 올라가요 |
| bfcache | `src/bfcache.tsx`, `other.html` | 뒤로 가기를 바로 보여주기 → "다른 페이지에 갔다가 돌아오기" → "원래 화면으로 돌아가기" → "이 화면을 연 시각"이 그대로면 얼려 둔 화면을 꺼낸 거예요 |
| Speculation Rules | `src/speculation.tsx`, `other.html`, `src/other.ts` | 다음 페이지 미리 그려 두기 → 몇 초 기다렸다가 "미리 그린 페이지로 이동하기" → 이동한 페이지가 미리 그려 뒀는지(`activationStart`) 알려줘요 |

- bfcache와 Speculation Rules는 다른 문서로 이동해야 보여서, 두 번째 페이지(`other.html`)를 같이 빌드해요(`vite.config.ts`의 `build.rolldownOptions.input`).
- 미리 그리기가 안 되고 "평범하게 불러온 페이지"라고 나오면 DevTools를 닫고 다시 해봐요. DevTools나 자동화 도구가 붙어 있으면 브라우저가 미리 그리지 않을 수 있어요.

## LCP·INP·CLS를 쉽게 말하면

구글이 "사용자가 느끼는 빠르기"를 세 숫자로 정리한 게 Core Web Vitals예요. 실제 사용자 값을 모아서 **75번째 백분위**로, 모바일과 데스크톱을 나눠서 봐요.

| 지표 | 쉽게 말하면 | 좋아요 | 나빠요 |
| --- | --- | --- | --- |
| LCP · 첫 화면이 보이기까지 | 가장 큰 이미지나 글 덩어리가 그려진 시각. 식당에서 메인 요리가 나오기까지 | 2.5초 이하 | 4초 초과 |
| INP · 눌렀을 때 반응하기까지 | 클릭·탭·키 입력부터 바뀐 화면이 보이기까지 걸린 시간 중 가장 느린 값 | 200ms 이하 | 500ms 초과 |
| CLS · 화면이 흔들린 정도 | 읽던 글이 갑자기 밀려서 엉뚱한 걸 누르게 되는 경험을 숫자로 만든 것 | 0.1 이하 | 0.25 초과 |

- **LCP**는 사용자가 누르거나 스크롤하면 그 뒤로는 더 재지 않아요.
- **INP**는 세 가지 시간을 더해요. 브라우저가 다른 일을 하느라 클릭을 바로 못 받은 시간, 클릭 처리 코드가 돈 시간, 처리가 끝나고 바뀐 화면이 나오기까지의 시간이에요. 마우스를 올리거나 스크롤하는 건 세지 않아요.
- **CLS**는 1초 안에 이어진 흔들림을 한 묶음(최대 5초)으로 더하고, 가장 큰 묶음의 점수를 써요. 내가 누른 직후 0.5초 안의 움직임은 예상한 것이라 빼요. 그래서 이 샘플은 배너를 누른 즉시가 아니라 0.8초 뒤에 끼워 넣어요.

## bfcache를 쉽게 말하면

페이지를 떠날 때 브라우저가 그 페이지를 **통째로 얼려 뒀다가**, 뒤로 가기를 누르면 그대로 꺼내 주는 기능이에요. 처음부터 다시 받지 않으니 기다림이 없어요. 크롬 사용 데이터로는 데스크톱 이동 10번 중 1번, 모바일 5번 중 1번이 뒤로·앞으로 가기예요.

이런 게 있으면 얼려 두지 못해요.

- **`unload` 이벤트**: 쓰지 않아요. 떠날 때 할 일은 `pagehide`로 옮겨요.
- **`Cache-Control: no-store`**: 로그인한 페이지에 자주 붙어요. 이 헤더가 있으면 얼려 두지 않을 수 있어요.
- **열려 있는 연결**: WebSocket·WebRTC, 진행 중인 `fetch`나 IndexedDB 작업이 있으면 브라우저에 따라 얼려 두지 않아요.
- **`window.opener`**: 다른 창이 이 페이지를 붙잡고 있으면 안전하게 얼릴 수 없어요.

크롬은 막힌 이유를 `notRestoredReasons`로 알려줘요. DevTools → Application → Back/forward cache에서 직접 시험해 볼 수도 있어요.

## Speculation Rules를 쉽게 말하면

사용자가 누를 것 같은 다음 페이지를 **미리 준비**해 두는 규칙이에요. HTML에 JSON 몇 줄만 넣으면 브라우저가 알아서 해요.

```html
<script type="speculationrules">
{ "prerender": [{ "urls": ["/other.html?from=speculation"] }] }
</script>
```

- **prefetch(미리 받아 두기)**: 다음 페이지의 HTML만 받아 둬요. 그리지는 않아요.
- **prerender(미리 그려 두기)**: 보이지 않는 탭에서 페이지를 통째로 그려 둬요. 이동하면 바로 바꿔 끼워서 기다림이 없어요.
- **언제 준비할지(eagerness)**: `immediate`는 규칙을 보자마자, `eager`·`moderate`는 링크에 마우스를 올리면, `conservative`는 누르기 시작할 때 준비해요. 주소 목록(`urls`) 규칙은 `immediate`, 문서 안 링크 규칙은 `conservative`가 기본값이에요.
- **조심할 것**: 데이터와 메모리를 더 써요. 미리 그리는 동안에도 페이지 코드가 돌아서, 분석 도구가 페이지뷰를 먼저 세지 않게 `document.prerendering`을 보고 실제로 보여진 뒤에 보내야 해요. 데이터 절약 모드, 배터리 절약 모드, 메모리가 부족할 때는 브라우저가 준비하지 않아요.

## 기술별로 자세히

### Core Web Vitals · ✅ 공고 상세부터 재 볼 만해요

- **무엇인가요:** `PerformanceObserver`로 `largest-contentful-paint`, `event`, `layout-shift` 기록을 받아서 LCP·INP·CLS를 계산해요. 이 샘플은 직접 계산하지만, 실제 서비스라면 web-vitals 라이브러리나 RUM 도구를 써요.
- **문서:** [web.dev · Core Web Vitals](https://web.dev/articles/vitals) · [web.dev · LCP](https://web.dev/articles/lcp) · [web.dev · INP](https://web.dev/articles/inp) · [web.dev · CLS](https://web.dev/articles/cls) · [Google 검색 센터 · Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals) · [Next.js · useReportWebVitals](https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals)
- **기대할 수 있는 것:** 공고 상세는 검색으로 처음 들어오는 사람이 많은 페이지라, 첫인상이 이 세 숫자로 드러나요. 구글도 검색에서 좋은 Core Web Vitals를 갖추라고 강하게 권해요. 실제 사용자 값을 모아야 어디부터 고칠지 정할 수 있어요.
- **한계:** 이 샘플에서 보는 숫자는 내 브라우저 한 번의 값이에요. 실제로는 많은 방문을 모아 75번째 백분위로, 모바일과 데스크톱을 나눠 봐야 해요. CLS는 크롬 계열에서만 잴 수 있어서 사파리 사용자의 흔들림은 보이지 않아요. 이미 RUM 도구를 쓰고 있다면 그 값을 쓰고, 없다면 Next.js의 `useReportWebVitals`로 모으는 게 가장 가까운 길이에요.
- **이렇게 확인해요:** 공고 목록·공고 상세·지원하기처럼 페이지 종류별로, 세 지표의 75번째 백분위를 모바일·데스크톱으로 나눠 보고 나쁜 것부터 고쳐요.

### bfcache · ✅ 막는 원인부터 없애 볼 만해요

- **무엇인가요:** 뒤로·앞으로 갈 때 얼려 둔 페이지를 그대로 꺼내는 브라우저 기능이에요. `pageshow` 이벤트의 `persisted`가 `true`면 bfcache로 돌아온 거예요.
- **문서:** [web.dev · bfcache](https://web.dev/articles/bfcache) · [Chrome for Developers · notRestoredReasons](https://developer.chrome.com/docs/web-platform/bfcache-notrestoredreasons) · [MDN · pageshow 이벤트](https://developer.mozilla.org/docs/Web/API/Window/pageshow_event) · [MDN · notRestoredReasons](https://developer.mozilla.org/docs/Web/API/PerformanceNavigationTiming/notRestoredReasons)
- **기대할 수 있는 것:** 회사 홈페이지나 외부 지원 페이지로 나갔다가 뒤로 돌아올 때, 공고 화면이 기다림 없이 그대로 나와요. 뒤로·앞으로 이동이 생각보다 많아서, 막는 원인만 없애도 효과가 커요.
- **한계:** Next.js 안에서 화면을 오가는 건 문서가 그대로라 bfcache와 상관없어요. 로그인한 페이지에 자주 붙는 `Cache-Control: no-store`를 걷어내려면, 뒤로 가기로 개인정보가 다시 보여도 괜찮은지 먼저 따져야 해요. 막힌 이유를 알려주는 `notRestoredReasons`는 크롬 계열에서만 돼요.
- **이렇게 확인해요:** `notRestoredReasons`를 모아서 가장 많이 나온 원인부터 없애고, `pageshow`의 `persisted`로 bfcache로 돌아온 비율이 늘었는지 봐요.

### Speculation Rules · ❌ Next.js 화면 이동에는 필요 없어요

- **무엇인가요:** `<script type="speculationrules">`에 적은 주소를 브라우저가 미리 받아 두거나(prefetch) 그려 둬요(prerender). 미리 그린 페이지가 보여지면 `activationStart`에 그리기 시작부터 보여진 순간까지의 시간이 남아요.
- **문서:** [MDN · Speculation Rules API](https://developer.mozilla.org/docs/Web/API/Speculation_Rules_API) · [MDN · `<script type="speculationrules">`](https://developer.mozilla.org/docs/Web/HTML/Reference/Elements/script/type/speculationrules) · [Chrome for Developers · 페이지 미리 그리기](https://developer.chrome.com/docs/web-platform/prerender-pages) · [MDN · activationStart](https://developer.mozilla.org/docs/Web/API/PerformanceNavigationTiming/activationStart)
- **필요 없는 이유:** Speculation Rules는 다음 "문서"를 미리 받아 두거나 그려 두는 기능이에요. Next.js의 `<Link>`는 문서를 새로 불러오지 않고 JavaScript로 화면을 바꾸고, 다음 화면 데이터도 이미 미리 받아 둬요. 그래서 원티드 안의 화면 이동에는 끼어들 자리가 없어요.
- **다시 볼 때:** 서로 다른 앱을 오가는 것처럼 문서를 새로 불러오는 이동이 잦은 곳이 생기면 다시 봐요. 그때도 미리 그린 페이지가 페이지뷰를 먼저 세지 않게 실제로 보여진 뒤에 보내야 하고, 크롬 계열에서만 동작해요.

## 알아두면 좋은 것

- INP는 브라우저가 실제 입력으로 인정하는 클릭(trusted event)만 재요. 개발자 도구 콘솔에서 `button.click()`을 불러도 INP는 바뀌지 않아요.
- 이 샘플의 INP는 상호작용 중 가장 느린 값이에요. 원래 정의는 상호작용이 50번을 넘으면 50번마다 가장 느린 1개를 빼요.
- 아이콘 파일이 없으면 브라우저가 `/favicon.ico`를 요청해서 404가 나요. 그래서 두 페이지 모두 `<link rel="icon" href="data:,">`로 빈 아이콘을 둬요.
- 화면은 [Tailwind CSS](https://tailwindcss.com) v4로 만들었어요. 화면 틀과 판단 화면은 `02`·`03`과 같이 `../shared/`를 써요.
- "원티드에 필요할까요?", "어디서 동작하나요?", 참고 문서는 앱의 기능 화면 맨 아래에도 있어요. 내용은 `src/report.tsx`에 모여 있으니, 고칠 때 이 README와 함께 고쳐요.
