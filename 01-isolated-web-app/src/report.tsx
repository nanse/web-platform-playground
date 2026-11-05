// README의 "원티드에 필요할까요?"와 "어디서 동작하나요?"를 화면에서도 보여줘요. 내용을 고치면 README도 같이 고쳐요.
// ponytail: 01-install-and-launch/src/report.tsx와 모양이 같아요. 브라우저 칸이 달라서 따로 뒀어요. 세 번째로 쓰이면 공용으로 빼요.

type Tech = {
  name: string
  reason: string
  revisit?: string
  /** [이름, ChromeOS(관리형), 크롬 데스크톱, 크롬 안드로이드, 사파리, 파이어폭스] */
  support: [string, string, string, string, string, string]
}

const TECHS: Tech[] = [
  {
    name: 'Isolated Web Apps',
    reason:
      '회사가 관리하는 기기에 관리자가 설치하는 앱이라, 구직자나 기업 담당자에게 배포할 방법이 없어요. Chrome 143부터는 Google 허용 목록에도 올라야 설치할 수 있어요.',
    support: ['Isolated Web Apps', '128+', '🛠', '✕', '✕', '✕'],
  },
  {
    name: 'Direct Sockets',
    reason:
      '원시 TCP·UDP가 필요한 건 프린터, IoT 장비, SSH 클라이언트 같은 경우예요. 원티드가 주고받는 데이터는 HTTP와 WebSocket으로 충분해요.',
    revisit:
      '회사가 관리하는 기기에서 도는 사내 도구가 로컬 장비와 직접 통신해야 할 때 다시 봐요. 예를 들어 채용 행사장 키오스크에서 출입증을 라벨 프린터로 바로 뽑는 경우예요. 그때도 서버를 거치는 방법이 없는지 먼저 봐요.',
    support: ['Direct Sockets', '131+', '🛠', '✕', '✕', '✕'],
  },
]

const DOCS: [title: string, href: string][] = [
  ['Chrome for Developers · Isolated Web Apps 소개', 'https://developer.chrome.com/docs/iwa/introduction'],
  ['Chrome for Developers · IWA 시작하기', 'https://developer.chrome.com/docs/iwa/get-started'],
  ['Chrome for Developers · Direct Sockets', 'https://developer.chrome.com/docs/iwa/direct-sockets'],
  ['WICG · Direct Sockets 명세', 'https://wicg.github.io/direct-sockets/'],
  ['blink-dev · IWA 허용 목록 안내', 'https://groups.google.com/a/chromium.org/g/blink-dev/c/iTCPaBw6HxU'],
]

const BROWSERS = ['ChromeOS\n관리형', '크롬\n데스크톱', '크롬\n안드로이드', '사파리', '파이어\n폭스']

function SupportValue({ value }: { value: string }) {
  if (value === '✕')
    return (
      <span className="text-grey-300" aria-label="지원 안 함">
        ✕
      </span>
    )
  return <span className="font-medium text-grey-800">{value}</span>
}

const sectionTitle = 'mt-4 text-[20px] font-bold tracking-[-0.01em] text-grey-900'
const label = 'text-[14px] font-semibold text-grey-500'
const body = 'mt-1 text-[15px] leading-[1.65] text-grey-700'

const SOLVE: [title: string, text: string][] = [
  ['통째로 포장해서 설치해요', '코드를 서버에서 그때그때 받지 않고, 설치한 파일(.swbn) 안에서만 꺼내 써요.'],
  [
    '도장이 곧 신분증이에요',
    '앱 주소가 도메인이 아니라 도장(서명 키)에서 만든 isolated-app://<ID>예요. 도장이 없으면 서버를 해킹해도 코드를 바꿀 수 없어요.',
  ],
  [
    '실행 중에도 끼어들 수 없어요',
    '브라우저가 "포장 안에 있는 코드만 실행해요"라는 규칙(CSP)을 강제로 걸어요. 그래서 실제로 실행되는 건 도장 찍힌 코드 그대로예요.',
  ],
]

const COMPARE: [question: string, web: string, iwa: string][] = [
  ['코드는 어디서 와요?', '열 때마다 서버에서', '설치한 파일 안에서'],
  ['진짜인지 무엇으로 믿어요?', '도메인', '도장(서명)'],
  ['코드는 언제 바뀌어요?', '서버가 바꾸면 바로', '도장 찍은 새 버전을 설치할 때만'],
]

function Topic({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-grey-50 p-5">
      <h3 className="flex items-center gap-2 text-[17px] font-semibold text-grey-900">
        <span aria-hidden>{icon}</span>
        {title}
      </h3>
      <div className="mt-3 flex flex-col gap-3 text-[15px] leading-[1.65] text-grey-700">{children}</div>
    </section>
  )
}

const bullets = 'flex list-disc flex-col gap-1.5 pl-5 marker:text-grey-400'

/** "IWA는 어떤 문제를 풀어요?" README의 같은 섹션을 화면에 옮겼어요. */
function Explainer() {
  return (
    <>
      <h2 className={sectionTitle}>IWA는 어떤 문제를 풀어요?</h2>
      <p className="text-[17px] leading-[1.6] text-grey-700">
        IWA는 웹 기술로 만든 <strong className="font-semibold text-grey-900">"설치 파일"</strong>이에요. 앱 코드를 통째로 포장하고
        도장(서명)을 찍어서 설치하기 때문에, 중간에 누가 코드를 바꿔치기할 수 없어요.
      </p>

      <Topic icon="🍳" title="왜 필요해요?">
        <p>
          일반 웹사이트는 열 때마다 서버에서 코드를 새로 받아 와요. 식당에서 주문할 때마다 주방이 음식을 새로 만들어 주는 것과 비슷해요. 문제는
          주방에 누가 몰래 들어와도 손님은 모른다는 거예요.
        </p>
        <ul className={bullets}>
          <li>서버가 해킹당하면 코드가 바뀌어도 사용자는 알아챌 수 없어요.</li>
          <li>페이지에 남의 코드가 끼어들어 실행되는 공격(XSS)도 있어요.</li>
        </ul>
        <p>
          그래서 브라우저는 위험한 기능을 웹에 주지 않아요. 해킹당한 사이트가 TCP 소켓을 쓸 수 있다면, 내 컴퓨터를 발판으로 회사 프린터나 DB에
          접속할 수 있게 돼요.
        </p>
      </Topic>

      <Topic icon="📦" title="어떻게 풀어요?">
        <p>봉인 스티커를 붙인 밀키트처럼 앱을 포장해요.</p>
        <ol className="flex flex-col gap-3">
          {SOLVE.map(([title, text], i) => (
            <li key={title} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-weak text-[13px] font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-grey-900">{title}</p>
                <p className="mt-0.5">{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <table className="mt-1 w-full overflow-hidden rounded-2xl bg-white text-[13px]">
          <thead>
            <tr className="text-grey-500">
              <th className="w-[38%] px-3 pt-3 pb-2 text-left font-medium"></th>
              <th className="px-3 pt-3 pb-2 text-left font-medium">일반 웹</th>
              <th className="px-3 pt-3 pb-2 text-left font-semibold text-primary">IWA</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE.map(([question, web, iwa]) => (
              <tr key={question} className="border-t border-grey-100 align-top">
                <th scope="row" className="px-3 py-2.5 text-left font-medium text-grey-600">
                  {question}
                </th>
                <td className="px-3 py-2.5 text-grey-700">{web}</td>
                <td className="px-3 py-2.5 font-medium text-grey-900">{iwa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Topic>

      <Topic icon="🔓" title="그래서 뭘 할 수 있어요?">
        <p>코드를 믿을 수 있으니까, 브라우저가 일반 웹에는 안 주는 기능을 열어 줘요.</p>
        <ul className={bullets}>
          <li>
            <strong className="font-semibold text-grey-900">Direct Sockets</strong>: 프린터, IoT 기기, 서버와 TCP·UDP로 직접 통신해요. 이 화면에서
            에코 서버에 메시지를 보내는 기능이에요.
          </li>
          <li>
            <strong className="font-semibold text-grey-900">Controlled Frame</strong>: 다른 사이트를 앱 안에 넣고 제어할 수 있어요.
          </li>
        </ul>
        <p>주로 회사에서 쓰는 앱을 위한 기술이에요. 매장 키오스크, 원격 접속 프로그램, 기기 관리 도구 같은 것들이에요.</p>
      </Topic>

      <Topic icon="⚖️" title="대신 뭘 포기해요?">
        <ul className={bullets}>
          <li>
            <strong className="font-semibold text-grey-900">바로 고칠 수 없어요.</strong> 버그 하나를 고쳐도 새 버전을 만들어 도장을 찍고 다시
            배포해야 해요.
          </li>
          <li>
            <strong className="font-semibold text-grey-900">링크로 공유할 수 없어요.</strong> "이 주소 열어 봐" 하고 보내는 웹의 가장 큰 장점이
            없어져요.
          </li>
          <li>
            <strong className="font-semibold text-grey-900">아무나 설치할 수 없어요.</strong> 지금은 회사 관리자가 회사 기기에 설치해 주는
            방식이에요.
          </li>
        </ul>
      </Topic>
    </>
  )
}

/** 화면 맨 아래: 어떤 문제를 푸는지 → 원티드에 필요한지 → 어디서 동작하는지 → 더 알아보기. */
export function Report() {
  return (
    <>
      <hr className="-mx-6 mt-6 h-3 border-0 bg-grey-100" />

      <Explainer />

      <h2 className={sectionTitle}>원티드에 필요할까요?</h2>
      {TECHS.map((tech) => (
        <section key={tech.name} className="rounded-3xl border border-grey-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[17px] font-semibold text-grey-900">{tech.name}</h3>
            <span className="rounded-lg bg-grey-100 px-2 py-1 text-[13px] font-semibold text-grey-500">필요 없어요</span>
          </div>
          <dl className="mt-4 flex flex-col gap-4">
            <div>
              <dt className={label}>필요 없는 이유</dt>
              <dd className={body}>{tech.reason}</dd>
            </div>
            {tech.revisit && (
              <div>
                <dt className={label}>다시 볼 때</dt>
                <dd className={body}>{tech.revisit}</dd>
              </div>
            )}
          </dl>
        </section>
      ))}

      <h2 className={sectionTitle}>어디서 동작하나요?</h2>
      <div className="-mx-6 overflow-x-auto px-6">
        <table className="w-full min-w-[400px] text-[13px]">
          <thead>
            <tr className="text-grey-500">
              <th className="pb-2 text-left font-medium">기술</th>
              {BROWSERS.map((browser) => (
                <th key={browser} className="px-1 pb-2 text-center leading-[1.3] font-medium whitespace-pre-line">
                  {browser}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TECHS.map(({ support: [name, ...values] }) => (
              <tr key={name} className="border-t border-grey-100">
                <th scope="row" className="py-3 pr-2 text-left font-medium text-grey-800">
                  {name}
                </th>
                {values.map((value, i) => (
                  <td key={i} className="px-1 py-3 text-center">
                    <SupportValue value={value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-1.5 px-1 text-[13px] leading-[1.6] text-grey-500">
        <li>Chrome Platform Status와 Chrome for Developers 문서(2026-11) 기준이에요. 숫자는 처음 지원한 버전이에요.</li>
        <li>🛠 개발자 모드 플래그를 켜야 설치할 수 있어요(Chrome 120+). 테스트용이에요.</li>
        <li>Windows·macOS·Linux의 관리형 설치는 공식 문서에 "앞으로 넓힐 예정"이라고만 나와 있어요.</li>
      </ul>

      <h2 className={sectionTitle}>더 알아보기</h2>
      <ul className="-mx-6">
        {DOCS.map(([title, href]) => (
          <li key={href}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-6 py-3 transition hover:bg-grey-50 active:bg-grey-100 focus-visible:bg-grey-50 focus-visible:outline-none"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-grey-900">{title}</span>
                <span className="block truncate text-[13px] text-grey-500">{new URL(href).host}</span>
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-grey-400">
                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}
