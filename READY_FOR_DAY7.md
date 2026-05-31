# Day7 준비 완료 보고서

> 프로젝트: OMC + Superpowers 런북 앱  
> Day7 목표: 디자인 개선 — 기능은 완성됐으니 화면을 사용하기 쉽게 다듬는다

---

## 디자인해야 할 화면

현재 앱은 8단계가 모두 동작하지만, 시각적 피드백이 부족한 화면이 3곳 있다.

### 1. BRIEF 입력 폼 (우선순위 높음)

| 현재 상태 | 개선 목표 |
|-----------|-----------|
| 7개 질문 카드가 동일한 흰 배경으로 나열됨 | 입력 완료된 질문 카드에 왼쪽 초록 테두리 + 배경색 변경 |
| "몇 개 입력했는지" 표시 없음 | 헤더 또는 폼 상단에 "질문 N/7 입력됨" 표시 |
| Q5 triple 입력 3개가 plain input — 구분이 약함 | ①②③ 숫자 배지 크기 키우고, 각 행 사이 구분선 추가 |

### 2. 프롬프트 단계 (TEAM / PLAN / BUILD / REVIEW / VERIFY)

| 현재 상태 | 개선 목표 |
|-----------|-----------|
| 복사 버튼이 절대 위치로 오른쪽 상단에 고정 | 모바일에서 복사 버튼이 프롬프트 블록 아래로 이동 (현재 겹침 위험) |
| 복사 성공/실패 메시지가 버튼 텍스트 교체로만 표시 | 버튼 아래 한 줄 "✅ 클립보드에 복사됨" 메시지 2초 표시 후 사라짐 |
| 프롬프트 블록 좌우 패딩 16px — 긴 줄에서 스크롤 없음 | `overflow-x: auto` → 긴 명령어 한 줄로 볼 수 있도록 |

### 3. 헤더 진행률 표시

| 현재 상태 | 개선 목표 |
|-----------|-----------|
| "N/8 완료" 텍스트 + 3px 흰 바 | 완료된 단계 수를 색상으로도 표현 (바 색상 변화 또는 아이콘) |
| 모바일에서 progress-label 숨김 | 모바일에서도 진행률 바만큼은 보이도록 유지 |

---

## 참고할 디자인 레퍼런스 방향

| 레퍼런스 | 참고할 요소 |
|----------|-------------|
| **Linear** | 체크리스트·단계 완료 시 부드러운 색상 전환, 사이드바 active 상태 |
| **Notion** | 입력 폼 카드의 여백·선 두께, focus 상태 ring |
| **GitHub PR 리뷰 화면** | 코드 블록 + 복사 버튼 위치, 스크롤 처리 방식 |
| **shadcn/ui Stepper** | 단계 진행 상태 시각화 (완료 ✓, 진행 중 ●, 미시작 ○) |

> 모두 vanilla CSS 구현 가능한 패턴만 참고한다. npm 패키지 금지.

---

## MCP 검색 프롬프트

context7 또는 Playwright MCP가 연결된 환경이라면 아래 프롬프트를 사용한다.

```
# context7 — CSS stepper 패턴 검색
context7로 "vanilla CSS step progress indicator" 구현 예시를 검색해줘.
라이브러리 없이 CSS custom properties만 사용한 패턴을 보여줘.

# context7 — 폼 완료 상태 시각화
context7로 "form field completion state CSS" 패턴 검색해줘.
input에 값이 있을 때 카드 스타일을 바꾸는 방법 중 JS 없이 :has() selector로
가능한 패턴과 JS로 class 토글하는 패턴을 비교해줘.

# Playwright — 모바일 375px 레이아웃 확인
Playwright MCP로 http://localhost:8080/index.html을 열고
375px 뷰포트에서 BRIEF 단계 스크린샷을 찍어줘.
복사 버튼이 프롬프트 블록과 겹치는지 확인해줘.
```

---

## Claude Designer / frontend-design Skill 요청문

### oh-my-claudecode:designer 사용 시

```
/oh-my-claudecode:designer "OMC + Superpowers 런북 앱 BRIEF 단계 UX 개선

현재:
- style.css: .q-block에 완료 상태 스타일 없음
- runbook.js: attachBriefEvents()에서 입력 시 class 추가 없음

목표:
1. .q-block에 입력값이 있을 때 .q-block--filled class 추가 → 왼쪽 4px 초록 테두리 + 배경 #f0fdf4
2. BRIEF 폼 상단에 '질문 N/7 입력됨' 카운터 표시 (span#brief-counter)
3. 카운터는 attachBriefEvents() debounce 후 업데이트

조건:
- vanilla JS·CSS만, 외부 라이브러리 없음
- file:// 에서 동작해야 함
- 기존 .q-input, .q-block 클래스명 유지"
```

### Superpowers frontend-design Skill 사용 시

```
Superpowers의 frontend-design 방식으로 아래 세 가지를 구현해줘.

파일: style.css, runbook.js
조건: vanilla CSS/JS, 외부 라이브러리 없음, file:// 동작

변경 1 — BRIEF 완료 상태 카드
- .q-block에 .q-block--filled class가 붙으면:
  border-left: 4px solid var(--success); background: #f0fdf4;
- attachBriefEvents()에서 input 이벤트 시 el.closest('.q-block').classList.toggle('q-block--filled', el.value.trim() !== '')

변경 2 — 진행 카운터
- briefHTML()에서 <div class="questions-form"> 위에 <p id="brief-counter"> 추가
- attachBriefEvents() 내부에서 filled 개수 세어 brief-counter.textContent 업데이트

변경 3 — 복사 버튼 피드백 개선
- 복사 성공 시 버튼 아래에 <span class="copy-ok">✅ 복사됨</span> 삽입, 2초 후 제거
- copy-ok: font-size 0.76rem; color: var(--success); display: block; margin-top: 4px;
```

---

## Day7 완료 기준

- [ ] BRIEF 폼에서 입력 완료된 질문이 시각적으로 구분된다
- [ ] 복사 버튼 피드백 메시지가 표시되고 2초 후 사라진다
- [ ] 375px 모바일에서 프롬프트 블록과 버튼이 겹치지 않는다
- [ ] git 커밋 2개 이상 (`git init` 후 style.css, runbook.js 개선 분리 커밋)
