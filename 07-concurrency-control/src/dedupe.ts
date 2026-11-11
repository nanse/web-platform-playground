// useMutation은 같은 요청도 합치지 않아요. 합치고 싶을 때 mutationFn을 이걸로 감싸요.
// 화면(src/mutation-single-flight.tsx)과 proof.ts가 같이 써요.
const inFlight = new Map<string, Promise<unknown>>()

/** 같은 키로 진행 중인 요청이 있으면 새로 보내지 않고 그 Promise를 같이 써요. 끝나면(성공·실패 모두) 지워서, 다음 요청은 새로 보내요. */
export function singleFlight<T>(key: string, run: () => Promise<T>): Promise<T> {
  const running = inFlight.get(key) as Promise<T> | undefined
  if (running) return running
  const promise = run().finally(() => inFlight.delete(key))
  inFlight.set(key, promise)
  return promise
}

export type Method = 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type Req = { method: Method; url: string; body?: unknown; idempotencyKey?: string }

/**
 * single-flight 키. 같은 키면 "같은 요청"으로 보고 합쳐요.
 * - PUT·DELETE는 몇 번 보내도 결과가 같아서(멱등) 메서드·주소·내용을 그대로 키로 써요.
 * - PATCH는 값을 정해 주는 것({ name: '원티드' })이면 PUT처럼 합쳐요. 늘리는 것({ count: +1 })은 POST처럼 다뤄요.
 * - POST는 내용이 같아도 두 번 보내면 두 개가 생길 수 있어서, 누를 때 만든 Idempotency-Key로 합쳐요.
 */
export const flightKey = (req: Req) => [req.method, req.url, req.idempotencyKey ?? JSON.stringify(req.body ?? null)].join(' ')
