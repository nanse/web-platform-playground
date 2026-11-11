import { useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { bullets, Code, ExplainTitle, Lead, strong, Topic } from '../../shared/explain'
import { Button, Note, Result, Screen, useNav } from '../../shared/ui'
import { Diagram } from './diagram'
import { circled, count, RequestLog, useRequestLog, type User } from './requests'

// B는 A가 보낸 요청이 아직 오는 중일 때 들어와요(API는 1.5초 뒤에 답해요).
const LATE_MS = 500

type QueryFn = (ctx: { signal: AbortSignal }) => Promise<User>

const FETCH_CODE = `// @tanstack/query-core 5.107.1 · query.ts의 fetch() (줄였어요)
if (this.state.fetchStatus !== 'idle') {   // 이미 불러오는 중이면
  if (this.state.data !== undefined && fetchOptions?.cancelRefetch) {
    this.cancel({ silent: true })           // 데이터가 있고 cancelRefetch면 끊고 새로 보내요
  } else if (this.#retryer && this.#fetchPromise) {
    return this.#fetchPromise               // 아니면 진행 중인 Promise를 그대로 돌려줘요
  }
}`

const USAGE_CODE = `// 서로 다른 컴포넌트가 같은 키로 불러요
function A() { useQuery({ queryKey: ['user', 1], queryFn }) }
function B() { useQuery({ queryKey: ['user', 1], queryFn }) }
// queryFn은 한 번만 실행되고, A와 B는 같은 data를 받아요`

function Explainer() {
  return (
    <>
      <ExplainTitle>왜 한 번만 나가요?</ExplainTitle>
      <Lead>
        TanStack Query는 queryKey마다 쿼리를 <strong className={strong}>하나만</strong> 만들어 캐시(QueryCache)에 둬요. 컴포넌트마다 useQuery를
        불러도 키가 같으면 같은 쿼리를 함께 바라봐요(옵저버). 그래서 두 번째로 불렀을 때 진행 중인 요청이 있으면, 새로 보내지 않고 그 Promise를
        돌려줘요.
      </Lead>
      <Diagram
        name="single-flight"
        alt="컴포넌트 A가 0초에 ['user', 1]을 부르고 B가 0.5초에 같은 키로 불러요. 네트워크 요청은 ① 하나만 나가고, 1.5초에 온 응답을 A와 B가 같이 받아요. switchMap이나 takeLatest라면 ①을 끊고 ②를 새로 보내요."
      />
      <Topic icon="🔍" title="라이브러리 코드로 보면">
        <Code code={FETCH_CODE} />
        <p>
          useQuery가 마운트될 때는 cancelRefetch 없이 불러서, 언제나 아래쪽(같이 기다리기)으로 가요. B가 0.5초 늦게 들어와도 ①을 같이 기다린 이유예요.
        </p>
        <Code code={USAGE_CODE} />
      </Topic>
      <Topic icon="🆚" title="switchMap, takeLatest와 달라요">
        <p>
          RxJS의 switchMap이나 Redux-Saga의 takeLatest는 새 요청이 오면 앞 요청을 끊고 새로 보내요. 마지막 요청만 살아요. useQuery의 기본 동작은
          반대로 <strong className={strong}>먼저 나간 요청 하나를 같이 써요.</strong> 같은 키는 같은 데이터를 뜻하니까 한 번만 받아도 돼요.
        </p>
      </Topic>
      <Topic icon="🔑" title="'같은 키'는 이렇게 정해요">
        <ul className={bullets}>
          <li>queryKey를 JSON 문자열로 바꾼 값(queryHash)이 같으면 같은 키예요.</li>
          <li>객체 안의 키 순서는 맞춰 줘서, {"{ a, b }"}와 {"{ b, a }"}는 같은 키예요.</li>
          <li>
            값의 타입은 그대로라서, <strong className={strong}>['user', 1]과 ['user', '1']은 다른 키</strong>예요. 주소에서 꺼낸 id는 숫자로 바꿔 써요.
          </li>
        </ul>
      </Topic>
    </>
  )
}

function UserCard({ name, queryFn }: { name: string; queryFn: QueryFn }) {
  const { data, isFetching } = useQuery({ queryKey: ['user', 1], queryFn })
  return (
    <div className="rounded-3xl bg-grey-50 p-5">
      <p className="text-[14px] font-medium text-grey-500">{name}</p>
      <p className="mt-1 text-[17px] font-semibold text-grey-900">{isFetching ? '기다리는 중' : data ? `${circled(data.n)} 응답` : ''}</p>
      <p className="mt-1 text-[13px] text-grey-500">{isFetching ? "['user', 1]" : data?.name}</p>
    </div>
  )
}

function Slot({ name, text }: { name: string; text: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-grey-200 p-5">
      <p className="text-[14px] font-medium text-grey-500">{name}</p>
      <p className="mt-1 text-[15px] text-grey-500">{text}</p>
    </div>
  )
}

export function SingleFlight({ feature }: { feature: { id: string; icon: string } }) {
  const { back } = useNav()
  const client = useQueryClient()
  const fetching = useIsFetching()
  const { lines, reset, fetchUser } = useRequestLog()
  const [run, setRun] = useState(0)
  const [late, setLate] = useState(false)

  function start() {
    // 지난번 응답이 캐시에 있으면 요청 없이 바로 보여줘요. 처음 부르는 상황으로 되돌려요.
    client.removeQueries({ queryKey: ['user'] })
    reset()
    setLate(false)
    setRun((r) => r + 1)
    setTimeout(() => setLate(true), LATE_MS)
  }

  const queryFn: QueryFn = ({ signal }) => fetchUser(1, { signal })
  const busy = fetching > 0 || (run > 0 && !late)
  const sent = count(lines, 'sent')
  const done = run > 0 && !busy && count(lines, 'received') > 0

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['useQuery()']}
      title={'같은 키로 두 번 부르면\n요청은 몇 번 나갈까요?'}
      description="컴포넌트 A가 ['user', 1]을 부르고, 응답이 오기 전에 컴포넌트 B가 같은 키로 불러요. B가 새 요청을 보내는지, A의 요청을 같이 기다리는지 봐요."
      cta={
        <Button onClick={start} disabled={busy}>
          {busy ? '응답을 기다리는 중이에요' : run ? '처음부터 다시 해보기' : '컴포넌트 두 개 띄우기'}
        </Button>
      }
    >
      {done && (
        <Result>
          {sent === 1
            ? `컴포넌트 두 개가 같은 키로 불렀지만 요청은 한 번만 나갔어요. B는 ${LATE_MS / 1000}초 늦게 들어와서 ①을 같이 기다렸고, 둘 다 ① 응답을 받았어요.`
            : `요청이 ${sent}번 나갔어요.`}
        </Result>
      )}
      <div className="grid grid-cols-2 gap-2" aria-live="polite">
        {run ? <UserCard key={`a${run}`} name="컴포넌트 A" queryFn={queryFn} /> : <Slot name="컴포넌트 A" text="바로 나타나요" />}
        {run && late ? (
          <UserCard key={`b${run}`} name="컴포넌트 B" queryFn={queryFn} />
        ) : (
          <Slot name="컴포넌트 B" text={`${LATE_MS / 1000}초 늦게 나타나요`} />
        )}
      </div>
      <RequestLog lines={lines} />
      <Note>요청 번호(①)는 queryFn이 실행된 횟수예요. queryFn 한 번이 HTTP 요청 하나예요.</Note>
      <hr className="-mx-6 mt-6 h-3 border-0 bg-grey-100" />
      <Explainer />
    </Screen>
  )
}
