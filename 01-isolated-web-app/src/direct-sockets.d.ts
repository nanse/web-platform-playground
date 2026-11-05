// Direct Sockets (IWA 전용)는 TS 기본 DOM 타입에 없어요. 여기서 쓰는 만큼만 선언해요.
declare class TCPSocket {
  constructor(remoteAddress: string, remotePort: number)
  readonly opened: Promise<{ readable: ReadableStream<Uint8Array>; writable: WritableStream<BufferSource> }>
  close(): Promise<void>
}
