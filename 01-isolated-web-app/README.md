# 01 · Isolated Web App · Direct Sockets

기술 지도 "1. 앱처럼 설치하고 실행하기"의 마지막 행이에요. 일반 웹에서는 쓸 수 없는 TCP/UDP 소켓(Direct Sockets)을 Isolated Web App(IWA)으로 설치해서 써봐요.
원래는 회사가 관리하는 ChromeOS 기기(엔터프라이즈)용 기능이에요. 데스크톱 크롬에서는 개발자 모드 플래그를 켜면 해볼 수 있어요.

## PWA와 다른 점

- origin이 `https://...`가 아니라 `isolated-app://<랜덤 ID>`예요.
- manifest는 `/.well-known/manifest.webmanifest`에 둬요. HTML에서 링크하지 않고, `version`을 꼭 넣어야 해요.
- 권한은 manifest의 `permissions_policy`에 선언해요.
  - `direct-sockets`: Direct Sockets API를 켜요.
  - `cross-origin-isolated`: 모든 IWA에 필요해요.
  - `loopback-network`: 127.0.0.1(내 컴퓨터)에 연결할 때 필요해요. 예전 이름은 `direct-sockets-private`예요.
- 브라우저가 엄격한 CSP, Trusted Types, cross-origin isolation을 강제해요. 인라인 스크립트와 HMR(저장하면 바로 반영되는 기능)을 쓸 수 없어서, `dev`는 빌드한 뒤 preview로 띄워요.
- 실제 배포는 서명된 Web Bundle(`.swbn`)로 해요. 이 샘플은 개발자 모드 프록시로만 설치해요.

## 실행하기

```sh
# 터미널 1: 실습용 TCP 에코 서버 (127.0.0.1:7777)
pnpm --filter 01-isolated-web-app echo

# 터미널 2: 빌드하고 https://localhost:5111 로 띄우기
pnpm --filter 01-isolated-web-app dev
```

1. `chrome://flags/#enable-isolated-web-app-dev-mode`를 켜고 크롬을 다시 시작해요.
2. `chrome://web-app-internals`의 **Install IWA via Dev Mode Proxy**에 `https://localhost:5111`을 넣어요.
3. 설치된 **Sockets Lab**을 열고 "TCP로 보내기"를 눌러요. `받았어요: hello from IWA`가 보이면 성공이에요.

설치 메뉴가 안 보이거나 TCPSocket이 ❌로 나오면 chrome://flags에서 "Isolated Web App"과 "Direct Sockets"를 검색해 관련 플래그를 모두 켜요.

## 알아두면 좋은 것

- 코드를 고친 뒤에는 `dev`를 다시 실행하고 앱 창을 새로고침해요. manifest를 고쳤다면 앱을 다시 설치해요.
- 일반 탭에서 https://localhost:5111 을 열어도 같은 CSP와 헤더가 적용돼요. 다만 TCPSocket은 IWA 안에서만 생기니까 일반 탭에서는 ❌로 나오는 게 정상이에요.
- 소켓으로 주고받은 데이터는 DevTools Network 패널의 Messages 탭에서 볼 수 있어요.
