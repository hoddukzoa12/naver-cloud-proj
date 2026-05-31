# VERIFY.md — OMC + Superpowers 런북 앱

> 기준: Superpowers verification-before-completion  
> 작성일: 2026-05-31  
> 작성 방법: 코드 직접 읽기 (브라우저 실행 없음 — 미확인 항목은 미확인으로 표시)

---

## 1. 만든 파일 목록

| 파일 | 크기(행) | 존재 여부 | 비고 |
|------|---------|-----------|------|
| `index.html` | 30 | ✅ 확인 | HTML 셸, style.css + runbook.js 로드 |
| `style.css` | 312 | ✅ 확인 | CSS 변수, 반응형, 다크 프롬프트 블록 |
| `runbook.js` | 603 | ✅ 확인 | 8단계 런북 로직, localStorage, 복사 |
| `README.md` | 135 | ✅ 확인 | 4가지 실행 방법, localStorage 안내 포함 |
| `AGENTS.md` | — | ✅ 확인 | 프로젝트 기술 규칙 및 금지 사항 |
| `PLAN.md` | — | ✅ 확인 | 구현 계획 (task 6개, 검증 기준 포함) |
| `PROJECT_QUESTIONS.md` | — | ✅ 확인 | 7개 질문 템플릿 + 예시 답변 |
| `PROJECT_TEAM_REVIEW.md` | — | ✅ 확인 | OMC team 3역할 검토 결과 |
| `MCP_REFERENCE.md` | — | ✅ 확인 | MCP 사용 정책 |
| `REVIEW.md` | — | ✅ 확인 | UltraQA 5개 기준 검토 결과 |
| `fixture.js` | — | ❌ **없음** | PLAN.md에는 명시됐으나 미구현 — 샘플 데이터가 필요 없는 구조로 변경됨 |
| `VERIFY.md` | — | 🔄 작성 중 | 이 파일 |

---

## 2. 실행 방법

```
방법 1 (가장 간단): index.html 파일을 Chrome/Edge에서 더블클릭
방법 2: VS Code → index.html 우클릭 → Open with Live Server
방법 3: python -m http.server 8080  (proj5/ 폴더에서)
방법 4: npx serve .                 (proj5/ 폴더에서)
```

> **주의:** Safari + `file://` 조합에서는 클립보드 복사가 제한됩니다. README.md에 명시됨.

---

## 3. 코드 읽기로 확인한 기능

> 아래는 브라우저를 열지 않고 runbook.js / style.css 소스를 직접 읽어 확인한 항목입니다.  
> "코드 있음"이 "동작함"과 동일하지 않습니다.

| 기능 | 확인 방법 | 결과 |
|------|-----------|------|
| 8단계 구조 (BRIEF→DAY8) | `buildSteps()` 내 7개 step 객체 확인 | ✅ 코드 있음 |
| localStorage 저장 | `saveState()` → `localStorage.setItem(STORAGE_KEY, ...)` | ✅ 코드 있음 |
| localStorage 불러오기 | `loadState()` → JSON.parse + version 체크 | ✅ 코드 있음 |
| 버전 마이그레이션 | `s.version !== '2'` → `defaultState()` 폴백 | ✅ 코드 있음 |
| 초기화 버튼 | `confirm()` → `localStorage.removeItem` + `defaultState()` | ✅ 코드 있음 |
| HTML 이스케이프 (XSS 방지) | `esc()` 함수 — &, <, >, " 치환 | ✅ 코드 있음 |
| 클립보드 복사 | `navigator.clipboard` (HTTPS) + `execCommand` 폴백 | ✅ 코드 있음 |
| BRIEF 입력 디바운스 | 420ms `setTimeout` + `clearTimeout` | ✅ 코드 있음 |
| 답변 → 프롬프트 자동 반영 | `buildSteps(state.answers)` + `v()` 헬퍼 | ✅ 코드 있음 |
| Day7 체크리스트 (5개 항목) | `DAY7_ITEMS` 배열 + `checklistHTML()` | ✅ 코드 있음 |
| Day8 체크리스트 (7개 항목) | `DAY8_ITEMS` 배열 + `checklistHTML()` | ✅ 코드 있음 |
| 모두 완료 배지 클래스 수정 | `class="all-done-badge"` 항상 존재, `display:none` 토글 | ✅ 수정 확인 |
| 진행률 표시 | `doneCount() / total * 100` | ✅ 코드 있음 |
| 외부 API / fetch 없음 | 전체 파일 grep — `fetch`, `XMLHttpRequest`, API 키 없음 | ✅ 없음 확인 |
| 외부 CDN 없음 | index.html script/link 태그 — 로컬 파일만 | ✅ 없음 확인 |
| 모바일 CSS 분기점 | `@media (max-width: 640px)` 사이드바 → 수평 탭 | ✅ 코드 있음 |

---

## 4. 확인하지 못한 항목

> 브라우저 실행 없이 확인 불가능한 항목입니다. 성공으로 가정하지 않습니다.

| 항목 | 이유 | 확인 방법 |
|------|------|-----------|
| **실제 화면 렌더링** | 브라우저 미실행 | Chrome에서 index.html 열기 → 8단계 사이드바·콘텐츠 표시 확인 |
| **클립보드 `file://` 동작** | `execCommand` 실행 환경 미확인 | Chrome에서 `file://` 열기 → 복사 버튼 클릭 → 메모장에 붙여넣기 |
| **모바일 375px 레이아웃** | 실제 렌더 없음 | Chrome DevTools → 375px 프리셋 → 텍스트·버튼 겹침 없음 확인 |
| **BRIEF 답변 → 다음 단계 프롬프트 반영** | 실행 흐름 미확인 | Q1~Q7 입력 → TEAM 탭 이동 → 프롬프트 안에 답변 값 표시 확인 |
| **모두 완료 배지 show/hide** | 수정됐으나 브라우저 미확인 | Day7 체크리스트 5개 체크 → 🎉 배지 녹색으로 표시 확인 |
| **새로고침 후 데이터 유지** | localStorage 코드는 있으나 실행 미확인 | 답변 입력 → 브라우저 새로고침 → 동일 값 복원 확인 |
| **페이지 스크롤 초기화** | `window.scrollTo(0,0)` 동작 미확인 | 긴 단계에서 다음 → 이전 이동 시 상단으로 이동 확인 |
| **Q5 triple 입력 복원** | `state.answers['q5_N']` 로드 코드 있으나 미확인 | Q5 3개 입력 → 다른 탭 이동 → 다시 BRIEF → 입력값 유지 확인 |

---

## 5. 남은 위험

| 위험 | 심각도 | 설명 |
|------|--------|------|
| `execCommand('copy')` 지원 중단 | 중간 | Clipboard API 미지원 환경(file://)에서 폴백으로 사용 중. 최신 Chrome에서도 동작하지만 공식 deprecated API. 현재 대안 없음. |
| `fixture.js` PLAN.md 불일치 | 낮음 | PLAN.md Task 2는 fixture.js를 명시했으나 실제로는 구현하지 않음. PLAN.md가 구현보다 오래된 상태. |
| git 저장소 없음 | 높음 | 현재 proj5/ 폴더는 git init 없음. DAY7 체크리스트 "git 커밋 2개 이상" 항목 달성 불가. 학생이 직접 `git init`해야 함. |
| 자동화 테스트 없음 | 낮음 | 전체 검증이 수동. 리팩터링 시 회귀 감지 수단 없음. |
| 답변 길이 제한 없음 | 낮음 | 매우 긴 텍스트 입력 시 프롬프트 블록 렌더링 영향 미확인. |

---

## 6. Day7에서 이어갈 일

Day7에서 이 런북 앱을 **도구로 사용**해 학생 자신의 프로젝트를 시작합니다.

| 작업 | 방법 |
|------|------|
| `git init` 실행 | proj5/ 또는 새 학생 프로젝트 폴더에서 `git init` |
| BRIEF Q1~Q7 입력 | 런북 앱 → 1단계 BRIEF에서 자신의 프로젝트 주제 입력 |
| TEAM 프롬프트 실행 | 2단계 프롬프트 복사 → Claude Code에 붙여넣기 → PROJECT_TEAM_REVIEW.md 생성 |
| PLAN 프롬프트 실행 | 3단계 프롬프트 복사 → PLAN.md 작성 (승인 전 구현하지 않기) |
| index.html 골격 작성 | Day7 목표: 브라우저에서 오류 없이 열리는 화면 1개 |
| git 커밋 2개 이상 | DAY7 체크리스트 4번 항목 달성 |

---

## 7. Day8에서 발표할 준비

Day8 발표는 런북 앱 DAY8 단계의 프롬프트를 Claude Code에서 실행해 **READY_FOR_DAY8.md**를 생성한 뒤 이를 기반으로 합니다.

### 발표 시나리오 구조 (5분)

| 시간 | 내용 |
|------|------|
| 0:00–0:30 | 화면 열고 프로젝트 주제 소개 |
| 0:30–2:30 | 핵심 장면 라이브 데모 (DAY8 Q4 답변) |
| 2:30–3:30 | 가장 중요한 코드 1곳 설명 |
| 3:30–4:30 | VERIFY.md로 검증 결과 공유 (확인한 것·못 한 것 솔직하게) |
| 4:30–5:00 | Day8 이후 개선 계획 1가지 |

### 발표 전 최소 달성 기준

- [ ] 핵심 기능 3개가 브라우저에서 실제로 동작한다
- [ ] VERIFY.md가 작성되어 있다 (이 파일)
- [ ] API 키·외부 토큰이 코드에 없다
- [ ] git 커밋이 4개 이상 있다

---

## 요약

| 상태 | 항목 수 |
|------|--------|
| ✅ 코드로 확인됨 | 15개 |
| ⚠️ 브라우저 미확인 | 8개 |
| ❌ 미구현 | 1개 (fixture.js) |
| 🔴 즉시 조치 필요 | 1개 (git init) |

**다음 행동:** Chrome에서 `index.html`을 열고 "확인하지 못한 항목" 8개를 순서대로 수동 확인한다.
