// 채용 공고 상세. 서버가 API를 불러서 HTML을 그려요(SSR).
// headers()를 읽어서 요청마다 새로 그리는 페이지가 되고, Next.js는 이런 페이지에 Cache-Control: no-store를 붙여요.
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Job } from '../../../jobs'
import { JobDetail } from './job-detail'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const h = await headers()
  const res = await fetch(`${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}/api/jobs/${id}`, { cache: 'no-store' })
  if (!res.ok) notFound()
  const job: Job & { liked: boolean } = await res.json()
  return <JobDetail job={job} renderedAt={new Date().toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' })} />
}
