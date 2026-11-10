'use client'
// 외부 사이트 역할. bfcache는 "다른 문서"로 이동해야 보여서, 여기로는 location.assign으로 와요.
import { useState, useSyncExternalStore, type ComponentProps } from 'react'
import { Button, Note, Screen } from '../../../../shared/ui'

const back = () => (history.length > 1 ? history.back() : location.assign('/'))

// 공고 상세에서 오면 주소에 ?job=번호가 붙어요. 미리 그려 둔 페이지라 서버에서는 주소를 몰라서 null로 그려요.
const useJob = () =>
  useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(location.search).get('job'),
    () => null,
  )

// 다른 탭에서 이 공고의 좋아요를 누른 것처럼, 서버 값을 직접 뒤집어요.
async function flipLike(job: string) {
  const { liked } = (await (await fetch(`/api/jobs/${job}`)).json()) as { liked: boolean }
  await fetch(`/api/jobs/${job}`, { method: 'PUT', body: JSON.stringify({ liked: !liked }) })
}

export default function Outside() {
  const job = useJob()
  const [flipping, setFlipping] = useState(false)

  return (
    <Screen
      brand="다른 사이트"
      apis={['pagehide', 'pageshow']}
      title={'다른 사이트에\n왔어요'}
      description="브라우저가 문서를 새로 불러왔어요. 떠나온 화면은 지금 브라우저 안에 얼려 둔 상태예요. 돌아가서 숫자가 그대로인지 봐요."
      cta={
        <>
          <Button onClick={back}>원래 화면으로 돌아가기</Button>
          {job && (
            <SubButton
              disabled={flipping}
              onClick={async () => {
                setFlipping(true)
                await flipLike(job)
                back()
              }}
            >
              {flipping ? '다른 탭에서 좋아요를 바꾸는 중이에요' : '다른 탭에서 좋아요를 바꾸고 돌아가기'}
            </SubButton>
          )}
          <SubButton
            onClick={() => {
              document.cookie = `session=${Date.now()}; path=/`
              back()
            }}
          >
            로그아웃한 것처럼 쿠키를 바꾸고 돌아가기
          </SubButton>
        </>
      }
    >
      <Note>
        쿠키를 바꾸고 돌아가면, 서버가 그린 상세 문서(no-store)는 개인정보가 남지 않게 다시 불러와요. 목록 문서는 그대로 꺼내요.
      </Note>
      {job && (
        <Note>
          다른 탭에서 좋아요를 바꾸고 돌아가면, 꺼낸 화면은 떠날 때 값을 잠깐 보여줘요. 곧 서버에 다시 물어서 바뀐 값으로 고쳐요.
        </Note>
      )}
    </Screen>
  )
}

function SubButton(props: ComponentProps<'button'>) {
  return (
    <button
      {...props}
      className="h-12 w-full rounded-2xl text-[15px] font-semibold text-grey-600 transition hover:bg-grey-100 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
    />
  )
}
