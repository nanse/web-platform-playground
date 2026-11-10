// README의 "원티드에 필요할까요?"와 "어디서 동작하나요?"를 화면에서도 보여줘요. 내용을 고치면 README도 같이 고쳐요.

type Verdict = 'try' | 'with' | 'no'

type Tech = {
  name: string
  verdict: Verdict
  verdictLabel: string
  reason: string
  limit?: string
  measure?: string
  revisit?: string
  docs: [label: string, href: string][]
  /** [이름, 크롬·엣지 데스크톱, 크롬 안드로이드, 사파리 macOS, 사파리 iOS, 파이어폭스] */
  support: [string, string, string, string, string, string][]
  supportNote?: string
}

const TECHS = {
  pwa: {
    name: 'PWA 기본기',
    verdict: 'try',
    verdictLabel: '기업 대시보드에서 해볼 만해요',
    reason:
      '기업 담당자는 대시보드를 매일 열어 지원자를 확인해요. 설치해 두면 탭 사이에서 찾지 않고 Dock·작업 표시줄에서 바로 열어요. 배지와 Launch Handler도 설치해야 쓸 수 있어서, 이게 출발점이에요.',
    limit:
      '원티드 홈페이지에는 아직 manifest가 없어서 지금은 설치할 수 없어요(2026-11-05 확인). 설치율도 아직 모르는 값이라, 숫자로 확인하기 전에는 기대를 크게 잡지 않아요. 구직자 모바일에서 설치 안내를 띄우면 네이티브 앱 설치 안내와 겹쳐서 오히려 헷갈려요.',
    measure: 'appinstalled 이벤트 수, display-mode: standalone 세션 비율, 설치한 담당자의 재방문 주기를 봐요.',
    docs: [
      ['MDN · 설치할 수 있는 PWA 만들기', 'https://developer.mozilla.org/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable'],
      ['MDN · BeforeInstallPromptEvent', 'https://developer.mozilla.org/docs/Web/API/BeforeInstallPromptEvent'],
      ['web.dev · 설치 경험 직접 만들기', 'https://web.dev/articles/customize-install'],
    ],
    support: [
      ['PWA 설치', '✅', '✅', '🟡 17+', '🟡', '❌'],
      ['beforeinstallprompt', '✅', '✅', '❌', '❌', '❌'],
    ],
    supportNote: '파이어폭스는 Windows에서 비슷한 기능(Taskbar Tabs)을 시험하고 있어요.',
  },
  badging: {
    name: 'Badging',
    verdict: 'try',
    verdictLabel: 'PWA와 함께 해볼 만해요',
    reason: '메신저 앱처럼 대시보드 아이콘에 "확인하지 않은 지원자 3"을 띄울 수 있어요. 창을 열지 않아도 할 일이 있는지 알 수 있어요.',
    limit:
      '앱이 닫혀 있을 때 숫자를 바꾸려면 Web Push가 필요해요. 푸시 없이 하면 창이 열려 있을 때만 바뀌어요. 숫자는 "지금 해야 할 일"만 세야 해요. 아무 알림이나 세면 금방 무시돼요.',
    measure: '배지를 쓰는 담당자와 쓰지 않는 담당자가 지원서를 처음 열어보기까지 걸린 시간을 비교해요.',
    docs: [
      ['MDN · Badging API', 'https://developer.mozilla.org/docs/Web/API/Badging_API'],
      ['Chrome for Developers · Badging API', 'https://developer.chrome.com/docs/capabilities/web-apis/badging-api'],
    ],
    support: [['Badging', '81+', '❌', '17+', '16.4+', '❌']],
    supportNote: 'Linux에서는 동작하지 않아요. iOS는 홈 화면에 추가한 앱에서 알림 권한을 허용해야 보여요.',
  },
  'web-share': {
    name: 'Web Share',
    verdict: 'try',
    verdictLabel: '공고 공유에서 해볼 만해요',
    reason:
      '공유 버튼을 누르면 기기의 공유 창이 떠서, 카카오톡·메시지·메일 중 늘 쓰는 앱으로 바로 보내요. 앱마다 공유 버튼을 따로 만들지 않아도 되고, 설치하지 않은 브라우저 탭에서도 동작해서 앱 없이 링크로 들어온 구직자에게도 닿아요.',
    limit:
      '파이어폭스 데스크톱에는 공유 창이 없어서 링크 복사를 같이 둬야 해요. 페이지는 사용자가 공유 창을 닫았는지만 알고, 어느 앱을 골랐는지나 실제로 보냈는지는 몰라요.',
    measure: '공유 링크에 utm을 붙여서, 공유로 들어온 방문과 그 방문의 지원 수를 봐요. 공유 창을 닫은 비율(AbortError)도 같이 봐요.',
    docs: [
      ['MDN · Web Share API', 'https://developer.mozilla.org/docs/Web/API/Web_Share_API'],
      ['MDN · navigator.share()', 'https://developer.mozilla.org/docs/Web/API/Navigator/share'],
      ['web.dev · Web Share API', 'https://web.dev/articles/web-share'],
    ],
    support: [
      ['Web Share', '128+', '61+', '12.1+', '12.2+', '❌'],
      ['이미지 같이 보내기(files)', '128+', '76+', '14+', '14+', '❌'],
    ],
    supportNote: '크롬은 89부터 Windows·ChromeOS에서 먼저 됐고, 128부터 macOS도 돼요. 파이어폭스는 안드로이드(79+)에서만 돼요.',
  },
  'launch-handler': {
    name: 'Launch Handler',
    verdict: 'with',
    verdictLabel: 'PWA를 하면 같이 넣어요',
    reason: '앱 아이콘을 여러 번 눌러도 대시보드 창이 쌓이지 않아요. manifest 한 줄이면 돼요.',
    limit: '혼자서는 효과가 작아요. 메일 속 링크가 앱 창으로 열릴지는 브라우저 설정에 따라 달라서, 링크를 앱 창 하나로 모으는 효과는 기대하기 어려워요.',
    docs: [
      ['MDN · Launch Handler API', 'https://developer.mozilla.org/docs/Web/API/Launch_Handler_API'],
      ['Chrome for Developers · Launch Handler', 'https://developer.chrome.com/docs/web-platform/launch-handler'],
    ],
    support: [['Launch Handler', '110+', '110+', '❌', '❌', '❌']],
  },
  'web-install': {
    name: 'Web Install API, <install>',
    verdict: 'no',
    verdictLabel: '필요 없어요',
    reason:
      '여러 앱을 모아 보여주는 앱 스토어 같은 페이지를 위한 기능이에요. 원티드는 앱 하나만 설치하게 하면 되고, 같은 크롬 계열에서는 beforeinstallprompt로 이미 할 수 있어요. 아직 플래그를 켜야 동작해서 일반 사용자에게는 보이지도 않아요.',
    revisit: '크롬에 정식으로 들어오고, 사파리도 지원하겠다고 밝히면 다시 봐요.',
    docs: [
      ['Chrome for Developers · <install> 요소 origin trial', 'https://developer.chrome.com/blog/install-element-ot'],
      ['Microsoft Edge · Web Install API 설명서', 'https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/WebInstall/explainer.md'],
    ],
    support: [['Web Install API, <install>', '🚩 154+', '🚩 154+', '❌', '❌', '❌']],
    supportNote: '<install>은 크롬·엣지 148~153에서 origin trial을 했어요.',
  },
  wco: {
    name: 'Window Controls Overlay, window-drag',
    verdict: 'no',
    verdictLabel: '필요 없어요',
    reason:
      '얻는 건 타이틀바 높이만큼의 공간과 네이티브 앱 같은 겉모습이에요. 대신 OS 창 버튼을 피하는 레이아웃과, 끄는 영역과 버튼이 겹치지 않게 하는 처리를 크롬 계열 데스크톱만을 위해 따로 관리해야 해요.',
    docs: [
      ['MDN · Window Controls Overlay API', 'https://developer.mozilla.org/docs/Web/API/Window_Controls_Overlay_API'],
      ['web.dev · Window Controls Overlay', 'https://web.dev/articles/window-controls-overlay'],
      ['CSS UI 4 · window-drag', 'https://drafts.csswg.org/css-ui-4/#window-drag'],
    ],
    support: [
      ['Window Controls Overlay', '105+', '❌', '❌', '❌', '❌'],
      ['window-drag', '152+', '❌', '❌', '❌', '❌'],
    ],
  },
  'window-management': {
    name: 'Window Management',
    verdict: 'no',
    verdictLabel: '필요 없어요',
    reason:
      '"한 모니터엔 이력서, 다른 모니터엔 평가표" 같은 장면을 떠올릴 수 있어요. 하지만 창은 사용자가 직접 옮겨도 충분하고, 이 API를 쓰면 "창 관리" 권한을 묻는 창이 하나 더 떠요.',
    docs: [
      ['MDN · Window Management API', 'https://developer.mozilla.org/docs/Web/API/Window_Management_API'],
      ['Chrome for Developers · Window Management', 'https://developer.chrome.com/docs/capabilities/web-apis/window-management'],
    ],
    support: [['Window Management', '100+', '—', '❌', '❌', '❌']],
  },
  'file-handling': {
    name: 'File Handling',
    verdict: 'no',
    verdictLabel: '필요 없어요',
    reason:
      '"Finder에서 이력서 PDF를 원티드로 열어 바로 등록"을 떠올릴 수 있어요. 하지만 이력서 등록은 자주 하는 일이 아니고, 원티드를 PDF 열기 앱으로 고를 사람도 드물어요.',
    docs: [
      ['MDN · file_handlers', 'https://developer.mozilla.org/docs/Web/Progressive_web_apps/Manifest/Reference/file_handlers'],
      ['Chrome for Developers · File Handling', 'https://developer.chrome.com/docs/capabilities/web-apis/file-handling'],
    ],
    support: [['File Handling', '102+', '❌', '❌', '❌', '❌']],
  },
  'protocol-handlers': {
    name: 'Protocol Handlers',
    verdict: 'no',
    verdictLabel: '필요 없어요',
    reason: '이런 링크를 만들어 줄 외부 서비스가 없어요. https://www.wanted.co.kr/... 링크와 네이티브 앱 링크가 이미 같은 일을 해요.',
    docs: [
      ['MDN · protocol_handlers', 'https://developer.mozilla.org/docs/Web/Progressive_web_apps/Manifest/Reference/protocol_handlers'],
      ['web.dev · OS와 연결하기', 'https://web.dev/learn/pwa/os-integration'],
    ],
    support: [['Protocol Handlers', '96+', '❌', '❌', '❌', '❌']],
  },
  'share-target': {
    name: 'Share Target',
    verdict: 'no',
    verdictLabel: '필요 없어요',
    reason: '주로 안드로이드에서 쓰는 기능인데, 원티드 안드로이드 사용자는 네이티브 앱을 써요. 공유로 받는 기능이 필요하면 네이티브 앱에서 만드는 게 맞아요.',
    docs: [
      ['MDN · share_target', 'https://developer.mozilla.org/docs/Web/Progressive_web_apps/Manifest/Reference/share_target'],
      ['Chrome for Developers · Web Share Target', 'https://developer.chrome.com/docs/capabilities/web-apis/web-share-target'],
    ],
    support: [['Share Target', '89+', '76+', '❌', '❌', '❌']],
  },
} satisfies Record<string, Tech>

const VERDICT_STYLE: Record<Verdict, string> = {
  try: 'bg-primary-weak text-primary',
  with: 'bg-grey-100 text-grey-800',
  no: 'bg-grey-100 text-grey-500',
}

const BROWSERS = ['크롬·엣지\n데스크톱', '크롬\n안드로이드', '사파리\nmacOS', '사파리\niOS', '파이어\n폭스']

const LEGEND: [mark: string, text: string][] = [
  ['🟡', '설치 버튼 없이 사용자가 공유 메뉴에서 직접 설치해요. macOS는 "Dock에 추가", iOS는 "홈 화면에 추가"예요.'],
  ['🚩', 'chrome://flags에서 켜야 동작해요.'],
  ['—', 'API는 있지만 화면이 대부분 하나라 쓸 일이 거의 없어요.'],
]

function SupportValue({ value }: { value: string }) {
  if (value === '❌')
    return (
      <span className="text-grey-300" aria-label="지원 안 함">
        ✕
      </span>
    )
  if (value === '✅')
    return (
      <span className="text-primary" aria-label="지원">
        ✓
      </span>
    )
  return <span className="font-medium text-grey-800">{value}</span>
}

const sectionTitle = 'mt-4 text-[20px] font-bold tracking-[-0.01em] text-grey-900'
const label = 'text-[14px] font-semibold text-grey-500'
const body = 'mt-1 text-[15px] leading-[1.65] text-grey-700'

/** 기능 화면 맨 아래: 원티드에 필요한지 → 어디서 동작하는지 → 더 알아보기. */
export function Report({ ids }: { ids: (keyof typeof TECHS)[] }) {
  const techs: Tech[] = ids.map((id) => TECHS[id])
  const rows = techs.flatMap((tech) => tech.support)
  const legend = LEGEND.filter(([mark]) => rows.some((row) => row.some((value) => value.includes(mark))))
  const notes = techs.flatMap((tech) => tech.supportNote ?? [])

  return (
    <>
      <hr className="-mx-6 mt-6 h-3 border-0 bg-grey-100" />

      <h2 className={sectionTitle}>원티드에 필요할까요?</h2>
      {techs.map((tech) => (
        <section key={tech.name} className="rounded-3xl border border-grey-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[17px] font-semibold text-grey-900">{tech.name}</h3>
            <span className={`rounded-lg px-2 py-1 text-[13px] font-semibold ${VERDICT_STYLE[tech.verdict]}`}>{tech.verdictLabel}</span>
          </div>
          <dl className="mt-4 flex flex-col gap-4">
            <div>
              <dt className={label}>{tech.verdict === 'no' ? '필요 없는 이유' : '기대할 수 있는 것'}</dt>
              <dd className={body}>{tech.reason}</dd>
            </div>
            {tech.limit && (
              <div>
                <dt className={label}>한계</dt>
                <dd className={body}>{tech.limit}</dd>
              </div>
            )}
            {tech.measure && (
              <div>
                <dt className={label}>이렇게 확인해요</dt>
                <dd className={body}>{tech.measure}</dd>
              </div>
            )}
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
            {rows.map(([name, ...values]) => (
              <tr key={name} className="border-t border-grey-100">
                <th scope="row" className="py-3 pr-2 text-left font-medium break-words text-grey-800">
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
        <li>MDN 호환성 데이터(2026-11-02) 기준이에요. 숫자는 처음 지원한 버전이에요.</li>
        {legend.map(([mark, text]) => (
          <li key={mark}>
            {mark} {text}
          </li>
        ))}
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>

      <h2 className={sectionTitle}>더 알아보기</h2>
      <ul className="-mx-6">
        {techs
          .flatMap((tech) => tech.docs)
          .map(([title, href]) => (
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
