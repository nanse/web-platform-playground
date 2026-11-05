# 02 · Smooth UI

화면 전환, 바텀시트, 말풍선처럼 "부드럽게 움직이는 화면"을 JavaScript 라이브러리 대신 브라우저 기능으로 만들어 봐요.

```sh
pnpm --filter 02-smooth-ui dev   # https://localhost:5102
```

## 결론부터 말할게요

- **원티드에서 바로 해볼 만한 건 View Transitions예요.** 공고 목록 → 상세처럼 자주 오가는 곳에 붙이면, 지원하지 않는 브라우저에서는 애니메이션만 빠져서 위험이 작아요. React 19.3에서 `<ViewTransition>`이 정식 기능이 돼서 React 코드 안에서 바로 쓸 수 있어요.
- **Popover API는 Montage를 손볼 때 같이 봐요.** Montage의 Popper가 이미 floating-ui와 Portal로 같은 일을 하고 있어서, 사용자가 느끼는 차이는 거의 없어요.
- **Anchor Positioning은 조금 더 기다려요.** 사파리 26과 파이어폭스 147에서 막 들어와서, 지금 쓰면 floating-ui를 대비책으로 같이 둬야 해요.

## 한눈에 보기

| 기술 | 원티드에 필요할까요? | 이유 |
| --- | --- | --- |
| View Transitions | ✅ 공고 목록 → 상세에서 해볼 만해요 | 모든 주요 브라우저가 지원하고, 안 되면 애니메이션만 빠져요 |
| Popover API | ➕ Montage를 손볼 때 같이 봐요 | Montage가 이미 JavaScript로 같은 일을 해요 |
| Anchor Positioning | ⏸ 조금 더 기다려요 | 막 모든 브라우저에 들어와서 대비책이 아직 필요해요 |

## 어디서 동작하나요?

[MDN 호환성 데이터](https://github.com/mdn/browser-compat-data)(2026-11-02) 기준이에요. 숫자는 처음 지원한 버전이에요.

| 기술 | 크롬·엣지 데스크톱 | 크롬 안드로이드 | 사파리 macOS | 사파리 iOS | 파이어폭스 |
| --- | --- | --- | --- | --- | --- |
| View Transitions (같은 문서 안에서) | 111+ | 111+ | 18+ | 18+ | 144+ |
| View Transitions (문서 사이, `@view-transition`) | 126+ | 126+ | 18.2+ | 18.2+ | ❌ |
| Popover API | 114+ | 114+ | 17+ | 17+ | 125+ |
| `@starting-style` (열고 닫는 움직임) | 117+ | 117+ | 17.5+ | 17.5+ | 129+ |
| `anchor-name` | 125+ | 125+ | 26+ | 26+ | 147+ |
| `position-area` | 129+ | 129+ | 26+ | 26+ | 147+ |
| `position-try-fallbacks` | 128+ | 128+ | 26+ | 26+ | 147+ |

- 원티드처럼 React로 화면을 바꾸는 서비스는 View Transitions "같은 문서 안에서"만 있으면 돼요.
- Popover API는 2024년부터, View Transitions(같은 문서)는 파이어폭스 144부터 모든 주요 브라우저가 지원해요. Anchor Positioning은 이제 막 모든 브라우저에 들어왔어요.

## 직접 해보기

첫 화면에서 기능을 고르면, 화면마다 할 일이 하나씩 나와요. 화면을 오가는 움직임 자체도 View Transitions예요.

| 기술 | 코드 | 해보는 방법 |
| --- | --- | --- |
| View Transitions | `../shared/ui.tsx`·`../shared/ui.css`(화면 이동), `src/view-transitions.tsx` | 화면을 부드럽게 잇기 → "순서 섞기" 클릭. 첫 화면과 기능 화면을 오가면 아이콘이 날아가듯 이어져요 |
| Popover API | `src/popover.tsx`, `src/style.css`의 `.sheet` | JavaScript 없이 바텀시트 열기 → "바텀시트 열기" 클릭 → 바깥을 누르거나 Esc |
| Anchor Positioning | `src/anchor.tsx`, `src/style.css`의 `.anchor-tip` | 말풍선이 버튼 따라가기 → "버튼 옮기기"를 여러 번 클릭 → 위쪽 끝에서는 말풍선이 아래로 뒤집혀요 |

## 기술별로 자세히

### View Transitions · ✅ 공고 목록 → 상세에서 해볼 만해요

- **무엇인가요:** 화면이 바뀌기 전과 후를 브라우저가 사진처럼 찍어 두고, 그 사이를 애니메이션으로 이어 줘요. React에서는 `<ViewTransition>`으로 감싸고 `startTransition` 안에서 상태를 바꾸면 돼요.
- **이 샘플에서 쓴 것:**
  - 화면 이동: 본문은 옆으로 밀리고, 위쪽 바와 아래 버튼은 제자리에서 바뀌어요. 방향은 `addTransitionType('forward' | 'back')`으로 알려줘요.
  - 공유 요소 전환: 첫 화면 목록의 아이콘과 기능 화면의 큰 아이콘에 같은 `name`을 줘서, 아이콘이 날아가듯 이어져요.
  - 목록 재정렬: 항목마다 `<ViewTransition>`을 달아서 카드 하나하나가 새 자리로 미끄러져요.
- **문서:** [MDN · View Transition API](https://developer.mozilla.org/docs/Web/API/View_Transition_API) · [React · `<ViewTransition>`](https://react.dev/reference/react/ViewTransition) · [React 블로그 · React 19.3](https://react.dev/blog/2026/09/09/react-19-3) · [Chrome for Developers · View Transitions](https://developer.chrome.com/docs/web-platform/view-transitions)
- **기대할 수 있는 것:** 공고 카드를 누르면 카드 이미지가 상세 화면 위쪽으로 이어지듯 움직여요. 어디서 왔는지 눈으로 따라갈 수 있어서 화면이 바뀌어도 덜 낯설어요. 지원하지 않는 브라우저에서는 애니메이션만 빠지고 그대로 동작해서 위험이 작아요.
- **한계:** React 19.3에서 `<ViewTransition>`이 정식 기능이 됐지만, Next.js의 `viewTransition` 설정은 아직 실험 기능이에요. 체감 품질을 높이는 일이라 전환율 같은 숫자로 효과를 증명하기 어렵고, 저사양 기기에서는 오히려 버벅일 수 있어요.
- **이렇게 확인해요:** 적용한 화면의 INP가 나빠지지 않는지 먼저 보고, 상세에 들어온 뒤 바로 나가는 비율이 줄어드는지 봐요.

### Popover API · ➕ Montage를 손볼 때 같이 봐요

- **무엇인가요:** `popover` 속성을 단 요소를 버튼의 `popovertarget`으로 열고 닫아요. 브라우저가 맨 위 층(top layer)에 띄우고, 바깥 누르기·Esc로 닫기와 포커스 처리를 해줘요. `@starting-style`과 함께 쓰면 열고 닫는 움직임도 CSS만으로 만들어요.
- **문서:** [MDN · Popover API](https://developer.mozilla.org/docs/Web/API/Popover_API) · [MDN · @starting-style](https://developer.mozilla.org/docs/Web/CSS/Reference/At-rules/@starting-style) · [web.dev · Popover API가 모든 브라우저에 들어왔어요](https://web.dev/blog/popover-api)
- **얻을 수 있는 것:** Montage의 Popper는 floating-ui로 위치를 잡고 Portal로 레이어를 띄워요. Popover API를 쓰면 브라우저가 맨 위 층에 띄워 줘서 z-index·overflow에 가려지는 문제가 없어지고, 닫는 코드도 줄어요.
- **한계:** 사용자가 느끼는 변화는 거의 없어요. 지금 컴포넌트가 잘 동작한다면, 바꾸는 비용(회귀 테스트, 접근성 재검증)이 더 커요. 레이어가 가려지는 버그를 고치거나 새 컴포넌트를 만들 때가 좋은 시점이에요.

### Anchor Positioning · ⏸ 조금 더 기다려요

- **무엇인가요:** 한 요소(앵커)에 `anchor-name`으로 이름을 붙이고, 다른 요소를 그 옆에 붙이는 CSS예요. 자리가 모자라면 `position-try-fallbacks`로 반대쪽에 다시 붙여요.
- **문서:** [MDN · CSS Anchor Positioning](https://developer.mozilla.org/docs/Web/CSS/Guides/Anchor_positioning) · [MDN · position-try-fallbacks](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position-try-fallbacks) · [Chrome for Developers · Anchor Positioning API](https://developer.chrome.com/blog/anchor-positioning-api) · [web.dev · Baseline](https://web.dev/baseline)
- **얻을 수 있는 것:** 말풍선·메뉴 위치를 CSS만으로 잡아 줘서, Montage Popper가 쓰는 floating-ui를 언젠가 덜어낼 수 있어요.
- **한계:** 사파리 26과 파이어폭스 147에서 막 들어와서, iOS를 업데이트하지 않은 사용자에게는 동작하지 않아요. 지금 쓰면 floating-ui를 대비책으로 같이 둬야 해서 코드가 오히려 늘어요.
- **다시 볼 때:** 모든 주요 브라우저가 지원한 지 충분히 지나 Baseline "널리 사용 가능"이 되거나, 원티드 방문자 중 지원 브라우저 비율이 충분히 높아지면 다시 봐요.

## 알아두면 좋은 것

- React의 `<ViewTransition>`은 `startTransition`, `useDeferredValue`, `<Suspense>`로 생긴 업데이트에서만 움직여요. 그냥 `setState`하면 바로 바뀌어요.
- `document.startViewTransition()`은 직접 부르지 않아요. React가 대신 부르고, 직접 부르면 React의 전환이 끊겨요.
- 목록 항목을 하나씩 움직이려면 `<ViewTransition>`을 목록의 DOM 부모(`ul`) 바로 아래에 둬요.
- 브라우저 뒤로 가기(popstate)는 React가 애니메이션 없이 바로 바꿔요. 앱 안의 뒤로 가기 버튼은 움직여요.
- 움직임 줄이기(`prefers-reduced-motion`)를 켜면 화면 이동과 바텀시트 모두 애니메이션 없이 바뀌어요.
- 버튼 자리는 grid 정렬로만 바꿔요. `transform`으로 옮기면 말풍선이 따라오지 않을 수 있어요.
- 화면은 [Tailwind CSS](https://tailwindcss.com) v4로 만들었어요. 색·글꼴, 화면 틀, 판단 화면은 다른 샘플과 같이 `../shared/`를 써요. 그래서 `vite.config.ts`에 `resolve.dedupe: ['react', 'react-dom']`이 있어요.
- "원티드에 필요할까요?", "어디서 동작하나요?", 참고 문서는 앱의 기능 화면 맨 아래에도 있어요. 내용은 `src/report.tsx`에 모여 있으니, 고칠 때 이 README와 함께 고쳐요.
