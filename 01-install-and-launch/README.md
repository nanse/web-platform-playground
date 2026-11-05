# 01 · Install & Launch

기술 지도 "1. 앱처럼 설치하고 실행하기"의 샘플이에요. 모두 manifest에 선언하는 "설치된 앱의 능력"이라서 PWA 하나에 함께 담았어요.
Isolated Web Apps와 Direct Sockets는 실행 조건이 달라서 [`../01-isolated-web-app`](../01-isolated-web-app)에 따로 있어요.

```sh
pnpm --filter 01-install-and-launch dev   # https://localhost:5101
```

## 결론부터 말할게요

- **원티드에서 해볼 만한 건 하나예요.** 기업 대시보드를 데스크톱 앱으로 설치할 수 있게 하고, 확인할 지원자 수를 앱 아이콘 배지로 보여주는 거예요.
- **구직자 쪽은 필요 없어요.** 모바일에는 이미 네이티브 앱이 있고 같은 일을 더 잘해요. 구직은 몇 주 집중하고 끝나는 일이라 데스크톱에 앱을 설치해 둘 이유도 약해요.
- **나머지 기술은 지금은 필요 없어요.** 대부분 크롬·엣지 데스크톱에서만, 그것도 앱을 설치한 사람에게만 동작해서 닿는 사용자가 적어요.
- 원티드 홈페이지(wanted.co.kr) HTML에는 아직 manifest가 없어서, 지금은 설치할 수 있는 PWA가 아니에요(2026-11-05 확인). 무엇을 하든 PWA 기본기가 먼저예요.

## 한눈에 보기

| 기술 | 원티드에 필요할까요? | 이유 |
| --- | --- | --- |
| PWA 기본기 | ✅ 기업 대시보드에서 해볼 만해요 | 매일 여는 업무 도구라 Dock·작업 표시줄에 둘 의미가 있어요 |
| Badging | ✅ PWA와 함께 해볼 만해요 | 창을 열지 않아도 확인할 지원자가 있는지 알 수 있어요 |
| Launch Handler | ➕ PWA를 하면 같이 넣어요 | manifest 한 줄이라 비용이 거의 없어요. 혼자서는 효과가 작아요 |
| Web Install API, `<install>` | ❌ 필요 없어요 | 아직 플래그를 켜야 동작하고, 앱 하나를 설치하는 건 기본기로 충분해요 |
| Window Controls Overlay, `window-drag` | ❌ 필요 없어요 | 타이틀바 자리를 쓰는 꾸밈이에요. 지원자 확인을 빠르게 해주지 않아요 |
| Window Management | ❌ 필요 없어요 | 창은 사용자가 직접 옮겨도 충분하고, 권한 요청만 늘어요 |
| File Handling | ❌ 필요 없어요 | 이력서 등록은 파일 선택과 드래그 앤 드롭으로 충분해요 |
| Protocol Handlers | ❌ 필요 없어요 | `https://` 링크와 앱 링크가 이미 같은 일을 해요 |
| Share Target | ❌ 필요 없어요 | 공유로 받는 기능이 필요하면 네이티브 앱이 맡는 게 맞아요 |

## 어디서 동작하나요?

[MDN 호환성 데이터](https://github.com/mdn/browser-compat-data)(2026-11-02) 기준이에요. 숫자는 처음 지원한 버전이에요.

| 기술 | 크롬·엣지 데스크톱 | 크롬 안드로이드 | 사파리 macOS | 사파리 iOS | 파이어폭스 |
| --- | --- | --- | --- | --- | --- |
| PWA 설치 | ✅ | ✅ | 🟡 17+ | 🟡 | ❌ |
| `beforeinstallprompt` | ✅ | ✅ | ❌ | ❌ | ❌ |
| Web Install API, `<install>` | 🚩 154+ | 🚩 154+ | ❌ | ❌ | ❌ |
| Window Controls Overlay | 105+ | ❌ | ❌ | ❌ | ❌ |
| `window-drag` | 152+ | ❌ | ❌ | ❌ | ❌ |
| Window Management | 100+ | — | ❌ | ❌ | ❌ |
| File Handling | 102+ | ❌ | ❌ | ❌ | ❌ |
| Protocol Handlers | 96+ | ❌ | ❌ | ❌ | ❌ |
| Launch Handler | 110+ | 110+ | ❌ | ❌ | ❌ |
| Share Target | 89+ | 76+ | ❌ | ❌ | ❌ |
| Badging | 81+ | ❌ | 17+ | 16.4+ | ❌ |

- 🟡 설치 버튼 없이 사용자가 공유 메뉴에서 직접 설치해요. macOS는 "Dock에 추가", iOS는 "홈 화면에 추가"예요.
- 🚩 chrome://flags에서 켜야 동작해요. `<install>`은 크롬·엣지 148~153에서 origin trial을 했어요.
- — API는 있지만 화면이 대부분 하나라 쓸 일이 거의 없어요.
- Badging은 Linux에서 동작하지 않아요. iOS는 홈 화면에 추가한 앱에서 알림 권한을 허용해야 보여요.
- 파이어폭스는 Windows에서 비슷한 기능(Taskbar Tabs)을 시험하고 있어요.

## 직접 해보기

첫 화면에서 기능을 고르면, 화면마다 할 일이 하나씩 나와요. 대부분의 기능은 **설치한 뒤 앱 창에서** 동작해요. 크롬 주소창의 설치 아이콘이나 첫 화면의 "Install Lab 설치하기" 버튼으로 먼저 설치해요.

| 기술 | 코드 | 해보는 방법 |
| --- | --- | --- |
| PWA 기본기 | `public/manifest.webmanifest`, `public/sw.js`, `src/pwa.tsx` | 앱으로 설치하기 → "앱으로 설치하기" 클릭 |
| Web Install API, `<install>` | `src/web-install.tsx` | chrome://flags에서 "Web App Installation API"와 "Web App Install Element"를 켜고, 버튼 하나로 설치하기 → "navigator.install()로 설치하기"나 `<install>` 버튼 클릭 |
| Window Controls Overlay, `window-drag` | `src/window-controls.tsx`, `src/style.css` | 앱 창 타이틀바의 ⌃ 클릭 → 맨 위 바의 빈 곳을 잡고 끌기 |
| Window Management | `src/window-management.tsx` | 다른 모니터에 창 열기 → "모니터 목록 가져오기" → "여기에 열기" 클릭 |
| File Handling | manifest `file_handlers`, `src/launch.tsx` | Finder에서 .txt 파일 우클릭 → 다음으로 열기 → Install Lab |
| Protocol Handlers | manifest `protocol_handlers` | 브라우저 탭에서 파일·링크·공유로 열기 → "web+playground:hello 링크 열기" 클릭 |
| Launch Handler | manifest `launch_handler` | 앱 창을 연 채로 위 두 가지 해보기 → 새 창이 열리지 않고 기존 창에 기록이 쌓여요 |
| Share Target | manifest `share_target` | 안드로이드에 설치하면 공유 목록에 나와요. 실기기에서 띄우는 방법은 아직 준비 중이에요 |
| Badging | `src/badging.tsx` | 앱 아이콘에 숫자 띄우기 → "배지 +1" 클릭 → Dock이나 작업 표시줄 아이콘에서 확인 |

## 기술별로 자세히

### PWA 기본기 · ✅ 기업 대시보드에서 해볼 만해요

- **무엇인가요:** manifest와 Service Worker를 갖추면 웹사이트를 앱처럼 설치할 수 있어요. 크롬 계열은 설치할 수 있을 때 `beforeinstallprompt` 이벤트를 줘서, 원하는 때 설치 창을 띄울 수 있어요.
- **문서:** [MDN · 설치할 수 있는 PWA 만들기](https://developer.mozilla.org/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) · [MDN · BeforeInstallPromptEvent](https://developer.mozilla.org/docs/Web/API/BeforeInstallPromptEvent) · [web.dev · 설치 경험 직접 만들기](https://web.dev/articles/customize-install)
- **기대할 수 있는 것:** 기업 담당자는 대시보드를 매일 열어 지원자를 확인해요. 설치해 두면 탭 사이에서 찾지 않고 Dock·작업 표시줄에서 바로 열어요. Badging과 Launch Handler도 설치해야 쓸 수 있어서, 이게 출발점이에요.
- **한계:** 설치율은 아직 모르는 값이에요. 숫자로 확인하기 전에는 기대를 크게 잡지 않아요. 구직자 모바일에서 설치 안내를 띄우면 네이티브 앱 설치 안내와 겹쳐서 오히려 헷갈려요.
- **이렇게 확인해요:** `appinstalled` 이벤트 수, `display-mode: standalone` 세션 비율, 설치한 담당자의 재방문 주기를 봐요.

### Badging · ✅ PWA와 함께 해볼 만해요

- **무엇인가요:** 설치한 앱 아이콘에 숫자나 점을 띄워요. `navigator.setAppBadge(3)`처럼 써요.
- **문서:** [MDN · Badging API](https://developer.mozilla.org/docs/Web/API/Badging_API) · [Chrome for Developers · Badging API](https://developer.chrome.com/docs/capabilities/web-apis/badging-api)
- **기대할 수 있는 것:** 메신저 앱처럼 대시보드 아이콘에 "확인하지 않은 지원자 3"을 띄울 수 있어요. 창을 열지 않아도 할 일이 있는지 알 수 있어요.
- **한계:** 앱이 닫혀 있을 때 숫자를 바꾸려면 Web Push가 필요해요. 푸시 없이 하면 창이 열려 있을 때만 바뀌어요. 숫자는 "지금 해야 할 일"만 세야 해요. 아무 알림이나 세면 금방 무시돼요.
- **이렇게 확인해요:** 배지를 쓰는 담당자와 쓰지 않는 담당자가 지원서를 처음 열어보기까지 걸린 시간을 비교해요.

### Launch Handler · ➕ PWA를 하면 같이 넣어요

- **무엇인가요:** 앱이 열려 있을 때 다시 실행하면 새 창을 띄울지, 열려 있는 창을 쓸지 정해요. 이 샘플은 `focus-existing`이에요.
- **문서:** [MDN · Launch Handler API](https://developer.mozilla.org/docs/Web/API/Launch_Handler_API) · [Chrome for Developers · Launch Handler](https://developer.chrome.com/docs/web-platform/launch-handler)
- **기대할 수 있는 것:** 앱 아이콘을 여러 번 눌러도 대시보드 창이 쌓이지 않아요. manifest 한 줄이면 돼요.
- **한계:** 혼자서는 효과가 작아요. 메일 속 링크가 앱 창으로 열릴지는 브라우저 설정에 따라 달라서, 링크를 앱 창 하나로 모으는 효과는 기대하기 어려워요.

### Web Install API, `<install>` · ❌ 필요 없어요

- **무엇인가요:** 버튼 하나로 이 앱이나 다른 사이트의 앱을 설치하게 해요. `<install>`은 브라우저가 직접 그려주는 설치 버튼이에요.
- **문서:** [Chrome for Developers · `<install>` 요소 origin trial](https://developer.chrome.com/blog/install-element-ot) · [Microsoft Edge · Web Install API 설명서](https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/WebInstall/explainer.md)
- **필요 없는 이유:** 여러 앱을 모아 보여주는 앱 스토어 같은 페이지를 위한 기능이에요. 원티드는 앱 하나만 설치하게 하면 되고, 같은 크롬 계열에서는 `beforeinstallprompt`로 이미 할 수 있어요. 아직 플래그를 켜야 동작해서 일반 사용자에게는 보이지도 않아요.
- **다시 볼 때:** 크롬에 정식으로 들어오고, 사파리도 지원하겠다고 밝히면 다시 봐요.

### Window Controls Overlay, `window-drag` · ❌ 필요 없어요

- **무엇인가요:** 설치한 앱 창의 타이틀바 자리까지 웹 화면으로 채워요. `window-drag: move`를 준 영역을 잡고 창을 끌 수 있어요.
- **문서:** [MDN · Window Controls Overlay API](https://developer.mozilla.org/docs/Web/API/Window_Controls_Overlay_API) · [web.dev · Window Controls Overlay](https://web.dev/articles/window-controls-overlay) · [CSS UI 4 · window-drag](https://drafts.csswg.org/css-ui-4/#window-drag)
- **필요 없는 이유:** 얻는 건 타이틀바 높이만큼의 공간과 네이티브 앱 같은 겉모습이에요. 대신 OS 창 버튼을 피하는 레이아웃과, 끄는 영역과 버튼이 겹치지 않게 하는 처리를 크롬 계열 데스크톱만을 위해 따로 관리해야 해요.

### Window Management · ❌ 필요 없어요

- **무엇인가요:** 연결된 모니터 목록을 읽고, 원하는 모니터에 창을 열어요.
- **문서:** [MDN · Window Management API](https://developer.mozilla.org/docs/Web/API/Window_Management_API) · [Chrome for Developers · Window Management](https://developer.chrome.com/docs/capabilities/web-apis/window-management)
- **필요 없는 이유:** "한 모니터엔 이력서, 다른 모니터엔 평가표" 같은 장면을 떠올릴 수 있어요. 하지만 창은 사용자가 직접 옮겨도 충분하고, 이 API를 쓰면 "창 관리" 권한을 묻는 창이 하나 더 떠요.

### File Handling · ❌ 필요 없어요

- **무엇인가요:** 설치한 앱을 OS의 "다음으로 열기" 목록에 넣어, 파일을 바로 열게 해요.
- **문서:** [MDN · file_handlers](https://developer.mozilla.org/docs/Web/Progressive_web_apps/Manifest/Reference/file_handlers) · [Chrome for Developers · File Handling](https://developer.chrome.com/docs/capabilities/web-apis/file-handling)
- **필요 없는 이유:** "Finder에서 이력서 PDF를 원티드로 열어 바로 등록"을 떠올릴 수 있어요. 하지만 이력서 등록은 자주 하는 일이 아니고, 원티드를 PDF 열기 앱으로 고를 사람도 드물어요.

### Protocol Handlers · ❌ 필요 없어요

- **무엇인가요:** `web+wanted:` 같은 링크를 누르면 설치한 앱이 열리게 해요.
- **문서:** [MDN · protocol_handlers](https://developer.mozilla.org/docs/Web/Progressive_web_apps/Manifest/Reference/protocol_handlers) · [web.dev · OS와 연결하기](https://web.dev/learn/pwa/os-integration)
- **필요 없는 이유:** 이런 링크를 만들어 줄 외부 서비스가 없어요. `https://www.wanted.co.kr/...` 링크와 네이티브 앱 링크가 이미 같은 일을 해요.

### Share Target · ❌ 필요 없어요

- **무엇인가요:** 설치한 앱이 OS 공유 목록에 나타나서, 다른 앱의 링크나 글을 받아요.
- **문서:** [MDN · share_target](https://developer.mozilla.org/docs/Web/Progressive_web_apps/Manifest/Reference/share_target) · [Chrome for Developers · Web Share Target](https://developer.chrome.com/docs/capabilities/web-apis/web-share-target)
- **필요 없는 이유:** 주로 안드로이드에서 쓰는 기능인데, 원티드 안드로이드 사용자는 네이티브 앱을 써요. 공유로 받는 기능이 필요하면 네이티브 앱에서 만드는 게 맞아요.

## 시작하기 전에 확인할 것

1. **기업 대시보드 사용자 중 크롬·엣지 데스크톱 비율을 봐요.** 이 폴더의 기술은 대부분 여기서만 동작해서, 이 비율이 효과의 상한이에요.
2. **설치하는 사람이 실제로 생기는지 봐요.** 작게 열고 `appinstalled`와 standalone 세션 수부터 확인해요.
3. **배지를 앱이 닫혀 있을 때도 바꿀지 정해요.** 그러려면 Web Push가 필요해서 일이 커져요. 창이 열려 있을 때만 바꾸는 것부터 시작해요.

## 알아두면 좋은 것

- 화면은 [Tailwind CSS](https://tailwindcss.com) v4로 만들었어요. 색과 글꼴은 `src/style.css`의 `@theme`에, 공통 화면 틀(제목, 아래 고정 버튼, 카드)은 `src/ui.tsx`에 있어요.
- 파일이나 링크로 열리면 어느 화면에 있든 "파일·링크·공유로 열기" 화면으로 바로 넘어가요.
- "원티드에 필요할까요?", "어디서 동작하나요?", 참고 문서는 앱의 기능 화면 맨 아래에도 있어요. 내용은 `src/report.tsx`에 모여 있으니, 고칠 때 이 README와 함께 고쳐요.
- manifest를 고쳤는데 반영되지 않으면 앱을 지우고 다시 설치해요. 앱 창의 ⋮ 메뉴나 chrome://apps의 우클릭 메뉴에서 지울 수 있어요. 이때 데이터도 함께 삭제하도록 체크하면 Service Worker까지 깨끗하게 지워져요.
- Web Install API는 실험 단계라 인자 모양이 자주 바뀌어요. 최신 버전은 `navigator.install({ manifest })`와 `<install manifest>`를, 예전 버전은 `install_url`, `manifest_id`, `installurl`, `manifestid`를 써요.
- `<install>`을 지원하지 않는 브라우저에서는 React가 "unrecognized tag" 경고를 남겨요. 지원하지 않는다는 신호일 뿐이라 그대로 둬도 괜찮아요.
