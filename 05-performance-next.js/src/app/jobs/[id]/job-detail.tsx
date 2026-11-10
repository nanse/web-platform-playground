'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button, Card, Note, Result, Screen } from '../../../../../shared/ui'
import { DocumentCard, ReloadedOnBack, Stat, useDoc, useRestored } from '../../../bfcache'
import type { Job } from '../../../jobs'

export function JobDetail({ job, renderedAt }: { job: Job & { liked: boolean }; renderedAt: string }) {
  const router = useRouter()
  const path = usePathname()
  const restored = useRestored()
  const doc = useDoc()
  // 이 주소로 문서를 처음 열었으면 서버가 그린 문서(no-store)예요. 목록에서 눌러 왔으면 문서는 목록 것이에요.
  const ownDocument = doc?.firstPath === path
  const like = useLike(job.id, job.liked)

  return (
    <Screen
      onBack={() => (doc && !ownDocument ? router.back() : router.push('/'))}
      apis={['SSR', 'Cache-Control: no-store']}
      title={job.position}
      description={`${job.company} · ${job.location} · ${job.career}`}
      cta={<Button onClick={() => location.assign(`/outside?job=${job.id}`)}>회사 홈페이지에 갔다가 돌아오기</Button>}
    >
      {restored ? (
        <Result>
          회사 홈페이지에서 뒤로 왔는데, 얼려 둔 화면을 그대로 꺼냈어요. 서버에 다시 묻지 않아서 &apos;서버가 그린 시각&apos;이 그대로예요. 좋아요만은 떠난 사이 바뀌었을 수 있어서 서버에
          다시 물어봐요. (pageshow persisted: true)
        </Result>
      ) : (
        <ReloadedOnBack path={path}>뒤로 왔지만 얼려 둔 화면이 없어서 서버가 다시 그렸어요.</ReloadedOnBack>
      )}
      <LikeButton {...like} />
      <Stat label="서버가 그린 시각" value={renderedAt} hint="다시 불러오면 서버가 새로 그려서 바뀌어요" />
      <Card title="하는 일">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] text-grey-700">
          {job.tasks.map((task) => (
            <li key={task}>{task}</li>
          ))}
        </ul>
      </Card>
      <DocumentCard />
      <Note>
        {doc && !ownDocument
          ? '목록에서 눌러 와서 지금 문서는 목록 페이지예요. 서버가 그린 문서로 보려면 새로고침해요.'
          : '이 문서는 서버가 그렸고 Cache-Control: no-store가 붙어 있어요. 크롬은 그래도 얼려 두지만, 다녀오는 사이 쿠키가 바뀌면 다시 불러와요.'}
      </Note>
    </Screen>
  )
}

// 좋아요. 누르면 서버 답을 기다리지 않고 화면부터 바꿔요(낙관적 업데이트). 실패하면 되돌려요.
function useLike(id: number, likedOnServer: boolean) {
  const client = useQueryClient()
  const key = ['like', id]
  const { data: liked } = useQuery({
    queryKey: key,
    queryFn: async () => ((await (await fetch(`/api/jobs/${id}`)).json()) as { liked: boolean }).liked,
    // 서버가 그려 준 값으로 시작해요. 바뀌는 건 내가 누를 때뿐이라 알아서 다시 묻지 않아요.
    initialData: likedOnServer,
    staleTime: Infinity,
  })
  const { mutate, status } = useMutation({
    mutationFn: async (next: boolean) => {
      const res = await fetch(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify({ liked: next }) })
      if (!res.ok) throw new Error(`좋아요를 저장하지 못했어요 (${res.status})`)
    },
    onMutate: async (next) => {
      await client.cancelQueries({ queryKey: key })
      const before = client.getQueryData<boolean>(key)
      client.setQueryData(key, next)
      return { before }
    },
    onError: (_error, _next, result) => client.setQueryData(key, result?.before),
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  })

  // 얼려 둔 화면은 떠날 때 모습 그대로라, 그 사이 다른 탭이나 기기에서 바뀐 좋아요를 몰라요.
  // 그래서 bfcache에서 꺼내지면 서버에 다시 물어요. staleTime이 Infinity라 TanStack Query가 알아서 묻지 않거든요.
  const [recheck, setRecheck] = useState<keyof typeof RECHECK | null>(null)
  useEffect(() => {
    const onShow = async (event: PageTransitionEvent) => {
      if (!event.persisted) return
      const before = client.getQueryData<boolean>(['like', id])
      setRecheck('checking')
      await client.invalidateQueries({ queryKey: ['like', id] })
      setRecheck(client.getQueryData(['like', id]) === before ? 'same' : 'changed')
    }
    addEventListener('pageshow', onShow)
    return () => removeEventListener('pageshow', onShow)
  }, [client, id])

  const note = status === 'pending' || !recheck ? SAVE[status] : RECHECK[recheck]
  const toggle = () => {
    setRecheck(null)
    mutate(!liked)
  }
  return { liked, note, toggle }
}

const SAVE = {
  idle: '누르면 서버 답을 기다리지 않고 바로 켜져요',
  pending: '화면은 먼저 바꿨고, 서버에 저장하는 중이에요',
  success: '서버에 저장했어요',
  error: '저장하지 못해서 되돌렸어요',
}

const RECHECK = {
  checking: '얼려 둔 화면을 꺼내서, 서버에 다시 물어보는 중이에요',
  same: '꺼낸 뒤 서버에 다시 물어봤는데 그대로예요',
  changed: '떠난 사이 다른 곳에서 바뀌어서, 서버 값으로 고쳤어요',
}

function LikeButton({ liked, note, toggle }: ReturnType<typeof useLike>) {
  return (
    <button
      onClick={toggle}
      aria-pressed={liked}
      className="flex items-center gap-4 rounded-3xl bg-grey-50 px-5 py-4 text-left transition hover:bg-grey-100 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-primary"
    >
      <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden className={liked ? 'text-danger' : 'text-grey-400'}>
        <path
          d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3Z"
          fill={liked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        <span className="block text-[17px] font-semibold text-grey-900">{liked ? '좋아요 했어요' : '좋아요'}</span>
        <span className="block text-[14px] text-grey-500" role="status">
          {note}
        </span>
      </span>
    </button>
  )
}
