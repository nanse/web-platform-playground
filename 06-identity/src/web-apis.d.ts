// TS 기본 DOM 타입에 없는 크롬 계열 API를, 이 샘플에서 쓰는 만큼만 선언해요.

interface PasswordCredential extends Credential {
  readonly password: string
  readonly name: string
}
declare var PasswordCredential: {
  prototype: PasswordCredential
  new (data: { id: string; password: string; name?: string }): PasswordCredential
}

interface OTPCredential extends Credential {
  readonly code: string
}

interface CredentialRequestOptions {
  /** WebOTP: 인증 문자를 기다려요. */
  otp?: { transport: 'sms'[] }
  /** PasswordCredential: 저장한 아이디·비밀번호를 꺼내요. */
  password?: boolean
}
