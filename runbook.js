const core = window.ScholarshipCore;

const state = {
  scholarships: [],
  filtered: [],
  selectedId: null,
  favorites: new Set(JSON.parse(localStorage.getItem('scholarshipRadar:favorites') || '[]')),
  today: core.currentKstDateString(),
};

const $ = (selector) => document.querySelector(selector);
const listEl = $('#scholarship-list');
const detailEl = $('#detail-panel');
const formEl = $('#filter-form');

const labels = {
  open: '지금 지원 가능',
  upcoming: '곧 열림',
  closed: '마감됨',
  unknown: '일정 확인 필요',
  school: '학교',
  foundation: '재단',
  government: '정부/공공기관',
  'local-government': '지자체',
  company: '기업',
  other: '기타',
  undergraduate: '학부생',
  graduate: '대학원생',
  all: '전체',
  tuition: '등록금형',
  living: '생활비형',
  mixed: '혼합형',
};

function formatWon(value) {
  if (!value) return '금액 확인 필요';
  return `${Number(value).toLocaleString('ko-KR')}원`;
}

function saveFavorites() {
  localStorage.setItem('scholarshipRadar:favorites', JSON.stringify([...state.favorites]));
  $('#metric-favorites').textContent = String(state.favorites.size);
}

function getFilters() {
  const form = new FormData(formEl);
  return {
    keyword: form.get('keyword'),
    schoolName: form.get('schoolName'),
    orgType: form.get('orgType'),
    studentLevel: form.get('studentLevel'),
    scholarshipType: form.get('scholarshipType'),
    incomeBand: form.get('incomeBand'),
    minAmount: form.get('minAmount'),
    status: form.get('status'),
    verifiedOnly: $('#verifiedOnly').checked,
    today: state.today,
  };
}

function chip(text, variant = '') {
  return `<span class="chip ${variant}">${escapeHtml(text)}</span>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderMetrics() {
  const computed = state.scholarships.map((item) => ({
    ...item,
    _computed: {
      status: core.inferApplicationStatus(item.deadline, state.today),
      amountKrw: core.extractAmountKrw(item),
    },
  }));
  $('#metric-total').textContent = String(state.scholarships.length);
  $('#metric-open').textContent = String(computed.filter((item) => item._computed.status === 'open').length);
  $('#metric-favorites').textContent = String(state.favorites.size);
  $('#today-label').textContent = `KST 기준일 ${state.today}`;
}

function renderList() {
  $('#result-count').textContent = String(state.filtered.length);
  if (!state.filtered.length) {
    listEl.innerHTML = '<p class="empty-state">조건에 맞는 샘플 장학금이 없어. 필터를 줄이거나 공식 공고 검색 범위를 넓혀봐.</p>';
    return;
  }

  listEl.innerHTML = state.filtered.map((item) => {
    const status = item._computed.status;
    const favorite = state.favorites.has(item.id);
    const amount = formatWon(item._computed.amountKrw);
    const verified = item.verification_status === 'verified' ? '공식 링크 확인' : '공식 재확인 필요';
    const levelText = (item.eligibility?.student_levels || []).map((level) => labels[level] || level).join(', ') || '전체';
    return `
      <article class="scholarship-card ${state.selectedId === item.id ? 'selected' : ''}" data-id="${escapeHtml(item.id)}">
        <div class="card-top">
          <span class="badge status ${status}">${labels[status] || status}</span>
          <button class="favorite-btn ${favorite ? 'on' : ''}" type="button" data-fav="${escapeHtml(item.id)}" aria-label="관심 장학금 저장">${favorite ? '★' : '☆'}</button>
        </div>
        <h3>${escapeHtml(item.name)}</h3>
        <p class="card-desc">${escapeHtml(item.description)}</p>
        <div class="chip-row">
          ${chip(labels[item.organization?.type] || item.organization?.type || '기관')}
          ${chip(labels[item.amount?.category] || item.amount?.category || '유형')}
          ${chip(levelText)}
          ${chip(verified, item.verification_status === 'verified' ? 'verified' : 'warning')}
        </div>
        <dl class="card-meta">
          <div><dt>기관</dt><dd>${escapeHtml(item.organization?.name || '-')}</dd></div>
          <div><dt>금액</dt><dd>${escapeHtml(item.amount?.text || amount)}</dd></div>
          <div><dt>기간</dt><dd>${escapeHtml(item.deadline?.text || '-')}</dd></div>
        </dl>
        <button class="btn small" type="button" data-detail="${escapeHtml(item.id)}">상세 보기</button>
      </article>`;
  }).join('');
}

function renderDetail() {
  const item = state.filtered.find((record) => record.id === state.selectedId) || state.filtered[0];
  if (!item) {
    detailEl.innerHTML = '<p class="empty-state">왼쪽에서 장학금을 선택하면 상세 조건과 AI 요약 버튼이 나와.</p>';
    return;
  }
  state.selectedId = item.id;
  const eligibility = item.eligibility || {};
  const levels = (eligibility.student_levels || []).map((level) => labels[level] || level).join(', ') || '-';
  detailEl.innerHTML = `
    <div class="detail-sticky">
      <span class="badge status ${item._computed.status}">${labels[item._computed.status] || item._computed.status}</span>
      <h2>${escapeHtml(item.name)}</h2>
      <p>${escapeHtml(item.description)}</p>
      <dl class="detail-list">
        <div><dt>운영기관</dt><dd>${escapeHtml(item.organization?.name || '-')} · ${escapeHtml(labels[item.organization?.type] || item.organization?.type || '-')}</dd></div>
        <div><dt>지원금</dt><dd>${escapeHtml(item.amount?.text || formatWon(item._computed.amountKrw))}</dd></div>
        <div><dt>신청기간</dt><dd>${escapeHtml(item.deadline?.text || '-')}</dd></div>
        <div><dt>학생 구분</dt><dd>${escapeHtml(levels)}</dd></div>
        <div><dt>학교/전공</dt><dd>${escapeHtml([...(eligibility.school_names || []), ...(eligibility.majors || [])].join(', ') || '제한 없음/공고 확인')}</dd></div>
        <div><dt>학자금 지원구간</dt><dd>${escapeHtml(`${eligibility.income_band_min ?? 0}~${eligibility.income_band_max ?? 10}구간`)}</dd></div>
        <div><dt>자격 메모</dt><dd>${escapeHtml((eligibility.notes || []).join(' · ') || '-')}</dd></div>
        <div><dt>검증 상태</dt><dd>${item.verification_status === 'verified' ? '공식 링크 기반' : '데모/공식 재확인 필요'}</dd></div>
      </dl>
      <div class="link-actions">
        <a class="btn ghost" href="${escapeHtml(item.source_url || '#')}" target="_blank" rel="noreferrer">공식 공고</a>
        ${item.apply_url ? `<a class="btn ghost" href="${escapeHtml(item.apply_url)}" target="_blank" rel="noreferrer">신청 링크</a>` : ''}
      </div>
      <button class="btn primary full" id="summarize-selected" type="button">선택 공고 AI 요약</button>
      <article id="selected-summary" class="summary-output compact" hidden></article>
    </div>`;

  $('#summarize-selected').addEventListener('click', async () => {
    const text = core.buildScholarshipSummaryInput(item);
    await summarizeText(text, $('#selected-summary'));
  });
}

function applyFilters() {
  state.filtered = core.filterScholarships(state.scholarships, getFilters());
  if (!state.filtered.some((item) => item.id === state.selectedId)) {
    state.selectedId = state.filtered[0]?.id || null;
  }
  renderMetrics();
  renderList();
  renderDetail();
}

function renderSummaryResult(target, payload) {
  target.hidden = false;
  const provider = payload.provider || 'clova-studio';
  const label = payload.mock ? '로컬 데모 요약' : 'CLOVA Studio 요약';
  const tokenText = payload.inputTokens ? ` · 입력 토큰 ${payload.inputTokens}` : '';
  target.innerHTML = `
    <div class="summary-provider">${escapeHtml(label)} <span>${escapeHtml(provider)}${tokenText}</span></div>
    <p>${escapeHtml(payload.text || payload.result?.text || '요약 결과가 비어 있어.')}</p>`;
}

async function summarizeText(text, target = $('#summary-output')) {
  const normalized = String(text || '').trim();
  if (!normalized) {
    target.hidden = false;
    target.innerHTML = '<p>요약할 텍스트를 먼저 입력해줘.</p>';
    return;
  }

  $('#summary-status').textContent = '요약 중...';
  try {
    const response = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: normalized }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    renderSummaryResult(target, data.result || data);
  } catch (error) {
    const fallback = core.localFallbackSummary(normalized);
    fallback.warning = `서버 프록시 연결 실패: ${error.message}`;
    renderSummaryResult(target, fallback);
  } finally {
    $('#summary-status').textContent = '';
  }
}

function wireEvents() {
  formEl.addEventListener('submit', (event) => {
    event.preventDefault();
    applyFilters();
  });
  formEl.addEventListener('input', () => applyFilters());
  $('#reset-filters').addEventListener('click', () => {
    formEl.reset();
    applyFilters();
  });
  listEl.addEventListener('click', (event) => {
    const favoriteButton = event.target.closest('[data-fav]');
    if (favoriteButton) {
      const id = favoriteButton.dataset.fav;
      if (state.favorites.has(id)) state.favorites.delete(id);
      else state.favorites.add(id);
      saveFavorites();
      renderList();
      return;
    }
    const detailButton = event.target.closest('[data-detail]');
    const card = event.target.closest('[data-id]');
    const id = detailButton?.dataset.detail || card?.dataset.id;
    if (id) {
      state.selectedId = id;
      renderList();
      renderDetail();
    }
  });
  $('#summarize-notice').addEventListener('click', () => summarizeText($('#notice-text').value));
}

async function loadScholarships() {
  try {
    const response = await fetch('data/scholarships.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.scholarships = await response.json();
  } catch (error) {
    listEl.innerHTML = `<p class="empty-state">샘플 데이터를 불러오지 못했어: ${escapeHtml(error.message)}. README의 node server.js 실행 방법을 확인해줘.</p>`;
    state.scholarships = [];
  }
  state.selectedId = state.scholarships[0]?.id || null;
  applyFilters();
}

wireEvents();
loadScholarships();
