// README의 "원티드에 필요할까요?"와 "어디서 동작하나요?"를 화면에서도 보여줘요. 내용을 고치면 README도 같이 고쳐요.
import type { ReactNode } from 'react'
import { Report as SharedReport, type Tech } from '../../shared/report'

const TECHS = {
  'service-worker': {
    name: 'Service Worker',
    verdict: 'with',
    verdictLabel: 'PWA를 하면 같이 넣어요',
    reason:
      '01에서 해볼 만하다고 본 기업 대시보드 PWA에서, 앱이 닫혀 있을 때도 배지를 바꾸려면 Web Push가 필요해요. Web Push는 Service Worker가 받아요. 인터넷이 끊겼을 때 "연결이 끊겼어요" 안내 화면을 보여줄 수도 있어요.',
    limit:
      '구직과 채용은 서버 데이터가 있어야 하는 일이라, 오프라인으로 쓸 수 있는 기능은 거의 없어요. 잘못 배포한 Service Worker는 사용자 브라우저에 남아 옛 화면을 계속 보여줄 수 있어서, 업데이트와 해제 방법을 먼저 정해야 해요.',
    docs: [
      ['MDN · Service Worker API', 'https://developer.mozilla.org/docs/Web/API/Service_Worker_API'],
      ['web.dev · 오프라인 쿡북', 'https://web.dev/articles/offline-cookbook'],
      ['web.dev · Learn PWA: Service Worker', 'https://web.dev/learn/pwa/service-workers'],
      ['MDN · Push API', 'https://developer.mozilla.org/docs/Web/API/Push_API'],
    ],
    support: [
      ['Service Worker', '40+', '40+', '11.1+', '11.3+', '44+'],
      ['Cache Storage', '43+', '43+', '11.1+', '11.3+', '41+'],
    ],
  },
  'offline-data': {
    name: 'Service Worker로 API 응답 담기',
    verdict: 'with',
    verdictLabel: 'PWA를 하면 공개 데이터만 담아요',
    reason:
      '지하철이나 엘리베이터처럼 잠깐 끊기는 곳에서, 오류 화면 대신 마지막에 받은 공고 목록을 보여줄 수 있어요. 받은 시각을 같이 보여주면 사용자가 옛 정보와 헷갈리지 않아요.',
    limit:
      '담아 둔 공고는 그사이 마감됐을 수 있어서, 지원하기 같은 행동은 늘 서버에 다시 확인해야 해요. 내 지원 현황, 이력서 같은 개인 데이터는 담으면 안 돼요. Cache Storage는 Cache-Control: no-store를 보지 않아서, 로그아웃한 뒤에도 남아요.',
    measure: '네트워크 오류로 목록을 못 그린 횟수와 그 뒤 떠난 비율을 먼저 재요. 이 숫자가 작으면 넣지 않아도 돼요.',
    docs: [
      ['web.dev · 오프라인 쿡북 (전략별 코드)', 'https://web.dev/articles/offline-cookbook'],
      ['Chrome · Workbox 캐싱 전략', 'https://developer.chrome.com/docs/workbox/caching-strategies-overview'],
      ['MDN · Cache', 'https://developer.mozilla.org/docs/Web/API/Cache'],
      ['TanStack Query · persistQueryClient', 'https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient'],
    ],
    support: [
      ['Service Worker', '40+', '40+', '11.1+', '11.3+', '44+'],
      ['Cache Storage', '43+', '43+', '11.1+', '11.3+', '41+'],
    ],
  },
  'background-sync': {
    name: 'Background Sync',
    verdict: 'no',
    verdictLabel: '필요 없어요',
    reason:
      '끊긴 동안 누른 좋아요나 관심 공고 저장을 연결되면 보내 줘요. 그런데 탭이 열려 있다면 online 이벤트로 다시 보내도 결과가 같아요. Background Sync만 할 수 있는 건 탭을 닫은 뒤에 보내는 것인데, 크롬 계열에서만 돼요. 지원하기처럼 결과를 바로 알아야 하는 행동에는 맞지 않아요.',
    revisit: 'PWA로 앱처럼 쓰는 사용자가 많아지고, 끊긴 곳에서 누른 좋아요나 저장이 사라진다는 문의가 숫자로 보일 때 다시 봐요.',
    docs: [
      ['MDN · Background Synchronization API', 'https://developer.mozilla.org/docs/Web/API/Background_Synchronization_API'],
      ['WICG · Background Sync 명세', 'https://wicg.github.io/background-sync/spec/'],
      ['Chrome · Workbox Background Sync', 'https://developer.chrome.com/docs/workbox/modules/workbox-background-sync'],
    ],
    support: [['끊긴 동안 보낸 요청 나중에 보내기 (Background Sync)', '49+', '49+', '❌', '❌', '❌']],
    supportNote: '사파리와 파이어폭스에는 없어요. 탭이 열린 채 연결되면(online 이벤트) 화면이 대신 보내요.',
  },
  'indexed-db': {
    name: 'IndexedDB',
    verdict: 'with',
    verdictLabel: 'localStorage로 부족할 때 써요',
    reason:
      'localStorage는 문자열만, 동기로, 몇 MB까지만 담아요. IndexedDB는 객체와 파일을 비동기로 크게 담을 수 있어서, 이력서 초안처럼 서버에 보내기 전 데이터를 잃지 않게 붙잡아 둘 때 쓸 만해요.',
    limit:
      'API가 불편해서 보통 idb 같은 작은 래퍼를 써요. 브라우저 저장소는 언제든 지워질 수 있어요. 사파리는 7일 동안 방문하지 않은 사이트의 데이터를 지울 수 있어서, 원본은 늘 서버에 둬요.',
    docs: [
      ['MDN · IndexedDB API', 'https://developer.mozilla.org/docs/Web/API/IndexedDB_API'],
      ['web.dev · 웹 저장소 고르기', 'https://web.dev/articles/storage-for-the-web'],
      ['GitHub · idb (작은 IndexedDB 래퍼)', 'https://github.com/jakearchibald/idb'],
      ['WebKit 블로그 · 7일 저장 제한', 'https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/'],
    ],
    support: [
      ['IndexedDB', '24+', '25+', '8+', '8+', '16+'],
      ['저장 공간 확인 (storage.estimate)', '61+', '61+', '17+', '17+', '57+'],
      ['지우지 말아 달라고 요청 (storage.persist)', '55+', '55+', '15.2+', '15.2+', '57+'],
    ],
  },
  opfs: {
    name: 'Origin Private File System (OPFS)',
    verdict: 'no',
    verdictLabel: '필요 없어요',
    reason:
      'OPFS는 사진·영상 편집기나 브라우저 안 SQLite처럼, 큰 파일을 브라우저 안에서 빠르게 읽고 쓰는 용도예요. 원티드가 다루는 이력서와 포트폴리오는 서버에 올려야 의미가 있어서, 브라우저에만 두는 파일은 쓸 곳이 없어요.',
    revisit: '브라우저 안에서 큰 데이터를 직접 다뤄야 할 때 다시 봐요. 예를 들어 SQLite(WASM)로 오프라인 검색을 만드는 경우예요.',
    docs: [
      ['MDN · Origin private file system', 'https://developer.mozilla.org/docs/Web/API/File_System_API/Origin_private_file_system'],
      ['web.dev · OPFS', 'https://web.dev/articles/origin-private-file-system'],
    ],
    support: [
      ['OPFS (storage.getDirectory)', '86+', '109+', '15.2+', '15.2+', '111+'],
      ['메인 스레드에서 쓰기 (createWritable)', '86+', '109+', '26+', '26+', '111+'],
      ['워커에서 빠르게 쓰기 (createSyncAccessHandle)', '102+', '109+', '15.2+', '15.2+', '111+'],
    ],
    supportNote: '사파리는 26 전까지 메인 스레드에서 쓰기가 없어서, 워커에서 createSyncAccessHandle로 써야 했어요.',
  },
} satisfies Record<string, Tech>

export const Report = ({ id, intro }: { id: keyof typeof TECHS; intro?: ReactNode }) => <SharedReport tech={TECHS[id]} intro={intro} />
