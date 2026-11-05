import { useEffect, useState } from 'react'
import { Button, Card, InfoList, Note, Result, Screen, useNav, yesNo } from '../../shared/ui'
import { formatBytes, useStorageInfo } from './estimate'
import { Report } from './report'

const FILE = 'memo.txt'

const supported = 'getDirectory' in (navigator.storage ?? {})
// 사파리는 26부터 메인 스레드에서 쓸 수 있어요. 그 전에는 워커에서 createSyncAccessHandle로 써야 해요.
const canWrite = typeof FileSystemFileHandle !== 'undefined' && 'createWritable' in FileSystemFileHandle.prototype

export function Opfs({ feature }: { feature: { id: string; icon: string } }) {
  const { back } = useNav()
  const [text, setText] = useState('오늘 지원할 공고: 프론트엔드 개발자, 데이터 분석가')
  const [saved, setSaved] = useState<{ size: number; at: Date } | null>(null)
  const [result, setResult] = useState('')
  const storage = useStorageInfo(saved)

  // 지난번에 저장한 파일이 있으면 불러와요. 새로고침해도 남아 있는지 여기서 보여요.
  useEffect(() => {
    if (!supported) return
    void (async () => {
      try {
        const root = await navigator.storage.getDirectory()
        const file = await (await root.getFileHandle(FILE)).getFile()
        setText(await file.text())
        setSaved({ size: file.size, at: new Date(file.lastModified) })
        setResult(`지난번에 저장한 ${FILE}를 불러왔어요.`)
      } catch {
        // 아직 저장한 적이 없어요.
      }
    })()
  }, [])

  async function save() {
    try {
      const root = await navigator.storage.getDirectory()
      const handle = await root.getFileHandle(FILE, { create: true })
      const writable = await handle.createWritable()
      await writable.write(text)
      await writable.close()
      const file = await handle.getFile()
      setSaved({ size: file.size, at: new Date(file.lastModified) })
      setResult(`${FILE}에 ${formatBytes(file.size)}를 저장했어요. 새로고침해도 그대로 남아 있어요.`)
    } catch (e) {
      setResult(`저장하지 못했어요. (${e})`)
    }
  }

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['storage.getDirectory()', 'createWritable()']}
      title={'브라우저 안에\n파일을 저장해 볼까요?'}
      description="이 사이트만 열 수 있는 숨은 폴더(OPFS)에 메모를 파일로 저장해요. Finder에는 보이지 않지만, 새로고침해도 남아 있어요."
      cta={
        <Button onClick={save} disabled={!supported || !canWrite || !text}>
          OPFS에 저장하기
        </Button>
      }
    >
      {result && <Result>{result}</Result>}
      <label className="block">
        <span className="text-[14px] font-medium text-grey-600">{FILE}에 저장할 내용</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="mt-2 w-full resize-none rounded-2xl border-2 border-grey-200 bg-transparent px-4 py-3 text-[17px] leading-[1.6] text-grey-900 transition outline-none focus:border-primary"
        />
      </label>
      <Card title="지금 상태">
        <InfoList
          items={[
            ['OPFS', yesNo(supported)],
            ['메인 스레드에서 쓰기', yesNo(canWrite)],
            [FILE, saved ? `${formatBytes(saved.size)} · ${saved.at.toLocaleTimeString('ko-KR')} 저장` : '아직 없어요'],
            ['이 사이트가 쓰는 공간', storage.usage],
          ]}
        />
      </Card>
      {supported && !canWrite && <Note>이 브라우저는 메인 스레드에서 파일을 쓸 수 없어요. 사파리 26 이상에서 열어요.</Note>}
      <Note>파일을 지우려면 DevTools → Application → Storage에서 "Clear site data"를 눌러요.</Note>
      <Report id="opfs" />
    </Screen>
  )
}
