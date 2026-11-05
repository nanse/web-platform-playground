import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'

function App() {
  const [address, setAddress] = useState('127.0.0.1:7777')
  const [message, setMessage] = useState('hello from IWA')
  const [log, setLog] = useState<string[]>([])
  const add = (line: string) => setLog((prev) => [...prev, line])

  async function send() {
    const [host, port] = address.split(':')
    try {
      const socket = new TCPSocket(host, Number(port))
      const { readable, writable } = await socket.opened
      add(`${address}에 연결했어요`)

      const writer = writable.getWriter()
      await writer.write(new TextEncoder().encode(message))
      writer.releaseLock()

      const reader = readable.getReader()
      const { value } = await reader.read()
      add(`받았어요: ${new TextDecoder().decode(value)}`)
      reader.releaseLock()

      await socket.close()
    } catch (e) {
      add(`보내지 못했어요. 에코 서버(pnpm --filter 01-isolated-web-app echo)가 켜져 있는지 확인해요. (${e})`)
    }
  }

  return (
    <main>
      <h1>01 · Isolated Web App · Direct Sockets</h1>
      <ul>
        <li>origin: {location.origin}</li>
        <li>crossOriginIsolated: {crossOriginIsolated ? '✅' : '❌'}</li>
        <li>TCPSocket: {'TCPSocket' in window ? '✅' : '❌ (IWA로 설치해서 열어야 보여요)'}</li>
      </ul>
      <p>
        <input value={address} onChange={(e) => setAddress(e.target.value)} aria-label="서버 주소" />{' '}
        <input value={message} onChange={(e) => setMessage(e.target.value)} aria-label="보낼 메시지" />{' '}
        <button onClick={send} disabled={!('TCPSocket' in window)}>
          TCP로 보내기
        </button>
      </p>
      <pre>{log.join('\n')}</pre>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
