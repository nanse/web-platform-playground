// SharedArrayBuffer 화면: 같은 메모리의 0번 칸을 times번 더해요.
// 1번 칸은 출발 신호예요. 워커 4개가 동시에 출발해야 서로 겹쳐서 고치는 일이 생겨요.
self.onmessage = (event: MessageEvent<{ memory: SharedArrayBuffer; times: number; atomic: boolean }>) => {
  const { memory, times, atomic } = event.data
  const view = new Int32Array(memory)
  self.postMessage('ready')
  Atomics.wait(view, 1, 0) // 1번 칸이 0인 동안 기다려요. 화면이 1로 바꾸고 깨우면 출발해요.
  const startedAt = performance.now()
  if (atomic) {
    for (let i = 0; i < times; i++) Atomics.add(view, 0, 1) // 읽고-더하고-쓰기를 한 번에 해요
  } else {
    for (let i = 0; i < times; i++) view[0]++ // 읽고, 더하고, 쓰는 사이에 다른 워커가 끼어들 수 있어요
  }
  self.postMessage(performance.now() - startedAt)
}
