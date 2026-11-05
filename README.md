# web-platform-playground

웹을 네이티브 앱처럼 만드는 기술을 직접 만져보며 이해하는 실험실이에요.

- [웹을 네이티브 앱처럼 만드는 기술 지도 (1차 정리)](https://wantedlab.atlassian.net/wiki/spaces/~71520108/pages/5023236323/1)
- [web.dev로 정리한 사용자 경험 향상 기술 지도](https://wantedlab.atlassian.net/wiki/spaces/~71520108/pages/5030543361/web.dev)

## 폴더 구조

```
web-platform-playground/
├── 01-install-and-launch/   # https://localhost:5101  PWA, Web Install, WCO, Window Management, File/Protocol/Launch/Share, Badging
├── 01-isolated-web-app/     # https://localhost:5111  Isolated Web Apps, Direct Sockets
├── 02-smooth-ui/            # https://localhost:5102  View Transitions, Popover, Anchor Positioning
├── 03-offline-and-storage/  # https://localhost:5103  Service Worker, OPFS, IndexedDB
├── 04-multi-tab/            # https://localhost:5104  Web Locks, BroadcastChannel
├── 05-performance/          # https://localhost:5105  LCP·INP·CLS, bfcache, Speculation Rules
├── 06-identity/             # https://localhost:5106  Passkeys, PasswordCredential, WebOTP
├── shared/                  # 샘플들이 같이 쓰는 디자인: 색·글꼴(theme.css), 화면 틀(ui.tsx·ui.css), 판단 화면(report.tsx)
└── scripts/cert.ts          # mkcert로 localhost HTTPS 인증서 생성
```

폴더 하나가 pnpm 워크스페이스 패키지 하나예요. 기본은 React + Vite이고, 필요하면 Next.js 폴더를 추가해요.
페이지를 열면 지금 브라우저가 그 폴더의 API를 지원하는지 먼저 보여요. 01·02는 기능마다 직접 해보는 화면과 원티드 도입 판단까지 있어요.

## localhost(HTTPS)로 실행하기

패스키, Web Locks, Service Worker 같은 기능은 안전한 환경(HTTPS 또는 localhost)에서만 동작해요. 이런 환경을 **보안 컨텍스트**라고 불러요.
이 레포는 항상 `https://localhost`로 띄워서, 로컬에서 본 동작이 배포 환경에서도 똑같이 나오게 해요.

### 1. 준비물

- Node.js 22.18 이상
- pnpm (`corepack enable`로 켜요)
- [mkcert](https://github.com/FiloSottile/mkcert)

```sh
brew install mkcert
brew install nss   # Firefox도 쓴다면
```

### 2. 설치하고 인증서 만들기 (처음 한 번만)

```sh
pnpm install
pnpm cert   # 로컬 인증 기관을 시스템에 등록해요. macOS 암호를 물어볼 수 있어요.
```

인증서는 `.certs/`에 만들어지고 git에는 올라가지 않아요. `pnpm cert`를 건너뛰어도 첫 `dev` 때 자동으로 만들어져요.

### 3. 실행하기

```sh
pnpm --filter 03-offline-and-storage dev   # https://localhost:5103
# 또는
cd 03-offline-and-storage && pnpm dev
```

LCP, bfcache, Speculation Rules처럼 운영 환경과 비슷해야 정확한 실험은 빌드해서 확인해요. preview도 HTTPS로 열려요.

```sh
pnpm --filter 05-performance build
pnpm --filter 05-performance preview
```

### 왜 mkcert를 쓰나요?

직접 서명한 인증서는 브라우저 경고를 넘기고 들어가도 Service Worker를 등록할 수 없어요.
mkcert는 내 컴퓨터에서만 믿는 인증 기관(로컬 CA)을 만들어 시스템에 등록해요. 그래서 경고 없는 진짜 HTTPS로 열려요.

### 왜 포트를 고정했나요?

Service Worker, IndexedDB, OPFS의 데이터는 origin(프로토콜 + 호스트 + 포트, 예: `https://localhost:5103`)마다 따로 저장돼요.
포트가 바뀌면 브라우저가 다른 앱으로 보고 저장해 둔 데이터를 찾지 못해요. 그래서 `strictPort`로 포트를 고정했어요.

## 새 실험 폴더 추가하기

### React (Vite)

기존 폴더를 복사하고 두 군데만 바꿔요.

1. `package.json`의 `name`을 폴더 이름으로 바꿔요.
2. `vite.config.ts`의 `port`를 다른 폴더와 겹치지 않는 번호(`51xx`)로 바꿔요.

그다음 `pnpm install`을 실행하면 바로 띄울 수 있어요.

### Next.js

```sh
pnpm create next-app@latest 07-something
```

`07-something/package.json`의 `dev` 스크립트를 아래처럼 바꾸면 다른 폴더와 같은 인증서로 HTTPS가 켜져요.

```json
"dev": "node ../scripts/cert.ts && next dev -p 5107 --experimental-https --experimental-https-key ../.certs/localhost-key.pem --experimental-https-cert ../.certs/localhost.pem"
```

`next start`에는 HTTPS 옵션이 없어요. 운영 모드도 HTTPS로 확인하려면 앞에 프록시를 둬요.

```sh
pnpm dlx local-ssl-proxy --source 5107 --target 3000 --cert ../.certs/localhost.pem --key ../.certs/localhost-key.pem
```

## 막혔을 때

- **`HTTPS 인증서를 만들지 못했어요`가 떠요**: mkcert가 없거나 PATH에서 찾지 못한 거예요. `brew install mkcert`로 설치하고 `pnpm cert`를 다시 실행해요.
- **인증서 경고가 떠요**: 로컬 CA가 아직 등록되지 않았어요. `mkcert -install`을 실행하고 브라우저를 다시 열어요.
- **`Port 51xx is already in use`가 떠요**: 다른 프로세스가 그 포트를 쓰고 있어요. `lsof -i :51xx`로 찾아서 종료하고 다시 실행해요.
- **Service Worker가 예전 코드를 계속 써요**: DevTools → Application → Storage에서 "Clear site data"를 눌러요.
