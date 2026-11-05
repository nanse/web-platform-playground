import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App, Button, FeatureSections, Note, Screen, useNav, type Section } from '../../shared/ui'
import { Passkey } from './passkey'
import { Password } from './password'
import { WebOtp } from './web-otp'

// README의 결론 순서대로 묶어요: 원티드에서 해볼 만한 것 먼저, 필요 없는 것은 아래에.
const SECTIONS: Section[] = [
  {
    title: '원티드에서 해볼 만해요',
    features: [
      {
        id: 'passkey',
        icon: '🔑',
        screen: Passkey,
        title: '패스키로 로그인하기',
        summary: '비밀번호 없이 지문·얼굴로 로그인해요',
        supported: 'PublicKeyCredential' in window,
      },
    ],
  },
  {
    title: 'SMS 인증이 있다면 같이 넣어요',
    features: [
      {
        id: 'web-otp',
        icon: '💬',
        screen: WebOtp,
        title: 'SMS 인증번호 자동으로 채우기',
        summary: '문자 한 줄과 입력칸 속성만 바꾸면 돼요',
        supported: 'OTPCredential' in window,
      },
    ],
  },
  {
    title: '지금은 필요 없어요',
    features: [
      {
        id: 'password',
        icon: '🔒',
        screen: Password,
        title: '브라우저에 비밀번호 저장하기',
        summary: 'autocomplete만 잘 달아도 브라우저가 해줘요',
        supported: 'PasswordCredential' in window,
      },
    ],
  },
]

function Home() {
  const { go } = useNav()

  return (
    <Screen
      brand="Identity Lab"
      title={'비밀번호 없이,\n더 빠르게 로그인해 볼까요?'}
      description="원티드에서 해볼 만한 건 패스키예요. OneID에 SMS 인증 단계가 있다면 WebOTP도 같이 넣고, PasswordCredential은 필요 없어요."
      cta={<Button onClick={() => go(SECTIONS[0].features[0].id)}>하나씩 해보기</Button>}
    >
      <FeatureSections sections={SECTIONS} />
      <Note>로그인 기능은 진짜 서비스라면 서버가 꼭 검증해야 해요. 이 샘플에는 서버가 없어서, 브라우저 쪽에서 무슨 일이 일어나는지만 보여줘요.</Note>
    </Screen>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App sections={SECTIONS} home={<Home />} />
  </StrictMode>,
)
