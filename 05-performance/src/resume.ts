// 원티드 이력서 API 응답과 같은 모양이에요. 그리는 데 쓰는 필드만 남기고, 번호·키 같은 내부 값은 뺐어요.
// 이 레포는 GitHub에 올라가서 휴대폰 번호는 가짜 번호로 바꿨어요.

export type Project = {
  title: string
  description: string
  job_role: string | null
  business_title: string | null
  start_time: string
  end_time: string | null
}

export type Career = {
  company: { name: string }
  served: boolean
  start_time: string
  end_time: string | null
  employment_type: string
  job_role: string | null
  business_title: string | null
  total_period: number
  projects: Project[]
}

export type Education = {
  school_name: string
  major: string | null
  school_type: string
  degree: string
  status: string
  start_time: string
  end_time: string | null
}

export type Resume = {
  resume: { name: string; email: string; mobile: string; about: string }
  careers: Career[]
  educations: Education[]
}

export const RESUME: Resume = {
  resume: {
    name: 'K 아재1',
    email: 'test1234@test.com',
    mobile: '+821012345678',
    about:
      '대규모 트래픽 서비스 최적화·표준화·조직문화 개선까지 주도적으로 이끈 경험 보유.\nReact/Next.js/AWS 기반의 성능 개선 및 비용 절감 프로젝트에서 성과를 입증 하였습니다.',
  },
  careers: [
    {
      company: { name: '원티드랩' },
      served: true,
      start_time: '2020-03-01',
      end_time: null,
      employment_type: 'FULLTIME',
      job_role: '프론트엔드',
      business_title: '팀원',
      total_period: 81,
      projects: [
        {
          title: '사내 원격 디버깅 플랫폼 bugted',
          description:
            '웹뷰/웹앱의 런타임 상태를 원격에서 관찰·기록·재생하고, 버그 리포트를 Jira 이슈로 자동 발행하는 사내 도구.\n(Claude Code를 이용하여 배포까지 4일 소요)\n\n역할:\n- 문제 정의부터 아키텍처 설계\n- 3티어 전 구간 구현, 프로덕션 배포, 사내 도입\n\n\n성과:\n- 누적 기록 50건\n- 라이브 세션 14건\n- 재생 300회\n- jira 발행 이슈 30건\n\n\n사용기술:\n- Frontend: TypeScript, Next.js 16 (App Router), React 19, FSD 아키텍처, rrweb-player\n- Backend: Go 1.25, gorilla/websocket, pgx, aws-sdk-go-v2, PostgreSQL, S3\n- SDK: Chrome DevTools Protocol(chobitsu), rrweb, esbuild, bun workspaces',
          job_role: null,
          business_title: null,
          start_time: '2026-09-01',
          end_time: '2026-09-01',
        },
        {
          title: '법인카드 지출결의 자동화 서비스(돈티드)',
          description:
            '수동으로 기입하는 법인카드 지출결의서를 자동으로 지출결의서를 생성해주는 서비스 개발\n(Claude Code를 이용하여 배포까지 하루만에 완성)\n\n역할: \n- 전 구간 개발 (풀스택 개발)\n  - 크롤러 워커(Node ESM·pg)\n  - 멱등(idempotent) 수집 파이프라인 구현: dedup_key(sha256) + ON CONFLICT 업서트로 재크롤링 시 중복·유실 없이 정확히 1건=1행 보장\n\n성과:\n- 건당: 180초 → 20초 = 160초 절감 (약 89%↓)\n  - 월 530건: 22시간 13분/월 (8월 실측)\n\n사용기술:\n- Node.js, Next.js, PostgreSQL, Playwright',
          job_role: null,
          business_title: null,
          start_time: '2026-06-01',
          end_time: '2026-06-01',
        },
        {
          title: '인증 SDK 개발',
          description:
            '역할:\n프론트엔드 인증 SDK 개발\n\n성과:\n1. 인증 연동 코드 방식 표준화\n2. 인증기반 페이지 Next.js middleware 처리 > 각 페이지별 인증코드 제거\n3. 로그인 / 로그아웃 연동 처리 표준화\n\n사용기술:\n- next.js middleware, react\n- monorepo, tsup, lerna',
          job_role: null,
          business_title: null,
          start_time: '2025-07-01',
          end_time: '2025-08-01',
        },
        {
          title: '원티드 100% 트래픽 CloudFront 전환 프로젝트 리드',
          description:
            '역할: \nCloudFront 프로젝트 리딩 및 메인 개발담당자\n\n성과:\n1. 데이터 트래픽 전송 비용 60% 절감 \n\n2. 성능 및 안정성 개선\n- 평균 응답시간 23% 개선 (1.65s  ->1.27s)\n- 초당 처리량 15% 향상 (36.8/s -> 43/s)\n- ALB 활성 연결 수 66% 감소\n\n• 프론트엔드 사용자 경험 개선\n- LCP(Largest Contentful Paint) 24% 개선 (1.30s ->  0.984s)\n- FCP(First Contentful Paint) 13% 개선 (1.11s  -> 0.970s)\n\n3. 검색엔진 최적화(SEO)\n• 검색엔진 크롤링 성능 개선\n- Google 크롤러 페이지 로딩 속도 75% 개선 (2초  ->  0.5초)\n- Naver 페이지 수집량 130% 증가 (10,000건  -> 23,000건)\n\n\n러닝포인트:\n- devops 동료와의 협업의 중요성\n\n사용기술:\n- Node.js\n- AWS CloudFront\n- AWS Lambda@edge\n- ESbuild\n\n관련글:\nhttps://shorturl.at/HVstr',
          job_role: '프론트엔드',
          business_title: null,
          start_time: '2024-10-01',
          end_time: '2024-12-01',
        },
        {
          title: '빌드/배포 속도 개선',
          description:
            '역할:\nDocker 최적화\n\n성과:\n- 빌드 시간 단축: 10분 -> 2분으로 단축 (80%절감)\n: docker image 사이즈 경량화 (60~93% 용량 감소)\n: docker build context 최적화 (docker build context 20초 10초 단축)\n\n- 사용기술:\nnext.js, docker, github actions, aws ecs\n\n러닝 포인트:\n- Next.js standalone 모드\n- Docker 이미지 레이어링.\n- Docker ignore 파일의 동작 원리\n- Vercel Node File Trace를 이용한 의존성 탐색',
          job_role: null,
          business_title: null,
          start_time: '2022-12-01',
          end_time: '2023-01-01',
        },
        {
          title: '실시간 이미지 리사이징 서버 구축',
          description:
            '역할:\n실시간 이미지 리사이징 서버 개발\n\n성과:\n- 웹페이지 무게 97% 절감\n- 웹페이지 LCP 20% 개선\n\n사용기술:\n- AWS Cloudfront, CloudFront function,  Lambda, typescript, esbuild, Content Negotiation\n\n러닝포인트:\n- webp maxium size (16383 x 16383)\n- lambda request/response payload limit (6MB)\n- CloudFront functios를 이용한 white domain 처리.\n\n관련글:\nhttps://shorturl.at/S5vkn',
          job_role: '프론트엔드',
          business_title: null,
          start_time: '2022-05-01',
          end_time: '2022-06-01',
        },
        {
          title: '사용자 편의 향상 (뒤로가기 상태유지)',
          description:
            '역할:\n프론트엔드 개발\n\n배경:\n"리스트 --> 상세 --> (뒤로가기) --> 리스트"\n뒤로가기 했을때, 리스트 스크롤 position이 상단으로 올라가 버리는 문제.\n- 순차적 탐색이 어려워, 사이트 이탈률 지표에 영향.\n- 참조: https://baymard.com/blog/back-button-expectations\n\n성과:\n상세 페이지 페이지뷰 10% 증가\n\n해결안:\n- Next.js Rooute as Modal이라는 기법으로 코드 복잡도 없이 뒤로가기 상태유지 처리.\n\n사용기술:\n- nextjs, Router as Modal',
          job_role: '프론트엔드',
          business_title: '팀원',
          start_time: '2022-07-01',
          end_time: '2022-07-01',
        },
        {
          title: '성능/속도 퍼포먼스 향상 (CDN Support with asset prefix + CloudFront 최적화)',
          description:
            '역할:\n프론트엔드 개발자\n\n성과:\n- lighthouse 점수 + 10점 향상\n- 프론트 서버 Request 처리량 77% 감소\n\n사용기술:\n- nextjs, cloudfront, cloudfront functions\n\n러닝포인트:\n- asset을 CloudFront로 보내는게 좋으나, Sentry 설정이 복잡하게 됨.\n\n관련글:\nhttps://shorturl.at/G7xM5',
          job_role: null,
          business_title: null,
          start_time: '2021-08-01',
          end_time: '2021-09-01',
        },
        {
          title: '성능/속도 퍼포먼스 향상 (SSR + Cache 적용)',
          description:
            '여러 페이지에 CSR -> SSR 변경 & 비로그인 케이스에서 Cache 처리\n\n역할:\n프론트엔드 개발자\n\n성과:\n- LCP 4초 -> 2.5초 개선 (37.5% 개선)\n\n사용기술:\n- nextjs, redis, express\n\n러닝포인트:\n- Next.js에서 SSR + Cache 처리는 Custom Server를 사용했을때 가능한 처리.\n- 비로그인 유저 대상으로 캐싱처리 하는건 쉬우나, 로그인 유저 대상으로 캐싱처리는 생각할 게 더 많음.\n- express 제거 작업하면서 해당 기능은 FadeOut.\n\n관련글:\nhttps://https://shorturl.at/BZVtt',
          job_role: '프론트엔드',
          business_title: '팀원',
          start_time: '2020-05-01',
          end_time: '2020-09-01',
        },
        {
          title: 'SEO 개선',
          description:
            '역할:\n프론트엔드 개발\n\n성과:\n- google search console 기준 유입 30% 증가\n\n사용기술:\n- nextjs, google search console\n\n\n관련글:\n- https://shorturl.at/6gtpA',
          job_role: null,
          business_title: null,
          start_time: '2020-05-01',
          end_time: '2020-06-01',
        },
      ],
    },
  ],
  educations: [
    {
      school_name: '가천대학교',
      major: '컴퓨터정보공학부 정보통신공학전공',
      school_type: 'UNIVERSITY',
      degree: 'BACHELOR',
      status: 'GRADUATED',
      start_time: '2007-03-01',
      end_time: '2012-09-01',
    },
  ],
}

// 화면(인쇄용 HTML)과 워커(PDF)가 같은 글자를 쓰도록, 보여줄 문구는 여기서 만들어요.
// 코드 값은 이 이력서에 나오는 것만 옮겼어요. 모르는 값은 그대로 보여줘요.
const EMPLOYMENT: Record<string, string> = { FULLTIME: '정규직' }
const SCHOOL_TYPE: Record<string, string> = { UNIVERSITY: '대학교(4년제이상)' }
const DEGREE: Record<string, string> = { BACHELOR: '학사' }
const STATUS: Record<string, string> = { GRADUATED: '졸업' }

const ym = (date: string | null) => (date ? date.slice(0, 7).replace('-', '.') : '')
const period = (months: number) =>
  [Math.floor(months / 12) && `${Math.floor(months / 12)}년`, months % 12 && `${months % 12}개월`].filter(Boolean).join(' ')

export const totalCareer = (data: Resume) => period(data.careers.reduce((sum, career) => sum + career.total_period, 0))

export const careerMeta = (career: Career) =>
  [
    `${ym(career.start_time)} - ${career.served && !career.end_time ? '재직중' : ym(career.end_time)} (${period(career.total_period)})`,
    EMPLOYMENT[career.employment_type] ?? career.employment_type,
    career.job_role,
    career.business_title,
  ].filter((part): part is string => !!part)

export const projectMeta = (project: Project) =>
  [`${ym(project.start_time)} - ${ym(project.end_time)}`, project.job_role, project.business_title].filter((part): part is string => !!part)

export const educationMeta = (education: Education) =>
  [
    `${ym(education.start_time)} - ${ym(education.end_time)}`,
    education.major,
    SCHOOL_TYPE[education.school_type] ?? education.school_type,
    DEGREE[education.degree] ?? education.degree,
    STATUS[education.status] ?? education.status,
  ].filter((part): part is string => !!part)
