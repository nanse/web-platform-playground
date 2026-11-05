import { useEffect, useRef, useState } from 'react'
import { Button, Card, InfoList, Note, Result, Screen, useNav, yesNo, type FeatureRef } from '../../shared/ui'
import { Code, ExplainTitle, strong, Topic } from '../../shared/explain'
import { Field } from './field'
import { Report } from './report'

const supported = 'OTPCredential' in window

const JS_CODE = `// 1. 인증 문자를 기다려요
const ac = new AbortController()
const otp = await navigator.credentials.get({
  otp: { transport: ['sms'] },
  signal: ac.signal,
})
// 2. 읽은 번호로 입력칸을 채워요
input.value = otp.code

// 사용자가 직접 입력하기 시작하면 기다리기를 멈춰요
input.addEventListener('input', () => ac.abort())`

function Explainer() {
  return (
    <>
      <ExplainTitle>WebOTP는 어떻게 동작하나요?</ExplainTitle>
      <p className="text-[17px] leading-[1.6] text-grey-700">
        인증 문자의 <strong className={strong}>마지막 줄</strong>에 "이 번호는 어느 사이트 거예요"라고 적어 보내면, 브라우저가 그 사이트에서만 번호를
        꺼내 줘요. 다른 사이트는 번호를 읽을 수 없어요.
      </p>
      <Topic icon="🧩" title="세 가지만 맞추면 돼요">
        <ol className="flex list-decimal flex-col gap-2 pl-5 marker:font-semibold marker:text-primary">
          <li>
            <strong className={strong}>문자 마지막 줄:</strong> <code>@도메인 #인증번호</code>. 사이에 공백 하나, 포트는 넣지 않아요.
          </li>
          <li>
            <strong className={strong}>입력칸 속성:</strong> <code>autocomplete="one-time-code"</code>. 아이폰 사파리도 이 속성을 보고 키보드 위에
            번호를 제안해요.
          </li>
          <li>
            <strong className={strong}>JavaScript 몇 줄:</strong> 안드로이드 크롬과, 같은 구글 계정의 데스크톱 크롬이 문자를 읽어 채워요.
          </li>
        </ol>
        <Code code={JS_CODE} />
      </Topic>
    </>
  )
}

export function WebOtp({ feature }: { feature: FeatureRef }) {
  const { back } = useNav()
  const [code, setCode] = useState('')
  const [waiting, setWaiting] = useState(false)
  const [result, setResult] = useState('')
  const abort = useRef<AbortController | null>(null)
  const [example] = useState(() => String(Math.floor(100000 + Math.random() * 900000)))

  // 화면을 떠나면 기다리기를 멈춰요.
  useEffect(() => () => abort.current?.abort(), [])

  async function wait() {
    const controller = new AbortController()
    abort.current = controller
    setWaiting(true)
    setResult('')
    try {
      const otp = (await navigator.credentials.get({ otp: { transport: ['sms'] }, signal: controller.signal })) as OTPCredential | null
      if (otp) {
        setCode(otp.code)
        setResult(`문자에서 읽은 인증번호로 채웠어요: ${otp.code}`)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setResult(`문자를 읽지 못했어요. 직접 입력해도 돼요. (${e})`)
    } finally {
      setWaiting(false)
    }
  }

  function type(value: string) {
    setCode(value)
    // 직접 입력하기 시작하면 더 기다리지 않아요.
    abort.current?.abort()
  }

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['navigator.credentials.get({ otp })', 'autocomplete="one-time-code"']}
      title={'SMS 인증번호를\n자동으로 채워 볼까요?'}
      description="안드로이드 크롬은 인증 문자가 오면 번호를 읽어 입력칸에 채워요. 문자 마지막 줄만 정해진 모양으로 보내면 돼요."
      cta={
        <Button onClick={wait} disabled={!supported || waiting}>
          {waiting ? '문자를 기다리는 중이에요' : '인증 문자 기다리기'}
        </Button>
      }
    >
      {result && <Result>{result}</Result>}
      <Field
        label="인증번호"
        value={code}
        onChange={(e) => type(e.target.value)}
        autoComplete="one-time-code"
        inputMode="numeric"
        placeholder="6자리 숫자"
      />
      <Card title="이런 문자를 보내요">
        <pre className="rounded-2xl rounded-tl-md bg-white px-4 py-3 font-sans text-[15px] leading-[1.6] whitespace-pre-wrap text-grey-900">
          {`[Identity Lab] 인증번호: ${example}\n\n@${location.hostname} #${example}`}
        </pre>
        <p className="mt-3 text-[13px] leading-[1.6] text-grey-500">
          마지막 줄의 주소는 지금 사이트({location.hostname})예요. 포트(:{location.port})는 넣지 않아요.
        </p>
      </Card>
      <Card title="지금 상태">
        <InfoList
          items={[
            ['WebOTP', yesNo(supported)],
            ['autocomplete="one-time-code"', '모든 브라우저에 달아 둘 수 있어요'],
          ]}
        />
      </Card>
      {!supported && (
        <Note>
          이 브라우저는 WebOTP를 지원하지 않아요. 그래도 입력칸에 <code>autocomplete="one-time-code"</code>가 있어서, 아이폰 사파리는 키보드 위에
          인증번호를 제안해요.
        </Note>
      )}
      <Note>
        이 샘플은 https://localhost:5106 이라 실제 문자로 시험하기 어려워요. 포트를 넣을 수 없어서, 실제 주소(포트 없는 https)에 올린 뒤
        안드로이드 크롬에서 확인해요.
      </Note>
      <Report id="web-otp" intro={<Explainer />} />
    </Screen>
  )
}
