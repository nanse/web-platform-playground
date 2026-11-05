import { useEffect, useState } from 'react'
import { Button, Card, InfoList, Note, Result, Screen, useNav, yesNo, type FeatureRef } from '../../shared/ui'
import { bullets, ExplainTitle, strong, Topic } from '../../shared/explain'
import { Checklist } from './checklist'
import { Report } from './report'

const KEY = 'identity-lab:passkey'
type Saved = { id: string; createdAt: string }
type Check = [label: string, ok: boolean | null]

const supported = 'PublicKeyCredential' in window
const ALGORITHMS: Record<number, string> = { [-7]: 'ES256 (타원곡선)', [-257]: 'RS256 (RSA)' }

function loadSaved(): Saved | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null')
  } catch {
    return null
  }
}

const toBase64url = (buffer: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

/** 브라우저가 서명하기 전에 만든 "누가, 어디서, 어떤 문제에" 기록이에요. 서버가 가장 먼저 확인하는 부분이에요. */
const readClientData = (response: AuthenticatorResponse) =>
  JSON.parse(new TextDecoder().decode(response.clientDataJSON)) as { type: string; challenge: string; origin: string }

// 진짜 서비스라면 챌린지는 서버가 만들어 줘요. 이 데모에는 서버가 없어서 브라우저에서 만들어요.
const newChallenge = () => crypto.getRandomValues(new Uint8Array(32))

function Explainer() {
  return (
    <>
      <ExplainTitle>패스키는 무엇인가요?</ExplainTitle>
      <p className="text-[17px] leading-[1.6] text-grey-700">
        패스키는 비밀번호 대신 쓰는 <strong className={strong}>"기기 안의 열쇠"</strong>예요. 지문이나 얼굴로 잠금을 풀면 로그인돼요. 외울 것도,
        입력할 것도 없어요.
      </p>

      <Topic icon="🔑" title="비밀번호와 뭐가 달라요?">
        <table className="w-full overflow-hidden rounded-2xl bg-white text-[13px]">
          <thead>
            <tr className="text-grey-500">
              <th className="w-[30%] px-3 pt-3 pb-2 text-left font-medium"></th>
              <th className="px-3 pt-3 pb-2 text-left font-medium">비밀번호</th>
              <th className="px-3 pt-3 pb-2 text-left font-semibold text-primary">패스키</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['무엇을 기억해요?', '내가 외워요', '기기가 기억해요'],
              ['서버에는 뭐가 있어요?', '비밀번호(를 바꾼 값). 털리면 위험해요', '공개 키. 털려도 로그인에 못 써요'],
              ['가짜 사이트라면?', '입력하면 그대로 넘어가요', '주소가 다르면 아예 안 꺼내져요'],
              ['로그인할 때', '직접 입력해요', '지문·얼굴·PIN으로 확인해요'],
            ].map(([question, password, passkey]) => (
              <tr key={question} className="border-t border-grey-100 align-top">
                <th scope="row" className="px-3 py-2.5 text-left font-medium text-grey-600">
                  {question}
                </th>
                <td className="px-3 py-2.5 text-grey-700">{password}</td>
                <td className="px-3 py-2.5 font-medium text-grey-900">{passkey}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Topic>

      <Topic icon="🖋️" title="열쇠 두 개로 생각해 봐요">
        <p>패스키를 만들면 짝이 맞는 열쇠가 두 개 생겨요.</p>
        <ul className={bullets}>
          <li>
            <strong className={strong}>개인 키(private key)</strong>는 기기 안에만 있고 밖으로 나오지 않아요. 나만 가진 도장이에요.
          </li>
          <li>
            <strong className={strong}>공개 키(public key)</strong>는 서버에 맡겨요. 그 도장이 진짜인지 확인하는 견본이에요.
          </li>
        </ul>
        <p>
          로그인할 때 서버가 매번 새 문제(챌린지)를 내면, 기기는 지문·얼굴로 나인지 확인한 뒤 개인 키로 도장을 찍어 돌려줘요. 서버는 공개 키로 그
          도장이 진짜인지만 확인해요. 그래서 서버에는 훔쳐 갈 비밀이 없어요.
        </p>
      </Topic>

      <Topic icon="🎣" title="왜 피싱에 강해요?">
        <p>
          패스키는 만들 때의 사이트 주소에 묶여요. wanted.co.kr에서 만든 패스키는 wanted-login.example 같은 가짜 사이트에서는 아예 꺼내지지
          않아요. 사용자가 속아서 들어가도 넘겨줄 게 없어요.
        </p>
      </Topic>

      <Topic icon="⚠️" title="이 데모에는 서버가 없어요">
        <p>
          진짜 서비스라면 <strong className={strong}>서버</strong>가 챌린지를 만들어 주고, 돌아온 응답에서 챌린지·주소·서명을 모두 검증해야 해요. 이
          데모는 브라우저에서 챌린지를 만들고, 받은 값을 보여주기만 해요. 서명은 검증하지 않아요.
        </p>
        <p>서버 검증은 직접 짜지 말고 SimpleWebAuthn 같은 검증된 라이브러리를 써요.</p>
      </Topic>
    </>
  )
}

export function Passkey({ feature }: { feature: FeatureRef }) {
  const { back } = useNav()
  const [saved, setSaved] = useState(loadSaved)
  const [platform, setPlatform] = useState('확인하는 중')
  const [autofill, setAutofill] = useState('확인하는 중')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')
  const [details, setDetails] = useState<[string, string][]>([])
  const [checks, setChecks] = useState<Check[]>([])

  useEffect(() => {
    if (!supported) return
    void PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then((ok) =>
      setPlatform(ok ? '지문·얼굴·PIN으로 확인할 수 있어요' : '이 기기만으로는 어려워요'),
    )
    void (PublicKeyCredential.isConditionalMediationAvailable?.() ?? Promise.resolve(false)).then((ok) => setAutofill(yesNo(ok)))
  }, [])

  async function create() {
    const challenge = newChallenge()
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        // rp.id를 비우면 지금 주소(localhost)에 묶여요. 원티드라면 'wanted.co.kr'이에요.
        rp: { name: 'Identity Lab' },
        user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'jobseeker@example.com', displayName: '원티드 구직자' },
        // -7(ES256)을 먼저, 안 되는 기기를 위해 -257(RS256)도 받아요.
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        // residentKey: 'required'라야 아이디를 입력하지 않고 고르는 "패스키"가 돼요.
        authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
      },
    })) as PublicKeyCredential
    const response = credential.response as AuthenticatorAttestationResponse
    const client = readClientData(response)
    const next = { id: credential.id, createdAt: new Date().toISOString() }
    localStorage.setItem(KEY, JSON.stringify(next))
    setSaved(next)
    setResult('패스키를 만들었어요. 이제 "패스키로 로그인하기"를 눌러 봐요.')
    setDetails([
      ['패스키 ID', `${credential.id.slice(0, 16)}…`],
      ['열쇠 종류', ALGORITHMS[response.getPublicKeyAlgorithm()] ?? String(response.getPublicKeyAlgorithm())],
      ['저장된 곳', credential.authenticatorAttachment === 'cross-platform' ? '보안 키나 다른 휴대폰' : '이 기기의 비밀번호 관리자'],
    ])
    setChecks([
      ['챌린지가 내가 보낸 값과 같아요', client.challenge === toBase64url(challenge)],
      [`요청한 주소가 지금 사이트와 같아요 (${location.origin})`, client.origin === location.origin],
      ['응답 종류가 "만들기(webauthn.create)"예요', client.type === 'webauthn.create'],
      ['공개 키를 이 계정에 저장해요', null],
    ])
  }

  async function login() {
    const challenge = newChallenge()
    // allowCredentials를 비워 두면, 아이디를 묻지 않고 이 사이트의 패스키 목록에서 고르게 해요.
    const credential = (await navigator.credentials.get({
      publicKey: { challenge, userVerification: 'preferred' },
    })) as PublicKeyCredential
    const response = credential.response as AuthenticatorAssertionResponse
    const client = readClientData(response)
    // authenticatorData의 33번째 바이트가 플래그예요. 0x04 비트가 "본인 확인(UV)을 했어요"예요.
    const flags = new Uint8Array(response.authenticatorData)[32]
    setResult('패스키로 로그인했어요. 비밀번호는 한 번도 오가지 않았어요.')
    setDetails([
      ['고른 패스키 ID', `${credential.id.slice(0, 16)}…`],
      ['서명(도장) 길이', `${response.signature.byteLength}바이트`],
    ])
    setChecks([
      ['챌린지가 내가 보낸 값과 같아요', client.challenge === toBase64url(challenge)],
      [`요청한 주소가 지금 사이트와 같아요 (${location.origin})`, client.origin === location.origin],
      ['응답 종류가 "로그인(webauthn.get)"이에요', client.type === 'webauthn.get'],
      ['지문·얼굴·PIN으로 본인 확인을 했어요', (flags & 0x04) !== 0],
      ['만들 때 저장한 패스키예요', credential.id === saved?.id],
      ['저장해 둔 공개 키로 서명이 진짜인지 확인해요', null],
    ])
  }

  async function run(action: () => Promise<void>) {
    setBusy(true)
    try {
      await action()
    } catch (e) {
      setChecks([])
      setDetails([])
      setResult(
        (e as Error).name === 'NotAllowedError'
          ? '취소했거나 시간이 지났어요. 다시 누르면 처음부터 할 수 있어요.'
          : `패스키를 쓰지 못했어요. (${e})`,
      )
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    localStorage.removeItem(KEY)
    setSaved(null)
    setResult('')
    setChecks([])
    setDetails([])
  }

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['navigator.credentials.create()', '.get()']}
      title={saved ? '만든 패스키로\n로그인해 볼까요?' : '비밀번호 대신\n패스키를 만들어 볼까요?'}
      description={
        saved
          ? '아이디도 비밀번호도 입력하지 않아요. 지문·얼굴·PIN으로 확인하면 끝이에요.'
          : '이 기기에 열쇠를 하나 만들어요. 지문·얼굴·PIN으로 확인하면 바로 만들어져요.'
      }
      cta={
        <Button onClick={() => run(saved ? login : create)} disabled={!supported || busy}>
          {busy ? '확인하는 중이에요' : saved ? '패스키로 로그인하기' : '패스키 만들기'}
        </Button>
      }
    >
      {result && <Result>{result}</Result>}
      {checks.length > 0 && (
        <Card title="서버라면 이렇게 확인해요">
          <Checklist items={checks} />
          <p className="mt-3 text-[13px] leading-[1.6] text-grey-500">이 데모에는 서버가 없어서, 브라우저가 받은 값을 보고 흉내만 내요.</p>
        </Card>
      )}
      {details.length > 0 && (
        <Card title="돌아온 값">
          <InfoList items={details} />
        </Card>
      )}
      <Card title="지금 상태">
        <InfoList
          items={[
            ['패스키 (WebAuthn)', yesNo(supported)],
            ['이 기기', platform],
            ['패스키 자동완성', autofill],
            ['만든 패스키', saved ? `${saved.id.slice(0, 12)}…` : '아직 없어요'],
          ]}
        />
        {saved && (
          <button
            onClick={reset}
            className="mt-3 rounded-lg px-2 py-1 text-[14px] font-semibold text-grey-600 hover:bg-grey-100 focus-visible:outline-2 focus-visible:outline-primary"
          >
            처음부터 다시 하기
          </button>
        )}
      </Card>
      <Note>
        "처음부터 다시 하기"는 이 화면의 기록만 지워요. 만든 패스키는 기기의 비밀번호 관리자에 남아 있어서, 지우려면 거기서 지워요. 크롬은
        DevTools의 WebAuthn 탭에서 가상 기기를 만들어 시험할 수도 있어요.
      </Note>
      <Report id="passkey" intro={<Explainer />} />
    </Screen>
  )
}
