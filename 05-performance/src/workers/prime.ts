// Web Worker 화면: 받은 숫자까지 소수를 세서 돌려줘요. 이 파일은 메인 스레드가 아니라 워커에서 돌아요.
import { countPrimes } from '../primes'

self.onmessage = (event: MessageEvent<{ limit: number }>) => {
  self.postMessage({ count: countPrimes(event.data.limit) })
}
