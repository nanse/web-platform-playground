// 화면 없이 TanStack Query만으로 같은 주장을 확인해요: pnpm --filter 07-concurrency-control proof
// 가짜 API는 0.1초 뒤에 답하고, signal을 받으면 끊긴 걸 기록해요.
import assert from 'node:assert/strict'
import { focusManager, MutationObserver, QueryClient, QueryObserver } from '@tanstack/react-query'
import { ApplyError, ApplyServer, classify, CONFIG, cooldownUntil, nextMidnight, type Code } from './apply-server.ts'
import { flightKey, singleFlight } from './src/dedupe.ts'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type Key = ['user', number]

/** 요청마다 '보냄 1', '끊음 1', '받음 1'을 남기는 가짜 API. wire가 false면 signal을 읽지도 않아요. */
function api(wire = true) {
  const log: string[] = []
  const queryFn = (ctx: { queryKey: Key; signal: AbortSignal }) => {
    const id = ctx.queryKey[1]
    // signal은 읽는 순간 TanStack Query가 '끊어도 되는 요청'으로 표시해요. 그래서 wire가 false면 아예 읽지 않아요.
    const signal = wire ? ctx.signal : undefined
    log.push(`보냄 ${id}`)
    return new Promise<{ id: number }>((resolve, reject) => {
      const timer = setTimeout(() => {
        log.push(`받음 ${id}`)
        resolve({ id })
      }, 100)
      signal?.addEventListener('abort', () => {
        clearTimeout(timer)
        log.push(`끊음 ${id}`)
        reject(signal.reason)
      })
    })
  }
  return { log, queryFn }
}

function setup(wire = true) {
  const client = new QueryClient()
  client.mount()
  const { log, queryFn } = api(wire)
  const observe = (id: number) => new QueryObserver(client, { queryKey: ['user', id] as Key, queryFn })
  return { client, log, queryFn, observe }
}

/** 저장 요청 흉내. mutate(n)마다 '보냄 n', '받음 n'을 남기고, useMutation의 onSuccess가 불린 순서를 모아요. */
function saving(scope?: { id: string }) {
  const log: string[] = []
  const hookCalls: number[] = []
  const contexts: object[] = []
  const observer = new MutationObserver(new QueryClient(), {
    mutationFn: async (n: number, context) => {
      contexts.push(context)
      log.push(`보냄 ${n}`)
      await wait(100)
      log.push(`받음 ${n}`)
      return n
    },
    onSuccess: (n) => void hookCalls.push(n),
    scope,
  })
  observer.subscribe(() => {})
  return { log, hookCalls, contexts, observer }
}

/** 지원하기 서버를 빠른 설정으로 띄워요. 쿨다운 0.15초, 지원 간격 0.15초, 채용 시스템 0.005초, 재시도 0.02초부터 최대 4번·0.4초 안에서. */
function applying(setup: Parameters<ApplyServer['reset']>[0] = {}) {
  const server = new ApplyServer({ ...CONFIG, cooldownMs: 150, rateLimitMs: 150, atsMs: 5, retry: { baseMs: 20, maxAttempts: 4, maxTotalMs: 400 } })
  server.reset(setup)
  const apply = (jobId = 1001, resumeId = 'resume-me') => server.apply('me', jobId, resumeId)
  const find = (jobId = 1001) => server.applications.get(`me:${jobId}`)!
  return { server, apply, find }
}

const cases: [string, () => Promise<void>][] = [
  [
    '같은 키: 진행 중에 들어온 두 번째 구독자는 새 요청 없이 같은 결과를 받아요',
    async () => {
      const { log, observe } = setup()
      const a = observe(1)
      const b = observe(1)
      a.subscribe(() => {})
      await wait(30) // 1번이 아직 진행 중일 때
      b.subscribe(() => {})
      await wait(150)
      assert.deepEqual(log, ['보냄 1', '받음 1'])
      // 두 구독자가 받은 data가 같은 객체예요. 한 응답을 나눠 가졌다는 뜻이에요.
      assert.equal(a.getCurrentResult().data, b.getCurrentResult().data)
    },
  ],
  [
    '같은 키: 창 포커스 리패치는 진행 중인 요청을 끊지 않고 기다려요',
    async () => {
      const { client, log, observe } = setup()
      // 내부에서 refetch({ cancelRefetch: false })를 불러요
      const focus = () => {
        focusManager.setFocused(false)
        focusManager.setFocused(true)
      }
      const a = observe(1)
      a.subscribe(() => {})
      await wait(150) // 데이터를 한 번 받아 둬요
      log.length = 0
      focus() // 쉬고 있을 때는 포커스만으로 다시 받아요. 포커스 리패치가 켜져 있다는 대조군이에요.
      await wait(150)
      assert.deepEqual(log, ['보냄 1', '받음 1'])
      log.length = 0
      void a.refetch()
      await wait(30)
      focus() // 진행 중일 때 포커스
      await wait(150)
      focusManager.setFocused(undefined)
      assert.deepEqual(log, ['보냄 1', '받음 1'])
      client.unmount()
    },
  ],
  [
    '키가 바뀜 + signal 연결: 앞 요청이 끊기고 새 키로 보내요',
    async () => {
      const { client, log, queryFn, observe } = setup(true)
      const obs = observe(1)
      obs.subscribe(() => {})
      await wait(30)
      obs.setOptions({ queryKey: ['user', 2] as Key, queryFn })
      await wait(150)
      assert.deepEqual(log, ['보냄 1', '끊음 1', '보냄 2', '받음 2'])
      assert.equal(client.getQueryData(['user', 1]), undefined)
    },
  ],
  [
    '키가 바뀜 + signal 안 씀: 앞 요청은 끝까지 받아서 캐시에 남아요',
    async () => {
      const { client, log, queryFn, observe } = setup(false)
      const obs = observe(1)
      obs.subscribe(() => {})
      await wait(30)
      obs.setOptions({ queryKey: ['user', 2] as Key, queryFn })
      await wait(150)
      assert.deepEqual(log, ['보냄 1', '보냄 2', '받음 1', '받음 2'])
      assert.deepEqual(client.getQueryData(['user', 1]), { id: 1 })
    },
  ],
  [
    '키가 바뀜 + signal 연결, 다른 구독자가 남아 있으면: 끊지 않아요',
    async () => {
      const { log, queryFn, observe } = setup(true)
      const leaving = observe(1)
      const staying = observe(1)
      leaving.subscribe(() => {})
      staying.subscribe(() => {})
      await wait(30)
      leaving.setOptions({ queryKey: ['user', 2] as Key, queryFn })
      await wait(150)
      assert.deepEqual(log, ['보냄 1', '보냄 2', '받음 1', '받음 2'])
    },
  ],
  [
    'refetch(): 옵션 없이도 cancelRefetch가 true라서, 데이터가 있으면 앞 요청을 끊고 다시 보내요',
    async () => {
      const { log, observe } = setup()
      const obs = observe(1)
      obs.subscribe(() => {})
      await wait(150)
      log.length = 0
      void obs.refetch()
      await wait(30)
      void obs.refetch()
      await wait(150)
      assert.deepEqual(log, ['보냄 1', '끊음 1', '보냄 1', '받음 1'])
    },
  ],
  [
    'refetch({ cancelRefetch: false }): 앞 요청을 같이 기다려요',
    async () => {
      const { log, observe } = setup()
      const obs = observe(1)
      obs.subscribe(() => {})
      await wait(150)
      log.length = 0
      void obs.refetch()
      await wait(30)
      void obs.refetch({ cancelRefetch: false })
      await wait(150)
      assert.deepEqual(log, ['보냄 1', '받음 1'])
    },
  ],
  [
    'refetch(): 아직 데이터가 없으면 cancelRefetch가 true여도 끊지 않고 기다려요',
    async () => {
      const { log, observe } = setup()
      const obs = observe(1)
      obs.subscribe(() => {}) // 첫 요청, 아직 데이터 없음
      await wait(30)
      void obs.refetch()
      await wait(150)
      assert.deepEqual(log, ['보냄 1', '받음 1'])
    },
  ],
  [
    'queryClient.refetchQueries(): 기본이 cancelRefetch: true라서 앞 요청을 끊어요',
    async () => {
      const { client, log, observe } = setup()
      const obs = observe(1)
      obs.subscribe(() => {})
      await wait(150)
      log.length = 0
      void obs.refetch()
      await wait(30)
      void client.refetchQueries({ queryKey: ['user', 1] })
      await wait(150)
      assert.deepEqual(log, ['보냄 1', '끊음 1', '보냄 1', '받음 1'])
    },
  ],
  [
    'useMutation: mutate()를 두 번 부르면 합치지 않고 둘 다 바로 보내요',
    async () => {
      const { log, observer } = saving()
      void observer.mutate(1)
      await wait(30) // 1번이 아직 진행 중일 때
      void observer.mutate(2)
      await wait(150)
      assert.deepEqual(log, ['보냄 1', '보냄 2', '받음 1', '받음 2'])
    },
  ],
  [
    'useMutation: 화면 결과와 mutate에 넘긴 콜백은 마지막 것만, useMutation의 onSuccess는 매번 불려요',
    async () => {
      const { hookCalls, observer } = saving()
      const perCall: number[] = []
      const first = observer.mutate(1, { onSuccess: (n) => void perCall.push(n) })
      await wait(30)
      void observer.mutate(2, { onSuccess: (n) => void perCall.push(n) })
      await wait(150)
      assert.deepEqual(hookCalls, [1, 2])
      assert.deepEqual(perCall, [2])
      assert.equal(observer.getCurrentResult().data, 2)
      // 돌려받은 Promise(mutateAsync)는 각자 자기 결과를 받아요.
      assert.equal(await first, 1)
    },
  ],
  [
    'useMutation: scope.id가 같으면 줄을 서서 하나씩 보내요',
    async () => {
      const { log, observer } = saving({ id: 'save-user' })
      void observer.mutate(1)
      await wait(30)
      void observer.mutate(2)
      await wait(250)
      assert.deepEqual(log, ['보냄 1', '받음 1', '보냄 2', '받음 2'])
    },
  ],
  [
    'useMutation: mutationFn은 signal을 받지 않아서 TanStack Query가 끊을 수 없어요',
    async () => {
      const { contexts, observer } = saving()
      await observer.mutate(1)
      assert.deepEqual(Object.keys(contexts[0]).sort(), ['client', 'meta', 'mutationKey'])
    },
  ],
  [
    'single-flight: 같은 키로 진행 중이면 한 번만 보내고 결과를 나눠 가져요. 끝나면 다음은 새로 보내요',
    async () => {
      let runs = 0
      const send = () => singleFlight('PUT /api/user/1 {"name":"원티드"}', () => wait(50).then(() => ({ run: ++runs })))
      const a = send()
      await wait(10)
      const b = send()
      assert.equal(await a, await b)
      assert.equal(runs, 1)
      await send()
      assert.equal(runs, 2)
    },
  ],
  [
    'single-flight: 실패도 같이 받고, 끝나면 지워서 다음은 새로 보내요',
    async () => {
      let runs = 0
      const send = () => singleFlight('DELETE /api/user/1 null', () => wait(20).then(() => Promise.reject(new Error(`실패 ${++runs}`))))
      const results = await Promise.allSettled([send(), send()])
      assert.deepEqual(
        results.map((r) => (r as PromiseRejectedResult).reason.message),
        ['실패 1', '실패 1'],
      )
      await send().catch(() => {})
      assert.equal(runs, 2)
    },
  ],
  [
    'single-flight 키: PUT·PATCH·DELETE는 요청 그대로, POST는 Idempotency-Key로 정해요',
    async () => {
      const put = (name: string) => flightKey({ method: 'PUT', url: '/api/user/1', body: { name } })
      assert.equal(put('원티드'), put('원티드'))
      assert.notEqual(put('원티드'), put('원티드랩'))
      assert.equal(flightKey({ method: 'DELETE', url: '/api/user/1' }), flightKey({ method: 'DELETE', url: '/api/user/1' }))
      const post = (idempotencyKey: string) => flightKey({ method: 'POST', url: '/api/user/1', body: { message: '안녕하세요' }, idempotencyKey })
      assert.equal(post('a1'), post('a1'))
      assert.notEqual(post('a1'), post('b2')) // 내용이 같아도 새로 누른 건 따로 보내요
    },
  ],
  [
    'useMutation + single-flight: 요청은 한 번, 두 mutate가 같은 결과를 받고 useMutation의 onSuccess는 두 번 불려요',
    async () => {
      let sent = 0
      const hookCalls: number[] = []
      const observer = new MutationObserver(new QueryClient(), {
        mutationFn: (name: string) => singleFlight(`PUT /api/user/1 ${name}`, () => wait(50).then(() => ++sent)),
        onSuccess: (n) => void hookCalls.push(n),
      })
      observer.subscribe(() => {})
      const a = observer.mutate('원티드')
      await wait(10)
      const b = observer.mutate('원티드')
      assert.deepEqual([await a, await b], [1, 1])
      assert.equal(sent, 1)
      assert.deepEqual(hookCalls, [1, 1])
    },
  ],
  [
    '실패 분류: 마감·이력서·한도·중복은 확정, 타임아웃·5xx·모르는 오류는 불확정이에요',
    async () => {
      const kind = (code: Code) => classify(new ApplyError(code))
      for (const code of ['JOB_CLOSED', 'NO_RESUME', 'NOT_OWNER', 'DAILY_LIMIT', 'RATE_LIMITED', 'ALREADY_APPLIED'] as const)
        assert.equal(kind(code), 'definitive', code)
      for (const code of ['DB_TIMEOUT', 'ATS_TIMEOUT', 'ATS_5XX', 'COMMIT_LOST'] as const) assert.equal(kind(code), 'indeterminate', code)
      assert.equal(classify(new TypeError('fetch failed')), 'indeterminate')
    },
  ],
  [
    '쿨다운 TTL: 하루 지원 한도는 자정까지, 나머지는 설정값만큼이에요',
    async () => {
      const now = Date.now()
      const midnight = new Date(cooldownUntil('DAILY_LIMIT', now))
      assert.equal(midnight.getTime(), nextMidnight(now))
      assert.deepEqual([midnight.getHours(), midnight.getMinutes(), midnight.getSeconds()], [0, 0, 0])
      assert.ok(midnight.getTime() > now && midnight.getTime() - now <= 24 * 3_600_000)
      assert.equal(cooldownUntil('JOB_CLOSED', now), now + CONFIG.cooldownMs)
    },
  ],
  [
    '마감된 공고: 같은 공고는 처음 한 번만 처리하고 나머지는 캐시가 4xx로 바로 답해요. 다른 공고는 캐시를 거치지 않아요',
    async () => {
      const { server, apply } = applying()
      const replies = [await apply(2001), await apply(2001), await apply(2001)]
      assert.deepEqual(
        replies.map((r) => [r.status, r.body.code, r.body.fromCache]),
        [
          [409, 'JOB_CLOSED', false],
          [409, 'JOB_CLOSED', true],
          [409, 'JOB_CLOSED', true],
        ],
      )
      assert.equal(server.processed, 1)
      const other = await apply(1001)
      assert.deepEqual([other.status, other.body.status, server.processed], [201, 'SUBMITTED', 2])
    },
  ],
  [
    '쿨다운이 지나면 다시 처리해요',
    async () => {
      const { server, apply } = applying()
      await apply(2001)
      await wait(200) // 쿨다운 0.15초
      const again = await apply(2001)
      assert.deepEqual([again.body.fromCache, server.processed], [false, 2])
    },
  ],
  [
    '이력서가 없거나 내 것이 아니면 확정 실패예요',
    async () => {
      const { apply } = applying()
      assert.deepEqual([(await apply(1001, 'resume-none')).body.code, (await apply(1002, 'resume-other')).body.code], ['NO_RESUME', 'NOT_OWNER'])
    },
  ],
  [
    '이미 지원한 공고: ALREADY_APPLIED(409)로 답하고, 그다음은 캐시에서 답해요',
    async () => {
      const { server, apply } = applying({ applied: [1001] })
      const replies = [await apply(), await apply()]
      assert.deepEqual(
        replies.map((r) => [r.status, r.body.code, r.body.fromCache]),
        [
          [409, 'ALREADY_APPLIED', false],
          [409, 'ALREADY_APPLIED', true],
        ],
      )
      assert.equal(server.atsSends, 0)
    },
  ],
  [
    '하루 지원 한도: 사람 키로 자정까지 캐시해서, 다른 공고도 바로 막아요',
    async () => {
      const { server, apply } = applying({ dailyUsed: 3 })
      const first = await apply(1001)
      assert.deepEqual([first.status, first.body.code], [429, 'DAILY_LIMIT'])
      assert.ok((first.body.cooldownMs as number) > 150, '쿨다운 설정값보다 길어요')
      const other = await apply(1002)
      assert.deepEqual([other.body.code, other.body.fromCache, server.processed], ['DAILY_LIMIT', true, 1])
    },
  ],
  [
    '연달아 지원(매크로): 같은 쿨다운 캐시로 막아요. 간격이 지나면 다시 돼요',
    async () => {
      const { apply } = applying()
      const replies = [await apply(1001), await apply(1002), await apply(1003)]
      assert.deepEqual(
        replies.map((r) => [r.status, r.body.code ?? r.body.status, r.body.fromCache ?? false]),
        [
          [201, 'SUBMITTED', false],
          [429, 'RATE_LIMITED', true],
          [429, 'RATE_LIMITED', true],
        ],
      )
      await wait(200)
      assert.equal((await apply(1004)).status, 201)
    },
  ],
  [
    '불확정(응답만 잃어버림): 202로 답하고 PENDING으로 둬요. 채용 시스템에 있어서 다시 보내지 않고 SUBMITTED',
    async () => {
      const { server, apply, find } = applying({ faults: ['lost'] })
      const reply = await apply()
      assert.deepEqual([reply.status, reply.body.status], [202, 'PENDING'])
      assert.equal(server.cooldown.get('user:me:job:1001'), undefined, '불확정은 실패로 캐시하지 않아요')
      await wait(100)
      assert.equal(find().status, 'SUBMITTED')
      assert.deepEqual([server.ats.size, server.atsSends], [1, 1])
    },
  ],
  [
    '불확정(채용 시스템 5xx 두 번): 같은 application_id로 다시 보내서 SUBMITTED, 채용 시스템에는 하나만 들어가요',
    async () => {
      const { server, apply, find } = applying({ faults: ['down', 'down'] })
      await apply()
      await wait(200)
      assert.equal(find().status, 'SUBMITTED')
      assert.deepEqual([...server.ats], [find().applicationId])
      assert.equal(server.atsSends, 3)
    },
  ],
  [
    '불확정(채용 시스템이 계속 5xx): 지수 백오프로 상한까지 다시 보내고, 넘기면 수동 확인 + 운영팀 알림',
    async () => {
      const { server, apply, find } = applying({ faults: Array(10).fill('down') })
      await apply()
      await wait(500)
      const application = find()
      assert.equal(application.status, 'MANUAL_REVIEW')
      assert.ok(application.retries <= 4)
      assert.equal(server.atsSends, 1 + application.retries)
      assert.deepEqual([server.alerts.length, server.ats.size], [1, 0])
    },
  ],
  [
    '보내는 중에 같은 지원이 또 오면: 새 지원서를 만들지 않고 보내는 중인 것을 알려줘요',
    async () => {
      const { server, apply } = applying({ faults: Array(10).fill('down') }) // 0.3초쯤까지 계속 PENDING이에요
      const first = await apply()
      await wait(160) // 지원 간격(0.15초)이 지나도록
      const again = await apply()
      assert.deepEqual([again.status, again.body.duplicate, again.body.applicationId], [202, true, first.body.applicationId])
      assert.equal(server.applications.size, 1)
      await wait(300)
    },
  ],
  [
    '성공하면 그 키의 쿨다운 캐시를 바로 지워요',
    async () => {
      const { server, apply, find } = applying({ faults: ['lost'] })
      await apply()
      server.cooldown.set('user:me:job:1001', 'JOB_CLOSED', Date.now() + 60_000) // 예전에 남은 실패라고 쳐요
      await wait(100)
      assert.equal(find().status, 'SUBMITTED')
      assert.equal(server.cooldown.get('user:me:job:1001'), undefined)
    },
  ],
]

let failed = 0
for (const [name, run] of cases) {
  try {
    await run()
    console.log(`✓ ${name}`)
  } catch (error) {
    failed++
    console.log(`✗ ${name}\n  ${(error as Error).message.split('\n').join('\n  ')}`)
  }
}
console.log(failed ? `\n${failed}개가 예상과 달라요.` : `\n${cases.length}개 모두 예상대로예요.`)
process.exitCode = failed ? 1 : 0
