import { useEffect, useRef, useState } from 'react'
import { Button, Card, InfoList, Note, Result, Screen, useNav, yesNo, type FeatureRef } from '../../shared/ui'
import { bullets, Code, ExplainTitle, Lead, numbered, strong, Topic } from '../../shared/explain'
import { Report } from './report'

type State = { tabs: number; checks: number; unread: number; checkedAt: string; by: string }

const supported = 'SharedWorker' in window
// 탭마다 짧은 이름을 붙여서, 어느 탭이 눌렀는지 보여줘요.
const TAB_ID = Math.random().toString(16).slice(2, 6).toUpperCase()

const CODE = `// notify-worker.js: 탭들이 붙을 때마다 onconnect가 불려요.
const ports = new Set()
self.onconnect = (event) => {
  const port = event.ports[0]
  ports.add(port)
  port.onmessage = () => checkNotifications()
}

async function checkNotifications() {
  const data = await (await fetch('/api/notifications')).json()
  ports.forEach((port) => port.postMessage(data)) // 모든 탭에 나눠 줘요
}

// 탭: 같은 주소, 같은 이름이면 같은 워커에 붙어요.
const worker = new SharedWorker(new URL('./notify-worker.js', import.meta.url), { name: 'notify' })
worker.port.onmessage = (event) => showBadge(event.data)
worker.port.postMessage('check')`

function Explainer() {
  return (
    <>
      <ExplainTitle>Shared Worker는 뭐예요?</ExplainTitle>
      <Lead>
        보통 워커(Dedicated Worker)는 만든 탭 하나만 써요. Shared Worker는 <strong className={strong}>같은 주소, 같은 이름</strong>이면 탭 여러 개가 워커
        하나에 붙어요. 마지막 탭이 닫히면 워커도 사라져요.
      </Lead>
      <Topic icon="🔌" title="이렇게 써요">
        <p>탭마다 port라는 전화선이 하나씩 생겨요. 워커는 붙은 port를 모아 두고, 같은 결과를 모든 탭에 보내요.</p>
        <Code code={CODE} />
      </Topic>
      <Topic icon="🆚" title="04의 Web Locks 리더 탭과 뭐가 달라요?">
        <ul className={bullets}>
          <li>
            <strong className={strong}>Shared Worker:</strong> 연결과 상태가 워커 안에 있어요. 탭 하나가 닫혀도 다른 탭이 남아 있으면 연결이 끊기지
            않아요.
          </li>
          <li>
            <strong className={strong}>Web Locks 리더 탭 + BroadcastChannel:</strong> 리더 탭이 닫히면 다음 탭이 이어받아 다시 연결해요. 대신 2022년부터
            모든 주요 브라우저에서 돼요.
          </li>
          <li>
            Shared Worker는 <strong className={strong}>크롬 안드로이드가 148(2026년)부터</strong> 지원해요. 아직 옛 버전을 쓰는 안드로이드 사용자가 있어서,
            지금은 리더 탭 방식이 더 넓게 돼요.
          </li>
        </ul>
      </Topic>
      <Topic icon="⚖️" title="알아둘 것">
        <ul className={bullets}>
          <li>탭이 닫혀도 워커가 바로 알 방법이 없어요. 그래서 떠날 때(pagehide) "나 가요"를 직접 보내요. 이 화면도 그렇게 해요.</li>
          <li>워커의 로그는 탭의 DevTools에 안 보여요. 크롬에서 chrome://inspect/#workers를 열어 따로 봐요.</li>
          <li>배포하면 새 탭은 새 워커에, 열려 있던 탭은 옛 워커에 붙어서, 잠깐 둘이 같이 돌아요.</li>
          <li>같은 출처의 탭끼리만 붙어요. 다른 서브도메인 탭은 따로 워커를 만들어요.</li>
        </ul>
      </Topic>
    </>
  )
}

export function SharedWorkerScreen({ feature }: { feature: FeatureRef }) {
  const { back } = useNav()
  const [state, setState] = useState<State | null>(null)
  const port = useRef<MessagePort | null>(null)

  useEffect(() => {
    if (!supported) return
    const worker = new SharedWorker(new URL('./workers/notify.ts', import.meta.url), { type: 'module', name: 'notify' })
    port.current = worker.port
    worker.port.onmessage = (event: MessageEvent<State>) => setState(event.data)
    const bye = () => worker.port.postMessage({ type: 'bye', tab: TAB_ID })
    addEventListener('pagehide', bye)
    return () => {
      bye()
      removeEventListener('pagehide', bye)
      worker.port.close()
    }
  }, [])

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['SharedWorker', 'MessagePort']}
      title={'탭이 여러 개여도\n서버에는 한 번만 물어볼까요?'}
      description="알림 확인을 Shared Worker 하나가 대신하고, 붙어 있는 모든 탭에 나눠 줘요. 탭이 몇 개든 서버에 물어보는 곳은 한 곳이에요."
      cta={
        <Button onClick={() => port.current?.postMessage({ type: 'check', tab: TAB_ID })} disabled={!state}>
          지금 알림 확인하기
        </Button>
      }
    >
      {!supported && <Result>이 브라우저는 Shared Worker를 지원하지 않아요. 크롬 데스크톱이나 사파리 16 이상에서 열어 봐요.</Result>}
      {state && state.checks > 0 && (
        <Result>
          {state.checkedAt}에 알림을 확인했어요. {state.by}. 붙어 있는 탭 {state.tabs}개가 모두 같은 결과를 받았어요.
        </Result>
      )}
      <div className="grid grid-cols-3 gap-2" aria-live="polite">
        {(
          [
            ['붙어 있는 탭', `${state?.tabs ?? 0}개`],
            ['서버에 물어본 횟수', `${state?.checks ?? 0}번`],
            ['새 알림', `${state?.unread ?? 0}개`],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-3xl bg-grey-50 px-4 py-5">
            <p className="text-[13px] font-medium text-grey-500">{label}</p>
            <p className="mt-1 text-[24px] font-bold text-grey-900">{value}</p>
          </div>
        ))}
      </div>
      <Card title="탭 여러 개로 해 봐요">
        <ol className={`${numbered} text-[15px] leading-[1.6] text-grey-700`}>
          <li>아래 링크로 이 화면을 새 탭에 두세 개 더 열어요. "붙어 있는 탭" 숫자가 늘어나요.</li>
          <li>아무 탭에서나 "지금 알림 확인하기"를 눌러요.</li>
          <li>모든 탭의 숫자가 같이 바뀌어요. 탭이 몇 개든 "서버에 물어본 횟수"는 한 번씩만 올라가요. 10초마다 워커가 알아서도 물어봐요.</li>
        </ol>
        <a
          href={location.href}
          target="_blank"
          rel="noopener"
          className="mt-4 block rounded-2xl bg-white py-3 text-center text-[15px] font-semibold text-primary"
        >
          이 화면을 새 탭으로 열기
        </a>
      </Card>
      <Card title="지금 상태">
        <InfoList
          items={[
            ['Shared Worker', yesNo(supported)],
            ['이 탭 이름', TAB_ID],
          ]}
        />
      </Card>
      <Note>
        알림은 흉내만 내요. 확인할 때마다 새 알림이 1개 왔다고 쳐요. 워커 코드는 <code>src/workers/notify.ts</code>에 있어요.
      </Note>
      <Report id="shared-worker" intro={<Explainer />} />
    </Screen>
  )
}
