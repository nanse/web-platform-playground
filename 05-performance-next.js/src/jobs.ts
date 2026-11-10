// 백엔드 API 흉내예요. 실제 서비스라면 다른 서버에 있어요.
export type Job = { id: number; company: string; position: string; location: string; career: string; tasks: string[] }

export const JOBS: Job[] = [
  { id: 1, company: '오늘의 지도', position: '프론트엔드 개발자', location: '서울 강남구', career: '경력 3년 이상', tasks: ['지도 위에 장소를 빠르게 그리는 화면을 만들어요', '느린 화면을 찾아 숫자로 재고 고쳐요'] },
  { id: 2, company: '단단한 커머스', position: '백엔드 개발자', location: '서울 성동구', career: '경력 5년 이상', tasks: ['주문과 결제 API를 만들어요', '하루 수백만 건의 요청을 버티게 다듬어요'] },
  { id: 3, company: '푸른 핀테크', position: '프로덕트 디자이너', location: '서울 중구', career: '경력 2년 이상', tasks: ['송금 흐름을 한 화면 한 행동으로 다시 그려요', '사용자 인터뷰로 불편한 곳을 찾아요'] },
  { id: 4, company: '맑은 헬스케어', position: 'iOS 개발자', location: '서울 서초구', career: '경력 3년 이상', tasks: ['진료 예약 앱을 SwiftUI로 만들어요', '앱 시작 시간을 줄여요'] },
  { id: 5, company: '반짝 모빌리티', position: '안드로이드 개발자', location: '경기 성남시', career: '경력 4년 이상', tasks: ['배차 화면을 Jetpack Compose로 만들어요', '배터리를 덜 쓰는 위치 추적을 다듬어요'] },
  { id: 6, company: '따뜻한 교육', position: '풀스택 개발자', location: '서울 마포구', career: '경력 2년 이상', tasks: ['강의 영상 플레이어를 만들어요', '관리자 화면과 API를 함께 만들어요'] },
  { id: 7, company: '든든한 보험', position: '데이터 엔지니어', location: '서울 영등포구', career: '경력 5년 이상', tasks: ['흩어진 데이터를 한곳에 모으는 파이프라인을 만들어요', '매일 아침 보는 지표를 자동으로 쌓아요'] },
  { id: 8, company: '새벽 배송', position: '물류 시스템 개발자', location: '경기 김포시', career: '경력 3년 이상', tasks: ['창고 안 동선을 줄이는 시스템을 만들어요', '주문이 몰리는 새벽을 버티게 해요'] },
  { id: 9, company: '고요한 음악', position: '웹 프론트엔드 개발자', location: '서울 용산구', career: '경력 1년 이상', tasks: ['음악 듣는 화면을 끊김 없이 만들어요', '디자이너와 같이 움직임을 다듬어요'] },
  { id: 10, company: '초록 에너지', position: 'DevOps 엔지니어', location: '대전 유성구', career: '경력 4년 이상', tasks: ['배포를 버튼 하나로 끝나게 만들어요', '장애를 먼저 알아채는 알림을 붙여요'] },
  { id: 11, company: '바른 법률', position: '백엔드 개발자', location: '서울 서초구', career: '경력 3년 이상', tasks: ['상담 예약 API를 만들어요', '문서 검색을 빠르게 다듬어요'] },
  { id: 12, company: '한입 푸드', position: '프로덕트 매니저', location: '서울 강남구', career: '경력 4년 이상', tasks: ['주문 화면에서 빠져나가는 이유를 찾아요', '개발자, 디자이너와 다음 할 일을 정해요'] },
  { id: 13, company: '별빛 게임즈', position: '클라이언트 개발자', location: '경기 성남시', career: '경력 2년 이상', tasks: ['모바일 게임 화면을 만들어요', '프레임이 떨어지는 곳을 찾아 고쳐요'] },
  { id: 14, company: '산뜻한 여행', position: '프론트엔드 개발자', location: '제주 제주시', career: '경력 3년 이상', tasks: ['숙소 검색 화면을 만들어요', '느린 지도를 가볍게 바꿔요'] },
  { id: 15, company: '든든 부동산', position: 'QA 엔지니어', location: '서울 송파구', career: '경력 2년 이상', tasks: ['배포 전에 꼭 지나야 할 테스트를 짜요', '자주 깨지는 화면을 자동으로 확인해요'] },
  { id: 16, company: '가벼운 클라우드', position: '보안 엔지니어', location: '서울 구로구', career: '경력 5년 이상', tasks: ['서비스 권한을 꼭 필요한 만큼만 나눠요', '취약한 곳을 먼저 찾아 막아요'] },
  { id: 17, company: '두근 매칭', position: '머신러닝 엔지니어', location: '서울 강남구', career: '경력 3년 이상', tasks: ['추천 모델을 만들고 매일 다시 학습해요', '추천이 잘 맞는지 실험으로 확인해요'] },
  { id: 18, company: '느긋한 책방', position: 'UX 라이터', location: '서울 마포구', career: '경력 1년 이상', tasks: ['버튼과 안내 문구를 쉽게 다듬어요', '문구 원칙을 정리해 팀과 나눠요'] },
  { id: 19, company: '튼튼 제조', position: '임베디드 개발자', location: '경북 구미시', career: '경력 4년 이상', tasks: ['공장 센서 펌웨어를 만들어요', '현장 장비와 서버를 이어요'] },
  { id: 20, company: '파도 미디어', position: '영상 플랫폼 개발자', location: '부산 해운대구', career: '경력 3년 이상', tasks: ['영상 업로드와 변환을 빠르게 만들어요', '많은 사람이 동시에 봐도 끊기지 않게 해요'] },
]

// API가 응답하는 데 걸리는 시간이에요. 목록을 다시 받을 때 '불러오는 중'이 눈에 보이게 조금 길게 뒀어요.
export const wait = () => new Promise((resolve) => setTimeout(resolve, 700))
