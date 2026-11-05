# 06 · Identity

패스키, WebOTP, PasswordCredential로 "비밀번호 없이, 더 빠르게 로그인하는" 방법을 직접 해봐요.

```sh
pnpm --filter 06-identity dev   # https://localhost:5106
```

## 결론부터 말할게요

- **원티드에서 해볼 만한 건 패스키예요.** 지문·얼굴로 로그인하고, 서버에는 털려도 쓸모없는 공개 키만 남아요. 가짜 사이트에서는 아예 꺼내지지 않아서 피싱에도 강해요. 로그인은 OneID가 맡고 있어서, 서버 검증과 계정 복구까지 OneID 쪽에서 함께 정해야 해요.
- **WebOTP는 OneID에 SMS 인증번호 입력 단계가 있다면 같이 넣어요.** 문자 마지막 줄 한 줄과 입력칸 속성 하나, JavaScript 몇 줄이면 돼서 비용이 작아요.
- **PasswordCredential은 필요 없어요.** 크롬 계열에서만 되고, 입력칸에 `autocomplete`만 제대로 달아도 모든 브라우저가 비밀번호를 알아서 저장하고 채워 줘요.

## 한눈에 보기

| 기술 | 원티드에 필요할까요? | 이유 |
| --- | --- | --- |
| 패스키 (WebAuthn) | ✅ OneID에서 해볼 만해요 | 비밀번호 없이 로그인하고, 피싱과 비밀번호 유출에 강해요 |
| WebOTP | ➕ SMS 인증이 있다면 같이 넣어요 | 작은 비용으로 인증번호 입력을 줄여요 |
| PasswordCredential | ❌ 필요 없어요 | `autocomplete` 속성으로 모든 브라우저가 같은 일을 해요 |

## 어디서 동작하나요?

[MDN 호환성 데이터](https://github.com/mdn/browser-compat-data)(2026-11-02) 기준이에요. 숫자는 처음 지원한 버전이에요.

| 기술 | 크롬·엣지 데스크톱 | 크롬 안드로이드 | 사파리 macOS | 사파리 iOS | 파이어폭스 |
| --- | --- | --- | --- | --- | --- |
| WebAuthn (`PublicKeyCredential`) | 67+ | 70+ | 13+ | 13+ | 60+ |
| 패스키 자동완성 (conditional mediation) | 108+ | 108+ | 16+ | 16+ | 119+ |
| JSON으로 주고받기 (`toJSON` 등) | 129+ | 129+ | 18.4+ | 18.4+ | 119+ |
| WebOTP (`OTPCredential`) | 93+ | 84+ | ❌ | ❌ | ❌ |
| PasswordCredential | 51+ | 51+ | ❌ | ❌ | ❌ |
| `autocomplete` 속성 | 14+ | 18+ | 6+ | 6+ | 4+ |

- 패스키를 다른 기기와 동기화하는 건 브라우저가 아니라 비밀번호 관리자(iCloud 키체인, Google 비밀번호 관리자 등)가 해요.
- WebOTP를 데스크톱 크롬에서 쓰려면, 같은 구글 계정으로 로그인한 안드로이드 휴대폰에 문자가 와야 해요.
- 사파리는 WebOTP가 없지만 `autocomplete="one-time-code"`를 달면 iOS 14·macOS Big Sur부터 키보드가 인증번호를 제안해요([Chrome for Developers 문서](https://developer.chrome.com/docs/identity/web-apis/web-otp) 기준).
- MDN 데이터에는 사파리 27부터 `credentials.get()`의 `otp` 옵션을 받는다고 나오지만, `OTPCredential`은 아직 없다고 나오고 Apple의 공식 발표는 찾지 못했어요.

## 직접 해보기

첫 화면에서 기능을 고르면, 화면마다 할 일이 하나씩 나와요.

| 기술 | 코드 | 해보는 방법 |
| --- | --- | --- |
| 패스키 | `src/passkey.tsx` | 패스키로 로그인하기 → "패스키 만들기" → 지문·얼굴·PIN으로 확인 → "패스키로 로그인하기" |
| WebOTP | `src/web-otp.tsx` | SMS 인증번호 자동으로 채우기 → "인증 문자 기다리기" → 화면에 나온 모양의 문자를 받으면 번호가 채워져요 |
| PasswordCredential | `src/password.tsx` | 브라우저에 비밀번호 저장하기 → "브라우저에 저장하기" → 크롬이 물어보면 "저장" → "저장한 비밀번호로 채우기" |

- 패스키는 지문 센서가 없는 컴퓨터에서도 해볼 수 있어요. 크롬 DevTools → 더보기 → WebAuthn 탭에서 가상 기기를 만들면 돼요.
- WebOTP는 localhost에서 실제 문자로 시험하기 어려워요. 문자 마지막 줄에 포트를 넣을 수 없어서, 포트 없는 실제 https 주소에 올린 뒤 안드로이드 크롬에서 확인해요.
- 이 샘플에는 서버가 없어요. 패스키 화면의 "서버라면 이렇게 확인해요"는 브라우저가 받은 값을 보고 흉내만 내요.

## 패스키는 무엇인가요?

**한 줄로:** 패스키는 비밀번호 대신 쓰는 "기기 안의 열쇠"예요. 지문이나 얼굴로 잠금을 풀면 로그인돼요. 외울 것도, 입력할 것도 없어요.

### 비밀번호와 뭐가 달라요?

| | 비밀번호 | 패스키 |
| --- | --- | --- |
| 무엇을 기억해요? | 내가 외워요 | 기기가 기억해요 |
| 서버에는 뭐가 있어요? | 비밀번호(를 바꾼 값). 털리면 위험해요 | 공개 키. 털려도 로그인에 못 써요 |
| 가짜 사이트라면? | 입력하면 그대로 넘어가요 | 주소가 다르면 아예 안 꺼내져요 |
| 로그인할 때 | 직접 입력해요 | 지문·얼굴·PIN으로 확인해요 |

### 열쇠 두 개로 생각해 봐요

패스키를 만들면 짝이 맞는 열쇠가 두 개 생겨요.

- **개인 키(private key)** 는 기기 안에만 있고 밖으로 나오지 않아요. 나만 가진 도장이에요.
- **공개 키(public key)** 는 서버에 맡겨요. 그 도장이 진짜인지 확인하는 견본이에요.

로그인할 때 서버가 매번 새 문제(챌린지)를 내면, 기기는 지문·얼굴로 나인지 확인한 뒤 개인 키로 도장을 찍어 돌려줘요. 서버는 공개 키로 그 도장이 진짜인지만 확인해요. 그래서 서버에는 훔쳐 갈 비밀이 없어요.

### 왜 피싱에 강해요?

패스키는 만들 때의 사이트 주소에 묶여요. wanted.co.kr에서 만든 패스키는 wanted-login.example 같은 가짜 사이트에서는 아예 꺼내지지 않아요. 사용자가 속아서 들어가도 넘겨줄 게 없어요.

### 서버는 무엇을 확인해요?

진짜 서비스라면 서버가 챌린지를 만들어 주고, 돌아온 응답을 이렇게 확인해요. 이 샘플의 패스키 화면은 앞의 세 가지를 브라우저에서 흉내 내 보여주고, 서명 검증은 하지 않아요.

1. 챌린지가 서버가 보낸 값과 같은지
2. 요청한 주소(origin)가 우리 사이트인지
3. 응답 종류가 "만들기(webauthn.create)"인지 "로그인(webauthn.get)"인지
4. 만들 때: 공개 키를 계정에 저장해요. 로그인할 때: 저장해 둔 공개 키로 서명이 진짜인지 확인해요.

서버 검증은 직접 짜지 말고 [SimpleWebAuthn](https://simplewebauthn.dev/) 같은 검증된 라이브러리를 써요.

## WebOTP는 어떻게 동작하나요?

**한 줄로:** 인증 문자의 마지막 줄에 "이 번호는 어느 사이트 거예요"라고 적어 보내면, 브라우저가 그 사이트에서만 번호를 꺼내 줘요. 다른 사이트는 번호를 읽을 수 없어요.

세 가지만 맞추면 돼요.

1. **문자 마지막 줄:** `@도메인 #인증번호`. 사이에 공백 하나, 포트는 넣지 않아요.

   ```
   [원티드] 인증번호: 123456

   @www.wanted.co.kr #123456
   ```

2. **입력칸 속성:** `autocomplete="one-time-code"`. 아이폰 사파리도 이 속성을 보고 키보드 위에 번호를 제안해요.
3. **JavaScript 몇 줄:** 안드로이드 크롬과, 같은 구글 계정의 데스크톱 크롬이 문자를 읽어 채워요.

```js
// 1. 인증 문자를 기다려요
const ac = new AbortController()
const otp = await navigator.credentials.get({
  otp: { transport: ['sms'] },
  signal: ac.signal,
})
// 2. 읽은 번호로 입력칸을 채워요
input.value = otp.code

// 사용자가 직접 입력하기 시작하면 기다리기를 멈춰요
input.addEventListener('input', () => ac.abort())
```

## 기술별로 자세히

### 패스키 (WebAuthn) · ✅ OneID에서 해볼 만해요

- **무엇인가요:** `navigator.credentials.create()`로 기기 안에 열쇠(패스키)를 만들고, `navigator.credentials.get()`으로 그 열쇠로 로그인해요. `residentKey: 'required'`로 만들면 아이디를 입력하지 않고 목록에서 골라 로그인할 수 있어요.
- **문서:** [MDN · Web Authentication API](https://developer.mozilla.org/docs/Web/API/Web_Authentication_API) · [MDN · 패스키](https://developer.mozilla.org/docs/Web/Security/Authentication/Passkeys) · [passkeys.dev](https://passkeys.dev/) · [web.dev · 패스키 만들기](https://web.dev/articles/passkey-registration) · [web.dev · 패스키 자동완성으로 로그인하기](https://web.dev/articles/passkey-form-autofill) · [SimpleWebAuthn](https://simplewebauthn.dev/) · [Chrome for Developers · DevTools WebAuthn 탭](https://developer.chrome.com/docs/devtools/webauthn)
- **기대할 수 있는 것:** 비밀번호를 외우거나 입력하지 않고 지문·얼굴로 로그인해요. 서버에는 공개 키만 있어서 털려도 로그인에 쓸 수 없고, 가짜 사이트에서는 패스키가 아예 꺼내지지 않아 피싱에 강해요. 비밀번호 찾기 요청도 줄일 수 있어요.
- **한계:** OneID 서버가 챌린지를 만들고 서명을 검증해야 해서 서버 작업이 필요해요. 기기를 잃어버린 사용자를 위한 복구 방법(비밀번호, 이메일 인증 등)은 계속 남겨야 해요. 네이티브 앱과 웹에서 같은 패스키를 쓰려면 iOS Associated Domains, Android Digital Asset Links 설정도 필요해요. 소셜 로그인을 쓰는 사용자에게는 차이가 작아요.
- **이렇게 확인해요:** 패스키를 등록한 사용자의 로그인 성공률과 걸린 시간, 비밀번호 재설정 요청 수가 줄어드는지 봐요.

### WebOTP · ➕ SMS 인증이 있다면 같이 넣어요

- **무엇인가요:** `navigator.credentials.get({ otp })`로 인증 문자를 기다렸다가, 문자가 오면 번호를 읽어 와요. 입력칸의 `autocomplete="one-time-code"`와 함께 써요.
- **문서:** [MDN · WebOTP API](https://developer.mozilla.org/docs/Web/API/WebOTP_API) · [Chrome for Developers · WebOTP](https://developer.chrome.com/docs/identity/web-apis/web-otp) · [web.dev · SMS 인증번호 입력 폼 모범 사례](https://web.dev/articles/sms-otp-form) · [WICG · 인증 문자 형식 명세](https://wicg.github.io/sms-one-time-codes/) · [MDN · autocomplete 속성](https://developer.mozilla.org/docs/Web/HTML/Reference/Attributes/autocomplete)
- **얻을 수 있는 것:** 인증 문자가 오면 안드로이드 크롬이 번호를 읽어 입력칸에 채워요. 문자 마지막 줄 한 줄, 입력칸 속성, JavaScript 몇 줄이면 돼서 비용이 작아요. 같은 속성 덕분에 아이폰 사파리도 키보드 위에 번호를 제안해요.
- **한계:** OneID가 직접 만든 입력칸에서 SMS 인증번호를 받을 때만 쓸 수 있어요. 외부 본인인증 화면처럼 원티드가 입력칸을 만들지 않는 단계에는 쓸 수 없어요. 문자 문구를 바꿔야 해서 발송 쪽도 함께 고쳐야 해요. SMS 인증은 번호 도용에 약해서, 로그인 수단으로는 패스키가 더 안전해요.
- **이렇게 확인해요:** 인증번호 입력 단계에서 걸린 시간과, 그 단계에서 그만두는 비율이 줄어드는지 봐요.

### PasswordCredential · ❌ 필요 없어요

- **무엇인가요:** `new PasswordCredential({ id, password })`를 `navigator.credentials.store()`로 브라우저 비밀번호 관리자에 넣고, `navigator.credentials.get({ password: true })`로 꺼내요.
- **문서:** [MDN · Credential Management API](https://developer.mozilla.org/docs/Web/API/Credential_Management_API) · [MDN · PasswordCredential](https://developer.mozilla.org/docs/Web/API/PasswordCredential) · [web.dev · 로그인 폼 모범 사례](https://web.dev/articles/sign-in-form-best-practices) · [MDN · autocomplete 속성](https://developer.mozilla.org/docs/Web/HTML/Reference/Attributes/autocomplete)
- **필요 없는 이유:** 크롬 계열에서만 돼요. 입력칸에 `autocomplete="username"`과 `"current-password"`만 제대로 달아도, 모든 브라우저의 비밀번호 관리자가 알아서 저장하고 채워 줘요. JavaScript로 직접 저장해서 얻는 게 거의 없어요. 대신 OneID 로그인 폼에 `autocomplete` 속성이 빠져 있지 않은지는 확인해 볼 만해요.

## 알아두면 좋은 것

- 패스키는 만든 사이트 주소에 묶여요. 이 샘플에서 만든 패스키는 `localhost`에 묶여서, 다른 주소에서는 보이지 않아요.
- 패스키 화면의 "처음부터 다시 하기"는 화면의 기록만 지워요. 만든 패스키는 기기의 비밀번호 관리자에 남아 있어서, 지우려면 거기서 지워요.
- PasswordCredential로 넘긴 값은 크롬이 "저장할까요?"라고 물었을 때 "저장"을 눌러야 실제로 들어가요.
- WebOTP를 기다리는 중에 사용자가 직접 입력하기 시작하면, `AbortController`로 기다리기를 멈춰요.
- 화면은 [Tailwind CSS](https://tailwindcss.com) v4로 만들었어요. 화면 틀과 판단 화면은 `02`·`03`과 같이 `../shared/`를 써요.
- "원티드에 필요할까요?", "어디서 동작하나요?", 참고 문서는 앱의 기능 화면 맨 아래에도 있어요. 내용은 `src/report.tsx`에 모여 있으니, 고칠 때 이 README와 함께 고쳐요.
