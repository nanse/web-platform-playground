// README의 "원티드에 필요할까요?"와 "어디서 동작하나요?"를 화면에서도 보여줘요. 내용을 고치면 README도 같이 고쳐요.
import type { ReactNode } from 'react'
import { Report as SharedReport, type Tech } from '../../shared/report'

const TECHS = {
  passkey: {
    name: '패스키 (WebAuthn)',
    verdict: 'try',
    verdictLabel: 'OneID에서 해볼 만해요',
    reason:
      '비밀번호를 외우거나 입력하지 않고 지문·얼굴로 로그인해요. 서버에는 공개 키만 있어서 털려도 로그인에 쓸 수 없고, 가짜 사이트에서는 패스키가 아예 꺼내지지 않아 피싱에 강해요. 비밀번호 찾기 요청도 줄일 수 있어요.',
    limit:
      'OneID 서버가 챌린지를 만들고 서명을 검증해야 해서 서버 작업이 필요해요. 기기를 잃어버린 사용자를 위한 복구 방법(비밀번호, 이메일 인증 등)은 계속 남겨야 해요. 네이티브 앱과 웹에서 같은 패스키를 쓰려면 iOS Associated Domains, Android Digital Asset Links 설정도 필요해요. 소셜 로그인을 쓰는 사용자에게는 차이가 작아요.',
    measure: '패스키를 등록한 사용자의 로그인 성공률과 걸린 시간, 비밀번호 재설정 요청 수가 줄어드는지 봐요.',
    docs: [
      ['MDN · Web Authentication API', 'https://developer.mozilla.org/docs/Web/API/Web_Authentication_API'],
      ['MDN · 패스키', 'https://developer.mozilla.org/docs/Web/Security/Authentication/Passkeys'],
      ['passkeys.dev · 패스키 개발자 가이드', 'https://passkeys.dev/'],
      ['web.dev · 패스키 만들기', 'https://web.dev/articles/passkey-registration'],
      ['web.dev · 패스키 자동완성으로 로그인하기', 'https://web.dev/articles/passkey-form-autofill'],
      ['SimpleWebAuthn · 서버 검증 라이브러리', 'https://simplewebauthn.dev/'],
      ['Chrome for Developers · DevTools WebAuthn 탭', 'https://developer.chrome.com/docs/devtools/webauthn'],
    ],
    support: [
      ['WebAuthn (PublicKeyCredential)', '67+', '70+', '13+', '13+', '60+'],
      ['패스키 자동완성 (conditional mediation)', '108+', '108+', '16+', '16+', '119+'],
      ['JSON으로 주고받기 (toJSON 등)', '129+', '129+', '18.4+', '18.4+', '119+'],
    ],
    supportNote: '패스키를 다른 기기와 동기화하는 건 브라우저가 아니라 비밀번호 관리자(iCloud 키체인, Google 비밀번호 관리자 등)가 해요.',
  },
  'web-otp': {
    name: 'WebOTP',
    verdict: 'with',
    verdictLabel: 'SMS 인증이 있다면 같이 넣어요',
    reason:
      '인증 문자가 오면 안드로이드 크롬이 번호를 읽어 입력칸에 채워요. 문자 마지막 줄 한 줄, 입력칸 속성(autocomplete="one-time-code"), JavaScript 몇 줄이면 돼서 비용이 작아요. 같은 속성 덕분에 아이폰 사파리도 키보드 위에 번호를 제안해요.',
    limit:
      'OneID가 직접 만든 입력칸에서 SMS 인증번호를 받을 때만 쓸 수 있어요. 외부 본인인증 화면처럼 원티드가 입력칸을 만들지 않는 단계에는 쓸 수 없어요. 문자 문구를 바꿔야 해서 발송 쪽도 함께 고쳐야 해요. SMS 인증은 번호 도용에 약해서, 로그인 수단으로는 패스키가 더 안전해요.',
    measure: '인증번호 입력 단계에서 걸린 시간과, 그 단계에서 그만두는 비율이 줄어드는지 봐요.',
    docs: [
      ['MDN · WebOTP API', 'https://developer.mozilla.org/docs/Web/API/WebOTP_API'],
      ['Chrome for Developers · WebOTP', 'https://developer.chrome.com/docs/identity/web-apis/web-otp'],
      ['web.dev · SMS 인증번호 입력 폼 모범 사례', 'https://web.dev/articles/sms-otp-form'],
      ['WICG · 인증 문자 형식 명세', 'https://wicg.github.io/sms-one-time-codes/'],
      ['MDN · autocomplete 속성', 'https://developer.mozilla.org/docs/Web/HTML/Reference/Attributes/autocomplete'],
    ],
    support: [['WebOTP (OTPCredential)', '93+', '84+', '❌', '❌', '❌']],
    supportNote:
      '데스크톱 크롬은 같은 구글 계정으로 로그인한 안드로이드 휴대폰에 온 문자를 읽어요. 사파리는 WebOTP가 없지만 autocomplete="one-time-code"를 달면 iOS 14·macOS Big Sur부터 키보드가 인증번호를 제안해요(Chrome for Developers 문서 기준). MDN 데이터에는 사파리 27부터 otp 옵션을 받는다고 나오지만, Apple의 공식 발표는 찾지 못했어요.',
  },
  password: {
    name: 'PasswordCredential',
    verdict: 'no',
    verdictLabel: '필요 없어요',
    reason:
      '크롬 계열에서만 돼요. 입력칸에 autocomplete="username"과 "current-password"만 제대로 달아도, 모든 브라우저의 비밀번호 관리자가 알아서 저장하고 채워 줘요. JavaScript로 직접 저장해서 얻는 게 거의 없어요. 대신 OneID 로그인 폼에 autocomplete 속성이 빠져 있지 않은지는 확인해 볼 만해요.',
    docs: [
      ['MDN · Credential Management API', 'https://developer.mozilla.org/docs/Web/API/Credential_Management_API'],
      ['MDN · PasswordCredential', 'https://developer.mozilla.org/docs/Web/API/PasswordCredential'],
      ['web.dev · 로그인 폼 모범 사례', 'https://web.dev/articles/sign-in-form-best-practices'],
      ['MDN · autocomplete 속성', 'https://developer.mozilla.org/docs/Web/HTML/Reference/Attributes/autocomplete'],
    ],
    support: [
      ['PasswordCredential', '51+', '51+', '❌', '❌', '❌'],
      ['autocomplete 속성', '14+', '18+', '6+', '6+', '4+'],
    ],
  },
} satisfies Record<string, Tech>

export const Report = ({ id, intro }: { id: keyof typeof TECHS; intro?: ReactNode }) => <SharedReport tech={TECHS[id]} intro={intro} />
