import { useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { bullets, Code, ExplainTitle, Lead, strong, Topic } from '../../shared/explain'
import { Button, Note, Result, Screen, useNav } from '../../shared/ui'
import { Diagram } from './diagram'
import { circled, count, RequestLog, useRequestLog } from './requests'

// 첫 요청의 응답(1.5초)이 오기 전에 한 번 더 불러요.
const SECOND_MS = 500

const CASES = {
  cancel: {
    title: 'refetch()',
    summary: '옵션 없이 다시 불러요. 이미 받은 데이터가 있어요.',
    cancels: true,
    why: '옵션을 주지 않아도 cancelRefetch 기본값이 true라서요.',
  },
  wait: {
    title: 'refetch({ cancelRefetch: false })',
    summary: '진행 중인 요청이 있으면 그걸 기다리라고 해요.',
    cancels: false,
    why: 'cancelRefetch: false라서요.',
  },
  empty: {
    title: '데이터가 없을 때 refetch()',
    summary: '캐시를 비우고 처음 불러오는 중에 다시 불러요.',
    cancels: false,
    why: 'cancelRefetch는 true지만 아직 받은 데이터가 없어서요.',
  },
}
type Case = keyof typeof CASES

const USAGE_CODE = `const { refetch } = useQuery({ queryKey: ['user', 1], queryFn })

refetch()                          // 데이터가 있으면 앞 요청을 끊고 새로 보내요
refetch({ cancelRefetch: false })  // 앞 요청이 있으면 그걸 기다려요`

function Explainer() {
  return (
    <>
      <ExplainTitle>언제 끊고, 언제 기다려요?</ExplainTitle>
      <Lead>
        진행 중일 때 다시 부르면 cancelRefetch가 정해요. 다만 <strong className={strong}>이미 받은 데이터가 있을 때만</strong> 끊어요. 처음
        불러오는 중이면 cancelRefetch가 true여도 같이 기다려요.
      </Lead>
      <Diagram
        name="cancel-refetch"
        alt="['user', 1]을 불러오고 0.5초 뒤 한 번 더 불러요. 데이터가 있을 때 refetch()는 ①을 끊고 ②를 새로 보내요. refetch({ cancelRefetch: false })와, 데이터가 없을 때 refetch()는 새 요청 없이 ①을 같이 기다려요."
      />
      <Topic icon="🧭" title="부르는 곳마다 기본값이 달라요">
        <ul className={bullets}>
          <li>
            <strong className={strong}>끊어요 (기본 true):</strong> refetch(), queryClient.refetchQueries(), invalidateQueries(), resetQueries()
          </li>
          <li>
            <strong className={strong}>기다려요:</strong> useQuery 마운트, 창 포커스, 네트워크 다시 연결, refetchInterval
          </li>
        </ul>
        <p>그래서 refetch({'{ cancelRefetch: true }'})라고 적지 않아도 refetch()만으로 끊어요. 기다리게 하려면 false를 적어요.</p>
        <Code code={USAGE_CODE} />
      </Topic>
      <Topic icon="⚠️" title="'끊는다'는 결과를 버린다는 뜻이에요">
        <p>
          TanStack Query가 끊으면 그 요청의 결과를 쓰지 않아요. HTTP 요청까지 끊기려면 queryFn이 fetch에 signal을 넘겨야 해요. 넘기지 않으면 응답은
          끝까지 오고, 받은 뒤 버려져요. 이 화면은 signal을 넘겨서 Network 탭에서 (canceled)로 보여요.
        </p>
      </Topic>
    </>
  )
}

export function CancelRefetch({ feature }: { feature: { id: string; icon: string } }) {
  const { back } = useNav()
  const client = useQueryClient()
  const fetching = useIsFetching()
  const { lines, reset, fetchUser } = useRequestLog()
  const [mode, setMode] = useState<Case>('cancel')
  const [ran, setRan] = useState<Case | null>(null)
  const [pending, setPending] = useState(false)
  // 화면에 들어오면 사용자 1을 한 번 받아 둬요. 'refetch()'와 'cancelRefetch: false'는 데이터가 있어야 비교돼요.
  const { data, isFetching, refetch } = useQuery({ queryKey: ['user', 1], queryFn: ({ signal }) => fetchUser(1, { signal }) })

  function start() {
    reset()
    setRan(mode)
    setPending(true)
    // 첫 번째로 불러요(①). 'empty'는 데이터를 비우고 처음부터 불러요.
    void (mode === 'empty' ? client.resetQueries({ queryKey: ['user', 1] }) : refetch())
    setTimeout(() => {
      // ①이 아직 오는 중일 때 한 번 더 불러요.
      void refetch(mode === 'wait' ? { cancelRefetch: false } : undefined)
      setPending(false)
    }, SECOND_MS)
  }

  const busy = fetching > 0 || pending
  const aborted = count(lines, 'aborted') > 0

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['refetch()', 'cancelRefetch']}
      title={'불러오는 중에 다시 부르면\n앞 요청을 끊을까요?'}
      description="['user', 1]을 불러오고, 0.5초 뒤 응답이 오기 전에 한 번 더 불러요. 두 번째 부름을 골라 보세요."
      cta={
        <Button onClick={start} disabled={busy}>
          {busy ? '응답을 기다리는 중이에요' : '불러오는 중에 한 번 더 부르기'}
        </Button>
      }
    >
      {ran && !busy && (
        <Result>
          {aborted ? '두 번째 부름이 ①을 끊고 ②를 새로 보냈어요.' : '두 번째 부름은 새 요청 없이 ①을 같이 기다렸어요.'}{' '}
          {CASES[ran].cancels === aborted ? CASES[ran].why : '예상과 달라요. 네트워크 기록을 확인해 주세요.'}
        </Result>
      )}
      <fieldset className="flex flex-col gap-2" disabled={busy}>
        <legend className="mb-2 text-[15px] font-semibold text-grey-700">두 번째 부름</legend>
        {(Object.keys(CASES) as Case[]).map((key) => (
          <label
            key={key}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
              mode === key ? 'border-primary bg-primary-weak' : 'border-grey-200 hover:bg-grey-50'
            }`}
          >
            <input type="radio" name="case" checked={mode === key} onChange={() => setMode(key)} className="size-5 shrink-0 accent-primary" />
            <span>
              <code className="block text-[15px] font-semibold text-grey-900">{CASES[key].title}</code>
              <span className="mt-0.5 block text-[14px] text-grey-500">{CASES[key].summary}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="rounded-3xl bg-grey-50 p-5" aria-live="polite">
        <p className="text-[14px] font-medium text-grey-500">['user', 1]</p>
        <p className="mt-1 text-[17px] font-semibold text-grey-900">
          {isFetching ? '불러오는 중이에요' : data ? `${circled(data.n)} 응답 · ${data.name}` : '아직 데이터가 없어요'}
        </p>
      </div>
      <RequestLog lines={lines} />
      <Note>처음 들어올 때 보이는 ①은 데이터를 받아 두는 요청이에요. 버튼을 누르면 기록을 비우고 다시 세요.</Note>
      <hr className="-mx-6 mt-6 h-3 border-0 bg-grey-100" />
      <Explainer />
    </Screen>
  )
}
