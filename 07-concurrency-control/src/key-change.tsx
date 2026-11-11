import { useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { bullets, Code, ExplainTitle, Lead, numbered, strong, Topic } from '../../shared/explain'
import { Button, Note, Result, Screen, useNav } from '../../shared/ui'
import { Diagram } from './diagram'
import { circled, count, RequestLog, useRequestLog } from './requests'

// ['user', 1]의 응답(1.5초)이 오기 전에 키를 바꿔요.
const SWITCH_MS = 500

const REMOVE_CODE = `// @tanstack/query-core 5.107.1 · query.ts의 removeObserver() (줄였어요)
if (!this.observers.length) {              // 이 쿼리를 보는 구독자가 0이 되면
  if (this.#abortSignalConsumed) {         // queryFn이 signal을 읽었으면
    this.#retryer.cancel({ revert: true }) //   끊어요
  } else {
    this.#retryer.cancelRetry()            //   아니면 끝까지 받아 캐시에 둬요
  }
}`

const USAGE_CODE = `useQuery({
  queryKey: ['user', id],
  queryFn: ({ signal }) =>
    fetch(\`/api/user/\${id}\`, { signal }).then((res) => res.json()),
})`

function Explainer() {
  return (
    <>
      <ExplainTitle>키가 바뀌면 무슨 일이 생겨요?</ExplainTitle>
      <Lead>
        키가 바뀌면 컴포넌트는 새 쿼리(['user', 2])로 옮겨 가고, 앞 쿼리(['user', 1])에서는 구독자가 하나 빠져요. 앞 요청을 끊을지는 이 순간에
        정해요.
      </Lead>
      <Diagram
        name="key-change"
        alt="0.5초에 키가 ['user', 1]에서 ['user', 2]로 바뀌어요. queryFn이 fetch에 signal을 넘기면 ①은 0.5초에 끊기고 ②가 나가요. signal을 안 넘기면 ①은 끝까지 받아 캐시에 두고, ②는 따로 나가요."
      />
      <Topic icon="🔍" title="라이브러리 코드로 보면">
        <Code code={REMOVE_CODE} />
      </Topic>
      <Topic icon="✂️" title="두 가지가 다 맞아야 끊어요">
        <ol className={numbered}>
          <li>
            <strong className={strong}>그 쿼리를 보는 구독자가 0이 돼요.</strong> 같은 키를 보는 다른 컴포넌트가 남아 있으면 끊지 않아요.
          </li>
          <li>
            <strong className={strong}>queryFn이 signal을 읽었어요.</strong> 읽지 않았으면 끝까지 받아서 캐시에 둬요. 다시 그 키로 오면 바로 보여줘요.
          </li>
        </ol>
        <Code code={USAGE_CODE} />
      </Topic>
      <Topic icon="⚠️" title="signal은 읽기만 해도 표시돼요">
        <ul className={bullets}>
          <li>({'{ signal }'}) ={'>'}처럼 구조 분해만 해도 TanStack Query는 '끊어도 되는 요청'으로 봐요.</li>
          <li>
            이때 fetch에 넘기지 않으면 <strong className={strong}>결과만 버리고 HTTP 요청은 끝까지 가요.</strong> 읽었으면 꼭 fetch(url, {'{ signal }'})로
            넘겨요. axios도 같은 signal 옵션을 받아요.
          </li>
          <li>그래서 이 화면은 스위치를 끄면 ctx.signal을 아예 읽지 않아요.</li>
        </ul>
      </Topic>
      <Topic icon="🚪" title="화면을 떠날 때도 똑같아요">
        <p>
          키가 바뀔 때뿐 아니라 컴포넌트가 사라져 구독자가 0이 될 때도 같은 규칙으로 끊어요. 개발 모드의 StrictMode가 구독을 끊었다 다시 붙이면 첫
          요청이 끊기고 다시 나가는 것도 이 때문이에요.
        </p>
      </Topic>
    </>
  )
}

type FetchUser = ReturnType<typeof useRequestLog>['fetchUser']

function UserView({ id, wire, fetchUser }: { id: number; wire: boolean; fetchUser: FetchUser }) {
  const { data, isFetching } = useQuery({
    queryKey: ['user', id],
    // signal은 읽기만 해도 '끊어도 되는 요청'으로 표시돼요. 그래서 끌 때는 ctx.signal을 아예 읽지 않아요.
    queryFn: (ctx) => fetchUser(id, { signal: wire ? ctx.signal : undefined }),
  })
  return (
    <div className="rounded-3xl bg-grey-50 p-5">
      <p className="text-[14px] font-medium text-grey-500">지금 보는 키</p>
      <p className="mt-1 text-[17px] font-semibold text-grey-900">['user', {id}]</p>
      <p className="mt-1 text-[13px] text-grey-500">{isFetching ? '불러오는 중이에요' : data && `${circled(data.n)} 응답 · ${data.name}`}</p>
    </div>
  )
}

export function KeyChange({ feature }: { feature: { id: string; icon: string } }) {
  const { back } = useNav()
  const client = useQueryClient()
  const fetching = useIsFetching()
  const { lines, reset, fetchUser } = useRequestLog()
  const [run, setRun] = useState(0)
  const [id, setId] = useState(1)
  const [wire, setWire] = useState(true)

  function start() {
    client.removeQueries({ queryKey: ['user'] })
    reset()
    setId(1)
    setRun((r) => r + 1)
    setTimeout(() => setId(2), SWITCH_MS)
  }

  // signal을 안 쓰면 키를 바꾼 뒤에도 ①이 계속 받는 중이라, useIsFetching이 그것까지 세요.
  const busy = fetching > 0 || (run > 0 && id === 1)
  const done = run > 0 && !busy && count(lines, 'received') > 0
  const cached = client.getQueryData(['user', 1]) !== undefined

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['queryKey', 'signal']}
      title={'불러오는 중에 키가 바뀌면\n앞 요청은 어떻게 될까요?'}
      description="['user', 1]을 불러오다가 0.5초 뒤 ['user', 2]로 바꿔요. 사용자가 1번 탭을 눌렀다가 바로 2번 탭을 누른 상황이에요."
      cta={
        <Button onClick={start} disabled={busy}>
          {busy ? '응답을 기다리는 중이에요' : '1번을 불러오다 2번으로 바꾸기'}
        </Button>
      }
    >
      {done && (
        <Result>
          {count(lines, 'aborted') > 0
            ? "키가 ['user', 2]로 바뀌자 구독자가 없어진 ①이 끊기고 ②가 나갔어요. Network 탭에서 ①은 (canceled)로 보여요."
            : `signal을 넘기지 않아서 ①은 끊기지 않고 끝까지 받았어요. 화면엔 안 쓰지만 캐시(['user', 1])에 ${cached ? '남아 있어요' : '없어요'}.`}
        </Result>
      )}
      <label className="flex items-center justify-between gap-4 rounded-3xl bg-grey-50 p-5">
        <span>
          <span className="block text-[17px] font-semibold text-grey-900">queryFn에서 signal 넘기기</span>
          <span className="mt-0.5 block text-[14px] text-grey-500">fetch(url, {'{ signal }'})처럼 넘겨요</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={wire}
          disabled={busy}
          onChange={(e) => setWire(e.target.checked)}
          className="size-6 shrink-0 accent-primary"
        />
      </label>
      {run ? (
        <UserView key={run} id={id} wire={wire} fetchUser={fetchUser} />
      ) : (
        <div className="rounded-3xl border-2 border-dashed border-grey-200 p-5 text-[15px] text-grey-500">버튼을 누르면 ['user', 1]부터 불러요.</div>
      )}
      <RequestLog lines={lines} />
      <Note>스위치를 끄고 다시 해보면, ①이 끊기지 않고 끝까지 받는 걸 볼 수 있어요.</Note>
      <hr className="-mx-6 mt-6 h-3 border-0 bg-grey-100" />
      <Explainer />
    </Screen>
  )
}
