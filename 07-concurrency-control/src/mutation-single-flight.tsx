import { useIsMutating, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { bullets, Code, ExplainTitle, Lead, strong, Topic } from '../../shared/explain'
import { Button, Card, InfoList, Note, Result, Screen, useNav } from '../../shared/ui'
import { flightKey, singleFlight, type Method, type Req } from './dedupe'
import { Diagram } from './diagram'
import { circled, count, RequestLog, useRequestLog, type User } from './requests'

// 첫 요청의 응답(1.5초)이 오기 전에 한 번 더 보내요.
const SECOND_MS = 500

const METHODS: Record<Method, { what: string; other: string; build: (other: boolean, intent: string) => Req }> = {
  PUT: {
    what: '이름을 통째로 바꿔요. 같은 값을 몇 번 보내도 결과가 같아요(멱등).',
    other: "두 번째는 이름을 '원티드랩'으로",
    build: (other) => ({ method: 'PUT', url: '/api/user/1', body: { name: other ? '원티드랩' : '원티드' } }),
  },
  PATCH: {
    what: '이름만 고쳐요. 값을 정해 주는 PATCH라 PUT처럼 합쳐요.',
    other: "두 번째는 이름을 '원티드랩'으로",
    build: (other) => ({ method: 'PATCH', url: '/api/user/1', body: { name: other ? '원티드랩' : '원티드' } }),
  },
  DELETE: {
    what: '지워요. 두 번 지워도 결과가 같아요(멱등).',
    other: '두 번째는 2번 사용자를 지우기',
    build: (other) => ({ method: 'DELETE', url: other ? '/api/user/2' : '/api/user/1' }),
  },
  POST: {
    what: '새로 만들어요. 내용이 같아도 두 번이면 두 개가 생길 수 있어서, 누를 때 만든 Idempotency-Key로 합쳐요.',
    other: '두 번째는 새로 누른 것(새 Idempotency-Key)으로',
    build: (_other, intent) => ({ method: 'POST', url: '/api/user/1', body: { message: '안녕하세요' }, idempotencyKey: intent }),
  },
}

const WRAP_CODE = `const inFlight = new Map()

function singleFlight(key, run) {
  if (inFlight.has(key)) return inFlight.get(key) // 같은 키면 진행 중인 Promise를 같이 써요
  const promise = run().finally(() => inFlight.delete(key)) // 끝나면 지워요
  inFlight.set(key, promise)
  return promise
}

const save = useMutation({
  mutationFn: (req) => singleFlight(flightKey(req), () => send(req)),
})`

const KEY_CODE = `// PUT·DELETE·값을 정하는 PATCH: 요청 그대로
'PUT /api/user/1 {"name":"원티드"}'
// POST: 폼을 열 때(누를 때) 만든 Idempotency-Key
'POST /api/user/1 3f1c…'`

const ALT =
  'PUT을 0초와 0.5초에 두 번 보내요. 키가 같으면 두 번째는 ①에 합류해서 요청은 하나만 나가고 둘 다 ① 응답을 받아요. 값이 달라 키가 다르면 ①과 ②가 따로 나가요.'

function Explainer() {
  return (
    <>
      <ExplainTitle>저장도 한 번만 보내려면</ExplainTitle>
      <Lead>
        useMutation은 같은 요청도 합치지 않아요. 합치고 싶으면 mutationFn을 <strong className={strong}>single-flight</strong>로 감싸요. 같은 키로 진행 중인
        요청이 있으면 새로 보내지 않고 그 Promise를 같이 써요. useQuery가 같은 키를 합치는 것과 같은 방법이에요.
      </Lead>
      <Diagram name="mutation-single-flight" alt={ALT} />
      <Topic icon="🧩" title="이렇게 감싸요">
        <Code code={WRAP_CODE} />
      </Topic>
      <Topic icon="🔑" title="키가 '같은 요청'을 정해요">
        <ul className={bullets}>
          <li>
            <strong className={strong}>PUT·DELETE:</strong> HTTP에서 멱등이라고 정한 메서드예요. 몇 번 보내도 결과가 같아서, 메서드·주소·내용이 같으면 합쳐도 돼요.
          </li>
          <li>
            <strong className={strong}>PATCH:</strong> 명세상 멱등이 아니에요. 값을 정해 주는 것({"{ name: '원티드' }"})은 PUT처럼 합치고, 늘리는 것(
            {'{ count: +1 }'})은 POST처럼 다뤄요.
          </li>
          <li>
            <strong className={strong}>POST:</strong> 내용이 같아도 "두 번 만들기"가 맞을 때가 있어요. 그래서 내용 대신, 폼을 열 때(누를 때) 만든
            Idempotency-Key로 합쳐요. 같은 폼에서 두 번 누른 건 합치고, 새로 쓴 건 따로 보내요.
          </li>
        </ul>
        <Code code={KEY_CODE} />
      </Topic>
      <Topic icon="⚠️" title="알아둘 것">
        <ul className={bullets}>
          <li>
            <strong className={strong}>이 탭 안에서만 막아요.</strong> 다른 탭, 다른 기기, 네트워크 재시도는 서버가 막아야 해요. 서버도 Idempotency-Key를 보고
            같은 요청은 한 번만 처리해요.
          </li>
          <li>
            <strong className={strong}>useMutation은 mutation을 두 개 만들어요.</strong> 요청은 하나지만 useMutation({'{ onSuccess }'})는 두 번 불려요.
            토스트처럼 한 번만 해야 하는 일은 따로 막아요.
          </li>
          <li>가장 쉬운 건 저장하는 동안 버튼을 막는 거예요(disabled={'{save.isPending}'}). single-flight는 버튼이 여러 개거나 코드가 여러 곳에서 부를 때 써요.</li>
        </ul>
      </Topic>
    </>
  )
}

export function MutationSingleFlight({ feature }: { feature: { id: string; icon: string } }) {
  const { back } = useNav()
  const mutating = useIsMutating()
  const { lines, reset, fetchUser } = useRequestLog()
  const [method, setMethod] = useState<Method>('PUT')
  const [other, setOther] = useState(false)
  const [pending, setPending] = useState(false)
  const [calls, setCalls] = useState<{ key: string; user?: User }[]>([])
  const [hookCalls, setHookCalls] = useState(0)

  const save = useMutation({
    mutationFn: (req: Req) =>
      singleFlight(flightKey(req), () =>
        fetchUser(Number(req.url.split('/').pop()), {
          method: req.method,
          body: req.body,
          headers: req.idempotencyKey ? { 'Idempotency-Key': req.idempotencyKey } : undefined,
        }),
      ),
    onSuccess: () => setHookCalls((n) => n + 1),
  })

  function send(i: number, req: Req) {
    setCalls((prev) => Object.assign([...prev], { [i]: { key: flightKey(req) } }))
    void save.mutateAsync(req).then((user) => setCalls((prev) => Object.assign([...prev], { [i]: { key: flightKey(req), user } })))
  }

  function start() {
    reset()
    setCalls([])
    setHookCalls(0)
    setPending(true)
    // POST의 Idempotency-Key는 누를 때(폼을 열 때) 하나 만들어요. 같은 폼에서 두 번 누르면 같은 키예요.
    const intent = crypto.randomUUID().slice(0, 8)
    const { build } = METHODS[method]
    send(0, build(false, intent))
    setTimeout(() => {
      send(1, build(other, other ? crypto.randomUUID().slice(0, 8) : intent))
      setPending(false)
    }, SECOND_MS)
  }

  const busy = mutating > 0 || pending
  const done = calls.length === 2 && calls.every((call) => call.user) && !busy
  const sameKey = calls.length === 2 && calls[0].key === calls[1].key

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['useMutation()', 'single-flight']}
      title={'같은 저장을 두 번 보내도\n한 번만 나가게 해 볼까요?'}
      description="mutationFn을 single-flight로 감쌌어요. 첫 요청을 보내고, 0.5초 뒤 응답이 오기 전에 한 번 더 보내요. 메서드를 골라 보세요."
      cta={
        <Button onClick={start} disabled={busy}>
          {busy ? '응답을 기다리는 중이에요' : `${method} 두 번 보내기`}
        </Button>
      }
    >
      {done && (
        <Result>
          {count(lines, 'sent') === 1
            ? `키가 같아서 요청은 한 번만 나갔고, 두 번 보낸 곳 모두 ${circled(calls[0].user!.n)} 응답을 받았어요.`
            : `키가 달라서 따로 보냈어요. 다른 요청은 합치지 않아요.`}
        </Result>
      )}
      <fieldset className="flex flex-col gap-2" disabled={busy}>
        <legend className="mb-2 text-[15px] font-semibold text-grey-700">메서드</legend>
        {(Object.keys(METHODS) as Method[]).map((key) => (
          <label
            key={key}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
              method === key ? 'border-primary bg-primary-weak' : 'border-grey-200 hover:bg-grey-50'
            }`}
          >
            <input type="radio" name="method" checked={method === key} onChange={() => setMethod(key)} className="size-5 shrink-0 accent-primary" />
            <span>
              <code className="block text-[15px] font-semibold text-grey-900">{key}</code>
              <span className="mt-0.5 block text-[14px] text-grey-500">{METHODS[key].what}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <label className="flex items-center justify-between gap-4 rounded-3xl bg-grey-50 p-5">
        <span>
          <span className="block text-[17px] font-semibold text-grey-900">다른 요청으로 보내기</span>
          <span className="mt-0.5 block text-[14px] text-grey-500">{METHODS[method].other}</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={other}
          disabled={busy}
          onChange={(e) => setOther(e.target.checked)}
          className="size-6 shrink-0 accent-primary"
        />
      </label>
      <Card title="single-flight 키">
        <InfoList
          items={[
            ...calls.map((call, i): [string, string] => [`${i + 1}번째`, `${call.key}${call.user ? ` → ${circled(call.user.n)} 응답` : ''}`]),
            ['두 키가', calls.length === 2 ? (sameKey ? '같아요. 합쳐요' : '달라요. 따로 보내요') : '두 번 보내면 비교해요'],
            ['useMutation의 onSuccess', `${hookCalls}번`],
          ]}
        />
      </Card>
      <RequestLog lines={lines} />
      <Note>가짜 API는 메서드와 상관없이 1.5초 뒤에 같은 사용자 정보를 돌려줘요. 요청이 몇 번 나가는지만 봐요.</Note>
      <hr className="-mx-6 mt-6 h-3 border-0 bg-grey-100" />
      <Explainer />
    </Screen>
  )
}
