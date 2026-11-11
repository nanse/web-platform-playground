// 원티드 "지원하기" 서버 흉내예요. Vite 서버(dev, preview)에 붙이고, proof.ts도 같은 코드를 확인해요.
// 실패 쿨다운 캐시 설계를 지원하기에 옮겼어요.
//   2-1 실패를 확정·불확정으로 나눠요(classify)
//   2-2 확정 실패만 쿨다운 캐시에 넣어요(CooldownCache). 연달아 지원(매크로) 막기도 같은 캐시로 해요
//   2-3 불확정 실패는 지원서를 PENDING으로 두고, 기업 채용 시스템부터 다시 본 뒤 같은 application_id로 다시 보내요(reconcile)
// API (모두 쿼리 문자열로 받아요)
//   POST /api/applications?user_id=&job_id=&resume_id=   지원하기
//   GET  /api/applications/:application_id?user_id=      지원 상태 조회. 학습용으로 서버 기록(events)도 같이 내려줘요
//   POST /api/lab/scenario?user_id=&daily_used=&applied=&faults=   상태를 비우고 실험을 준비해요
import type { Connect, Plugin } from 'vite'

export const CONFIG = {
  /** 확정 실패를 기억하는 시간. 설정값이고 짧게 둬요. */
  cooldownMs: 5_000,
  /** 같은 사람은 이 간격에 지원서 하나만 만들 수 있어요(매크로 막기). */
  rateLimitMs: 2_000,
  /** 하루에 지원할 수 있는 공고 수. 예시 정책이에요. */
  dailyLimit: 3,
  /** 기업 채용 시스템이 답하는 시간 */
  atsMs: 100,
  /** 불확정 실패 다시 보내기: 0.3초부터 두 배씩, 최대 4번, 처음부터 3초 안에서만 */
  retry: { baseMs: 300, maxAttempts: 4, maxTotalMs: 3_000 },
}
type Config = typeof CONFIG

export const JOBS: Record<number, { title: string; open: boolean }> = {
  1001: { title: '프론트엔드 개발자', open: true },
  1002: { title: '백엔드 개발자', open: true },
  1003: { title: 'iOS 개발자', open: true },
  1004: { title: '데이터 엔지니어', open: true },
  2001: { title: '프로덕트 디자이너', open: false },
}
/** 이력서와 주인. 화면은 늘 'me'의 이력서로 지원해요. */
const RESUMES: Record<string, string> = { 'resume-me': 'me', 'resume-other': 'other' }

export type Code =
  | 'JOB_CLOSED'
  | 'ALREADY_APPLIED'
  | 'NO_RESUME'
  | 'NOT_OWNER'
  | 'DAILY_LIMIT'
  | 'RATE_LIMITED'
  | 'DB_TIMEOUT'
  | 'ATS_TIMEOUT'
  | 'ATS_5XX'
  | 'COMMIT_LOST'

export class ApplyError extends Error {
  code: Code
  constructor(code: Code) {
    super(code)
    this.code = code
  }
}

/** 2-1. 모든 실패를 둘 중 하나로 나눠요. 확정: 다시 해도 결과가 같아요. 불확정: 실제로는 지원이 들어갔을 수도 있어요. */
export function classify(error: unknown): 'definitive' | 'indeterminate' {
  // 모르는 오류는 들어갔을 수도 있다고 봐요. 실패로 굳히면 지원서가 사라진 것처럼 보일 수 있어서요.
  if (!(error instanceof ApplyError)) return 'indeterminate'
  switch (error.code) {
    // 입력이 틀렸어요. 같은 공고·같은 이력서면 몇 번을 다시 해도 똑같아요.
    case 'JOB_CLOSED':
    case 'NO_RESUME':
    case 'NOT_OWNER':
    // 정책에 걸렸어요. 정해진 시간(자정, 지원 간격)이 지나기 전에는 같아요.
    case 'DAILY_LIMIT':
    case 'RATE_LIMITED':
    // 이미 끝난 일이에요. 다시 하면 중복 지원이에요.
    case 'ALREADY_APPLIED':
      return 'definitive'
    // 기업 채용 시스템에 닿았는지 몰라요. 들어갔는데 응답만 늦거나 잃어버렸을 수 있어요.
    case 'DB_TIMEOUT':
    case 'ATS_TIMEOUT':
    case 'ATS_5XX':
    case 'COMMIT_LOST':
      return 'indeterminate'
  }
}

/** 확정 실패를 화면에 돌려줄 HTTP 상태. 모두 4xx라 "다시 보내도 같아요"라는 뜻이에요. */
const HTTP: Partial<Record<Code, number>> = {
  JOB_CLOSED: 409,
  ALREADY_APPLIED: 409,
  NO_RESUME: 422,
  NOT_OWNER: 403,
  DAILY_LIMIT: 429,
  RATE_LIMITED: 429,
}

/** 다음 자정(서버 시간대). 하루 지원 한도는 날짜가 바뀌어야 풀려요. */
export function nextMidnight(now: number) {
  const date = new Date(now)
  date.setHours(24, 0, 0, 0)
  return date.getTime()
}

/** 2-2. 정책에 맞는 쿨다운 끝 시각. 하루 한도는 자정까지, 연달아 지원은 지원 간격만큼, 나머지는 짧게요. */
export function cooldownUntil(code: Code, now: number, config: Config = CONFIG) {
  if (code === 'DAILY_LIMIT') return nextMidnight(now)
  if (code === 'RATE_LIMITED') return now + config.rateLimitMs
  return now + config.cooldownMs
}

/** 2-2. 캐시 키는 실패를 만든 입력 그 자체예요. 공고 때문이면 사람+공고, 사람 때문이면(하루 한도, 연달아 지원) 사람이에요. */
export function cooldownKey(code: Code, userId: string, jobId: number) {
  return code === 'DAILY_LIMIT' || code === 'RATE_LIMITED' ? `user:${userId}` : `user:${userId}:job:${jobId}`
}

/** 키마다 확정 실패 하나를 끝 시각까지 기억해요. 지난 것은 꺼낼 때 지워요. */
export class CooldownCache {
  #entries = new Map<string, { code: Code; until: number }>()

  get(key: string) {
    const entry = this.#entries.get(key)
    if (entry && entry.until <= Date.now()) this.#entries.delete(key)
    return this.#entries.get(key)
  }
  set(key: string, code: Code, until: number) {
    this.#entries.set(key, { code, until })
  }
  delete(key: string) {
    this.#entries.delete(key)
  }
  get size() {
    return this.#entries.size
  }
}

/** 기업 채용 시스템 장애 흉내. lost: 지원서는 들어갔는데 응답을 잃어버려요(타임아웃). down: 받지 못하고 5xx를 돌려줘요. */
export type Fault = 'lost' | 'down'
export type Status = 'PENDING' | 'SUBMITTED' | 'FAILED' | 'MANUAL_REVIEW'
type Application = {
  applicationId: string
  userId: string
  jobId: number
  status: Status
  code?: Code
  retries: number
  startedAt: number
  events: { at: number; text: string }[]
}
type Reply = { status: number; body: Record<string, unknown> }

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const sec = (ms: number) => `${(ms / 1000).toFixed(1)}초`

export class ApplyServer {
  cooldown = new CooldownCache()
  /** 지원서. 사람+공고 하나에 하나예요. */
  applications = new Map<string, Application>()
  /** 기업 채용 시스템이 받은 지원서. application_id가 멱등키라 두 번 보내도 한 번만 들어가요. */
  ats = new Set<string>()
  atsSends = 0
  /** 오늘 지원한 수(사람별). 흉내라 자정에 비우는 일은 하지 않아요. */
  daily = new Map<string, number>()
  /** 다음 채용 시스템 전달에 차례로 일으킬 장애 */
  faults: Fault[] = []
  alerts: string[] = []
  /** 쿨다운 캐시를 거치지 않고 실제로 처리한 횟수 */
  processed = 0
  #timers = new Set<ReturnType<typeof setTimeout>>()
  config: Config

  constructor(config: Config = CONFIG) {
    this.config = config
  }

  /** 지원하기. 확정 실패는 4xx(다시 보내지 마세요), 불확정은 202(접수했고 확인 중이에요)로 답해요. */
  async apply(userId: string, jobId: number, resumeId: string): Promise<Reply> {
    // 공고 때문에 난 실패와 사람 때문에 난 실패를 둘 다 봐요. 다른 공고는 앞 키가 달라서 캐시를 거치지 않아요.
    for (const key of [`user:${userId}:job:${jobId}`, `user:${userId}`]) {
      const cached = this.cooldown.get(key)
      if (cached) return { status: HTTP[cached.code]!, body: { code: cached.code, fromCache: true, cooldownMs: cached.until - Date.now() } }
    }
    this.processed++

    let application: Application | undefined
    try {
      if (!JOBS[jobId]?.open) throw new ApplyError('JOB_CLOSED')
      if (!RESUMES[resumeId]) throw new ApplyError('NO_RESUME')
      if (RESUMES[resumeId] !== userId) throw new ApplyError('NOT_OWNER')
      const existing = this.applications.get(`${userId}:${jobId}`)
      if (existing?.status === 'SUBMITTED') throw new ApplyError('ALREADY_APPLIED')
      // 이미 보내는 중인 지원서예요. 새로 만들지 않고 그 지원서를 알려줘요.
      if (existing) return { status: 202, body: { status: existing.status, applicationId: existing.applicationId, duplicate: true } }
      if ((this.daily.get(userId) ?? 0) >= this.config.dailyLimit) throw new ApplyError('DAILY_LIMIT')

      application = this.#create(userId, jobId)
      // 지원서를 하나 만들면 지원 간격 동안 RATE_LIMITED를 미리 넣어 둬요. 매크로처럼 연달아 오는 지원은 바로 거절돼요.
      this.cooldown.set(`user:${userId}`, 'RATE_LIMITED', cooldownUntil('RATE_LIMITED', Date.now(), this.config))
      this.#event(application, `지원서를 PENDING으로 만들고 기업 채용 시스템에 보내요 (${application.applicationId})`)
      await this.#sendToAts(application)
      this.#submitted(application, '기업 채용 시스템이 받았어요 → SUBMITTED')
      return { status: 201, body: { status: 'SUBMITTED', applicationId: application.applicationId } }
    } catch (error) {
      if (classify(error) === 'definitive') {
        const { code } = error as ApplyError
        const until = cooldownUntil(code, Date.now(), this.config)
        this.cooldown.set(cooldownKey(code, userId, jobId), code, until)
        return { status: HTTP[code]!, body: { code, fromCache: false, cooldownMs: until - Date.now() } }
      }
      // 2-3. 불확정은 실패로 캐시하지 않아요. PENDING으로 두고 서버가 다시 맞춰요.
      if (!application) return { status: 503, body: { code: codeOf(error) } }
      this.#event(application, `${codeOf(error)}: 불확정 실패예요. PENDING으로 두고 202로 답해요`)
      this.#retryLater(application)
      return { status: 202, body: { status: 'PENDING', code: codeOf(error), applicationId: application.applicationId } }
    }
  }

  /** 지원 상태 조회. 학습용으로 서버 기록(events)도 같이 내려줘요. */
  status(userId: string, applicationId: string): Reply {
    const application = [...this.applications.values()].find((a) => a.applicationId === applicationId && a.userId === userId)
    if (!application) return { status: 404, body: {} }
    const { status, code, events } = application
    return { status: 200, body: { status, code, events, inAts: this.ats.has(applicationId), atsSends: this.atsSends, alerts: this.alerts } }
  }

  /** 상태를 비우고 실험을 준비해요. 하던 재시도도 멈춰요. */
  reset({ userId = 'me', dailyUsed = 0, applied = [] as number[], faults = [] as Fault[] } = {}) {
    for (const timer of this.#timers) clearTimeout(timer)
    // 공개 필드를 새 인스턴스 것으로 덮어써서 한 번에 비워요.
    Object.assign(this, new ApplyServer(this.config))
    this.#timers = new Set()
    if (dailyUsed) this.daily.set(userId, dailyUsed)
    // 예전에 지원을 마친 공고예요.
    for (const jobId of applied) {
      const application = this.#create(userId, jobId)
      application.status = 'SUBMITTED'
      this.ats.add(application.applicationId)
    }
    this.faults = faults
  }

  #create(userId: string, jobId: number) {
    const application: Application = {
      applicationId: `app-${crypto.randomUUID().slice(0, 6)}`,
      userId,
      jobId,
      status: 'PENDING',
      retries: 0,
      startedAt: Date.now(),
      events: [],
    }
    this.applications.set(`${userId}:${jobId}`, application)
    return application
  }

  async #sendToAts(application: Application) {
    this.atsSends++
    await wait(this.config.atsMs)
    const fault = this.faults.shift()
    if (fault === 'down') throw new ApplyError('ATS_5XX')
    this.ats.add(application.applicationId)
    if (fault === 'lost') throw new ApplyError('ATS_TIMEOUT')
  }

  /** 지수 백오프로 다음 맞추기를 예약해요. 최대 횟수나 총 시간 상한을 넘기면 수동 확인으로 넘겨요. */
  #retryLater(application: Application) {
    const { baseMs, maxAttempts, maxTotalMs } = this.config.retry
    const delay = baseMs * 2 ** application.retries
    const elapsed = Date.now() - application.startedAt
    if (application.retries >= maxAttempts || elapsed + delay > maxTotalMs) {
      application.status = 'MANUAL_REVIEW'
      this.#event(application, `상한(${maxAttempts}번, ${sec(maxTotalMs)})을 넘겨 수동 확인으로 넘기고 운영팀에 알려요`)
      this.alerts.push(`${application.applicationId} 지원서가 기업에 들어갔는지 확인해 주세요`)
      return
    }
    this.#event(application, `${sec(delay)} 뒤에 다시 맞춰요`)
    const timer = setTimeout(() => {
      this.#timers.delete(timer)
      void this.#reconcile(application)
    }, delay)
    this.#timers.add(timer)
  }

  async #reconcile(application: Application) {
    application.retries++
    // 진실의 원천(기업 채용 시스템)부터 다시 봐요. 응답만 잃어버렸다면 이미 들어가 있어요.
    if (this.ats.has(application.applicationId))
      return this.#submitted(application, `채용 시스템에 ${application.applicationId}가 있어요 → 다시 보내지 않고 SUBMITTED`)
    this.#event(application, `채용 시스템에 없어요 → 같은 ${application.applicationId}로 다시 보내요 (${application.retries}번째)`)
    try {
      await this.#sendToAts(application)
      this.#submitted(application, '기업 채용 시스템이 받았어요 → SUBMITTED')
    } catch (error) {
      if (classify(error) === 'definitive') {
        application.status = 'FAILED'
        application.code = (error as ApplyError).code
        return this.#event(application, `${application.code}: 확정 실패예요 → FAILED`)
      }
      this.#event(application, `${codeOf(error)}: 또 불확정이에요`)
      this.#retryLater(application)
    }
  }

  #submitted(application: Application, text: string) {
    application.status = 'SUBMITTED'
    this.daily.set(application.userId, (this.daily.get(application.userId) ?? 0) + 1)
    // 그 키로 성공이 생기면 남아 있던 실패 캐시를 바로 지워요.
    this.cooldown.delete(`user:${application.userId}:job:${application.jobId}`)
    this.#event(application, text)
  }

  #event(application: Application, text: string) {
    application.events.push({ at: Date.now() - application.startedAt, text })
  }
}

const codeOf = (error: unknown) => (error instanceof ApplyError ? error.code : 'UNKNOWN')

export function applyApi(): Plugin {
  const server = new ApplyServer()

  const handle: Connect.NextHandleFunction = (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const q = (name: string) => url.searchParams.get(name) ?? ''
    const send = ({ status, body }: Reply) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify(body))
    }
    const path = url.pathname
    const list = (name: string) => q(name).split(',').filter(Boolean)

    if (req.method === 'POST' && path === '/api/lab/scenario') {
      server.reset({ userId: q('user_id') || 'me', dailyUsed: Number(q('daily_used')), applied: list('applied').map(Number), faults: list('faults') as Fault[] })
      return send({ status: 200, body: { ok: true } })
    }
    if (req.method === 'POST' && path === '/api/applications')
      return void server.apply(q('user_id'), Number(q('job_id')), q('resume_id')).then(send)
    if (req.method === 'GET' && path.startsWith('/api/applications/')) return send(server.status(q('user_id'), path.split('/').pop()!))
    next()
  }

  return {
    name: 'apply-api',
    configureServer: (s) => void s.middlewares.use(handle),
    configurePreviewServer: (s) => void s.middlewares.use(handle),
  }
}
