import { useEffect, useState } from 'react'
import { Button, Card, InfoList, Note, Result, Screen, useNav, yesNo } from '../../shared/ui'
import { bullets, Code, ExplainTitle, Lead, numbered, strong, Topic } from '../../shared/explain'
import { Report } from './report'
import { now, TAB_ID, TwoTabSteps } from './tab'

const LOCK = 'token-refresh'
const TOKEN_KEY = 'multi-tab-lab:token'
const HOLDER_KEY = 'multi-tab-lab:lock-holder'
// 서버에 갱신을 요청하고 답을 받는 시간이라고 생각해요. 두 탭에서 겹쳐 누를 수 있게 넉넉히 잡았어요.
const REFRESH_MS = 3000

const supported = 'locks' in navigator

type Token = { version: number; by: string; at: string }
// 토큰은 흉내만 내요. 모든 탭이 같이 보도록 localStorage에 둬요.
const readToken = (): Token => JSON.parse(localStorage.getItem(TOKEN_KEY) ?? 'null') ?? { version: 1, by: '', at: '' }

const CODE = `const before = readToken()

await navigator.locks.request('token-refresh', async () => {
  // 기다리는 동안 다른 탭이 이미 갱신했으면 그대로 써요
  if (readToken() !== before) return
  await refreshToken()
})`

function Explainer() {
  return (
    <>
      <ExplainTitle>토큰 갱신이 겹치면 어떻게 되나요?</ExplainTitle>
      <Lead>
        로그인을 오래 유지하는 서비스는 짧게 쓰는 토큰(access token)과, 그걸 다시 받는 데 쓰는 토큰(refresh token)을 함께 써요. refresh token을 한
        번만 쓸 수 있게 해 둔 서버에서 탭 두 개가 동시에 갱신하면 문제가 생겨요.
      </Lead>
      <Topic icon="🍪" title="원티드처럼 쿠키로 로그인하면요">
        <p>
          세션 갱신도 대부분 서버가 응답 헤더(Set-Cookie)로 처리해서, 이 문제가 잘 생기지 않아요. 브라우저 JavaScript가 갱신 API를 직접 부르고, 서버가
          refresh token을 한 번만 받아주는 경우에만 생겨요. 이 화면은 그 경우를 흉내 내요.
        </p>
      </Topic>
      <Topic icon="💥" title="자물쇠가 없으면">
        <ol className={numbered}>
          <li>탭 A와 탭 B가 동시에 "토큰이 만료됐네" 하고 알아채요.</li>
          <li>둘 다 같은 refresh token으로 갱신을 요청해요.</li>
          <li>서버는 먼저 온 A에게 새 토큰을 주고, 이미 쓴 refresh token을 다시 보낸 B는 거절해요.</li>
          <li>B는 로그아웃되고, 사용자는 이유를 몰라요.</li>
        </ol>
      </Topic>
      <Topic icon="🔐" title="자물쇠를 걸면">
        <ol className={numbered}>
          <li>탭 A가 "token-refresh" 자물쇠를 먼저 잡고 갱신해요.</li>
          <li>탭 B는 자물쇠가 풀릴 때까지 기다려요.</li>
          <li>자물쇠를 잡은 B는 토큰이 이미 바뀐 걸 보고, 갱신하지 않고 새 토큰을 그대로 써요.</li>
        </ol>
        <Code code={CODE} />
      </Topic>
      <Topic icon="⚖️" title="알아둘 것">
        <ul className={bullets}>
          <li>같은 브라우저, 같은 출처의 탭끼리만 막아요. 다른 기기끼리는 막지 못해요.</li>
          <li>자물쇠를 잡은 탭이 닫히면 자물쇠는 저절로 풀려요. 다른 탭이 영원히 기다리지 않아요.</li>
          <li>
            <strong className={strong}>서버가 직전 refresh token을 몇 초 더 받아주면(유예 시간)</strong> 이 문제가 생기지 않아요. 서버에서 먼저 풀 수
            있는지 확인해요.
          </li>
        </ul>
      </Topic>
    </>
  )
}

export function WebLocks({ feature }: { feature: { id: string; icon: string } }) {
  const { back } = useNav()
  const [token, setToken] = useState(readToken)
  const [lock, setLock] = useState({ held: false, holder: '', waiting: 0 })
  const [phase, setPhase] = useState<'idle' | 'waiting' | 'refreshing'>('idle')
  const [result, setResult] = useState('')

  useEffect(() => {
    // 다른 탭이 토큰을 바꾸면 storage 이벤트로 알 수 있어요.
    const onStorage = () => setToken(readToken())
    addEventListener('storage', onStorage)
    // 자물쇠는 바뀔 때 오는 이벤트가 없어서, 0.5초마다 locks.query()로 물어봐요.
    const timer = setInterval(async () => {
      if (!supported) return
      const { held = [], pending = [] } = await navigator.locks.query()
      const isHeld = held.some((l) => l.name === LOCK)
      setLock({
        held: isHeld,
        // 누가 잡았는지는 query()가 알려주지 않아서, 잡은 탭이 이름을 적어 둬요. 잡힌 동안에만 믿어요.
        holder: isHeld ? (localStorage.getItem(HOLDER_KEY) ?? '') : '',
        waiting: pending.filter((l) => l.name === LOCK).length,
      })
    }, 500)
    return () => {
      removeEventListener('storage', onStorage)
      clearInterval(timer)
    }
  }, [])

  async function refresh() {
    const before = readToken().version
    setPhase('waiting')
    setResult('')
    await navigator.locks.request(LOCK, async () => {
      localStorage.setItem(HOLDER_KEY, TAB_ID)
      const current = readToken()
      if (current.version !== before) {
        setToken(current)
        setResult(`기다리는 동안 다른 탭(${current.by})이 이미 새 토큰(v${current.version})을 받았어요. 갱신하지 않고 그대로 써요.`)
        return
      }
      setPhase('refreshing')
      await new Promise((resolve) => setTimeout(resolve, REFRESH_MS))
      const next = { version: current.version + 1, by: TAB_ID, at: now() }
      localStorage.setItem(TOKEN_KEY, JSON.stringify(next))
      setToken(next)
      setResult(`이 탭이 새 토큰(v${next.version})을 받았어요. 기다리던 다른 탭은 이 토큰을 그대로 써요.`)
    })
    setPhase('idle')
  }

  const label = { idle: '토큰 갱신하기', waiting: '다른 탭이 끝나길 기다리는 중이에요', refreshing: '토큰을 갱신하는 중이에요' }[phase]

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['navigator.locks.request()', 'locks.query()']}
      title={'토큰 갱신을\n한 탭만 하게 해 볼까요?'}
      description="갱신하기 전에 자물쇠를 걸어요. 다른 탭은 자물쇠가 풀릴 때까지 기다렸다가, 이미 바뀐 토큰을 그대로 써요."
      cta={
        <Button onClick={refresh} disabled={!supported || phase !== 'idle'}>
          {label}
        </Button>
      }
    >
      {result && <Result>{result}</Result>}
      <div className="grid grid-cols-2 gap-2" aria-live="polite">
        <div className="rounded-3xl bg-grey-50 p-5">
          <p className="text-[14px] font-medium text-grey-500">지금 토큰</p>
          <p className="mt-1 text-[28px] font-bold text-grey-900">v{token.version}</p>
          <p className="mt-1 text-[13px] leading-[1.5] text-grey-500">{token.by ? `탭(${token.by})이 ${token.at}에 받았어요` : '처음 로그인할 때 받은 토큰이에요'}</p>
        </div>
        <div className={`rounded-3xl p-5 ${lock.held ? 'bg-primary-weak' : 'bg-grey-50'}`}>
          <p className="text-[14px] font-medium text-grey-500">자물쇠</p>
          <p className="mt-1 text-[28px]" aria-hidden>
            {lock.held ? '🔐' : '🔓'}
          </p>
          <p className="mt-1 text-[13px] leading-[1.5] text-grey-700">
            {lock.held ? `탭(${lock.holder || '?'})이 갱신하는 중이에요` : '아무 탭도 갱신하지 않아요'}
            {lock.waiting > 0 && ` · 기다리는 탭 ${lock.waiting}개`}
          </p>
        </div>
      </div>
      <TwoTabSteps
        hash={feature.id}
        steps={[
          '두 탭에서 3초 안에 차례로 "토큰 갱신하기"를 눌러요.',
          '먼저 누른 탭만 토큰을 갱신하고, 나중에 누른 탭은 기다렸다가 새 토큰을 그대로 써요. 토큰 숫자는 한 번만 올라가요.',
        ]}
      />
      <Card title="지금 상태">
        <InfoList
          items={[
            ['Web Locks', yesNo(supported)],
            ['이 탭 이름', TAB_ID],
            ['지금 단계', { idle: '쉬는 중이에요', waiting: '자물쇠를 기다려요', refreshing: '갱신하고 있어요' }[phase]],
          ]}
        />
      </Card>
      <Note>토큰과 서버 응답은 흉내만 내요. 갱신은 3초가 걸리게 해서, 두 탭이 겹치는 상황을 손으로 만들 수 있게 했어요.</Note>
      <Report id="web-locks" intro={<Explainer />} />
    </Screen>
  )
}
