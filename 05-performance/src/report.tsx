// README의 "원티드에 필요할까요?"와 "어디서 동작하나요?"를 화면에서도 보여줘요. 내용을 고치면 README도 같이 고쳐요.
import type { ReactNode } from 'react'
import { Report as SharedReport, type Tech } from '../../shared/report'

const TECHS = {
  'web-vitals': {
    name: 'Core Web Vitals (LCP·INP·CLS)',
    verdict: 'try',
    verdictLabel: '공고 상세부터 재 볼 만해요',
    reason:
      '공고 상세는 검색으로 처음 들어오는 사람이 많은 페이지라, 첫인상이 이 세 숫자로 드러나요. 구글도 검색에서 좋은 Core Web Vitals를 갖추라고 강하게 권해요. 실제 사용자 값을 모아야 어디부터 고칠지 정할 수 있어요.',
    limit:
      '여기서 보는 숫자는 내 브라우저 한 번의 값이에요. 실제로는 많은 방문을 모아 75번째 백분위로, 모바일과 데스크톱을 나눠 봐야 해요. CLS는 크롬 계열에서만 잴 수 있어서 사파리 사용자의 흔들림은 보이지 않아요. 이미 RUM 도구를 쓰고 있다면 그 값을 쓰고, 없다면 Next.js의 useReportWebVitals로 모으는 게 가장 가까운 길이에요.',
    measure: '공고 목록·공고 상세·지원하기처럼 페이지 종류별로, 세 지표의 75번째 백분위를 모바일·데스크톱으로 나눠 보고 나쁜 것부터 고쳐요.',
    docs: [
      ['web.dev · Core Web Vitals', 'https://web.dev/articles/vitals'],
      ['web.dev · LCP', 'https://web.dev/articles/lcp'],
      ['web.dev · INP', 'https://web.dev/articles/inp'],
      ['web.dev · CLS', 'https://web.dev/articles/cls'],
      ['Google 검색 센터 · Core Web Vitals', 'https://developers.google.com/search/docs/appearance/core-web-vitals'],
      ['Next.js · useReportWebVitals', 'https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals'],
    ],
    support: [
      ['LCP', '77+', '77+', '26.2+', '26.2+', '122+'],
      ['INP', '96+', '96+', '26.2+', '26.2+', '144+'],
      ['CLS', '77+', '77+', '❌', '❌', '❌'],
    ],
    supportNote: 'CLS는 크롬 계열에서만 잴 수 있어요. 사파리는 26.2부터 LCP와 INP를 잴 수 있어요.',
  },
  bfcache: {
    name: 'bfcache (뒤로·앞으로 캐시)',
    verdict: 'try',
    verdictLabel: '막는 원인부터 없애 볼 만해요',
    reason:
      '회사 홈페이지나 외부 지원 페이지로 나갔다가 뒤로 돌아올 때, 공고 화면이 기다림 없이 그대로 나와요. 크롬 기준으로 데스크톱 이동 10번 중 1번, 모바일 5번 중 1번이 뒤로·앞으로 이동이라, 막는 원인만 없애도 효과가 커요. 따로 만들 기능은 없어요.',
    limit:
      'Next.js 안에서 화면을 오가는 건 문서가 그대로라 bfcache와 상관없어요. 로그인한 페이지에 자주 붙는 Cache-Control: no-store를 걷어내려면, 뒤로 가기로 개인정보가 다시 보여도 괜찮은지 먼저 따져야 해요. 막힌 이유를 알려주는 notRestoredReasons는 크롬 계열에서만 돼요.',
    measure: 'notRestoredReasons를 모아서 가장 많이 나온 원인부터 없애고, pageshow의 persisted로 bfcache로 돌아온 비율이 늘었는지 봐요.',
    docs: [
      ['web.dev · bfcache', 'https://web.dev/articles/bfcache'],
      ['Chrome for Developers · notRestoredReasons', 'https://developer.chrome.com/docs/web-platform/bfcache-notrestoredreasons'],
      ['MDN · pageshow 이벤트', 'https://developer.mozilla.org/docs/Web/API/Window/pageshow_event'],
      ['MDN · notRestoredReasons', 'https://developer.mozilla.org/docs/Web/API/PerformanceNavigationTiming/notRestoredReasons'],
    ],
    support: [
      ['pageshow · persisted', '4+', '18+', '5+', '4+', '11+'],
      ['notRestoredReasons', '125+', '125+', '❌', '❌', '❌'],
    ],
    supportNote: '어떤 페이지를 얼려 둘지는 브라우저마다 조금씩 달라요. 그래서 크롬에서 막힌 이유를 고치면, 다른 브라우저에서도 대부분 같이 나아져요.',
  },
  yield: {
    name: 'scheduler.yield()',
    verdict: 'with',
    verdictLabel: '긴 작업을 찾으면 먼저 꺼내 써요',
    reason:
      'INP를 재서 50ms 넘는 작업을 찾았을 때, 코드를 워커로 옮기지 않고 await 한 줄로 쪼갤 수 있어요. 클릭에 대한 반응을 먼저 그리고 무거운 뒷일(저장, 로그 전송)을 미루는 데 특히 좋아요. 화면을 만지는 일처럼 워커로 못 옮기는 일에도 써요.',
    limit:
      '사파리는 지원하지 않아서 setTimeout으로 대신해야 해요. 그러면 쉬는 동안 다른 일에 순서를 뺏겨 다 끝나는 시간이 늘 수 있어요. 쪼개도 메인 스레드가 하는 일의 총량은 그대로이고, React 렌더링 안에서는 못 써요. 렌더링은 startTransition이 대신 쪼개 줘요.',
    measure: 'Long Animation Frames로 어떤 스크립트가 긴 프레임을 만드는지 찾고, 쪼갠 뒤 INP의 75번째 백분위가 줄었는지 봐요.',
    docs: [
      ['MDN · Scheduler.yield()', 'https://developer.mozilla.org/docs/Web/API/Scheduler/yield'],
      ['MDN · Prioritized Task Scheduling API', 'https://developer.mozilla.org/docs/Web/API/Prioritized_Task_Scheduling_API'],
      ['Chrome for Developers · scheduler.yield() 쓰기', 'https://developer.chrome.com/blog/use-scheduler-yield'],
      ['web.dev · 긴 작업 줄이기', 'https://web.dev/articles/optimize-long-tasks'],
      ['Chrome for Developers · Long Animation Frames', 'https://developer.chrome.com/docs/web-platform/long-animation-frames'],
    ],
    support: [
      ['scheduler.yield()', '129+', '129+', '❌', '❌', '142+'],
      ['scheduler.postTask()', '94+', '94+', '❌', '❌', '142+'],
      ['Long Animation Frames', '123+', '123+', '❌', '❌', '❌'],
    ],
    supportNote: '사파리는 scheduler 자체가 없어요. 있으면 쓰고 없으면 setTimeout으로 쉬는 함수를 같이 둬요.',
  },
  'web-worker': {
    name: 'Web Worker',
    verdict: 'with',
    verdictLabel: '계산 때문에 화면이 멈출 때 써요',
    reason:
      '기업 대시보드에서 지원자 목록을 파일로 만들거나, 프로필 사진을 올리기 전에 줄이는 것처럼 계산이 무거운 일을 워커로 옮기면, 그동안에도 화면이 클릭과 스크롤에 바로 반응해요(INP).',
    limit:
      '원티드 화면이 느린 이유는 대부분 계산보다 React 렌더링과 네트워크예요. 렌더링은 워커로 옮길 수 없어요. 워커는 화면(DOM)을 못 만지고, 주고받는 데이터는 복사돼요.',
    measure:
      'DevTools Performance 패널이나 Long Animation Frames로 50ms 넘는 작업을 찾고, 그게 계산 때문인지 먼저 봐요. 렌더링 때문이면 워커 대신 startTransition이나 작업 쪼개기를 봐요.',
    docs: [
      ['MDN · Web Worker 쓰기', 'https://developer.mozilla.org/docs/Web/API/Web_Workers_API/Using_web_workers'],
      ['web.dev · 메인 스레드 밖에서 JavaScript 돌리기', 'https://web.dev/articles/off-main-thread'],
      ['web.dev · 긴 작업 줄이기', 'https://web.dev/articles/optimize-long-tasks'],
      ['Vite · Web Workers', 'https://vite.dev/guide/features#web-workers'],
      ['GitHub · Comlink (워커를 함수처럼 부르기)', 'https://github.com/GoogleChromeLabs/comlink'],
    ],
    support: [
      ['Web Worker', '2+', '18+', '4+', '5+', '3.5+'],
      ["모듈 워커 (type: 'module')", '80+', '80+', '15+', '15+', '114+'],
    ],
    supportNote: '워커 안에서 import를 쓰려면 모듈 워커가 필요해요. Vite는 빌드할 때 워커를 따로 묶어 줘서, 옛 브라우저도 대부분 괜찮아요.',
  },
  transferable: {
    name: 'Transferable objects',
    verdict: 'with',
    verdictLabel: '워커에 큰 데이터를 넘길 때 같이 써요',
    reason:
      '이미지나 파일처럼 몇 MB가 넘는 바이너리를 워커와 주고받을 때, 복사하는 동안 메인 스레드가 묶이는 시간과 두 배로 드는 메모리를 없애요. postMessage에 한 줄만 더하면 돼요.',
    limit: '워커를 쓸 때만 의미가 있어요. 넘긴 쪽은 그 데이터를 더 쓸 수 없어요. 작은 JSON은 복사해도 충분히 빨라요.',
    docs: [
      ['MDN · Transferable objects', 'https://developer.mozilla.org/docs/Web/API/Web_Workers_API/Transferable_objects'],
      ['MDN · 구조화된 복제 (structured clone)', 'https://developer.mozilla.org/docs/Web/API/Web_Workers_API/Structured_clone_algorithm'],
      ['MDN · ArrayBuffer.prototype.transfer()', 'https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/transfer'],
      ['Chrome for Developers · Transferable objects', 'https://developer.chrome.com/blog/transferable-objects-lightning-fast'],
    ],
    support: [
      ['structuredClone (transfer 옵션)', '98+', '98+', '15.4+', '15.4+', '94+'],
      ['ArrayBuffer.transfer()', '114+', '114+', '17.4+', '17.4+', '122+'],
      ['OffscreenCanvas 옮기기', '69+', '69+', '16.4+', '16.4+', '105+'],
      ['ReadableStream 옮기기', '87+', '87+', '27+', '27+', '103+'],
    ],
    supportNote: 'postMessage로 ArrayBuffer를 옮기는 건 오래전부터 모든 주요 브라우저가 지원해요.',
  },
  export: {
    name: '워커 + ArrayBuffer + Transferable',
    verdict: 'with',
    verdictLabel: '브라우저에서 큰 파일을 만들 때 써요',
    reason:
      '지원자 목록 내려받기처럼 브라우저에서 큰 파일을 만들면, 만드는 동안 화면이 멈추고 버튼을 눌러도 반응이 없어요. 워커로 옮기면 진행률을 보여주면서 다른 일도 계속할 수 있어요.',
    limit:
      '파일을 이미 서버에서 만들어 내려주고 있다면 필요 없어요. 수십만 행을 넘으면 브라우저 메모리가 모자랄 수 있어서, 그때는 서버에서 만드는 게 나아요.',
    measure: '내려받기 버튼을 누른 뒤 화면이 멈춘 시간(Long Animation Frame)과, 그동안 다른 클릭의 INP를 재요.',
    docs: [
      ['MDN · Web Worker 쓰기', 'https://developer.mozilla.org/docs/Web/API/Web_Workers_API/Using_web_workers'],
      ['MDN · Transferable objects', 'https://developer.mozilla.org/docs/Web/API/Web_Workers_API/Transferable_objects'],
      ['MDN · TextEncoder', 'https://developer.mozilla.org/docs/Web/API/TextEncoder'],
      ['OWASP · CSV 인젝션', 'https://owasp.org/www-community/attacks/CSV_Injection'],
      ['SheetJS · 워커에서 엑셀 만들기', 'https://docs.sheetjs.com/docs/demos/bigdata/worker'],
    ],
    support: [
      ["모듈 워커 (type: 'module')", '80+', '80+', '15+', '15+', '114+'],
      ['TextEncoder', '38+', '38+', '10.1+', '10.3+', '18+'],
      ['Blob 주소 (URL.createObjectURL)', '19+', '25+', '6+', '6+', '19+'],
    ],
  },
  'shared-worker': {
    name: 'Shared Worker',
    verdict: 'wait',
    verdictLabel: '지금은 Web Locks 리더 탭이 더 넓게 돼요',
    reason:
      '탭마다 따로 여는 알림 폴링이나 실시간 연결을 워커 하나로 모을 수 있어요. 누가 리더인지 정할 필요 없이, 연결과 상태가 워커 안에 남아요.',
    limit:
      '크롬 안드로이드는 148(2026년)부터 지원해서, 아직 옛 버전을 쓰는 안드로이드 사용자는 못 써요. 같은 일은 04의 Web Locks 리더 탭과 BroadcastChannel로 모든 주요 브라우저에서 할 수 있어요. 워커 로그가 탭 DevTools에 안 보여서 디버깅도 번거로워요.',
    revisit: '크롬 안드로이드 148 이상 사용자가 대부분이 되고, 탭마다 여는 연결이 실제로 서버에 부담이 될 때 다시 봐요.',
    docs: [
      ['MDN · SharedWorker', 'https://developer.mozilla.org/docs/Web/API/SharedWorker'],
      ['MDN · Web Worker 쓰기 (Shared worker)', 'https://developer.mozilla.org/docs/Web/API/Web_Workers_API/Using_web_workers'],
      ['MDN · Web Locks API', 'https://developer.mozilla.org/docs/Web/API/Web_Locks_API'],
    ],
    support: [['SharedWorker', '5+', '148+', '16+', '16+', '29+']],
    supportNote: '사파리는 6.1에서 뺐다가 16에서 다시 넣었어요. 크롬 안드로이드는 148부터예요.',
  },
  'resume-pdf': {
    name: '브라우저에서 이력서 PDF 만들기',
    verdict: 'wait',
    verdictLabel: 'PDF 서버 비용이 문제가 될 때 다시 봐요',
    reason:
      '서버의 크롬 없이 사용자 기기에서 PDF를 만들어서, PDF를 만드는 서버 비용과 기다리는 시간을 없앨 수 있어요. 워커가 그리니 만드는 동안 화면도 멈추지 않고, 글꼴을 한 번 받아 두면 다음부터는 그리기만 해요.',
    limit:
      '처음 한 번 한글 글꼴 3.2MB(brotli로 줄이면 1.6MB쯤)와 PDF 라이브러리(gzip 330KB)를 받아야 해요. 레이아웃을 HTML·CSS 대신 좌표로 다시 그려서, 서버 PDF와 똑같이 맞추고 둘 다 고쳐 가는 비용이 생겨요. 회사·학교 로고 같은 다른 출처 이미지는 CORS 헤더가 없으면 담지 못해요. 인쇄 기능(window.print)은 받을 게 없지만 인쇄 창을 한 번 거쳐야 해요.',
    measure: '서버의 PDF 생성 요청 수와 건당 시간·비용을 먼저 보고, 저사양 안드로이드 기기에서 브라우저로 만드는 시간을 재서 비교해요.',
    revisit:
      'PDF 서버가 비용이나 대기열 문제를 일으킬 때, "내가 내려받는 내 이력서"부터 옮겨 봐요. 기업에 제출되는 PDF는 누가 열어도 같아야 해서 서버에 둬요.',
    docs: [
      ['pdf-lib', 'https://pdf-lib.js.org'],
      ['GitHub · fontkit', 'https://github.com/foliojs/fontkit'],
      ['GitHub · Pretendard (OFL)', 'https://github.com/orioncactus/pretendard'],
      ['MDN · window.print()', 'https://developer.mozilla.org/docs/Web/API/Window/print'],
      ['MDN · @page (인쇄 쪽 크기와 여백)', 'https://developer.mozilla.org/docs/Web/CSS/@page'],
      ['MDN · CacheStorage', 'https://developer.mozilla.org/docs/Web/API/CacheStorage'],
    ],
    support: [
      ["모듈 워커 (type: 'module')", '80+', '80+', '15+', '15+', '114+'],
      ['Cache Storage', '43+', '43+', '11.1+', '11.3+', '41+'],
      ['인쇄 쪽 크기 (@page size)', '15+', '18+', '18.2+', '18.2+', '95+'],
      ['인쇄가 끝났는지 (afterprint)', '63+', '63+', '13+', '13+', '6+'],
    ],
    supportNote: '워커로 만들면 어느 브라우저에서나 같은 PDF가 나와요. 인쇄 창으로 저장하면 브라우저 인쇄 엔진이 만들어서, 크롬이 아니면 서버 PDF와 조금 달라요.',
  },
  'shared-array-buffer': {
    name: 'SharedArrayBuffer',
    verdict: 'no',
    verdictLabel: '필요 없어요',
    reason:
      'ArrayBuffer는 파일과 이미지를 다룰 때 이미 쓰는 기본기라 따로 들일 게 없어요. SharedArrayBuffer는 영상 편집이나 WASM 멀티스레드처럼 여러 스레드가 큰 메모리를 함께 계산할 때 써요. 원티드에는 그런 계산이 없고, 워커에 큰 데이터를 넘기는 건 Transferable로 충분해요.',
    limit:
      '쓰려면 사이트 전체에 COOP·COEP 헤더를 붙여야 해요. 그러면 소셜 로그인 팝업처럼 다른 출처 창과 주고받는 흐름이 끊기고, CORP·CORS 헤더가 없는 외부 이미지·iframe이 막혀요.',
    revisit: '브라우저 안에서 영상이나 큰 데이터를 여러 스레드로 처리해야 할 때 다시 봐요. 그때도 헤더가 로그인과 외부 리소스를 막지 않는지 먼저 확인해요.',
    docs: [
      ['MDN · ArrayBuffer', 'https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer'],
      ['MDN · SharedArrayBuffer', 'https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer'],
      ['MDN · Atomics', 'https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Atomics'],
      ['MDN · crossOriginIsolated', 'https://developer.mozilla.org/docs/Web/API/Window/crossOriginIsolated'],
      ['web.dev · COOP와 COEP로 격리하기', 'https://web.dev/articles/coop-coep'],
    ],
    support: [
      ['ArrayBuffer', '7+', '18+', '5.1+', '4.2+', '4+'],
      ['SharedArrayBuffer', '68+', '89+', '15.2+', '15.2+', '79+'],
      ['Atomics', '68+', '89+', '15.2+', '15.2+', '78+'],
      ['crossOriginIsolated', '87+', '87+', '15.2+', '15.2+', '72+'],
      ['COEP: credentialless', '96+', '96+', '❌', '❌', '119+'],
    ],
    supportNote:
      'SharedArrayBuffer는 crossOriginIsolated일 때만 쓸 수 있어요. 외부 리소스를 덜 막는 COEP: credentialless는 사파리가 지원하지 않아서, 사파리까지 격리하려면 require-corp를 써야 해요.',
  },
  speculation: {
    name: 'Speculation Rules',
    verdict: 'no',
    verdictLabel: 'Next.js 화면 이동에는 필요 없어요',
    reason:
      'Speculation Rules는 다음 "문서"를 미리 받아 두거나 그려 두는 기능이에요. Next.js의 <Link>는 문서를 새로 불러오지 않고 JavaScript로 화면을 바꾸고, 다음 화면 데이터도 이미 미리 받아 둬요. 그래서 원티드 안의 화면 이동에는 끼어들 자리가 없어요.',
    revisit:
      '서로 다른 앱을 오가는 것처럼 문서를 새로 불러오는 이동이 잦은 곳이 생기면 다시 봐요. 그때도 미리 그린 페이지가 페이지뷰를 먼저 세지 않게 실제로 보여진 뒤에 보내야 하고, 크롬 계열에서만 동작해요.',
    docs: [
      ['MDN · Speculation Rules API', 'https://developer.mozilla.org/docs/Web/API/Speculation_Rules_API'],
      ['MDN · <script type="speculationrules">', 'https://developer.mozilla.org/docs/Web/HTML/Reference/Elements/script/type/speculationrules'],
      ['Chrome for Developers · 페이지 미리 그리기', 'https://developer.chrome.com/docs/web-platform/prerender-pages'],
      ['MDN · activationStart', 'https://developer.mozilla.org/docs/Web/API/PerformanceNavigationTiming/activationStart'],
    ],
    support: [
      ['prefetch', '110+', '103+', '🚩 26.2', '🚩 26.2', '❌'],
      ['prerender', '105+', '103+', '❌', '❌', '❌'],
      ['document.prerendering', '108+', '108+', '❌', '❌', '❌'],
    ],
    supportNote: '🚩 사파리는 설정에서 켜야 해요. 파이어폭스는 미리보기 버전에서만 prefetch를 해볼 수 있어요.',
  },
} satisfies Record<string, Tech>

export const Report = ({ id, intro }: { id: keyof typeof TECHS; intro?: ReactNode }) => <SharedReport tech={TECHS[id]} intro={intro} />
