import { useSyncExternalStore } from 'react'
import { Button, Card, InfoList, Note, Result, Screen, useNav, yesNo, type FeatureRef } from '../../shared/ui'
import { bullets, ExplainTitle, Lead, strong, Topic } from '../../shared/explain'
import { Report } from './report'

type Navigation = PerformanceNavigationTiming & { notRestoredReasons?: { reasons?: { reason: string }[] } | null }

// 이 문서를 처음 불러온 시각. bfcache로 돌아오면 다시 불러오지 않으니 이 값이 그대로 남아요.
const openedAt = new Date()
const navigation = performance.getEntriesByType('navigation')[0] as Navigation | undefined
const supportsReasons = 'notRestoredReasons' in PerformanceNavigationTiming.prototype

// pageshow는 bfcache로 돌아올 때도 와요. 그때 persisted가 true예요. 어느 화면에 있든 받도록 모듈에서 바로 들어요.
let restores = 0
const listeners = new Set<() => void>()
addEventListener('pageshow', (event) => {
  if (!event.persisted) return
  restores += 1
  listeners.forEach((listener) => listener())
})

const NAVIGATION_TYPE: Record<string, string> = {
  navigate: '주소로 열었어요',
  reload: '새로고침했어요',
  back_forward: '뒤로·앞으로 가기로 왔어요',
  prerender: '미리 그려 둔 걸 보여줬어요',
}

function Explainer() {
  return (
    <>
      <ExplainTitle>bfcache를 쉽게 말하면</ExplainTitle>
      <Lead>
        페이지를 떠날 때 브라우저가 그 페이지를 <strong className={strong}>통째로 얼려 뒀다가</strong>, 뒤로 가기를 누르면 그대로 꺼내 주는 기능이에요.
        처음부터 다시 받지 않으니 기다림이 없어요.
      </Lead>
      <Topic icon="📈" title="생각보다 자주 일어나요">
        <p>크롬 사용 데이터로는 데스크톱 이동 10번 중 1번, 모바일 5번 중 1번이 뒤로·앞으로 가기예요. 따로 만들 기능은 없고, 막는 원인만 없애면 돼요.</p>
      </Topic>
      <Topic icon="🧱" title="이런 게 있으면 얼려 두지 못해요">
        <ul className={bullets}>
          <li>
            <strong className={strong}>unload 이벤트</strong>: 쓰지 않아요. 떠날 때 할 일은 pagehide로 옮겨요.
          </li>
          <li>
            <strong className={strong}>Cache-Control: no-store</strong>: 로그인한 페이지와 Next.js가 SSR한 페이지에 붙어요. 크롬은 그래도 얼려 두지만, 떠난
            사이 쿠키가 바뀌면(로그인·로그아웃) 버리고 다시 불러와요. 다른 브라우저는 얼려 두지 않을 수 있어요.
          </li>
          <li>
            <strong className={strong}>열려 있는 연결</strong>: WebSocket·WebRTC, 진행 중인 fetch나 IndexedDB 작업이 있으면 브라우저에 따라 얼려 두지 않아요.
          </li>
          <li>
            <strong className={strong}>window.opener</strong>: 다른 창이 이 페이지를 붙잡고 있으면 안전하게 얼릴 수 없어요.
          </li>
        </ul>
        <p>크롬은 막힌 이유를 notRestoredReasons로 알려줘요. 이 화면도 다시 불러와졌다면 그 이유를 보여줘요.</p>
      </Topic>
      <Topic icon="🧭" title="Next.js에서는 문서가 바뀔 때만 일해요">
        <p>따로 짤 코드는 없어요. 브라우저에서 API로 받는 공고 목록과 서버에서 그리는(SSR) 공고 상세를 만들어 크롬 157에서 돌려 봤어요.</p>
        <ul className={bullets}>
          <li>
            <strong className={strong}>목록 → Link로 상세 → 뒤로</strong>: 문서가 그대로라 bfcache가 아니에요. 목록을 처음부터 다시 그려서 '불러오는
            중'이 보이고 API도 다시 불러요. 그동안 페이지가 짧아져서 보던 스크롤 위치도 잃어요.
          </li>
          <li>
            <strong className={strong}>목록이나 상세 → 외부 페이지 → 뒤로</strong>: bfcache로 꺼내요. 받아 둔 목록도, 서버에서 그린 상세도 그대로라 API도
            SSR도 다시 하지 않아요.
          </li>
          <li>
            <strong className={strong}>next dev</strong>: 개발 서버가 붙이는 no-store와 WebSocket 연결 때문에 얼려 두지 않아요. build 후 start로 확인해요.
          </li>
        </ul>
        <p>
          앱 안에서 뒤로 갈 때 보던 자리 그대로 보여주고 싶다면 bfcache가 아니라 받아 둔 데이터로 바로 그리면 돼요. TanStack Query에 staleTime과
          gcTime을 주니 '불러오는 중' 없이 그려져서, 크롬이 스크롤 위치까지 되돌려 놨어요.
        </p>
      </Topic>
    </>
  )
}

export function Bfcache({ feature }: { feature: FeatureRef }) {
  const { back } = useNav()
  const restored = useSyncExternalStore(
    (listener) => (listeners.add(listener), () => listeners.delete(listener)),
    () => restores,
  )
  const reasons = navigation?.notRestoredReasons?.reasons?.map((r) => r.reason) ?? []
  const reloadedOnBack = navigation?.type === 'back_forward' && !restored

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['pageshow', 'persisted', 'notRestoredReasons']}
      title={'뒤로 가기를 눌렀을 때\n바로 보이게 해 볼까요?'}
      description="다른 페이지에 갔다가 뒤로 돌아와 봐요. 얼려 둔 화면을 꺼내면 아래 '이 화면을 연 시각'이 그대로 남아 있어요."
      cta={<Button onClick={() => location.assign('/other.html?from=bfcache')}>다른 페이지에 갔다가 돌아오기</Button>}
    >
      {restored > 0 && (
        <Result>뒤로 가기로 돌아왔는데, 처음부터 다시 불러오지 않고 얼려 둔 화면을 그대로 꺼냈어요. (pageshow persisted: true)</Result>
      )}
      {reloadedOnBack && (
        <Result>
          뒤로 가기로 왔지만 얼려 둔 화면이 없어서 다시 불러왔어요.{' '}
          {reasons.length ? `막힌 이유: ${reasons.join(', ')}` : '이 브라우저는 막힌 이유를 알려주지 않아요.'}
        </Result>
      )}
      <div className="rounded-3xl bg-grey-50 px-5 py-6 text-center">
        <p className="text-[14px] font-semibold text-grey-500">이 화면을 연 시각</p>
        <p className="mt-1 text-[28px] font-bold tracking-[-0.02em] text-grey-900">{openedAt.toLocaleTimeString('ko-KR')}</p>
        <p className="mt-1 text-[14px] text-grey-500">다시 불러오면 새 시각으로 바뀌어요</p>
      </div>
      <Card title="지금 상태">
        <InfoList
          items={[
            ['이 문서를 연 방법', NAVIGATION_TYPE[navigation?.type ?? ''] ?? '알 수 없어요'],
            ['얼려 둔 화면에서 꺼낸 횟수', `${restored}번`],
            ['막힌 이유 알려주기', yesNo(supportsReasons)],
          ]}
        />
      </Card>
      <Note>
        실제 배포와 같은 조건으로 보려면 <code>build</code> 후 <code>preview</code>로 열어요. 얼려 둔 화면은 크롬 DevTools → Application → Back/forward
        cache에서 직접 시험해 볼 수도 있어요.
      </Note>
      <Report id="bfcache" intro={<Explainer />} />
    </Screen>
  )
}
