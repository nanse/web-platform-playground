import { JOBS, wait } from '../../../../jobs'

type Params = { params: Promise<{ id: string }> }

// 좋아요는 서버 메모리에 둬요. 서버를 다시 켜면 사라져요.
const likes = new Set<number>()

// 채용 공고 상세 API. 상세 화면은 서버가 이 API를 불러서 HTML을 그려요.
export async function GET(_: Request, { params }: Params) {
  const { id } = await params
  const job = JOBS.find((j) => j.id === Number(id))
  await wait()
  return job ? Response.json({ ...job, liked: likes.has(job.id) }) : new Response(null, { status: 404 })
}

// 좋아요를 바꿔요. 저장은 바로 하고 답은 0.7초 늦게 해서, 답이 오기 전에 화면이 먼저 바뀌는 게 보여요.
export async function PUT(request: Request, { params }: Params) {
  const id = Number((await params).id)
  const { liked } = (await request.json()) as { liked: boolean }
  if (liked) likes.add(id)
  else likes.delete(id)
  await wait()
  return Response.json({ liked })
}
