// 지원하기 화면 두 개가 같이 쓰는 API 호출과 기록이에요. 서버는 ../apply-server.ts예요.
import { Card } from '../../shared/ui'
import { JOBS, type Code, type Status } from '../apply-server'

export { JOBS }

type Body = {
  status?: Status
  code?: Code
  fromCache?: boolean
  cooldownMs?: number
  applicationId?: string
  duplicate?: boolean
  events?: { at: number; text: string }[]
  inAts?: boolean
  atsSends?: number
  alerts?: string[]
}
export type Reply = { status: number; body: Body }

async function call(method: 'GET' | 'POST', path: string): Promise<Reply> {
  const res = await fetch(path, { method, cache: 'no-store' })
  return { status: res.status, body: await res.json() }
}

const qs = (params: Record<string, string | number>) => new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()

export const applyApi = {
  /** 실험 준비. 서버 상태를 비우고, 오늘 지원한 수·이미 지원한 공고·채용 시스템 장애를 정해요. */
  prepare: ({ dailyUsed = 0, applied = [] as number[], faults = [] as string[] } = {}) =>
    call('POST', `/api/lab/scenario?${qs({ user_id: 'me', daily_used: dailyUsed, applied: applied.join(','), faults: faults.join(',') })}`),
  apply: (jobId: number) => call('POST', `/api/applications?${qs({ user_id: 'me', job_id: jobId, resume_id: 'resume-me' })}`),
  status: (applicationId: string) => call('GET', `/api/applications/${applicationId}?${qs({ user_id: 'me' })}`),
}

export const LABEL: Record<Code | Status, string> = {
  JOB_CLOSED: '마감된 공고',
  ALREADY_APPLIED: '이미 지원한 공고',
  NO_RESUME: '이력서 없음',
  NOT_OWNER: '내 이력서가 아님',
  DAILY_LIMIT: '오늘 지원 한도 초과',
  RATE_LIMITED: '너무 빨리 연달아 지원',
  DB_TIMEOUT: 'DB 응답 없음',
  ATS_TIMEOUT: '채용 시스템 응답 없음',
  ATS_5XX: '채용 시스템 오류',
  COMMIT_LOST: '저장 응답 유실',
  PENDING: '보내는 중',
  SUBMITTED: '지원 완료',
  FAILED: '실패',
  MANUAL_REVIEW: '수동 확인 중',
}

export function remaining(ms: number) {
  if (ms <= 60_000) return `${(ms / 1000).toFixed(1)}초`
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)
  return `자정까지 ${hours ? `${hours}시간 ` : ''}${minutes}분`
}

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export type Step = { label: string; detail: string; tone?: 'cache' | 'done' | 'fail' | 'wait'; at?: number }

const TONE = {
  cache: 'bg-grey-200 text-grey-700',
  done: 'bg-primary-weak text-primary',
  fail: 'bg-danger/10 text-danger',
  wait: 'bg-grey-100 text-grey-600',
}

/** 화면이 보낸 요청과 받은 답을 차례로 보여줘요. */
export function Steps({ title, steps }: { title: string; steps: Step[] }) {
  return (
    <Card title={title}>
      {steps.length === 0 ? (
        <p className="text-[15px] text-grey-500">아직 보낸 요청이 없어요.</p>
      ) : (
        <ol className="flex flex-col gap-2.5" aria-live="polite">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-[15px]">
              <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[13px] font-semibold ${TONE[step.tone ?? 'wait']}`}>{step.label}</span>
              <span className="min-w-0 flex-1 break-all text-grey-800">{step.detail}</span>
              {step.at !== undefined && <span className="shrink-0 text-[14px] text-grey-500 tabular-nums">{(step.at / 1000).toFixed(1)}초</span>}
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
