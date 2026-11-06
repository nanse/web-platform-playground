// README의 "원티드에 필요할까요?"와 "어디서 동작하나요?"를 화면에서도 보여줘요. 내용을 고치면 README도 같이 고쳐요.
import type { ReactNode } from 'react'
import { Report as SharedReport, type Tech } from '../../shared/report'

const TECHS = {
  'broadcast-channel': {
    name: 'BroadcastChannel',
    verdict: 'try',
    verdictLabel: '로그아웃 뒤 다른 탭 화면을 맞출 때 써요',
    reason:
      '원티드는 httpOnly 쿠키로 로그인하고, 로그아웃 응답이 쿠키를 지워요. 서버 기준으로는 모든 탭이 한 번에 로그아웃되지만, 다른 탭 화면은 그대로 남아요. redirect로 돌아온 페이지가 BroadcastChannel로 알리면, 같은 주소의 다른 탭이 서버에 다시 물어보고 바로 로그아웃 화면으로 바뀌어요. 몇 줄이면 되고 모든 주요 브라우저가 지원해요.',
    limit:
      '같은 출처(예: nextweek.wanted.co.kr)의 탭끼리만 통해요. 다른 서브도메인 탭, 다른 기기, 네이티브 앱에는 가지 않아요. 그래서 401 공통 처리와 탭이 다시 보일 때 세션 확인을 먼저 갖추고, BroadcastChannel은 그 위에 얹어요. redirect_url에 표시(?auth=logout)를 붙이려면 인증 서버가 그 주소를 허용하는지 먼저 확인해요.',
    measure: '로그아웃한 뒤 다른 탭에서 401 오류가 나는 횟수가 줄어드는지 봐요.',
    docs: [
      ['MDN · Broadcast Channel API', 'https://developer.mozilla.org/docs/Web/API/Broadcast_Channel_API'],
      ['MDN · Set-Cookie (HttpOnly)', 'https://developer.mozilla.org/docs/Web/HTTP/Reference/Headers/Set-Cookie'],
      ['MDN · visibilitychange 이벤트', 'https://developer.mozilla.org/docs/Web/API/Document/visibilitychange_event'],
      ['OWASP · 열린 리다이렉트 막기', 'https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html'],
      ['Chrome for Developers · BroadcastChannel', 'https://developer.chrome.com/blog/broadcastchannel'],
    ],
    support: [
      ['BroadcastChannel', '54+', '54+', '15.4+', '15.4+', '38+'],
      ['탭이 다시 보일 때 (visibilitychange)', '62+', '62+', '14.1+', '14.5+', '56+'],
    ],
  },
  'web-locks': {
    name: 'Web Locks API',
    verdict: 'with',
    verdictLabel: '여러 탭이 같은 일을 겹쳐 할 때만 써요',
    reason:
      '탭마다 알림 폴링이나 실시간 연결을 따로 연다면, 한 탭(리더)만 서버와 연결하고 다른 탭은 BroadcastChannel로 나눠 받게 할 수 있어요. 탭 수만큼 늘던 요청이 하나로 줄어요. 토큰 갱신은 원티드처럼 쿠키로 로그인하면 서버가 Set-Cookie로 처리해서 대부분 필요 없어요. 브라우저가 갱신 API를 직접 부르고 서버가 refresh token을 한 번만 받아줄 때만 필요해요.',
    limit:
      '같은 브라우저, 같은 출처의 탭끼리만 막아요. 다른 기기나 다른 서브도메인 사이는 서버가 막아야 해요(refresh token 유예 시간, Idempotency-Key). 탭 하나 안의 중복 요청은 진행 중인 Promise를 같이 쓰면 충분해요.',
    measure: '사용자당 열린 탭 수와, 탭마다 겹쳐 나가는 폴링 요청 수를 먼저 재요. 겹치는 요청이 적으면 넣지 않아도 돼요.',
    revisit: '탭을 여러 개 띄운 사용자에게서 갑작스러운 로그아웃이 보고되면, 원인이 토큰 갱신 경쟁인지 먼저 확인해요.',
    docs: [
      ['MDN · Web Locks API', 'https://developer.mozilla.org/docs/Web/API/Web_Locks_API'],
      ['MDN · LockManager.request() (옵션)', 'https://developer.mozilla.org/docs/Web/API/LockManager/request'],
      ['MDN · LockManager.query()', 'https://developer.mozilla.org/docs/Web/API/LockManager/query'],
      ['W3C · Web Locks 설명서 (쓰는 곳 예시)', 'https://github.com/w3c/web-locks/blob/main/EXPLAINER.md'],
      ['Auth0 · Refresh token rotation 설정(유예 시간)', 'https://auth0.com/docs/secure/tokens/refresh-tokens/configure-refresh-token-rotation'],
      ['IETF · OAuth 2.0 보안 모범 사례 (RFC 9700)', 'https://datatracker.ietf.org/doc/html/rfc9700'],
    ],
    support: [
      ['Web Locks (navigator.locks)', '69+', '69+', '15.4+', '15.4+', '96+'],
      ['자물쇠 상태 보기 (locks.query)', '69+', '69+', '15.4+', '15.4+', '96+'],
    ],
  },
} satisfies Record<string, Tech>

export const Report = ({ id, intro }: { id: keyof typeof TECHS; intro?: ReactNode }) => <SharedReport tech={TECHS[id]} intro={intro} />
