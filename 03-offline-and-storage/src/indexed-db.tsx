import { startTransition, useEffect, useState, ViewTransition } from 'react'
import { Button, Card, InfoList, Note, Result, Screen, useNav, yesNo } from '../../shared/ui'
import { useStorageInfo } from './estimate'
import { Report } from './report'

const JOBS = [
  { id: 1, icon: '🧑‍💻', title: '프론트엔드 개발자', meta: '경력 무관' },
  { id: 2, icon: '📊', title: '데이터 분석가', meta: '경력 5년 이상' },
  { id: 3, icon: '🎨', title: '프로덕트 디자이너', meta: '경력 3년 이상' },
  { id: 4, icon: '📣', title: '퍼포먼스 마케터', meta: '경력 2년 이상' },
  { id: 5, icon: '🤝', title: 'HR 매니저', meta: '경력 4년 이상' },
]

// localStorage와 달리 Date 같은 객체도 그대로 담겨요.
type Bookmark = (typeof JOBS)[number] & { savedAt: Date }

// IndexedDB 원래 API는 콜백 방식이라 Promise로 감싸요. 실제 서비스라면 idb 같은 작은 래퍼를 써요.
let db: Promise<IDBDatabase> | undefined
function openDb() {
  db ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('offline-lab', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('bookmarks', { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return db
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const store = (await openDb()).transaction('bookmarks', mode).objectStore('bookmarks')
  return new Promise<T>((resolve, reject) => {
    const request = action(store)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function IndexedDb({ feature }: { feature: { id: string; icon: string } }) {
  const { back } = useNav()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [result, setResult] = useState('')
  const storage = useStorageInfo(bookmarks.length)
  const next = JOBS.find((job) => !bookmarks.some((b) => b.id === job.id))

  async function reload() {
    const all = await run<Bookmark[]>('readonly', (store) => store.getAll())
    // startTransition 안에서 바꿔야 목록이 <ViewTransition>으로 부드럽게 바뀌어요.
    startTransition(() => setBookmarks(all.sort((a, b) => a.savedAt.getTime() - b.savedAt.getTime())))
    return all
  }

  useEffect(() => {
    void reload().then((all) => all.length && setResult(`지난번에 담은 관심 공고 ${all.length}개를 불러왔어요.`))
  }, [])

  async function add() {
    if (!next) return
    await run('readwrite', (store) => store.put({ ...next, savedAt: new Date() }))
    await reload()
    setResult(`'${next.title}'를 담았어요. 새로고침해도 남아 있어요.`)
  }

  async function remove(bookmark: Bookmark) {
    await run('readwrite', (store) => store.delete(bookmark.id))
    await reload()
    setResult(`'${bookmark.title}'를 뺐어요.`)
  }

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['indexedDB', 'IDBObjectStore']}
      title={'관심 공고를\n브라우저에 담아 볼까요?'}
      description="IndexedDB에 공고를 객체 그대로 담아요. 새로고침하거나 창을 닫았다 열어도 남아 있어요."
      cta={
        <Button onClick={add} disabled={!('indexedDB' in window) || !next}>
          {next ? '관심 공고 하나 담기' : '모두 담았어요'}
        </Button>
      }
    >
      {result && <Result>{result}</Result>}
      {bookmarks.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {bookmarks.map((bookmark) => (
            <ViewTransition key={bookmark.id}>
              <li className="flex items-center gap-4 rounded-2xl bg-grey-50 py-3 pr-2 pl-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[20px]" aria-hidden>
                  {bookmark.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-semibold text-grey-900">{bookmark.title}</span>
                  <span className="block text-[14px] text-grey-500">{bookmark.savedAt.toLocaleTimeString('ko-KR')}에 담았어요</span>
                </span>
                <button
                  onClick={() => remove(bookmark)}
                  className="shrink-0 rounded-lg px-3 py-2 text-[14px] font-semibold text-grey-600 hover:bg-grey-100 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  빼기
                </button>
              </li>
            </ViewTransition>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl bg-grey-50 px-5 py-8 text-center text-[15px] text-grey-500">아직 담은 공고가 없어요</p>
      )}
      <Card title="지금 상태">
        <InfoList
          items={[
            ['IndexedDB', yesNo('indexedDB' in window)],
            ['담은 공고', `${bookmarks.length}개`],
            ['이 사이트가 쓰는 공간', storage.usage],
            ['브라우저가 지울 수 있나요?', storage.persisted],
          ]}
        />
      </Card>
      <Note>담긴 내용은 DevTools → Application → IndexedDB → offline-lab → bookmarks에서 볼 수 있어요.</Note>
      <Report id="indexed-db" />
    </Screen>
  )
}
