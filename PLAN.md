# OMC + Superpowers 런북 앱 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 학생이 Day7·8 프로젝트 주제를 입력하면 BRIEF → TEAM → PLAN → BUILD → VERIFY 단계별 프롬프트를 생성하고, 진행 상황을 localStorage에 저장하는 단일 파일 브라우저 앱을 만든다.

**Architecture:** 프레임워크 없이 vanilla HTML + CSS + JS 3파일로 구성한다. `runbook.js`가 상태·프롬프트·DOM을 모두 담당하고, `style.css`는 CSS 변수 기반 레이아웃을 제공한다. 외부 의존성 없이 `file://` 또는 로컬 서버에서 동작한다.

**Tech Stack:** HTML5, CSS Custom Properties, Vanilla JavaScript (ES2020), localStorage API

---

## 1. 파일 구조

```
proj5/
├── index.html        ← 앱 셸, 정적 마크업, script/style 로드
├── style.css         ← CSS 변수, 레이아웃, 반응형 (375px 기준)
├── runbook.js        ← 상태 관리, 프롬프트 생성, localStorage, DOM 조작
└── fixture.js        ← 하드코딩 샘플 데이터 (Day7 테스트용)
```

| 파일 | 책임 | 변경 조건 |
|------|------|-----------|
| `index.html` | HTML 골격, `<header>`, `<nav>`, `<main>`, `<footer>` | 구조 변경 시만 |
| `style.css` | CSS 변수(색상·간격·폰트), 그리드/플렉스 레이아웃 | 시각 변경 시만 |
| `runbook.js` | 상태 초기화, step 렌더링, 프롬프트 생성, 체크박스 이벤트 | 로직 변경 시만 |
| `fixture.js` | `window.FIXTURE_TOPIC`, `window.FIXTURE_STEPS` | 예시 데이터 변경 시만 |

---

## 2. 화면 구성

```
┌──────────────────────────────────────────┐
│  OMC + Superpowers 런북              [?]  │  ← header
├──────────────────────────────────────────┤
│  내 프로젝트 주제                          │
│  ┌──────────────────────────────────┐    │
│  │ (textarea — 주제 입력)            │    │
│  └──────────────────────────────────┘    │
├──────────────────────────────────────────┤
│  [BRIEF] [TEAM] [PLAN] [BUILD] [VERIFY]  │  ← step nav (활성 탭 강조)
├──────────────────────────────────────────┤
│  단계 설명 (1–2줄)                         │
│  사용 도구: Superpowers brainstorming     │  ← OMC/SP 안내 배지
│  ──────────────────────────────────────  │
│  ┌──────────────────────────────────┐    │
│  │ # 프롬프트 템플릿                  │    │  ← <pre><code> 블록
│  │ 내 주제: {topic}                  │    │
│  │ ...                              │    │
│  └──────────────────────────────────┘    │
│                          [📋 복사]        │
│  ──────────────────────────────────────  │
│  ☐ 이 단계 완료로 표시                     │  ← checkbox
│  [← 이전 단계]           [다음 단계 →]    │
└──────────────────────────────────────────┘
```

**반응형 기준:** 375px 이하에서 step nav는 2줄로 줄바꿈, 버튼 폰트 최소 14px, 테이블 가로 스크롤 없음.

---

## 3. localStorage 데이터 구조

키: `runbook_state`

```json
{
  "version": "1",
  "topic": "13F 스크래핑 + Hood chain RWA 포트폴리오 자동화",
  "currentStep": 0,
  "steps": {
    "brief": { "completed": false, "completedAt": null },
    "team":  { "completed": false, "completedAt": null },
    "plan":  { "completed": false, "completedAt": null },
    "build": { "completed": false, "completedAt": null },
    "verify":{ "completed": false, "completedAt": null }
  }
}
```

**저장 시점:** 주제 입력 debounce 500ms 후, 체크박스 변경 즉시, 단계 이동 즉시.
**초기화:** 키가 없거나 `version` 불일치 시 기본값으로 재설정.

---

## 4. 구현 순서

### Task 1: HTML 골격 + CSS 변수 (Day7)

**Files:**
- Create: `index.html`
- Create: `style.css`

- [ ] **Step 1: `index.html` 기본 구조 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OMC + Superpowers 런북</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="app-header">
    <h1>OMC + Superpowers 런북</h1>
  </header>

  <main class="app-main">
    <section class="topic-section">
      <label for="topic-input">내 프로젝트 주제</label>
      <textarea id="topic-input" placeholder="Day 7·8에서 만들고 싶은 것을 한 문장으로 적으세요"></textarea>
    </section>

    <nav class="step-nav" id="step-nav" role="tablist"></nav>

    <section class="step-panel" id="step-panel"></section>
  </main>

  <script src="fixture.js"></script>
  <script src="runbook.js"></script>
</body>
</html>
```

- [ ] **Step 2: `style.css` CSS 변수 및 기본 레이아웃 작성**

```css
:root {
  --color-primary: #2563eb;
  --color-primary-light: #dbeafe;
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-text: #1e293b;
  --color-text-muted: #64748b;
  --radius: 8px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --font-mono: 'Courier New', Courier, monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  min-height: 100vh;
}

.app-header {
  background: var(--color-primary);
  color: #fff;
  padding: var(--spacing-md) var(--spacing-lg);
}

.app-main {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-lg) var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.topic-section label {
  display: block;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.topic-section textarea {
  width: 100%;
  min-height: 80px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 1rem;
  resize: vertical;
}

.step-nav {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.step-nav button {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.15s;
}

.step-nav button.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.step-nav button.done::after { content: ' ✓'; color: var(--color-success); }

.step-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.step-title { font-size: 1.25rem; font-weight: 700; }
.step-desc  { color: var(--color-text-muted); line-height: 1.6; }

.tool-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.prompt-block {
  position: relative;
  background: #1e293b;
  color: #e2e8f0;
  border-radius: var(--radius);
  padding: var(--spacing-md);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.copy-btn {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  padding: 4px 10px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 0.75rem;
}

.copy-btn:active { opacity: 0.8; }

.complete-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
}

.complete-row input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; }

.nav-row {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.nav-row button {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  cursor: pointer;
}

.nav-row button.primary {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

/* 반응형 — 375px 이하 */
@media (max-width: 375px) {
  .step-nav { gap: 4px; }
  .step-nav button { font-size: 0.75rem; padding: 6px 8px; }
  .app-header h1 { font-size: 1.1rem; }
  .step-title { font-size: 1.1rem; }
  .prompt-block { font-size: 0.75rem; }
}
```

- [ ] **Step 3: 브라우저로 `index.html` 열어 레이아웃 확인**

브라우저 주소창에 `file:///C:/Users/Administrator/Downloads/claude/proj5/index.html` 입력.
기대: 헤더 파란색, textarea 표시, JS 오류 없음 (runbook.js는 아직 없으므로 콘솔에 파일 없음 오류는 무시).

- [ ] **Step 4: 커밋**

```bash
git add index.html style.css
git commit -m "feat: HTML skeleton and CSS variables for runbook app"
```

---

### Task 2: 샘플 픽스처 데이터 (Day7)

**Files:**
- Create: `fixture.js`

- [ ] **Step 1: `fixture.js` 작성**

```javascript
window.FIXTURE_TOPIC = '13F 스크래핑 + Hood chain RWA 포트폴리오 자동화';

window.FIXTURE_STEPS_COMPLETE = {
  brief:  { completed: true,  completedAt: '2026-05-31T09:00:00Z' },
  team:   { completed: true,  completedAt: '2026-05-31T09:30:00Z' },
  plan:   { completed: false, completedAt: null },
  build:  { completed: false, completedAt: null },
  verify: { completed: false, completedAt: null },
};
```

- [ ] **Step 2: `index.html`에서 픽스처 확인**

`index.html`을 브라우저로 열고 DevTools 콘솔에서 실행:
```javascript
console.log(window.FIXTURE_TOPIC); // "13F 스크래핑 + Hood chain RWA 포트폴리오 자동화"
```
기대: 문자열이 출력됨.

- [ ] **Step 3: 커밋**

```bash
git add fixture.js
git commit -m "feat: add fixture data for Day7 UI testing"
```

---

### Task 3: 상태 관리 + localStorage (Day8)

**Files:**
- Create: `runbook.js` (첫 번째 섹션: 상태)

- [ ] **Step 1: `runbook.js` 상태 초기화 코드 작성**

```javascript
// runbook.js

const STORAGE_KEY = 'runbook_state';
const STATE_VERSION = '1';

const STEP_IDS = ['brief', 'team', 'plan', 'build', 'verify'];

function defaultState() {
  const steps = {};
  STEP_IDS.forEach(id => { steps[id] = { completed: false, completedAt: null }; });
  return { version: STATE_VERSION, topic: '', currentStep: 0, steps };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (parsed.version !== STATE_VERSION) return defaultState();
    return parsed;
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();
```

- [ ] **Step 2: 브라우저 콘솔에서 저장·복원 확인**

`index.html` 새로고침 후 콘솔 실행:
```javascript
state.topic = '테스트 주제';
saveState(state);
location.reload();
// 새로고침 후:
console.log(state.topic); // "테스트 주제"
```
기대: 새로고침 후에도 값이 유지됨.

- [ ] **Step 3: 커밋**

```bash
git add runbook.js
git commit -m "feat: state management with localStorage save/load"
```

---

### Task 4: Step 설정 및 프롬프트 템플릿 (Day8)

**Files:**
- Modify: `runbook.js` (두 번째 섹션: 단계 설정)

- [ ] **Step 1: `runbook.js`에 단계 설정 객체 추가**

```javascript
// runbook.js — 상태 코드 아래에 추가

const STEPS_CONFIG = [
  {
    id: 'brief',
    label: 'BRIEF',
    title: '1단계: 주제 명확화',
    desc: '프로젝트 주제를 한 문장으로 정리하고 요구사항을 명확히 합니다. 모호하면 Superpowers brainstorming으로 질문합니다.',
    tool: 'Superpowers brainstorming',
    promptTemplate: (topic) => `Superpowers brainstorming 방식으로 내 프로젝트 주제를 명확히 해줘.

주제: ${topic || '(주제를 위에 입력하세요)'}

다음 관점으로 질문해줘:
1. 누구를 위한 프로젝트인가?
2. Day7에서 보여줄 화면은 무엇인가?
3. Day8 발표 핵심 장면 1개를 정의한다면?
4. 꼭 필요한 기능 3개는?
5. 제외할 기능은?`,
  },
  {
    id: 'team',
    label: 'TEAM',
    title: '2단계: 팀 검토',
    desc: 'OMC team으로 기획자·구현자·검토자 3개 역할이 범위를 검토합니다. 너무 큰 범위, API 키 위험, 검증 누락을 잡아냅니다.',
    tool: 'OMC team',
    promptTemplate: (topic) => `/oh-my-claudecode:team 3:executor "PROJECT_QUESTIONS.md와 AGENTS.md를 읽고 아래 주제의 Day7·8 범위를 검토해줘.

주제: ${topic || '(주제를 위에 입력하세요)'}

역할:
1. 기획자: 발표하기 좋은 핵심 장면을 제안한다.
2. 구현자: 2일 안에 만들 수 있는 최소 기능을 제안한다.
3. 검토자: 범위 위험, API 키 위험, 검증 누락을 지적한다.

결과: PROJECT_TEAM_REVIEW.md 작성, 기능 3개 이하로 범위 확정."`,
  },
  {
    id: 'plan',
    label: 'PLAN',
    title: '3단계: 구현 계획',
    desc: 'Superpowers writing-plans로 PLAN.md를 작성합니다. 파일 구조, 구현 순서, 검증 기준을 bite-sized task로 분해합니다.',
    tool: 'Superpowers writing-plans',
    promptTemplate: (topic) => `Superpowers writing-plans 방식으로 PLAN.md를 만들어줘.

주제: ${topic || '(주제를 위에 입력하세요)'}

입력 파일: AGENTS.md, PROJECT_TEAM_REVIEW.md

포함할 내용:
1. 파일 구조
2. 화면 구성
3. localStorage 데이터 구조
4. 구현 순서 (bite-sized tasks)
5. 검증 기준
6. 제외할 기능

계획만 작성하고, 승인 전 구현하지 마.`,
  },
  {
    id: 'build',
    label: 'BUILD',
    title: '4단계: 구현',
    desc: 'Superpowers executing-plans로 PLAN.md의 태스크를 순서대로 실행합니다. 각 태스크 완료 후 확인하고 다음으로 넘어갑니다.',
    tool: 'Superpowers executing-plans',
    promptTemplate: (topic) => `Superpowers executing-plans 방식으로 PLAN.md의 태스크를 실행해줘.

주제: ${topic || '(주제를 위에 입력하세요)'}

규칙:
- PLAN.md의 체크박스를 순서대로 완료한다.
- 각 태스크 완료 후 브라우저에서 실제로 확인한다.
- 외부 라이브러리는 추가하지 않는다.
- API 키나 토큰을 코드에 넣지 않는다.`,
  },
  {
    id: 'verify',
    label: 'VERIFY',
    title: '5단계: 검증',
    desc: 'Superpowers verification-before-completion으로 실제 확인 결과를 VERIFY.md에 기록합니다. 확인하지 못한 것은 성공으로 쓰지 않습니다.',
    tool: 'Superpowers verification-before-completion',
    promptTemplate: (topic) => `Superpowers verification-before-completion 기준으로 VERIFY.md를 작성해줘.

주제: ${topic || '(주제를 위에 입력하세요)'}

검증할 항목:
1. 기능이 실제로 동작하는가? (브라우저에서 직접 확인)
2. localStorage 저장·복원이 새로고침 후에도 유지되는가?
3. 모바일(375px) 화면에서 텍스트가 겹치지 않는가?
4. API 키나 외부 토큰이 코드에 없는가?

확인하지 못한 항목은 "미확인"으로 기록한다.`,
  },
];
```

- [ ] **Step 2: 커밋**

```bash
git add runbook.js
git commit -m "feat: step config with prompt templates for all 5 stages"
```

---

### Task 5: 단계 네비게이션 렌더링 (Day8)

**Files:**
- Modify: `runbook.js` (세 번째 섹션: DOM 렌더링)

- [ ] **Step 1: `runbook.js`에 렌더링 함수 추가**

```javascript
// runbook.js — STEPS_CONFIG 아래에 추가

function renderStepNav() {
  const nav = document.getElementById('step-nav');
  nav.innerHTML = '';
  STEPS_CONFIG.forEach((step, idx) => {
    const btn = document.createElement('button');
    btn.textContent = step.label;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', idx === state.currentStep);
    if (idx === state.currentStep) btn.classList.add('active');
    if (state.steps[step.id].completed) btn.classList.add('done');
    btn.addEventListener('click', () => {
      state.currentStep = idx;
      saveState(state);
      render();
    });
    nav.appendChild(btn);
  });
}

function renderStepPanel() {
  const panel = document.getElementById('step-panel');
  const step = STEPS_CONFIG[state.currentStep];
  const promptText = step.promptTemplate(state.topic);

  panel.innerHTML = `
    <div class="step-title">${step.title}</div>
    <p class="step-desc">${step.desc}</p>
    <div><span class="tool-badge">${step.tool}</span></div>
    <div class="prompt-block" id="prompt-text">${escapeHtml(promptText)}<button class="copy-btn" id="copy-btn">📋 복사</button></div>
    <label class="complete-row">
      <input type="checkbox" id="complete-checkbox" ${state.steps[step.id].completed ? 'checked' : ''}>
      이 단계 완료로 표시
    </label>
    <div class="nav-row">
      <button id="prev-btn" ${state.currentStep === 0 ? 'disabled' : ''}>← 이전 단계</button>
      <button id="next-btn" class="primary" ${state.currentStep === STEPS_CONFIG.length - 1 ? 'disabled' : ''}>다음 단계 →</button>
    </div>
  `;

  document.getElementById('copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(promptText).then(() => {
      document.getElementById('copy-btn').textContent = '✅ 복사됨';
      setTimeout(() => { document.getElementById('copy-btn').textContent = '📋 복사'; }, 2000);
    });
  });

  document.getElementById('complete-checkbox').addEventListener('change', (e) => {
    state.steps[step.id].completed = e.target.checked;
    state.steps[step.id].completedAt = e.target.checked ? new Date().toISOString() : null;
    saveState(state);
    renderStepNav();
  });

  document.getElementById('prev-btn').addEventListener('click', () => {
    if (state.currentStep > 0) { state.currentStep--; saveState(state); render(); }
  });

  document.getElementById('next-btn').addEventListener('click', () => {
    if (state.currentStep < STEPS_CONFIG.length - 1) { state.currentStep++; saveState(state); render(); }
  });
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function render() {
  renderStepNav();
  renderStepPanel();
}
```

- [ ] **Step 2: `runbook.js`에 topic 입력 이벤트 연결 및 초기화 추가 (파일 맨 아래)**

```javascript
// runbook.js — 파일 맨 아래에 추가

document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('topic-input');
  textarea.value = state.topic;

  let debounceTimer;
  textarea.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.topic = textarea.value.trim();
      saveState(state);
      renderStepPanel(); // 프롬프트 템플릿 즉시 갱신
    }, 500);
  });

  render();
});
```

- [ ] **Step 3: 브라우저에서 전체 흐름 확인**

`index.html`을 열고:
1. 주제 입력 → 프롬프트 템플릿에 주제가 반영되는지 확인
2. "📋 복사" 클릭 → "✅ 복사됨"으로 바뀌는지 확인
3. "이 단계 완료로 표시" 체크 → 상단 탭에 ✓ 표시 확인
4. 새로고침 → 주제와 완료 상태가 유지되는지 확인

- [ ] **Step 4: 커밋**

```bash
git add runbook.js
git commit -m "feat: step navigation, prompt rendering, checkbox completion"
```

---

### Task 6: 모바일 반응형 최종 확인 (Day8)

**Files:**
- Modify: `style.css` (필요 시만)

- [ ] **Step 1: 브라우저 DevTools에서 375px 확인**

Chrome DevTools → Toggle device toolbar → 375px 설정 후 확인:
- step nav 버튼이 두 줄로 자연스럽게 줄바꿈되는지
- 프롬프트 블록 텍스트가 가로로 넘치지 않는지
- "복사" 버튼이 프롬프트 블록 안에 위치하는지

- [ ] **Step 2: 깨지는 부분 발견 시 `style.css` 수정**

텍스트가 넘칠 경우 `overflow-wrap: break-word;` 추가:
```css
.prompt-block {
  /* 기존 속성 유지 */
  overflow-wrap: break-word;
  overflow-x: hidden;
}
```

- [ ] **Step 3: 최종 커밋**

```bash
git add style.css
git commit -m "fix: mobile 375px layout polish"
```

---

## 5. 검증 기준

VERIFY.md에 기록할 항목 (PROJECT_TEAM_REVIEW.md 최종 합의 기준):

| 기준 | 확인 방법 | 합격 조건 |
|------|-----------|-----------|
| 주제 입력 후 프롬프트에 반영 | textarea 입력 → 프롬프트 블록 텍스트 육안 확인 | `{topic}` 자리에 입력 텍스트가 표시됨 |
| 복사 버튼 동작 | 클릭 후 메모장에 붙여넣기 | 프롬프트 전체 텍스트가 클립보드에 복사됨 |
| localStorage 지속성 | 체크박스 선택 → F5 새로고침 | 완료 상태와 주제가 유지됨 |
| 모바일 레이아웃 | DevTools 375px | 텍스트 겹침 없음, 가로 스크롤 없음 |
| 외부 의존성 없음 | `index.html` 소스 검사 | CDN·외부 script 없음, API 키 없음 |

---

## 6. 제외할 기능

AGENTS.md 및 PROJECT_TEAM_REVIEW.md 최종 합의 기준:

- SEC EDGAR 자동 수집 (CORS 제약)
- Hood chain 지갑 연동 및 실제 온체인 트랜잭션
- 실시간 가격 피드
- 과거 13F 비교 분석
- 멀티 지갑 지원
- 백엔드 서버 또는 외부 프록시
- 추가 npm 패키지 또는 프레임워크

---

## 7. Day7 준비 산출물

Day7 종료 시 브라우저에서 열 수 있는 상태여야 한다:

| 산출물 | 완료 기준 |
|--------|-----------|
| `index.html` | 브라우저에서 열림, 레이아웃 골격 표시 |
| `style.css` | CSS 변수 정의, 헤더·textarea·step-nav 스타일 적용 |
| `fixture.js` | 콘솔에서 `window.FIXTURE_TOPIC` 출력 확인 |
| 태스크 1–2 커밋 | git log에 2개 커밋 확인 |

---

## 8. Day8 준비 산출물

Day8 종료 시 발표 가능한 상태여야 한다:

| 산출물 | 완료 기준 |
|--------|-----------|
| `runbook.js` | 5단계 전체 렌더링, 복사 버튼, 체크박스 동작 |
| localStorage 지속성 | 새로고침 후 주제·완료 상태 유지 |
| 모바일 375px | 텍스트 겹침 없음 |
| VERIFY.md | 5개 검증 기준 실제 확인 결과 기록 |
| 태스크 3–6 커밋 | git log에 4개 이상 추가 커밋 확인 |
