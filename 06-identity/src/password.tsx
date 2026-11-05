import { useState } from 'react'
import { Button, Card, InfoList, Note, Result, Screen, useNav, yesNo, type FeatureRef } from '../../shared/ui'
import { Field } from './field'
import { Report } from './report'

const KEY = 'identity-lab:password-saved'
const supported = 'PasswordCredential' in window

export function Password({ feature }: { feature: FeatureRef }) {
  const { back } = useNav()
  const [id, setId] = useState('jobseeker@example.com')
  const [password, setPassword] = useState('wanted-demo-1234')
  const [saved, setSaved] = useState(() => localStorage.getItem(KEY) === '1')
  const [result, setResult] = useState('')

  async function save() {
    try {
      await navigator.credentials.store(new PasswordCredential({ id, password, name: '원티드 구직자' }))
      localStorage.setItem(KEY, '1')
      setSaved(true)
      setResult('브라우저에 넘겼어요. 크롬이 저장할지 물어보면 "저장"을 눌러야 실제로 들어가요.')
    } catch (e) {
      setResult(`저장하지 못했어요. (${e})`)
    }
  }

  async function fill() {
    try {
      // mediation: 'optional'이면 저장된 게 하나뿐이고 허락받은 적이 있을 때 묻지 않고 꺼내요.
      const credential = (await navigator.credentials.get({ password: true, mediation: 'optional' })) as PasswordCredential | null
      if (!credential) return setResult('저장된 비밀번호가 없어요. 크롬이 저장할지 물어봤을 때 "저장"을 눌렀는지 확인해요.')
      setId(credential.id)
      setPassword(credential.password)
      setResult(`저장해 둔 ${credential.id} 계정으로 채웠어요.`)
    } catch (e) {
      setResult(`꺼내지 못했어요. (${e})`)
    }
  }

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['PasswordCredential', 'navigator.credentials.store()']}
      title={saved ? '저장한 비밀번호를\n꺼내 볼까요?' : '아이디와 비밀번호를\n브라우저에 저장해 볼까요?'}
      description={
        saved
          ? 'JavaScript로 브라우저 비밀번호 관리자에서 꺼내 입력칸을 채워요.'
          : 'JavaScript로 브라우저 비밀번호 관리자에 바로 넣어요. 크롬 계열에서만 돼요.'
      }
      cta={
        <Button onClick={saved ? fill : save} disabled={!supported || !id || !password}>
          {saved ? '저장한 비밀번호로 채우기' : '브라우저에 저장하기'}
        </Button>
      }
    >
      {result && <Result>{result}</Result>}
      <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="아이디" value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" />
        <Field label="비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </form>
      <Card title="지금 상태">
        <InfoList
          items={[
            ['PasswordCredential', yesNo(supported)],
            ['이 화면에서 저장한 적', saved ? '있어요' : '없어요'],
          ]}
        />
        {saved && (
          <button
            onClick={() => {
              localStorage.removeItem(KEY)
              setSaved(false)
              setResult('')
            }}
            className="mt-3 rounded-lg px-2 py-1 text-[14px] font-semibold text-grey-600 hover:bg-grey-100 focus-visible:outline-2 focus-visible:outline-primary"
          >
            처음부터 다시 하기
          </button>
        )}
      </Card>
      <Note>
        사실 이 API가 없어도 돼요. 위 입력칸처럼 <code>autocomplete="username"</code>과 <code>"current-password"</code>만 제대로 달면, 모든
        브라우저의 비밀번호 관리자가 알아서 저장하고 채워 줘요. 저장된 값은 브라우저 설정의 비밀번호 관리자에서 지워요.
      </Note>
      {!supported && <Note>이 브라우저는 PasswordCredential을 지원하지 않아요. 크롬이나 엣지에서 열어요.</Note>}
      <Report id="password" />
    </Screen>
  )
}
