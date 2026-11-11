import { useIsMutating, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { bullets, Code, ExplainTitle, Lead, strong, Topic } from '../../shared/explain'
import { Button, Card, InfoList, Note, Result, Screen, useNav } from '../../shared/ui'
import { Diagram } from './diagram'
import { circled, count, RequestLog, useRequestLog, type User } from './requests'

// 첫 저장의 응답(1.5초)이 오기 전에 한 번 더 눌러요.
const SECOND_MS = 500

const MUTATE_CODE = `// @tanstack/query-core 5.107.1
// mutationObserver.ts의 mutate() (줄였어요)
mutate(variables, options) {
  // mutate에 넘긴 콜백은 마지막 것으로 덮어써요
  this.#mutateOptions = options
  // 앞 mutation은 더 지켜보지 않아요
  this.#currentMutation?.removeObserver(this)
  // 부를 때마다 새로 만들어요. 합치지 않아요
  this.#currentMutation = mutationCache.build(client, this.options)
  this.#currentMutation.addObserver(this)
  return this.#currentMutation.execute(variables)
}`

const USAGE_CODE = `const save = useMutation({
  mutationFn: saveUser,
  scope: { id: 'save-user' },   // 같은 id끼리 하나씩 차례로 보내요
  onSuccess: () => closeModal(), // 매번 불려요
})

<button disabled={save.isPending} onClick={() => save.mutate(form)}>
  저장하기
</button>`

const SCOPE_ALT =
  '0초와 0.5초에 mutate()를 불러요. scope가 없으면 ①과 ② 저장 요청이 겹쳐서 둘 다 나가고, 화면에는 마지막 ②의 결과만 보여요. scope.id가 같으면 ②는 ①이 끝난 1.5초까지 줄 서서 기다렸다가 나가요.'

function Explainer() {
  return (
    <>
      <ExplainTitle>useMutation은 왜 합치지 않아요?</ExplainTitle>
      <Lead>
        useQuery는 같은 데이터를 <strong className={strong}>읽는</strong> 일이라 같은 키면 하나로 합쳐요. useMutation은 서버를{' '}
        <strong className={strong}>바꾸는</strong> 일이라 키가 없고, mutate()를 부를 때마다 새 mutation을 만들어요. 같은 저장을 두 번 해도 되는지는
        화면과 서버만 알아서, 라이브러리는 부른 만큼 보내요.
      </Lead>
      <Diagram name="mutation" alt={SCOPE_ALT} />
      <Topic icon="🔍" title="라이브러리 코드로 보면">
        <Code code={MUTATE_CODE} />
      </Topic>
      <Topic icon="🆚" title="useQuery와 이렇게 달라요">
        <ul className={bullets}>
          <li>
            <strong className={strong}>합치기:</strong> useQuery는 같은 키면 합쳐요. useMutation은 합치지 않아요.
          </li>
          <li>
            <strong className={strong}>끊기:</strong> useQuery는 signal로 앞 요청을 끊을 수 있어요. mutationFn은 signal을 받지 않아서 TanStack Query가
            끊지 못해요. 화면을 떠나도 저장은 끝까지 가요.
          </li>
          <li>
            <strong className={strong}>줄 세우기:</strong> useMutation만 있어요. scope.id가 같은 mutation은 앞 것이 끝나야 다음이 나가요.
          </li>
          <li>
            <strong className={strong}>다시 시도:</strong> useMutation은 retry 기본값이 0이라, 실패해도 저절로 다시 보내지 않아요.
          </li>
        </ul>
      </Topic>
      <Topic icon="⚠️" title="mutate에 넘긴 콜백은 마지막 것만 불려요">
        <p>
          mutate()를 또 부르면 useMutation은 새 mutation만 지켜봐요. 그래서 save.data와 save.isPending은 마지막 저장만 보여주고, mutate(vars,{' '}
          {'{ onSuccess }'})로 넘긴 콜백도 마지막 것만 불려요. 모달 닫기처럼 꼭 해야 하는 일은 useMutation({'{ onSuccess }'})에 둬요. 이쪽은 저장마다
          불려요.
        </p>
        <p>mutateAsync()가 돌려준 Promise는 각자 자기 결과를 받아요.</p>
      </Topic>
      <Topic icon="🚦" title="두 번 저장을 막고 싶으면">
        <ul className={bullets}>
          <li>저장하는 동안 버튼을 막아요(disabled={'{save.isPending}'}). 가장 간단해요.</li>
          <li>순서가 중요하면 scope로 줄을 세워요. 마지막에 누른 값이 마지막에 저장돼요.</li>
          <li>다른 탭, 다른 기기까지 막아야 하면 서버가 막아요. 같은 요청을 한 번만 처리하는 Idempotency-Key가 그 예예요.</li>
        </ul>
        <Code code={USAGE_CODE} />
      </Topic>
    </>
  )
}

export function Mutation({ feature }: { feature: { id: string; icon: string } }) {
  const { back } = useNav()
  const mutating = useIsMutating()
  const { lines, reset, fetchUser } = useRequestLog()
  const [queued, setQueued] = useState(false)
  const [ran, setRan] = useState<{ queued: boolean } | null>(null)
  const [pending, setPending] = useState(false)
  // 저장마다 불리는 콜백(useMutation)과 마지막 것만 불리는 콜백(mutate)을 따로 세요.
  const [hookCalls, setHookCalls] = useState<number[]>([])
  const [mutateCalls, setMutateCalls] = useState<number[]>([])

  const save = useMutation({
    mutationFn: () => fetchUser(1, { method: 'POST' }),
    onSuccess: (user) => setHookCalls((calls) => [...calls, user.n]),
    scope: queued ? { id: 'save-user' } : undefined,
  })

  function start() {
    reset()
    setHookCalls([])
    setMutateCalls([])
    setRan({ queued })
    setPending(true)
    const onSuccess = (user: User) => setMutateCalls((calls) => [...calls, user.n])
    save.mutate(undefined, { onSuccess })
    setTimeout(() => {
      // ①이 아직 저장 중일 때 한 번 더 눌러요.
      save.mutate(undefined, { onSuccess })
      setPending(false)
    }, SECOND_MS)
  }

  const busy = mutating > 0 || pending
  const done = ran && !busy && count(lines, 'received') === 2
  // ②를 보낸 게 ①을 받기 전이면 겹친 거예요.
  const at = (n: number, kind: 'sent' | 'received') => lines.find((line) => line.n === n && line.kind === kind)?.at ?? 0
  const overlapped = at(2, 'sent') < at(1, 'received')
  const list = (calls: number[]) => (calls.length ? `${calls.length}번 (${calls.map(circled).join(' ')})` : '아직 없어요')

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['useMutation()', 'scope']}
      title={'저장 버튼을 두 번 누르면\n요청은 몇 번 나갈까요?'}
      description="저장하기(POST)를 누르고, 0.5초 뒤 응답이 오기 전에 한 번 더 눌러요. useQuery처럼 합치는지, 앞 것을 끊는지, 줄을 세우는지 봐요."
      cta={
        <Button onClick={start} disabled={busy}>
          {busy ? '저장하는 중이에요' : '저장하기 두 번 누르기'}
        </Button>
      }
    >
      {done && (
        <Result>
          {overlapped
            ? '저장 요청이 두 번 다 나갔어요. ②는 ①을 기다리지도 끊지도 않고 바로 나갔어요.'
            : '같은 scope라 ②는 ①이 끝난 뒤에 나갔어요.'}{' '}
          화면 결과와 mutate에 넘긴 onSuccess는 마지막 ②만 받았어요.
        </Result>
      )}
      <label className="flex items-center justify-between gap-4 rounded-3xl bg-grey-50 p-5">
        <span>
          <span className="block text-[17px] font-semibold text-grey-900">scope로 줄 세우기</span>
          <code className="mt-0.5 block text-[14px] text-grey-500">{"scope: { id: 'save-user' }"}</code>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={queued}
          disabled={busy}
          onChange={(e) => setQueued(e.target.checked)}
          className="size-6 shrink-0 accent-primary"
        />
      </label>
      <Card title="useMutation이 보여주는 것">
        <InfoList
          items={[
            ['save.data', save.isPending ? '저장하는 중이에요' : save.data ? `${circled(save.data.n)} 응답` : '아직 없어요'],
            ['useMutation의 onSuccess', list(hookCalls)],
            ['mutate에 넘긴 onSuccess', list(mutateCalls)],
          ]}
        />
      </Card>
      <RequestLog lines={lines} />
      <Note>스위치를 켜고 다시 해보면, ②가 ①이 끝날 때까지 기다렸다가 나가요.</Note>
      <hr className="-mx-6 mt-6 h-3 border-0 bg-grey-100" />
      <Explainer />
    </Screen>
  )
}
