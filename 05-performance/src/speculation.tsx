import { useEffect } from 'react'
import { Button, Card, InfoList, Note, Screen, useNav, yesNo, type FeatureRef } from '../../shared/ui'
import { bullets, Code, ExplainTitle, Lead, strong, Topic } from '../../shared/explain'
import { Report } from './report'

// 미리 그린 페이지를 실제로 쓰려면, 이동하는 주소가 규칙의 주소와 글자 하나까지 같아야 해요.
const TARGET = '/other.html?from=speculation'
const RULES = { prerender: [{ urls: [TARGET] }] }
const supported = HTMLScriptElement.supports?.('speculationrules') ?? false

function Explainer() {
  return (
    <>
      <ExplainTitle>Speculation Rules를 쉽게 말하면</ExplainTitle>
      <Lead>
        사용자가 누를 것 같은 다음 페이지를 <strong className={strong}>미리 준비</strong>해 두는 규칙이에요. HTML에 JSON 몇 줄만 넣으면 브라우저가 알아서
        해요.
      </Lead>
      <Topic icon="📦" title="두 가지 방법이 있어요">
        <ul className={bullets}>
          <li>
            <strong className={strong}>prefetch (미리 받아 두기)</strong>: 다음 페이지의 HTML만 받아 둬요. 그리지는 않아요.
          </li>
          <li>
            <strong className={strong}>prerender (미리 그려 두기)</strong>: 보이지 않는 탭에서 페이지를 통째로 그려 둬요. 이동하면 바로 바꿔 끼워서 기다림이
            없어요.
          </li>
        </ul>
      </Topic>
      <Topic icon="⏱️" title="언제 준비할지 정할 수 있어요 (eagerness)">
        <ul className={bullets}>
          <li>immediate: 규칙을 보자마자 준비해요. 주소 목록(urls)으로 쓴 규칙의 기본값이에요.</li>
          <li>eager · moderate: 링크에 마우스를 올리면 준비해요. moderate는 약 0.2초 동안 올리고 있어야 해요.</li>
          <li>conservative: 링크를 누르기 시작할 때 준비해요. 문서 안 링크로 쓴 규칙의 기본값이에요.</li>
        </ul>
      </Topic>
      <Topic icon="⚠️" title="조심할 것">
        <ul className={bullets}>
          <li>미리 그리면 데이터와 메모리를 더 써요. 정말 누를 것 같은 페이지만 준비해요.</li>
          <li>미리 그리는 동안에도 페이지의 코드가 돌아요. 분석 도구가 페이지뷰를 먼저 세지 않게, document.prerendering을 보고 실제로 보여진 뒤에 보내요.</li>
          <li>데이터 절약 모드, 배터리 절약 모드, 메모리가 부족할 때는 브라우저가 준비하지 않아요.</li>
        </ul>
      </Topic>
    </>
  )
}

export function Speculation({ feature }: { feature: FeatureRef }) {
  const { back } = useNav()

  // 이 화면에 있는 동안만 규칙을 넣어요. 화면을 떠나면 규칙을 빼서 미리 그리던 것도 멈춰요.
  useEffect(() => {
    if (!supported) return
    const script = document.createElement('script')
    script.type = 'speculationrules'
    script.textContent = JSON.stringify(RULES)
    document.head.append(script)
    return () => script.remove()
  }, [])

  return (
    <Screen
      feature={feature}
      onBack={back}
      apis={['<script type="speculationrules">', 'prerender', 'activationStart']}
      title={'다음 페이지를\n미리 그려 둘까요?'}
      description="이 화면에 들어오자마자 브라우저가 다음 페이지를 보이지 않는 탭에서 미리 그려 둬요. 이동하면 기다림 없이 바로 보여요."
      cta={
        <Button onClick={() => location.assign(TARGET)} disabled={!supported}>
          미리 그린 페이지로 이동하기
        </Button>
      }
    >
      <div>
        <p className="mb-2 text-[14px] font-medium text-grey-600">지금 이 화면에 넣은 규칙</p>
        <Code code={`<script type="speculationrules">\n${JSON.stringify(RULES, null, 2)}\n</script>`} />
      </div>
      <Card title="지금 상태">
        <InfoList
          items={[
            ['Speculation Rules', yesNo(supported)],
            ['미리 그리는 페이지', supported ? TARGET : '없어요'],
          ]}
        />
      </Card>
      {!supported && <Note>이 브라우저는 아직 Speculation Rules를 지원하지 않아요. 크롬·엣지에서 열어요.</Note>}
      <Note>
        이동한 페이지가 미리 그려 뒀는지 알려줘요. "평범하게 불러온 페이지"라고 나오면 DevTools를 닫고 다시 해봐요. DevTools나 자동화 도구가 붙어 있으면
        브라우저가 미리 그리지 않을 수 있어요.
      </Note>
      <Report id="speculation" intro={<Explainer />} />
    </Screen>
  )
}
