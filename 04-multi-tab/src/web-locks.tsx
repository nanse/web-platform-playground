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

const BASIC_CODE = `await navigator.locks.request('token-refresh', async () => {
  // 이 안은 한 번에 한 탭만 들어와요. 다른 탭은 여기서 기다려요.
  await refreshToken()
})
// 함수(Promise)가 끝나면 자물쇠가 저절로 풀려요.`

const REFRESH_CODE = `const before = readToken()

await navigator.locks.request('token-refresh', async () => {
  // 기다리는 동안 다른 탭이 이미 갱신했으면 그대로 써요
  if (readToken() !== before) return
  await refreshToken()
})`

const LEADER_CODE = `// 끝나지 않는 Promise로 자물쇠를 계속 잡고 있으면, 그 탭이 리더예요.
navigator.locks.request('notification-leader', () => {
  startPolling() // 리더만 서버에 물어봐요
  return new Promise(() => {}) // 탭이 닫힐 때까지 놓지 않아요
})`

const CLEANUP_CODE = `// 다른 탭이 이미 하고 있으면 기다리지 않고 건너뛰어요.
await navigator.locks.request('cleanup', { ifAvailable: true }, async (lock) => {
  if (!lock) return
  await deleteOldCache()
})`

function Explainer() {
  return (
    <>
      <ExplainTitle>Web Locks는 어떤 문제를 풀어요?</ExplainTitle>
      <Lead>
        같은 브라우저, 같은 출처의 탭과 워커가 함께 쓰는 <strong className={strong}>이름 붙은 자물쇠</strong>예요. 탭 하나 안에서는 JavaScript가 한
        줄씩 실행되지만, 탭이 여러 개면 같은 저장소(localStorage, IndexedDB)와 같은 서버 계정을 진짜로 동시에 건드려요. Web Locks는 "이 일은 한
        번에 한 탭만" 하게 해요.
      </Lead>
      <Topic icon="🚧" title="예전에는 이렇게 막았어요">
        <p>localStorage에 "작업 중" 표시를 적고, 표시가 있으면 기다렸어요. 그런데 두 가지가 안 됐어요.</p>
        <ol className={numbered}>
          <li>
            <strong className={strong}>동시에 확인하면 둘 다 통과해요.</strong> 두 탭이 거의 같은 순간 "표시 없네?" 하고 읽으면, 둘 다 표시를 적고
            둘 다 일해요. HTML 명세에 탭끼리 localStorage를 막는 장치(storage mutex)가 있었지만, 브라우저들이 구현하지 않아서 빠졌어요.
          </li>
          <li>
            <strong className={strong}>잡은 탭이 죽으면 표시가 남아요.</strong> 표시를 적은 탭이 닫히거나 멈추면 아무도 일을 못 해요. 그래서 "10초
            지나면 무시" 같은 땜질을 덧대야 했어요.
          </li>
        </ol>
      </Topic>
      <Topic icon="🔐" title="Web Locks는 브라우저가 직접 맡아요">
        <ul className={bullets}>
          <li>자물쇠는 한 번에 한 탭만 잡아요. 확인과 잡기가 한 번에 일어나요.</li>
          <li>잡은 함수가 끝나면 저절로 풀려요.</li>
          <li>잡은 탭이 닫히거나 멈춰도 저절로 풀려요. 다른 탭이 영원히 기다리지 않아요.</li>
          <li>기다리는 탭은 줄 선 순서대로 받아요.</li>
        </ul>
        <Code code={BASIC_CODE} />
        <ul className={bullets}>
          <li>
            <strong className={strong}>ifAvailable: true</strong> · 누가 잡고 있으면 기다리지 않고 바로 넘어가요. "누가 하고 있으면 나는 안 해도 돼"일
            때 써요.
          </li>
          <li>
            <strong className={strong}>{"mode: 'shared'"}</strong> · 여러 탭이 같이 잡아요. 읽기는 여럿이, 쓰기는 하나만 할 때 써요.
          </li>
          <li>
            <strong className={strong}>signal</strong> · 기다리기를 그만둬요. AbortSignal.timeout(5000)처럼 시간 제한을 둘 때 써요.
          </li>
          <li>
            <strong className={strong}>locks.query()</strong> · 지금 누가 잡고 있고, 몇 탭이 기다리는지 봐요. 이 화면의 자물쇠 카드가 이걸로 그려요.
          </li>
        </ul>
      </Topic>
      <Topic icon="🔑" title="쓰는 곳 1 · 토큰 갱신 (이 화면)">
        <p>
          로그인을 오래 유지하는 서비스는 짧게 쓰는 토큰(access token)과, 그걸 다시 받는 데 쓰는 토큰(refresh token)을 함께 써요. refresh token을 한
          번만 받아주는 서버에서 두 탭이 동시에 갱신하면 이렇게 돼요.
        </p>
        <ol className={numbered}>
          <li>탭 A와 탭 B가 동시에 "토큰이 만료됐네" 하고 같은 refresh token으로 갱신을 요청해요.</li>
          <li>서버는 먼저 온 A에게 새 토큰을 주고, 이미 쓴 refresh token을 보낸 B는 거절해요.</li>
          <li>B는 로그아웃되고, 사용자는 이유를 몰라요.</li>
        </ol>
        <p>자물쇠를 걸면 먼저 잡은 탭만 갱신하고, 기다리던 탭은 이미 바뀐 토큰을 그대로 써요.</p>
        <Code code={REFRESH_CODE} />
        <p>
          <strong className={strong}>원티드처럼 쿠키로 로그인하면</strong> 세션 갱신도 서버가 응답 헤더(Set-Cookie)로 처리해서 대부분 필요 없어요.
          브라우저 JavaScript가 갱신 API를 직접 부르고, 서버가 refresh token을 한 번만 받아줄 때만 생겨요. 이 화면은 그 경우를 흉내 내요.
        </p>
      </Topic>
      <Topic icon="👑" title="쓰는 곳 2 · 한 탭만 서버와 연결하기">
        <p>
          탭 10개가 각자 30초마다 알림을 물어보면 서버 요청도 10배예요. 한 탭(리더)만 서버와 연결하고, 받은 걸 BroadcastChannel로 나눠 주면 돼요.
        </p>
        <Code code={LEADER_CODE} />
        <p>
          리더 탭이 닫히면 자물쇠가 풀리고, 기다리던 다음 탭이 자동으로 리더가 돼요. 살아 있는지 확인하는 신호(하트비트)도, 타임아웃도 필요 없어요.
          원티드가 탭마다 알림 폴링이나 실시간 연결을 따로 연다면 <strong className={strong}>토큰 갱신보다 이쪽이 더 쓸 만해요.</strong>
        </p>
      </Topic>
      <Topic icon="📮" title="쓰는 곳 3 · 한 탭만 하면 되는 일">
        <ul className={bullets}>
          <li>
            <strong className={strong}>대기열 비우기:</strong> 보내지 못한 분석 이벤트를 IndexedDB에 모아 뒀다가 보낼 때, 여러 탭이 동시에 비우면 같은
            이벤트를 두 번 보내요. IndexedDB 트랜잭션은 중간에 await fetch()가 끼면 지켜 주지 못해서, "읽기 → 보내기 → 지우기" 전체를 자물쇠로
            감싸요.
          </li>
          <li>
            <strong className={strong}>정리 작업:</strong> 오래된 캐시 지우기, 저장소 데이터 옮기기처럼 탭마다 할 필요 없는 일은 ifAvailable로
            건너뛰어요.
          </li>
        </ul>
        <Code code={CLEANUP_CODE} />
      </Topic>
      <Topic icon="🙅" title="이럴 땐 안 써도 돼요">
        <ul className={bullets}>
          <li>
            <strong className={strong}>탭 하나 안에서 중복 요청 막기:</strong> 버튼 연타나 같은 API 동시 호출은, 진행 중인 Promise 하나를 같이 쓰면
            충분해요.
          </li>
          <li>
            <strong className={strong}>다른 기기, 다른 브라우저, 다른 서브도메인 사이:</strong> 자물쇠는 같은 브라우저의 같은 출처 안에서만 통해요. 이건
            서버가 막아요. 같은 요청을 두 번 받아도 한 번만 처리하는 Idempotency-Key가 그 예예요.
          </li>
          <li>
            <strong className={strong}>서버에서 풀 수 있을 때:</strong> 서버가 직전 refresh token을 몇 초 더 받아주면(유예 시간) 토큰 갱신이 겹치는
            문제는 생기지 않아요.
          </li>
        </ul>
      </Topic>
      <Topic icon="⚖️" title="조심할 것">
        <ul className={bullets}>
          <li>함수가 끝나지 않으면 다른 탭은 계속 기다려요. 리더처럼 일부러 잡는 게 아니면 signal로 시간 제한을 둬요.</li>
          <li>자물쇠 두 개를 탭마다 다른 순서로 잡으면 서로를 영원히 기다려요(교착). 한 번에 하나만 잡거나 잡는 순서를 정해요.</li>
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
