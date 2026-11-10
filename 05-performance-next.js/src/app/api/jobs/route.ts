import { JOBS, wait } from '../../../jobs'

// 채용 공고 목록 API. 목록 화면이 브라우저에서 불러요.
export async function GET() {
  await wait()
  return Response.json(JOBS)
}
