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
