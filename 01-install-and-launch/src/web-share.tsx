import { useState } from 'react'
import { Report } from './report'
import { back, Button, Card, InfoList, Note, Result, Screen, yesNo } from './ui'

// 실제 서비스라면 공고 상세 주소예요. 여기서는 이 화면 주소를 보내요.
const DATA = {
  title: '플레이그라운드랩 · 프론트엔드 개발자',
  text: '이 공고 같이 볼래요?',
  url: `${location.origin}/#web-share`,
} satisfies ShareData

const supported = 'share' in navigator
// 파일은 내용 말고 종류만 봐요. 빈 PNG로 "이미지를 같이 보낼 수 있는지"만 물어요.
// 사파리 12.1~13은 share만 있고 canShare가 없어서 ?.로 불러요.
const filesSupported = supported && (navigator.canShare?.({ files: [new File([], 'job.png', { type: 'image/png' })] }) ?? false)

export function WebShare() {
  const [result, setResult] = useState<string | null>(null)

  async function copyLink(reason: string) {
    try {
      await navigator.clipboard.writeText(DATA.url)
      setResult(`${reason} 링크를 복사했어요. 메신저에 붙여 넣어 보내요.`)
    } catch {
      setResult(`${reason} 링크도 복사하지 못했어요. 주소창의 주소를 복사해서 보내요.`)
    }
  }

  async function share() {
    if (!supported) return copyLink('이 브라우저는 공유 창이 없어서')
    try {
      // 버튼을 누른 직후에 불러야 해요. 앞에서 오래 기다리면 브라우저가 "사용자가 누른 게 아니"라며 막아요.
      await navigator.share(DATA)
      setResult('고른 앱으로 넘겼어요. 어느 앱을 골랐는지는 페이지가 알 수 없어요.')
    } catch (error) {
      if ((error as Error).name === 'AbortError') setResult('공유 창을 닫았어요. 다시 누르면 또 열려요.')
      else await copyLink(`공유 창을 열지 못해서(${(error as Error).name})`)
    }
  }

  return (
    <Screen
      onBack={back}
      apis={['Web Share API']}
      title={'이 공고를\n친구에게 보내 볼까요?'}
      description="누르면 기기의 공유 창이 떠요. 카카오톡, 메시지, 메일처럼 늘 쓰는 앱을 골라 보내요."
      cta={<Button onClick={share}>{supported ? '공고 공유하기' : '공고 링크 복사하기'}</Button>}
    >
      {result && <Result>{result}</Result>}
      <Card title="보낼 내용">
        <InfoList
          items={[
            ['제목', DATA.title],
            ['내용', DATA.text],
            ['링크', DATA.url],
          ]}
        />
      </Card>
      <Card title="지금 상태">
        <InfoList
          items={[
            ['navigator.share', yesNo(supported)],
            ['이미지 같이 보내기', yesNo(filesSupported)],
          ]}
        />
      </Card>
      <Note>
        {supported
          ? '설치하지 않은 브라우저 탭에서도 동작해요. 받는 앱에 따라 제목은 빠지고 내용과 링크만 갈 수 있어요.'
          : '이 브라우저는 공유 창이 없어요. 대신 링크를 복사해요. 크롬·엣지, 사파리, 안드로이드 파이어폭스에서 열면 공유 창이 떠요.'}
      </Note>
      <Report ids={['web-share']} />
    </Screen>
  )
}
