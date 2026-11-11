// 화면들이 같이 쓰는 가짜 사용자 API 호출과 네트워크 기록이에요.
import { useRef, useState } from 'react'
import { Card } from '../../shared/ui'

export type User = { id: number; name: string; /** 몇 번째 요청이 가져온 응답인지 */ n: number }

type Line = { n: number; id: number; method: string; kind: 'sent' | 'received' | 'aborted'; at: number }

/** 1 → ①. 요청 번호를 한눈에 구분하려고 써요. */
export const circled = (n: number) => String.fromCharCode(0x245f + n)

/** 해볼 때마다 기록을 비우고 요청 번호를 ①부터 다시 세요. */
export function useRequestLog() {
  const [lines, setLines] = useState<Line[]>([])
  const run = useRef({ count: 0, t0: performance.now() })

  const reset = () => {
    run.current = { count: 0, t0: performance.now() }
    setLines([])
  }

  /** queryFn이나 mutationFn 안에서 불러요. 부를 때마다 진짜 HTTP 요청이 하나 나가요. */
  async function fetchUser(id: number, { signal, method = 'GET', body, headers }: Omit<RequestInit, 'body'> & { body?: unknown } = {}): Promise<User> {
    const current = run.current
    const n = ++current.count
    const add = (kind: Line['kind']) => {
      // 지난번에 해본 요청이 늦게 끝나면 이번 기록에 섞지 않아요.
      if (run.current !== current) return
      setLines((prev) => [...prev, { n, id, method, kind, at: performance.now() - current.t0 }])
    }
    add('sent')
    // 끊기는 순간을 바로 적으려고 abort 이벤트를 들어요. fetch가 거절되는 건 그다음이에요.
    signal?.addEventListener('abort', () => add('aborted'))
    // cache: 'no-store'로 브라우저 HTTP 캐시를 거치지 않아요. 요청마다 서버까지 가요.
    const res = await fetch(`/api/user/${id}`, {
      method,
      signal,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    })
    const user = await res.json()
    add('received')
    return { ...user, n }
  }

  return { lines, reset, fetchUser }
}

export const count = (lines: Line[], kind: Line['kind']) => lines.filter((line) => line.kind === kind).length

const KIND = {
  sent: { label: '보냄', style: 'bg-grey-200 text-grey-700' },
  received: { label: '받음', style: 'bg-primary-weak text-primary' },
  aborted: { label: '끊음', style: 'bg-danger/10 text-danger' },
}

export function RequestLog({ lines }: { lines: Line[] }) {
  return (
    <Card title="네트워크 기록">
      {lines.length === 0 ? (
        <p className="text-[15px] text-grey-500">아직 보낸 요청이 없어요.</p>
      ) : (
        <ol className="flex flex-col gap-2.5" aria-live="polite">
          {lines.map((line) => (
            <li key={`${line.n}-${line.kind}`} className="flex items-center gap-3 text-[15px]">
              <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[13px] font-semibold ${KIND[line.kind].style}`}>{KIND[line.kind].label}</span>
              <span className="min-w-0 flex-1 font-medium text-grey-800">
                {circled(line.n)}{' '}
                <code className="text-[14px] text-grey-600">
                  {line.method} /api/user/{line.id}
                </code>
              </span>
              <span className="shrink-0 text-[14px] text-grey-500 tabular-nums">{(line.at / 1000).toFixed(2)}초</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
