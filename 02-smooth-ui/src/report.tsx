// README의 "원티드에 필요할까요?"와 "어디서 동작하나요?"를 화면에서도 보여줘요. 내용을 고치면 README도 같이 고쳐요.
import type { ReactNode } from 'react'
import { Report as SharedReport, type Tech } from '../../shared/report'

const TECHS = {
  'view-transitions': {
    name: 'View Transitions',
    verdict: 'try',
    verdictLabel: '공고 목록 → 상세에서 해볼 만해요',
    reason:
      '공고 카드를 누르면 카드 이미지가 상세 화면 위쪽으로 이어지듯 움직여요. 어디서 왔는지 눈으로 따라갈 수 있어서 화면이 바뀌어도 덜 낯설어요. 지원하지 않는 브라우저에서는 애니메이션만 빠지고 그대로 동작해서 위험이 작아요.',
    limit:
      'React 19.3에서 <ViewTransition>이 정식 기능이 됐지만, Next.js의 viewTransition 설정은 아직 실험 기능이에요. 체감 품질을 높이는 일이라 전환율 같은 숫자로 효과를 증명하기 어렵고, 저사양 기기에서는 오히려 버벅일 수 있어요.',
    measure: '적용한 화면의 INP가 나빠지지 않는지 먼저 보고, 상세에 들어온 뒤 바로 나가는 비율이 줄어드는지 봐요.',
    docs: [
      ['MDN · View Transition API', 'https://developer.mozilla.org/docs/Web/API/View_Transition_API'],
      ['React · <ViewTransition>', 'https://react.dev/reference/react/ViewTransition'],
      ['React 블로그 · React 19.3', 'https://react.dev/blog/2026/09/09/react-19-3'],
      ['Chrome for Developers · View Transitions', 'https://developer.chrome.com/docs/web-platform/view-transitions'],
    ],
    support: [
      ['같은 문서 안에서', '111+', '111+', '18+', '18+', '144+'],
      ['문서 사이 (@view-transition)', '126+', '126+', '18.2+', '18.2+', '❌'],
    ],
    supportNote: '원티드처럼 React로 화면을 바꾸는 서비스는 "같은 문서 안에서"만 있으면 돼요.',
  },
  popover: {
    name: 'Popover API',
    verdict: 'with',
    verdictLabel: 'Montage를 손볼 때 같이 봐요',
    reason:
      'Montage의 Popper는 floating-ui로 위치를 잡고 Portal로 레이어를 띄워요. Popover API를 쓰면 브라우저가 맨 위 층(top layer)에 띄워 줘서 z-index·overflow에 가려지는 문제가 없어지고, 바깥 누르기·Esc로 닫기도 브라우저가 해줘요.',
    limit:
      '사용자가 느끼는 변화는 거의 없어요. 지금 컴포넌트가 잘 동작한다면, 바꾸는 비용(회귀 테스트, 접근성 재검증)이 더 커요. 레이어가 가려지는 버그를 고치거나 새 컴포넌트를 만들 때가 좋은 시점이에요.',
    docs: [
      ['MDN · Popover API', 'https://developer.mozilla.org/docs/Web/API/Popover_API'],
      ['MDN · @starting-style', 'https://developer.mozilla.org/docs/Web/CSS/Reference/At-rules/@starting-style'],
      ['web.dev · Popover API가 모든 브라우저에 들어왔어요', 'https://web.dev/blog/popover-api'],
    ],
    support: [
      ['Popover API', '114+', '114+', '17+', '17+', '125+'],
      ['@starting-style (열고 닫는 움직임)', '117+', '117+', '17.5+', '17.5+', '129+'],
    ],
  },
  anchor: {
    name: 'Anchor Positioning',
    verdict: 'wait',
    verdictLabel: '조금 더 기다려요',
    reason:
      '말풍선·메뉴 위치를 CSS만으로 잡아 줘서, Montage Popper가 쓰는 floating-ui를 언젠가 덜어낼 수 있어요. 화면 끝에 닿으면 반대쪽으로 뒤집는 것도 CSS(position-try-fallbacks)로 돼요.',
    limit:
      '사파리 26과 파이어폭스 147에서 막 들어와서, iOS를 업데이트하지 않은 사용자에게는 동작하지 않아요. 지금 쓰면 floating-ui를 대비책으로 같이 둬야 해서 코드가 오히려 늘어요.',
    revisit:
      '모든 주요 브라우저가 지원한 지 충분히 지나 Baseline "널리 사용 가능"이 되거나, 원티드 방문자 중 지원 브라우저 비율이 충분히 높아지면 다시 봐요.',
    docs: [
      ['MDN · CSS Anchor Positioning', 'https://developer.mozilla.org/docs/Web/CSS/Guides/Anchor_positioning'],
      ['MDN · position-try-fallbacks', 'https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position-try-fallbacks'],
      ['Chrome for Developers · Anchor Positioning API', 'https://developer.chrome.com/blog/anchor-positioning-api'],
      ['web.dev · Baseline', 'https://web.dev/baseline'],
    ],
    support: [
      ['anchor-name', '125+', '125+', '26+', '26+', '147+'],
      ['position-area', '129+', '129+', '26+', '26+', '147+'],
      ['position-try-fallbacks', '128+', '128+', '26+', '26+', '147+'],
    ],
  },
} satisfies Record<string, Tech>

export const Report = ({ id, intro }: { id: keyof typeof TECHS; intro?: ReactNode }) => <SharedReport tech={TECHS[id]} intro={intro} />
