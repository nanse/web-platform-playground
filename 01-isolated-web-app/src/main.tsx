import { StrictMode, useState, type ComponentProps, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { Report } from './report'

const supported = 'TCPSocket' in window
const inIwa = location.protocol === 'isolated-app:'
const ECHO_COMMAND = 'pnpm --filter 01-isolated-web-app echo'

function useCopy() {
  const [copied, setCopied] = useState('')
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      setTimeout(() => setCopied((current) => (current === text ? '' : current)), 1500)
    } catch {
      // 창에 포커스가 없으면 복사가 막혀요. 다시 누르면 돼요.
    }
  }
  return { copied, copy }
}

/** 한 화면 = 제목 하나 + 할 일 하나(cta). */
function Screen({ title, description, children, cta }: { title: string; description: ReactNode; children: ReactNode; cta: ReactNode }) {
  return (
    <>
      <header className="mx-auto flex h-14 max-w-[480px] items-center px-6">
        <span className="text-[15px] font-bold text-grey-900">Sockets Lab</span>
      </header>
      <main className="mx-auto max-w-[480px] px-6 pt-5 pb-36">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {['Isolated Web Apps', 'Direct Sockets'].map((api) => (
            <code key={api} className="rounded-md bg-grey-100 px-2 py-0.5 text-[13px] font-medium text-grey-600">
              {api}
            </code>
          ))}
        </div>
        <h1 className="text-[26px] leading-[1.4] font-bold tracking-[-0.02em] whitespace-pre-line text-grey-900">{title}</h1>
        <p className="mt-3 text-[17px] leading-[1.6] text-grey-600">{description}</p>
        <div className="mt-8 flex flex-col gap-4">{children}</div>
      </main>
      <div className="fixed inset-x-0 bottom-0 bg-linear-to-t from-white from-70% to-white/0 px-6 pt-6 pb-[max(20px,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-[432px]">{cta}</div>
      </div>
    </>
  )
}

function Button(props: ComponentProps<'button'>) {
  return (
    <button
      {...props}
      className="h-14 w-full rounded-2xl bg-primary text-[17px] font-semibold text-white transition hover:bg-primary-strong active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:bg-grey-100 disabled:text-grey-400"
    />
  )
}

function Copyable({ text, copied, onCopy }: { text: string; copied: string; onCopy: (text: string) => void }) {
  return (
    <div className="mt-2 flex items-center gap-2 rounded-xl bg-grey-50 py-2 pr-2 pl-3">
      <code className="min-w-0 flex-1 text-[13px] break-all text-grey-800">{text}</code>
      <button
        onClick={() => onCopy(text)}
        className="shrink-0 rounded-lg px-2 py-1 text-[14px] font-semibold text-primary hover:bg-primary-weak focus-visible:outline-2 focus-visible:outline-primary"
      >
        {copied === text ? '복사했어요' : '복사'}
      </button>
    </div>
  )
}

function Status() {
  const items: [string, string][] = [
    ['origin', location.origin],
    ['crossOriginIsolated', crossOriginIsolated ? '켜져 있어요' : '꺼져 있어요'],
    ['TCPSocket', supported ? '쓸 수 있어요' : 'IWA 안에서만 생겨요'],
  ]
  return (
    <section className="rounded-3xl bg-grey-50 p-5">
      <h2 className="mb-3 text-[15px] font-semibold text-grey-700">지금 상태</h2>
      <dl className="flex flex-col gap-3 text-[15px]">
        {items.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-grey-500">{label}</dt>
            <dd className="text-right font-medium break-all text-grey-800">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

const STEPS = [
  { title: '개발자 모드 켜기', how: '주소창에 아래 주소를 열고 Enabled로 바꾼 뒤 크롬을 다시 시작해요.', copy: 'chrome://flags/#enable-isolated-web-app-dev-mode' },
  { title: '프록시로 설치하기', how: '아래 주소를 열고 Install IWA via Dev Mode Proxy 칸에 https://localhost:5111을 넣어요.', copy: 'chrome://web-app-internals' },
  { title: 'Sockets Lab 열기', how: '설치된 Sockets Lab을 열면 이 화면 대신 메시지를 보내는 화면이 나와요.' },
]

/** 일반 탭이거나 TCPSocket이 없을 때: 설치하는 방법을 보여줘요. */
function Install() {
  const { copied, copy } = useCopy()
  const target = inIwa ? 'chrome://flags' : 'https://localhost:5111'

  return (
    <Screen
      title={inIwa ? 'Direct Sockets 플래그를\n켜 볼까요?' : 'IWA로 설치하면\n소켓을 쓸 수 있어요'}
      description={
        inIwa
          ? 'IWA로 열렸지만 TCPSocket이 없어요. chrome://flags에서 "Direct Sockets"를 검색해 관련 플래그를 모두 켜요.'
          : '지금은 일반 탭이라 TCPSocket이 없어요. 아래 순서대로 설치하고 Sockets Lab 앱에서 열어요.'
      }
      cta={<Button onClick={() => copy(target)}>{copied === target ? '복사했어요' : inIwa ? '플래그 주소 복사하기' : '설치 주소 복사하기'}</Button>}
    >
      {!inIwa && (
        <ol className="flex flex-col gap-5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-weak text-[14px] font-bold text-primary">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold text-grey-900">{step.title}</p>
                <p className="mt-1 text-[15px] leading-[1.6] text-grey-600">{step.how}</p>
                {step.copy && <Copyable text={step.copy} copied={copied} onCopy={copy} />}
              </div>
            </li>
          ))}
        </ol>
      )}
      <Status />
      <Report />
    </Screen>
  )
}

type Entry = { kind: 'sent' | 'received' | 'info' | 'error'; text: string }

function Field({ label, ...props }: ComponentProps<'input'> & { label: string }) {
  return (
    <label className="block">
      <span className="text-[14px] font-medium text-grey-600">{label}</span>
      <input
        {...props}
        className="mt-1 w-full border-b-2 border-grey-200 bg-transparent py-2 text-[20px] font-semibold text-grey-900 transition outline-none focus:border-primary"
      />
    </label>
  )
}

/** IWA 안에서 TCPSocket이 있을 때: 에코 서버로 메시지를 보내요. */
function Send() {
  const { copied, copy } = useCopy()
  const [address, setAddress] = useState('127.0.0.1:7777')
  const [message, setMessage] = useState('hello from IWA')
  const [log, setLog] = useState<Entry[]>([])
  const [sending, setSending] = useState(false)
  const add = (kind: Entry['kind'], text: string) => setLog((prev) => [...prev, { kind, text }])

  async function send() {
    const [host, port] = address.split(':')
    setSending(true)
    try {
      const socket = new TCPSocket(host, Number(port))
      const { readable, writable } = await socket.opened
      add('info', `${address}에 연결했어요`)

      const writer = writable.getWriter()
      await writer.write(new TextEncoder().encode(message))
      writer.releaseLock()
      add('sent', message)

      const reader = readable.getReader()
      const { value } = await reader.read()
      add('received', new TextDecoder().decode(value))
      reader.releaseLock()

      await socket.close()
    } catch (e) {
      add('error', `보내지 못했어요. 에코 서버가 켜져 있는지 확인해요. (${e})`)
    } finally {
      setSending(false)
    }
  }

  return (
    <Screen
      title={'TCP로 메시지를\n보내 볼까요?'}
      description="에코 서버는 받은 내용을 그대로 돌려줘요. 터미널에서 먼저 켜 둬요."
      cta={
        <Button onClick={send} disabled={sending || !message || !address.includes(':')}>
          {sending ? '보내는 중이에요' : 'TCP로 보내기'}
        </Button>
      }
    >
      <Copyable text={ECHO_COMMAND} copied={copied} onCopy={copy} />
      <Field label="서버 주소" value={address} onChange={(e) => setAddress(e.target.value)} />
      <Field label="보낼 메시지" value={message} onChange={(e) => setMessage(e.target.value)} />
      {log.length > 0 && (
        <ol className="mt-2 flex flex-col gap-2" aria-live="polite">
          {log.map((entry, i) =>
            entry.kind === 'sent' ? (
              <li key={i} className="max-w-[80%] self-end rounded-[20px] rounded-br-md bg-primary px-4 py-2.5 text-[15px] break-all text-white">
                <span className="sr-only">보냄: </span>
                {entry.text}
              </li>
            ) : entry.kind === 'received' ? (
              <li key={i} className="max-w-[80%] self-start rounded-[20px] rounded-bl-md bg-grey-100 px-4 py-2.5 text-[15px] break-all text-grey-900">
                <span className="sr-only">받았어요: </span>
                {entry.text}
              </li>
            ) : entry.kind === 'info' ? (
              <li key={i} className="self-center text-[13px] text-grey-500">
                {entry.text}
              </li>
            ) : (
              <li key={i} className="rounded-2xl bg-[#fff0f1] px-4 py-3 text-[14px] leading-[1.6] break-all text-danger">
                {entry.text}
              </li>
            ),
          )}
        </ol>
      )}
      <Status />
      <Report />
    </Screen>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode>{supported ? <Send /> : <Install />}</StrictMode>)
