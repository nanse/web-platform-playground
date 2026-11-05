# 01 · Isolated Web App · Direct Sockets

기술 지도 "1. 앱처럼 설치하고 실행하기"의 마지막 행이에요. 일반 웹에서는 쓸 수 없는 TCP·UDP 소켓(Direct Sockets)을 Isolated Web App(IWA)으로 설치해서 써봐요.

```sh
# 터미널 1: 실습용 TCP 에코 서버 (127.0.0.1:7777)
pnpm --filter 01-isolated-web-app echo

# 터미널 2: 빌드하고 https://localhost:5111 로 띄우기
pnpm --filter 01-isolated-web-app dev
```

## 결론부터 말할게요

- **원티드에는 필요 없어요.** IWA는 회사가 관리하는 기기에 관리자가 설치하는 앱이라, 구직자나 기업 담당자에게 배포할 방법이 없어요.
- **Direct Sockets가 하는 일도 채용 서비스에는 쓸 곳이 없어요.** 원시 TCP·UDP가 필요한 건 프린터, IoT 장비, SSH 클라이언트 같은 경우예요. 원티드가 주고받는 데이터는 HTTP와 WebSocket으로 충분해요.
- 이 폴더는 "웹이 어디까지 할 수 있나"를 이해하는 용도로만 봐요.

## 한눈에 보기

| 기술 | 원티드에 필요할까요? | 이유 |
| --- | --- | --- |
| Isolated Web Apps | ❌ 필요 없어요 | 관리자가 설치하는 앱이라 일반 사용자에게 배포할 수 없어요 |
| Direct Sockets | ❌ 필요 없어요 | 채용 서비스는 HTTP와 WebSocket으로 충분해요 |

## 어디서 동작하나요?

[Chrome Platform Status](https://chromestatus.com/feature/6398297361088512)와 Chrome for Developers 문서(2026-11) 기준이에요. MDN 호환성 데이터에는 아직 없어요. 숫자는 처음 지원한 버전이에요.

| 기술 | ChromeOS 관리형 | 크롬 데스크톱 | 크롬 안드로이드 | 사파리 | 파이어폭스 |
| --- | --- | --- | --- | --- | --- |
| Isolated Web Apps | 128+ | 🛠 | ❌ | ❌ | ❌ |
| Direct Sockets | 131+ | 🛠 | ❌ | ❌ | ❌ |

- 🛠 개발자 모드 플래그를 켜야 설치할 수 있어요(Chrome 120+). 테스트용이에요.
- Direct Sockets는 IWA 안에서만 생겨요. 일반 웹 페이지와 PWA에서는 쓸 수 없어요.
- Chrome 143부터 관리자 정책으로 설치하는 IWA는 [Google 허용 목록](https://groups.google.com/a/chromium.org/g/blink-dev/c/iTCPaBw6HxU)에 있어야 해요.
- Windows·macOS·Linux의 관리형 설치는 공식 문서에 "앞으로 넓힐 예정"이라고만 나와 있어요.

## 직접 해보기

1. `chrome://flags/#enable-isolated-web-app-dev-mode`를 켜고 크롬을 다시 시작해요.
2. `chrome://web-app-internals`의 **Install IWA via Dev Mode Proxy**에 `https://localhost:5111`을 넣어요.
3. 설치된 **Sockets Lab**을 열고 "TCP로 보내기"를 눌러요. 내가 보낸 파란 말풍선 아래에 같은 내용의 회색 말풍선이 돌아오면 성공이에요.

일반 탭에서 https://localhost:5111 을 열면 위 순서가 화면에 나와요. 주소마다 "복사" 버튼이 있어서 그대로 붙여 넣으면 돼요.
설치 메뉴가 안 보이거나 IWA 안에서도 TCPSocket이 없으면, chrome://flags에서 "Isolated Web App"과 "Direct Sockets"를 검색해 관련 플래그를 모두 켜요.

| 화면 | 언제 보여요 | 할 일 |
| --- | --- | --- |
| IWA로 설치하면 소켓을 쓸 수 있어요 | 일반 탭에서 열었을 때 | "설치 주소 복사하기" |
| Direct Sockets 플래그를 켜 볼까요? | IWA로 열었지만 TCPSocket이 없을 때 | "플래그 주소 복사하기" |
| TCP로 메시지를 보내 볼까요? | IWA 안에서 TCPSocket이 있을 때 | "TCP로 보내기" |

코드는 `src/main.tsx` 하나에 있고, 화면 맨 아래의 "원티드에 필요할까요?"와 "어디서 동작하나요?"는 `src/report.tsx`에 있어요.

## IWA는 어떤 문제를 풀어요?

IWA는 **웹 기술로 만든 "설치 파일"**이에요. 앱 코드를 통째로 포장하고 도장(서명)을 찍어서 설치하기 때문에, 중간에 누가 코드를 바꿔치기할 수 없어요.

### 왜 필요해요?

일반 웹사이트는 열 때마다 서버에서 코드를 새로 받아 와요. 식당에서 주문할 때마다 주방이 음식을 새로 만들어 주는 것과 비슷해요.
문제는 주방에 누가 몰래 들어와도 손님은 모른다는 거예요.

- 서버가 해킹당하면 코드가 바뀌어도 사용자는 알아챌 수 없어요.
- 페이지에 남의 코드가 끼어들어 실행되는 공격(XSS)도 있어요.

그래서 브라우저는 위험한 기능을 웹에 주지 않아요. 예를 들어 웹사이트가 TCP 소켓으로 다른 기기와 직접 통신할 수 있다고 해 볼게요. 해킹당한 사이트 하나가 내 컴퓨터를 발판으로 회사 프린터나 DB에 접속할 수 있게 돼요.

### 어떻게 풀어요?

봉인 스티커를 붙인 밀키트처럼 앱을 포장해요.

1. **통째로 포장해서 설치해요.** 코드를 서버에서 그때그때 받지 않고, 설치한 파일(`.swbn`) 안에서만 꺼내 써요.
2. **도장이 곧 신분증이에요.** 앱 주소가 `https://wanted.co.kr` 같은 도메인이 아니라 도장(서명 키)에서 만든 `isolated-app://<ID>`예요. 도장이 없으면 서버를 해킹해도 코드를 바꿀 수 없어요.
3. **실행 중에도 끼어들 수 없어요.** 브라우저가 "포장 안에 있는 코드만 실행해요"라는 규칙(CSP)을 강제로 걸어요. 그래서 실제로 실행되는 건 도장 찍힌 코드 그대로예요.

| | 일반 웹 | IWA |
| --- | --- | --- |
| 코드는 어디서 와요? | 열 때마다 서버에서 | 설치한 파일 안에서 |
| 이 앱이 진짜인지 무엇으로 믿어요? | 도메인 | 도장(서명) |
| 코드는 언제 바뀌어요? | 서버가 바꾸면 바로 | 도장 찍은 새 버전을 설치할 때만 |

### 그래서 뭘 할 수 있어요?

코드를 믿을 수 있으니까, 브라우저가 일반 웹에는 안 주는 기능을 열어 줘요.

- **Direct Sockets:** 프린터, IoT 기기, 서버와 TCP·UDP로 직접 통신해요. 이 샘플에서 에코 서버에 메시지를 보내는 기능이에요.
- **Controlled Frame:** 다른 사이트를 앱 안에 넣고 제어할 수 있어요.

주로 회사에서 쓰는 앱을 위한 기술이에요. 매장 키오스크, 원격 접속 프로그램, 기기 관리 도구 같은 것들이에요.

### 대신 뭘 포기해요?

- **바로 고칠 수 없어요.** 버그 하나를 고쳐도 새 버전을 만들어 도장을 찍고 다시 배포해야 해요.
- **링크로 공유할 수 없어요.** "이 주소 열어 봐" 하고 보내는 웹의 가장 큰 장점이 없어져요.
- **아무나 설치할 수 없어요.** 지금은 회사 관리자가 회사 기기에 설치해 주는 방식이에요.

원티드는 누구나 링크로 들어오는 서비스라서, 이런 대가를 치르고 얻을 기능이 없어요. 그래서 맨 위 결론처럼 필요 없다고 판단했어요.

## PWA와 다른 점

- origin이 `https://...`가 아니라 `isolated-app://<랜덤 ID>`예요.
- manifest는 `/.well-known/manifest.webmanifest`에 둬요. HTML에서 링크하지 않고, `version`을 꼭 넣어야 해요.
- 권한은 manifest의 `permissions_policy`에 선언해요.
  - `direct-sockets`: Direct Sockets API를 켜요.
  - `cross-origin-isolated`: 모든 IWA에 필요해요.
  - `loopback-network`: 127.0.0.1(내 컴퓨터)에 연결할 때 필요해요. 예전에는 `direct-sockets-private` 하나로 썼는데, `local-network`와 `loopback-network`로 나누는 중이에요.
- 브라우저가 엄격한 CSP, Trusted Types, cross-origin isolation을 강제해요. 인라인 스크립트와 HMR(저장하면 바로 반영되는 기능)을 쓸 수 없어서, `dev`는 빌드한 뒤 preview로 띄워요.
- 실제 배포는 서명된 Web Bundle(`.swbn`)로 해요. 이 샘플은 개발자 모드 프록시로만 설치해요.

## 기술별로 자세히

### Isolated Web Apps · ❌ 필요 없어요

- **무엇인가요:** 코드를 서명된 묶음(Web Bundle)으로 통째로 설치하는 웹 앱이에요. 서버가 털려도 코드가 바뀌지 않아서, 일반 웹에는 주지 않는 강한 API를 쓸 수 있어요.
- **문서:** [Chrome for Developers · Isolated Web Apps 소개](https://developer.chrome.com/docs/iwa/introduction) · [Chrome for Developers · IWA 시작하기](https://developer.chrome.com/docs/iwa/get-started) · [WICG · Isolated Web Apps 설명서](https://github.com/WICG/isolated-web-apps/blob/main/README.md)
- **필요 없는 이유:** 회사가 관리하는 기기에 관리자가 설치하는 앱이라, 구직자나 기업 담당자에게 배포할 방법이 없어요. Chrome 143부터는 Google 허용 목록에도 올라야 설치할 수 있어요.

### Direct Sockets · ❌ 필요 없어요

- **무엇인가요:** IWA 안에서 `TCPSocket`, `UDPSocket`, `TCPServerSocket`으로 다른 기기와 TCP·UDP로 직접 통신해요. 이 샘플은 `TCPSocket`으로 에코 서버에 메시지를 보내고 돌려받아요.
- **문서:** [Chrome for Developers · Direct Sockets](https://developer.chrome.com/docs/iwa/direct-sockets) · [WICG · Direct Sockets 명세](https://wicg.github.io/direct-sockets/)
- **필요 없는 이유:** 원시 TCP·UDP가 필요한 건 프린터, IoT 장비, SSH 클라이언트 같은 경우예요. 원티드가 주고받는 데이터는 HTTP와 WebSocket으로 충분해요.
- **다시 볼 때:** 회사가 관리하는 기기에서 도는 사내 도구가 로컬 장비와 직접 통신해야 할 때 다시 봐요. 예를 들어 채용 행사장 키오스크에서 출입증을 라벨 프린터로 바로 뽑는 경우예요. 그때도 서버를 거치는 방법이 없는지 먼저 봐요.

## 알아두면 좋은 것

- 코드를 고친 뒤에는 `dev`를 다시 실행하고 앱 창을 새로고침해요. manifest를 고쳤다면 앱을 다시 설치해요.
- 일반 탭에서 https://localhost:5111 을 열어도 같은 CSP와 헤더가 적용돼요. 그래서 일반 탭에서 화면이 잘 뜨면 IWA 안에서도 CSP 때문에 막히지 않아요.
- 소켓으로 주고받은 데이터는 DevTools Network 패널의 Messages 탭에서 볼 수 있어요(Chrome 138+).
- 화면은 [Tailwind CSS](https://tailwindcss.com) v4로 만들었어요. 색과 글꼴(`src/style.css`의 `@theme`)은 `01-install-and-launch`와 같아요.
- "IWA는 어떤 문제를 풀어요?", "원티드에 필요할까요?", "어디서 동작하나요?", 참고 문서는 앱 화면 맨 아래에도 있어요. 내용은 `src/report.tsx`에 모여 있으니, 고칠 때 이 README와 함께 고쳐요.
