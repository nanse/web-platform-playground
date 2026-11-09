/** from 이상 limit 미만의 소수를 하나씩 나눠 보며 세요. 일부러 느린 방법이에요. 화면과 워커에서 같은 함수를 써요. */
export function countPrimes(limit: number, from = 2) {
  let count = 0
  for (let n = Math.max(from, 2); n < limit; n++) {
    let prime = true
    for (let d = 2; d * d <= n; d++) {
      if (n % d === 0) {
        prime = false
        break
      }
    }
    if (prime) count++
  }
  return count
}
