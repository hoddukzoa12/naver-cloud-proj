'use strict';

/* ─── CONSTANTS ─────────────────────────────────────────── */

const STORAGE_KEY = 'omc_runbook_v2';

const QUESTIONS = [
  {
    id: 'q1', num: 1,
    text: '만들고 싶은 프로젝트 주제는 무엇인가?',
    placeholder: '예: 로컬 13F XML 파일을 업로드하면 종목별 비중을 테이블로 보여주는 뷰어',
    rows: 2,
    hint: '주제가 한 문장으로 정리되어야 TEAM·PLAN 단계 프롬프트에 자동으로 들어갑니다.',
  },
  {
    id: 'q2', num: 2,
    text: '누구를 위한 프로젝트인가?',
    placeholder: '예: 미국 기관투자자 포지션을 참고하는 개인 투자자',
    rows: 1,
    hint: '사용자 정의가 화면 복잡도와 용어 수준을 결정합니다.',
  },
  {
    id: 'q3', num: 3,
    text: 'Day7에서 보여줄 화면이나 디자인은 무엇인가?',
    placeholder: '예: 파일 업로드 → 종목명·보유수량·비중% 테이블이 즉시 나타나는 화면',
    rows: 2,
    hint: 'Day7 목표를 "보여줄 수 있는 화면" 하나로 고정하면 범위가 작아집니다.',
  },
  {
    id: 'q4', num: 4,
    text: 'Day8에서 발표할 핵심 장면은 무엇인가?',
    placeholder: '예: XML 업로드 버튼 클릭 한 번 → 결과 테이블 즉시 렌더링',
    rows: 2,
    hint: '핵심 장면 1개를 먼저 정하면 구현 범위를 역산할 수 있습니다.',
  },
  {
    id: 'q5', num: 5,
    text: '꼭 필요한 기능 3개는 무엇인가?',
    type: 'triple',
    placeholders: [
      '예: 로컬 XML 파일 업로드 및 파싱',
      '예: 종목별 비중 계산 및 테이블 표시',
      '예: localStorage 세션 유지 (선택)',
    ],
    hint: '3개로 제한하면 2일 안에 끝낼 수 있습니다.',
  },
  {
    id: 'q6', num: 6,
    text: '이번 수업에서 제외할 기능은 무엇인가?',
    placeholder: '예: 실시간 가격 피드, 자동 수집, 외부 API, 온체인 트랜잭션',
    rows: 1,
    hint: '제외 목록이 없으면 범위가 계속 늘어납니다.',
  },
  {
    id: 'q7', num: 7,
    text: '검증해야 할 가장 중요한 기준은 무엇인가?',
    placeholder: '예: 파싱한 종목명·수량이 원본 XML과 필드 단위로 일치하는가',
    rows: 1,
    hint: '기준이 명확해야 VERIFY.md에 실제 확인 결과를 쓸 수 있습니다.',
  },
];

const DAY7_ITEMS = [
  'index.html이 브라우저에서 오류 없이 열린다',
  'style.css 레이아웃 골격이 화면에 표시된다',
  '샘플 데이터로 핵심 화면이 정상 렌더링된다',
  'git 커밋이 2개 이상 있다',
  '7개 질문 답변이 모두 입력되어 있다',
];

const DAY8_ITEMS = [
  '핵심 기능 3개가 브라우저에서 실제로 동작한다',
  '복사 버튼 클릭 → 클립보드에 정상 복사된다',
  'localStorage 저장 후 새로고침해도 데이터가 유지된다',
  '모바일(375px) 화면에서 텍스트가 겹치지 않는다',
  'VERIFY.md가 작성되어 있다',
  'API 키·외부 토큰이 코드에 없다',
  'git 커밋이 4개 이상 있다',
];

/* ─── STEP CONFIGS ──────────────────────────────────────── */

function buildSteps(a) {
  const v = (key, fallback) => (a[key] && a[key].trim()) ? a[key].trim() : fallback;

  return [
    /* 0 — BRIEF */
    {
      id: 'brief', label: 'BRIEF', emoji: '📝',
      title: '1단계 · 주제 명확화',
      desc: '7개 질문에 답하면 이후 모든 단계의 Claude Code 프롬프트가 자동으로 채워집니다. 답변이 구체적일수록 더 정확한 프롬프트가 만들어집니다.',
      type: 'questions',
    },

    /* 1 — TEAM */
    {
      id: 'team', label: 'TEAM', emoji: '👥',
      title: '2단계 · OMC 팀 검토',
      desc: 'OMC team으로 기획자·구현자·검토자 3역할이 프로젝트 범위를 검토합니다. 너무 큰 범위, API 키 위험, 검증 누락을 사전에 잡고 PROJECT_TEAM_REVIEW.md를 만듭니다.',
      tool: 'OMC team (3:executor)', toolType: 'omc',
      promptText:
`/oh-my-claudecode:team 3:executor "다음 프로젝트의 Day7·8 범위를 검토해줘.

주제: ${v('q1', '(BRIEF Q1 입력 필요)')}
대상 사용자: ${v('q2', '(BRIEF Q2 입력 필요)')}
Day7 화면: ${v('q3', '(BRIEF Q3 입력 필요)')}
Day8 핵심 장면: ${v('q4', '(BRIEF Q4 입력 필요)')}
제외 예정 기능: ${v('q6', '(BRIEF Q6 입력 필요)')}

역할:
1. 기획자: Day8 발표에 임팩트 있는 핵심 장면 1개를 제안한다.
2. 구현자: 2일 안에 브라우저 단독으로 완성 가능한 최소 기능 3개를 제안한다.
3. 검토자: 범위 위험, API 키 위험, 검증 누락을 지적한다.

결과: PROJECT_TEAM_REVIEW.md 작성, 최종 기능 3개 이하로 범위 확정."`,
    },

    /* 2 — PLAN */
    {
      id: 'plan', label: 'PLAN', emoji: '🗺️',
      title: '3단계 · 구현 계획',
      desc: 'Superpowers writing-plans로 PLAN.md를 작성합니다. 파일 구조, 화면 구성, localStorage 구조, 구현 순서를 bite-sized task로 분해합니다.',
      tool: 'Superpowers writing-plans', toolType: 'sp',
      promptText:
`Superpowers writing-plans 방식으로 PLAN.md를 만들어줘.

주제: ${v('q1', '(BRIEF Q1 입력 필요)')}
핵심 기능:
1. ${v('q5_1', '(BRIEF Q5-① 입력 필요)')}
2. ${v('q5_2', '(BRIEF Q5-② 입력 필요)')}
3. ${v('q5_3', '(BRIEF Q5-③ 입력 필요)')}
제외 기능: ${v('q6', '(BRIEF Q6 입력 필요)')}

PLAN.md에 포함할 내용:
1. 파일 구조 (4파일 이하, 프레임워크 없음)
2. 화면 구성 (ASCII 와이어프레임)
3. localStorage 데이터 구조 (JSON 스키마)
4. 구현 순서 (bite-sized tasks, 각 2–5분)
5. 검증 기준: ${v('q7', '(BRIEF Q7 입력 필요)')}
6. 제외 기능 목록

조건: 외부 API 없음, 서버 없음, API 키 없음.
계획만 작성하고, 승인 전 구현하지 마.`,
    },

    /* 3 — BUILD */
    {
      id: 'build', label: 'BUILD', emoji: '🔨',
      title: '4단계 · 구현',
      desc: 'Superpowers executing-plans로 PLAN.md의 태스크를 순서대로 실행합니다. 각 태스크 완료 후 브라우저에서 실제로 확인하고 넘어갑니다.',
      tool: 'Superpowers executing-plans', toolType: 'sp',
      promptText:
`Superpowers executing-plans 방식으로 PLAN.md의 태스크를 실행해줘.

주제: ${v('q1', '(BRIEF Q1 입력 필요)')}
Day7 화면: ${v('q3', '(BRIEF Q3 입력 필요)')}
Day8 핵심 장면: ${v('q4', '(BRIEF Q4 입력 필요)')}

규칙:
- PLAN.md 체크박스를 순서대로 완료한다.
- 각 태스크 후 브라우저에서 실제 동작을 확인한다.
- 외부 라이브러리·프레임워크를 추가하지 않는다.
- API 키나 토큰을 코드에 넣지 않는다.
- file:// 또는 localhost에서 정상 동작해야 한다.`,
    },

    /* 4 — REVIEW */
    {
      id: 'review', label: 'REVIEW', emoji: '🔍',
      title: '5단계 · 코드 리뷰',
      desc: '완료를 주장하기 전에 독립적인 코드 리뷰를 받습니다. AGENTS.md 금지 조항 위반, API 키 노출, 모바일 레이아웃 문제를 잡습니다.',
      tool: 'Superpowers requesting-code-review', toolType: 'sp',
      promptText:
`Superpowers requesting-code-review 방식으로 현재 구현을 검토해줘.

주제: ${v('q1', '(BRIEF Q1 입력 필요)')}

검토 기준:
1. AGENTS.md 금지 조항 위반 여부 (API 키 하드코딩, 외부 라이브러리)
2. localStorage 저장·복원이 새로고침 후에도 올바르게 작동하는가
3. 모바일(375px) 화면에서 텍스트가 겹치지 않는가
4. 검증 기준 충족: ${v('q7', '(BRIEF Q7 입력 필요)')}

발견한 문제는 심각도(높음/중간/낮음)로 분류해줘.
수정 항목은 파일명과 줄 번호를 포함해줘.`,
    },

    /* 5 — VERIFY */
    {
      id: 'verify', label: 'VERIFY', emoji: '✅',
      title: '6단계 · 검증',
      desc: 'Superpowers verification-before-completion 기준으로 실제 확인 결과를 VERIFY.md에 기록합니다. 확인하지 못한 것은 성공으로 쓰지 않습니다.',
      tool: 'Superpowers verification-before-completion', toolType: 'sp',
      promptText:
`Superpowers verification-before-completion 기준으로 VERIFY.md를 작성해줘.

주제: ${v('q1', '(BRIEF Q1 입력 필요)')}

검증 항목 (브라우저에서 실제 확인 후 기록):
1. 핵심 기능 ① 동작: ${v('q5_1', '미입력')}
2. 핵심 기능 ② 동작: ${v('q5_2', '미입력')}
3. 핵심 기능 ③ 동작: ${v('q5_3', '미입력')}
4. localStorage 새로고침 후 데이터 유지 여부
5. 모바일 375px 레이아웃 깨짐 없음
6. 주요 검증 기준: ${v('q7', '미입력')}
7. API 키·외부 토큰 코드에 없음

각 항목마다 확인 방법과 실제 결과를 기록한다.
확인하지 못한 항목은 반드시 "미확인"으로 표시한다.`,
    },

    /* 6 — DAY7 */
    {
      id: 'day7', label: 'DAY7', emoji: '🌅',
      title: '7단계 · Day7 준비',
      desc: 'Day7 수업 전에 아래 체크리스트를 모두 완료하세요. 이후 READY_FOR_DAY7.md 생성 프롬프트를 Claude Code에서 실행합니다.',
      type: 'checklist', checklistKey: 'day7', checklistItems: DAY7_ITEMS,
      tool: 'READY_FOR_DAY7.md 생성', toolType: 'file',
      promptText:
`다음 내용으로 READY_FOR_DAY7.md를 만들어줘.

프로젝트 주제: ${v('q1', '미입력')}
대상 사용자: ${v('q2', '미입력')}
Day7 목표 화면: ${v('q3', '미입력')}
핵심 기능 ①: ${v('q5_1', '미입력')}
핵심 기능 ②: ${v('q5_2', '미입력')}
핵심 기능 ③: ${v('q5_3', '미입력')}
제외 기능: ${v('q6', '미입력')}

READY_FOR_DAY7.md 구조:
# Day7 준비 완료 보고서

## 프로젝트 요약
(주제 한 문장 + 대상 사용자 + Day7 목표 화면)

## Day7 작업 목록
- [ ] index.html 기본 골격 작성
- [ ] style.css CSS 변수 및 레이아웃
- [ ] 샘플 데이터로 화면 확인
- [ ] git 커밋 2개 이상

## Day8에서 할 것
(핵심 기능 3개 구현, localStorage, VERIFY.md 작성)

## 제외 확정 기능
(이번 수업에서 하지 않을 기능 목록)`,
    },

    /* 7 — DAY8 */
    {
      id: 'day8', label: 'DAY8', emoji: '🎤',
      title: '8단계 · Day8 발표 준비',
      desc: 'Day8 발표 전 최종 점검입니다. 아래 체크리스트를 모두 완료하고 READY_FOR_DAY8.md를 생성합니다.',
      type: 'checklist', checklistKey: 'day8', checklistItems: DAY8_ITEMS,
      tool: 'READY_FOR_DAY8.md 생성', toolType: 'file',
      promptText:
`다음 내용으로 READY_FOR_DAY8.md를 만들어줘.

프로젝트 주제: ${v('q1', '미입력')}
대상 사용자: ${v('q2', '미입력')}
Day8 핵심 장면: ${v('q4', '미입력')}
핵심 기능:
1. ${v('q5_1', '미입력')}
2. ${v('q5_2', '미입력')}
3. ${v('q5_3', '미입력')}
검증 기준: ${v('q7', '미입력')}

READY_FOR_DAY8.md 구조:
# Day8 발표 준비 완료 보고서

## 발표 시나리오 (5분)
1. 화면을 열고 프로젝트 주제 소개 (30초)
2. 핵심 장면 라이브 데모 (2분)
3. 가장 중요한 코드 1곳 설명 (1분)
4. VERIFY.md로 검증 결과 공유 (1분)
5. Day8 이후 개선 계획 1가지 (30초)

## 검증 완료 항목
(VERIFY.md에서 확인된 항목들)

## 미완성 항목 (솔직하게)
(완성하지 못한 것들 — 없으면 없다고 쓴다)`,
    },
  ];
}

/* ─── STATE ─────────────────────────────────────────────── */

function defaultState() {
  return {
    version: '2',
    answers: { q1:'', q2:'', q3:'', q4:'', q5_1:'', q5_2:'', q5_3:'', q6:'', q7:'' },
    currentStep: 0,
    steps: {
      brief:  { completed: false, completedAt: null },
      team:   { completed: false, completedAt: null },
      plan:   { completed: false, completedAt: null },
      build:  { completed: false, completedAt: null },
      review: { completed: false, completedAt: null },
      verify: { completed: false, completedAt: null },
      day7:   { completed: false, completedAt: null },
      day8:   { completed: false, completedAt: null },
    },
    checklists: {
      day7: DAY7_ITEMS.map(() => false),
      day8: DAY8_ITEMS.map(() => false),
    },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    if (s.version !== '2') return defaultState();
    if (!s.checklists) s.checklists = { day7: DAY7_ITEMS.map(() => false), day8: DAY8_ITEMS.map(() => false) };
    return s;
  } catch { return defaultState(); }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

/* ─── UTILS ─────────────────────────────────────────────── */

function esc(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  const el = document.createElement('textarea');
  el.value = text;
  el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(el);
  el.focus(); el.select();
  try   { document.execCommand('copy'); return Promise.resolve(); }
  catch (e) { return Promise.reject(e); }
  finally   { document.body.removeChild(el); }
}

function doneCount() {
  return Object.values(state.steps).filter(s => s.completed).length;
}

/* ─── TOP-LEVEL RENDER ──────────────────────────────────── */

function render() {
  const steps = buildSteps(state.answers);
  renderSidebar(steps);
  renderProgress();
  renderContent(steps);
}

function renderProgress() {
  const total = Object.keys(state.steps).length;
  const done  = doneCount();
  document.getElementById('progress-bar').style.width = Math.round(done / total * 100) + '%';
  document.getElementById('progress-label').textContent = done + '/' + total + ' 완료';
}

function renderSidebar(steps) {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = steps.map((step, idx) => {
    const done   = state.steps[step.id].completed;
    const active = idx === state.currentStep;
    return `<button class="nav-item${active?' active':''}${done?' done':''}"
      data-idx="${idx}" role="tab" aria-selected="${active}">
      ${step.emoji} ${step.label}${done ? ' ✓' : ''}
    </button>`;
  }).join('');

  sidebar.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentStep = +btn.dataset.idx;
      saveState();
      render();
    });
  });
}

function renderContent(steps) {
  const step    = steps[state.currentStep];
  const content = document.getElementById('content');
  const isFirst = state.currentStep === 0;
  const isLast  = state.currentStep === steps.length - 1;

  if (step.type === 'questions') {
    content.innerHTML = briefHTML(step, isFirst, isLast);
    attachBriefEvents(steps);
  } else if (step.type === 'checklist') {
    content.innerHTML = checklistHTML(step, isFirst, isLast);
    attachChecklistEvents(step, steps);
  } else {
    content.innerHTML = promptHTML(step, isFirst, isLast);
    attachPromptEvents(step, steps);
  }
}

/* ─── BRIEF STEP ─────────────────────────────────────────── */

function briefHTML(step, isFirst, isLast) {
  const questions = QUESTIONS.map(q => {
    if (q.type === 'triple') {
      const rows = [1,2,3].map(n => `
        <div class="triple-row">
          <span class="triple-num">${n}</span>
          <input type="text" class="q-input" data-qid="q5_${n}"
            placeholder="${esc(q.placeholders[n-1])}"
            value="${esc(state.answers['q5_' + n])}">
        </div>`).join('');
      return `<div class="q-block">
        <div class="q-label"><span class="q-num">Q${q.num}</span>${esc(q.text)}</div>
        <div class="q-hint">${esc(q.hint)}</div>
        <div class="triple-inputs">${rows}</div>
      </div>`;
    }
    return `<div class="q-block">
      <div class="q-label"><span class="q-num">Q${q.num}</span>${esc(q.text)}</div>
      <div class="q-hint">${esc(q.hint)}</div>
      <textarea class="q-input" data-qid="${q.id}" rows="${q.rows}"
        placeholder="${esc(q.placeholder)}">${esc(state.answers[q.id])}</textarea>
    </div>`;
  }).join('');

  const done = state.steps[step.id].completed;
  return `
    <div class="step-header">
      <h2 class="step-title">${esc(step.title)}</h2>
      <p class="step-desc">${esc(step.desc)}</p>
    </div>
    <div class="questions-form">${questions}</div>
    ${footerHTML(step.id, done, isFirst, isLast)}`;
}

function attachBriefEvents(steps) {
  let timer;
  document.querySelectorAll('.q-input').forEach(el => {
    el.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.answers[el.dataset.qid] = el.value;
        saveState();
      }, 420);
    });
  });
  attachFooterEvents('brief', steps);
}

/* ─── PROMPT STEP ─────────────────────────────────────────── */

function promptHTML(step, isFirst, isLast) {
  const badge = step.tool
    ? `<span class="tool-badge ${step.toolType}">${esc(step.tool)}</span>` : '';
  const done = state.steps[step.id].completed;
  return `
    <div class="step-header">
      <h2 class="step-title">${esc(step.title)}</h2>
      <p class="step-desc">${esc(step.desc)}</p>
      ${badge}
    </div>
    <div class="prompt-section">
      <div class="prompt-label">Claude Code 프롬프트</div>
      <div class="prompt-wrapper">
        <pre class="prompt-block">${esc(step.promptText)}</pre>
        <button class="copy-btn" id="copy-btn">📋 복사</button>
      </div>
    </div>
    ${footerHTML(step.id, done, isFirst, isLast)}`;
}

function attachPromptEvents(step, steps) {
  document.getElementById('copy-btn').addEventListener('click', () => {
    const btn = document.getElementById('copy-btn');
    copyText(step.promptText)
      .then(()  => { btn.textContent = '✅ 복사됨';        setTimeout(() => { btn.textContent = '📋 복사'; }, 2000); })
      .catch(()  => { btn.textContent = '⚠️ 직접 선택하세요'; setTimeout(() => { btn.textContent = '📋 복사'; }, 3000); });
  });
  attachFooterEvents(step.id, steps);
}

/* ─── CHECKLIST STEP ─────────────────────────────────────── */

function checklistHTML(step, isFirst, isLast) {
  const cl    = state.checklists[step.checklistKey];
  const items = step.checklistItems.map((item, i) => `
    <label class="checklist-item">
      <input type="checkbox" class="cl-cb" data-idx="${i}" ${cl[i] ? 'checked' : ''}>
      <span>${esc(item)}</span>
    </label>`).join('');
  const allDone = cl.every(Boolean);
  const badge   = `<span class="tool-badge ${step.toolType}">${esc(step.tool)}</span>`;
  const done    = state.steps[step.id].completed;

  return `
    <div class="step-header">
      <h2 class="step-title">${esc(step.title)}</h2>
      <p class="step-desc">${esc(step.desc)}</p>
    </div>
    <div class="checklist-section">
      <div class="checklist-label">준비 체크리스트</div>
      <div class="checklist-items">${items}</div>
      <div class="all-done-badge" id="all-done" style="${allDone ? '' : 'display:none'}">🎉 모두 완료!</div>
    </div>
    <div class="prompt-section">
      <div class="prompt-label">완료 후 Claude Code에서 실행 ${badge}</div>
      <div class="prompt-wrapper">
        <pre class="prompt-block">${esc(step.promptText)}</pre>
        <button class="copy-btn" id="copy-btn">📋 복사</button>
      </div>
    </div>
    ${footerHTML(step.id, done, isFirst, isLast)}`;
}

function attachChecklistEvents(step, steps) {
  document.querySelectorAll('.cl-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      state.checklists[step.checklistKey][+cb.dataset.idx] = cb.checked;
      saveState();
      const allDone = state.checklists[step.checklistKey].every(Boolean);
      const badge   = document.getElementById('all-done');
      if (badge) { badge.style.display = allDone ? '' : 'none'; badge.textContent = '🎉 모두 완료!'; }
    });
  });

  document.getElementById('copy-btn').addEventListener('click', () => {
    const btn = document.getElementById('copy-btn');
    copyText(step.promptText)
      .then(()  => { btn.textContent = '✅ 복사됨';        setTimeout(() => { btn.textContent = '📋 복사'; }, 2000); })
      .catch(()  => { btn.textContent = '⚠️ 직접 선택하세요'; setTimeout(() => { btn.textContent = '📋 복사'; }, 3000); });
  });

  attachFooterEvents(step.id, steps);
}

/* ─── SHARED FOOTER ──────────────────────────────────────── */

function footerHTML(stepId, done, isFirst, isLast) {
  return `
    <div class="step-footer">
      <label class="complete-label">
        <input type="checkbox" id="complete-cb" ${done ? 'checked' : ''}>
        이 단계 완료로 표시
      </label>
      <div class="nav-buttons">
        <button class="btn" id="prev-btn" ${isFirst ? 'disabled' : ''}>← 이전</button>
        <button class="btn primary" id="next-btn" ${isLast ? 'disabled' : ''}>다음 →</button>
      </div>
    </div>`;
}

function attachFooterEvents(stepId, steps) {
  document.getElementById('complete-cb').addEventListener('change', e => {
    state.steps[stepId].completed  = e.target.checked;
    state.steps[stepId].completedAt = e.target.checked ? new Date().toISOString() : null;
    saveState();
    renderSidebar(steps);
    renderProgress();
  });

  const prev = document.getElementById('prev-btn');
  const next = document.getElementById('next-btn');
  if (prev && !prev.disabled) {
    prev.addEventListener('click', () => {
      state.currentStep = Math.max(0, state.currentStep - 1);
      saveState(); render(); window.scrollTo(0, 0);
    });
  }
  if (next && !next.disabled) {
    next.addEventListener('click', () => {
      state.currentStep = Math.min(steps.length - 1, state.currentStep + 1);
      saveState(); render(); window.scrollTo(0, 0);
    });
  }
}

/* ─── RESET ──────────────────────────────────────────────── */

function initReset() {
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('모든 답변과 진행 상황을 초기화합니다.\n계속하시겠습니까?')) {
      localStorage.removeItem(STORAGE_KEY);
      state = defaultState();
      render();
      window.scrollTo(0, 0);
    }
  });
}

/* ─── INIT ───────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  initReset();
  render();
});
