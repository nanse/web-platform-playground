'use client'
// 채용 공고 목록. 브라우저가 API를 불러서 그려요(CSR).
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button, Note, Result, Screen } from '../../../shared/ui'
import { DocumentCard, ReloadedOnBack, Stat, useRestored } from '../bfcache'
import type { Job } from '../jobs'

// 모듈 값은 문서가 그대로인 동안 남아요. 앱 안에서 돌아오면 목록 화면만 새로 그려지고 이 값은 이어져요.
let fetches = 0
let mounts = 0

export default function JobList() {
  const [returned] = useState(() => mounts > 0)
  const restored = useRestored()
  useEffect(() => {
    mounts += 1
  }, [])

  // 앱 안에서 뒤로 오면 목록 화면을 처음부터 다시 그려요. 이때 받아 둔 목록이 있어야 공고가 바로 그려지고,
  // 페이지가 그만큼 길어서 브라우저가 보던 스크롤 위치로 되돌려 놓을 수 있어요.
  // 새로 받은 목록이 같으면 data가 그대로라 다시 그려지지 않아요. isFetching도 읽어서 뒤에서 받는 동안과 받은 뒤 API 횟수가 바뀌어 보여요.
  const { data: jobs, isFetching } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs')
      fetches += 1
      return (await res.json()) as Job[]
    },
    // 받은 지 1분 안에는 그대로 믿고 다시 부르지 않아요. 1분이 지났다면 받아 둔 목록을 먼저 그리고 뒤에서 새로 받아요.
    staleTime: 60 * 1000,
    // 목록 화면이 사라진 뒤에도 받아 둔 목록을 5분 동안 지우지 않아요. 5분이 지나면 '불러오는 중'부터 다시 시작해요.
    gcTime: 5 * 60 * 1000,
  })

  return (
    <Screen
      brand="Performance Lab · Next.js"
      apis={['CSR', 'TanStack Query', 'pageshow']}
      title={'채용 공고를 골라\n뒤로 가기를 해 볼까요?'}
      description="아래로 내려 공고를 눌렀다가 뒤로 와 봐요. 보던 자리 그대로 돌아와요. 아래 버튼으로 다른 사이트에 다녀와도 돼요."
      cta={<Button onClick={() => location.assign('/outside')}>다른 사이트에 갔다가 돌아오기</Button>}
    >
      {restored ? (
        <Result>다른 사이트에서 뒤로 왔는데, 얼려 둔 화면을 그대로 꺼냈어요. 목록을 다시 받지 않아서 API를 부른 횟수가 그대로예요. (pageshow persisted: true)</Result>
      ) : returned ? (
        <Result>
          앱 안에서 목록으로 돌아왔어요. bfcache는 아니에요. TanStack Query가 받아 둔 목록으로 바로 그려서, 보던 자리 그대로예요.
        </Result>
      ) : (
        <ReloadedOnBack path="/">뒤로 왔지만 얼려 둔 화면이 없어서 처음부터 다시 불러왔어요.</ReloadedOnBack>
      )}
      <Stat
        label="이 문서에서 목록 API를 부른 횟수"
        value={`${fetches}번`}
        hint={jobs && isFetching ? '받아 둔 목록을 먼저 보여주고 뒤에서 새로 받고 있어요' : '받은 지 1분 안에 돌아오면 다시 부르지 않아요'}
      />
      {jobs ? (
        <ul className="-mx-6">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link href={`/jobs/${job.id}`} className="block px-6 py-3.5 transition hover:bg-grey-50 active:bg-grey-100">
                <span className="block text-[17px] font-semibold text-grey-900">{job.position}</span>
                <span className="block text-[14px] text-grey-500">
                  {job.company} · {job.location} · {job.career}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-3xl bg-grey-50 px-5 py-6 text-center text-[15px] font-medium text-grey-500" role="status">
          공고를 불러오는 중이에요
        </p>
      )}
      <DocumentCard />
      <Note>
        공고를 눌러 가는 상세 화면은 서버가 그려요. 앱 안에서 오가는 건 문서가 그대로라, &apos;문서를 연 시각&apos;이 바뀌지 않아요.
      </Note>
    </Screen>
  )
}
