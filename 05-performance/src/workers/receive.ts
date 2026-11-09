// Transferable 화면: 받은 ArrayBuffer의 크기와 받은 시각만 알려줘요.
// performance.now()는 워커마다 기준 시각이 달라서, timeOrigin을 더해 화면과 같은 기준으로 맞춰요.
self.onmessage = (event: MessageEvent<{ buffer: ArrayBuffer }>) => {
  self.postMessage({ receivedAt: performance.timeOrigin + performance.now(), byteLength: event.data.buffer.byteLength })
}
