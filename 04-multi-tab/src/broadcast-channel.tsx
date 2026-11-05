import { useEffect, useState } from 'react'
import { bullets, Code, ExplainTitle, Lead, numbered, strong, Topic } from '../../shared/explain'
import { Button, Card, InfoList, Note, Result, Screen, useNav, yesNo } from '../../shared/ui'
import { Report } from './report'
import { now, TAB_ID, TwoTabSteps } from './tab'

const channel = 'BroadcastChannel' in window ? new BroadcastChannel('multi-tab-lab-auth') : null

type Action = 'login' | 'logout'
type Message = { type: Action; from: string }
type Session = 'checking' | 'in' | 'out'

const KO: Record<Action, string> = { login: '로그인', logout: '로그아웃' }

/** 서버에 세션을 물어봐요. 세션 쿠키는 httpOnly라서 JavaScript로 읽을 수 없어요. 물어보는 수밖에 없어요. */
async function askServer(): Promise<'in' | 'out'> {
  const response = await fetch('/v1/me', { cache: 'no-store' })
  return response.ok ? 'in' : 'out'
}

/** 원티드처럼 인증 서버의 주소로 이동해요. 쿠키는 서버가 응답 헤더로 바꾸고, redirect_url로 돌려보내요. */
function goToAuthServer(action: Action, hash: string) {
  const back = `${location.origin}/?auth=${action}#${hash}`
  location.assign(`/v1/auth/${action}?redirect_url=${encodeURIComponent(back)}`)
}

// 인증 서버에서 redirect로 돌아온 순간이에요. 쿠키는 이미 바뀌었으니, 이때 다른 탭에 알려요.
// 주소에 붙은 표시(?auth=logout)는 새로고침해도 다시 알리지 않게 바로 지워요.
const params = new URLSearchParams(location.search)
const mark = params.get('auth')
const arrived: Action | null = mark === 'login' || mark === 'logout' ? mark : null
if (arrived) {
  params.delete('auth')
  const query = params.toString()
  history.replaceState(null, '', location.pathname + (query ? `?${query}` : '') + location.hash)
  channel?.postMessage({ type: arrived, from: TAB_ID } satisfies Message)
}

const CODE = `const channel = new BroadcastChannel('auth')

// 1. 로그아웃 버튼: 인증 서버로 이동해요. 쿠키는 서버가 지워요.
location.assign(
  '/v1/auth/logout?redirect_url=' +
    encodeURIComponent(location.origin + '/?auth=logout')
)

// 2. redirect로 돌아온 페이지: 쿠키가 지워진 뒤라 이때 알려요.
if (new URLSearchParams(location.search).get('auth') === 'logout') {
  channel.postMessage({ type: 'logout' })
}

// 3. 다른 탭: 소식만 믿지 않고 서버에 다시 물어봐요.
channel.onmessage = async () => {
  const response = await fetch('/v1/me')
  if (response.status === 401) showLoggedOut()
}`

function Explainer() {
  return (
    <>
      <ExplainTitle>쿠키로 로그아웃하는데 왜 탭을 맞춰야 해요?</ExplainTitle>
      <Lead>
        세션 쿠키는 같은 브라우저의 모든 탭이 같이 써요. 그래서 로그아웃 응답이 쿠키를 지우는 순간, 서버 기준으로는 모든 탭이 이미
        로그아웃이에요. 그런데 다른 탭의 <strong className={strong}>화면</strong>(이름, 프로필 메뉴, 작성 중인 글)은 그대로 남아요. BroadcastChannel은
        이 남은 화면을 바로 맞춰요.
      </Lead>
      <Topic icon="🔁" title="원티드 로그아웃은 이렇게 흘러가요">
        <ol className={numbered}>
          <li>로그아웃 버튼을 누르면 인증 서버의 로그아웃 주소(/v1/auth/logout?redirect_url=…)로 이동해요.</li>
          <li>서버가 응답 헤더(Set-Cookie)로 세션 쿠키를 만료시키고, redirect_url로 돌려보내요.</li>
          <li>돌아온 페이지가 "방금 로그아웃됐어요"를 BroadcastChannel로 알려요.</li>
          <li>다른 탭은 소식을 받으면 서버에 세션을 다시 물어보고(401), 로그아웃 화면으로 바꿔요.</li>
        </ol>
        <Code code={CODE} />
      </Topic>
      <Topic icon="⏱️" title="왜 돌아온 뒤에 알려요?">
        <ul className={bullets}>
          <li>로그아웃 주소로 가기 전에는 쿠키가 아직 살아 있어요. 그때 알리면, 다른 탭이 새로고침했을 때 다시 로그인된 화면이 나올 수 있어요.</li>
          <li>로그아웃이 실패하면, 실제로는 로그인 상태인데 다른 탭만 로그아웃된 것처럼 보여요.</li>
          <li>그래서 받는 탭도 소식만 믿지 않고 서버에 다시 물어봐요. 소식은 "한번 확인해 봐"라는 신호예요.</li>
        </ul>
      </Topic>
      <Topic icon="🛟" title="먼저 갖출 안전장치">
        <ul className={bullets}>
          <li>
            <strong className={strong}>API가 401을 주면 한 곳에서 처리해요.</strong> 어느 탭이든 다음 요청에서 로그인 화면으로 보내요.
          </li>
          <li>
            <strong className={strong}>탭이 다시 보일 때(visibilitychange) 세션을 물어봐요.</strong> 소식을 못 받는 다른 서브도메인 탭도 이걸로
            맞춰요. 이 화면도 그렇게 해요.
          </li>
          <li>BroadcastChannel은 이 둘 위에 얹어서, 같은 주소의 탭을 기다림 없이 바로 맞추는 데 써요.</li>
        </ul>
      </Topic>
      <Topic icon="⚖️" title="알아둘 것">
        <ul className={bullets}>
          <li>
            같은 출처(예: nextweek.wanted.co.kr)의 탭끼리만 통해요. 쿠키가 .wanted.co.kr로 공유돼 다른 서브도메인 탭도 서버 기준으로는 로그아웃되지만,
            소식은 받지 못해요.
          </li>
          <li>httpOnly 쿠키는 document.cookie로도, 쿠키가 바뀔 때 알려주는 Cookie Store API로도 보이지 않아요. 쿠키 변화를 직접 감지할 수는 없어요.</li>
          <li>보낸 탭 자신은 메시지를 받지 않아요. 다른 기기나 네이티브 앱에도 가지 않아요.</li>
        </ul>
      </Topic>
    </>
  )
}

export function BroadcastChannelScreen({ feature }: { feature: { id: string; icon: string } }) {
  const { back } = useNav()
  const [session, setSession] = useState<Session>('checking')
  const [leaving, setLeaving] = useState(false)
  const [log, setLog] = useState<string[]>(() => (arrived ? [`${now()} · ${KO[arrived]} 주소에서 돌아와서 다른 탭에 알렸어요`] : []))
  const [result, setResult] = useState(
    arrived
      ? `${KO[arrived]}하고 돌아왔어요. 쿠키는 서버가 응답 헤더로 ${arrived === 'logout' ? '지웠고' : '만들었고'}, 열려 있는 다른 탭에 알렸어요.`
      : '',
  )

  async function check(reason: string) {
    const next = await askServer()
    setSession(next)
    setLog((prev) => [`${now()} · ${reason} → ${next === 'in' ? '200, 로그인 상태예요' : '401, 로그아웃 상태예요'}`, ...prev])
    return next
  }

  useEffect(() => {
    void check('화면을 열어서 서버에 물어봤어요')

    const onMessage = async ({ data }: MessageEvent<Message>) => {
      const next = await check(`탭(${data.from})에서 ${KO[data.type]}했다는 소식을 받고 서버에 물어봤어요`)
      setResult(`다른 탭(${data.from})의 소식을 받고 서버에 다시 물어봤어요. 이 탭도 ${next === 'in' ? '로그인' : '로그아웃'} 화면으로 바꿨어요.`)
    }
    // 탭이 다시 보일 때도 물어봐요. 소식을 못 받은 경우(다른 서브도메인 탭 등)까지 맞춰요.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void check('탭이 다시 보여서 서버에 물어봤어요')
    }
    channel?.addEventListener('message', onMessage)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      channel?.removeEventListener('message', onMessage)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const action: Action = session === 'in' ? 'logout' : 'login'

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['BroadcastChannel', 'httpOnly 쿠키', 'visibilitychange']}
      title={'한 탭에서 로그아웃하면\n모든 탭이 따라오게 해 볼까요?'}
      description="원티드처럼 인증 서버가 httpOnly 쿠키를 지우고 돌려보내면, 돌아온 탭이 다른 탭에 알려요. 다른 탭은 서버에 다시 물어보고 바로 로그아웃 화면으로 바뀌어요."
      cta={
        <Button
          onClick={() => {
            setLeaving(true)
            goToAuthServer(action, feature.id)
          }}
          disabled={session === 'checking' || leaving}
        >
          {leaving ? '인증 서버로 가는 중이에요' : session === 'checking' ? '서버에 물어보는 중이에요' : `${KO[action]}하기`}
        </Button>
      }
    >
      {result && <Result>{result}</Result>}
      <div className="flex items-center gap-4 rounded-3xl bg-grey-50 px-5 py-6" aria-live="polite">
        <span className="grid size-14 place-items-center rounded-full bg-white text-[28px]" aria-hidden>
          {session === 'in' ? '🙂' : session === 'out' ? '🔒' : '⏳'}
        </span>
        <span>
          <span className="block text-[20px] font-bold text-grey-900">
            {session === 'in' ? '로그인 중이에요' : session === 'out' ? '로그아웃했어요' : '확인하는 중이에요'}
          </span>
          <span className="block text-[14px] text-grey-500">탭({TAB_ID})에서 서버(/v1/me)에 물어본 결과예요</span>
        </span>
      </div>
      <TwoTabSteps
        hash={feature.id}
        steps={[
          '한 탭에서 "로그인하기"를 눌러요. 인증 서버를 거쳐 이 화면으로 돌아와요.',
          '돌아온 탭이 소식을 보내면, 다른 탭은 서버에 다시 물어보고 로그인 화면으로 바뀌어요.',
          '이번엔 "로그아웃하기"를 눌러요. 쿠키가 지워진 뒤에 알리니까, 다른 탭도 바로 로그아웃 화면이 돼요.',
        ]}
      />
      <Card title="이 탭이 겪은 일">
        {log.length ? (
          <ul className="flex flex-col gap-1.5 text-[14px] leading-[1.6] text-grey-700">
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] text-grey-500">아직 아무 일도 없어요</p>
        )}
      </Card>
      <Card title="지금 상태">
        <InfoList
          items={[
            ['세션 쿠키', 'lab_session · HttpOnly'],
            ['JavaScript로 보이나요?', document.cookie.includes('lab_session') ? '보여요' : '안 보여요 (document.cookie에 없어요)'],
            ['BroadcastChannel', yesNo(!!channel)],
            ['이 탭 이름', TAB_ID],
          ]}
        />
      </Card>
      <Note>
        로그인·로그아웃은 Vite 서버에 붙인 가짜 인증 서버(mock-auth.ts)가 처리해요. 원티드처럼 응답 헤더로 httpOnly 쿠키를 만들고 지워요. 진짜
        인증 서버는 다른 서브도메인에 있다는 점만 달라요.
      </Note>
      <Report id="broadcast-channel" intro={<Explainer />} />
    </Screen>
  )
}
