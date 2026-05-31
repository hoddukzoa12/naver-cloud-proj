'use strict';

const STATUS_ORDER = { open: 0, upcoming: 1, closed: 2, unknown: 3 };

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function compactText(value) {
  return normalizeText(value).replace(/\s+/g, '');
}

function parseDateOnly(value) {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function currentKstDateString(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function inferApplicationStatus(deadline = {}, today = currentKstDateString()) {
  const todayDate = parseDateOnly(today);
  const startDate = parseDateOnly(deadline.start);
  const endDate = parseDateOnly(deadline.end);

  if (!todayDate || (!startDate && !endDate)) return 'unknown';
  if (startDate && todayDate < startDate) return 'upcoming';
  if (endDate && todayDate > endDate) return 'closed';
  return 'open';
}

function parseKoreanWon(text) {
  const source = String(text ?? '').replace(/,/g, '').replace(/\s+/g, '');
  if (!source) return 0;

  const eok = source.match(/(\d+(?:\.\d+)?)억/);
  const man = source.match(/(\d+(?:\.\d+)?)만/);
  const won = source.match(/(\d{5,})원?/);
  let total = 0;
  if (eok) total += Math.round(Number(eok[1]) * 100000000);
  if (man) total += Math.round(Number(man[1]) * 10000);
  if (!total && won) total += Number(won[1]);
  return Number.isFinite(total) ? total : 0;
}

function extractAmountKrw(record = {}) {
  const amount = record.amount || {};
  const candidates = [
    amount.max_krw,
    amount.per_semester_krw,
    amount.annual_krw,
    amount.amount_krw,
    amount.min_krw,
    parseKoreanWon(amount.text),
  ].filter((value) => Number.isFinite(Number(value)) && Number(value) > 0)
    .map(Number);
  return candidates.length ? Math.max(...candidates) : 0;
}

function arrayIncludesLoose(values, needle) {
  if (!needle) return true;
  const normalizedNeedle = compactText(needle);
  return (values || []).some((value) => compactText(value).includes(normalizedNeedle));
}

function scholarshipHaystack(record) {
  const fields = [
    record.name,
    record.description,
    record.source_kind,
    record.verification_status,
    record.organization?.name,
    record.organization?.type,
    record.amount?.text,
    record.amount?.category,
    record.deadline?.text,
    ...(record.tags || []),
    ...(record.eligibility?.student_levels || []),
    ...(record.eligibility?.school_names || []),
    ...(record.eligibility?.majors || []),
    ...(record.eligibility?.notes || []),
  ];
  return compactText(fields.filter(Boolean).join(' '));
}

function matchesIncomeBand(record, incomeBand) {
  if (incomeBand === undefined || incomeBand === null || incomeBand === '') return true;
  const band = Number(incomeBand);
  if (!Number.isFinite(band)) return true;
  const eligibility = record.eligibility || {};
  const min = eligibility.income_band_min ?? 0;
  const max = eligibility.income_band_max ?? 10;
  return band >= Number(min) && band <= Number(max);
}

function matchesStudentLevel(record, studentLevel) {
  if (!studentLevel || studentLevel === 'all') return true;
  const levels = record.eligibility?.student_levels || [];
  return levels.includes('all') || levels.includes(studentLevel);
}

function filterScholarships(scholarships = [], filters = {}) {
  const today = filters.today || currentKstDateString();
  const keyword = compactText(filters.keyword);
  const schoolName = filters.schoolName || filters.school;
  const minAmount = Number(filters.minAmount || 0);

  return scholarships
    .map((record) => {
      const status = inferApplicationStatus(record.deadline, today);
      const amountKrw = extractAmountKrw(record);
      return { ...record, _computed: { status, amountKrw } };
    })
    .filter((record) => {
      const haystack = scholarshipHaystack(record);
      if (keyword && !haystack.includes(keyword)) return false;
      if (schoolName) {
        const schoolNames = record.eligibility?.school_names || [];
        const orgName = record.organization?.name || '';
        if (!arrayIncludesLoose([...schoolNames, orgName], schoolName) && !haystack.includes(compactText(schoolName))) return false;
      }
      if (filters.orgType && filters.orgType !== 'all' && record.organization?.type !== filters.orgType) return false;
      if (!matchesStudentLevel(record, filters.studentLevel)) return false;
      if (filters.scholarshipType && filters.scholarshipType !== 'all' && record.amount?.category !== filters.scholarshipType) return false;
      if (!matchesIncomeBand(record, filters.incomeBand)) return false;
      if (minAmount > 0 && record._computed.amountKrw < minAmount) return false;
      if (filters.status && filters.status !== 'all' && record._computed.status !== filters.status) return false;
      if (filters.verifiedOnly && record.verification_status !== 'verified') return false;
      return true;
    })
    .sort((a, b) => {
      const statusDiff = (STATUS_ORDER[a._computed.status] ?? 9) - (STATUS_ORDER[b._computed.status] ?? 9);
      if (statusDiff) return statusDiff;
      return (b._computed.amountKrw || 0) - (a._computed.amountKrw || 0);
    });
}

function buildClovaSummaryPayload(text) {
  const normalized = String(text ?? '').trim().slice(0, 35000);
  return {
    texts: [normalized],
    autoSentenceSplitter: true,
    segCount: -1,
    segMaxSize: 1000,
    segMinSize: 300,
    includeAiFilters: false,
  };
}

function pickSentences(text, count = 3) {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?。]|다\.|요\.|음\.|함\.|됨\.)\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, count);
}

function localFallbackSummary(text) {
  const sentences = pickSentences(text, 3);
  const body = sentences.length ? sentences.join(' ') : String(text ?? '').trim().slice(0, 220);
  return {
    provider: 'local-fallback',
    mock: true,
    text: `로컬 데모 요약: ${body || '요약할 공고문을 입력하면 핵심 지원 조건과 마감 정보를 정리합니다.'}`,
    inputTokens: 0,
  };
}

function buildScholarshipSummaryInput(record = {}) {
  const eligibility = record.eligibility || {};
  return [
    `장학금명: ${record.name || '-'}`,
    `운영기관: ${record.organization?.name || '-'} (${record.organization?.type || '-'})`,
    `금액: ${record.amount?.text || '-'}`,
    `신청기간: ${record.deadline?.text || `${record.deadline?.start || '-'} ~ ${record.deadline?.end || '-'}`}`,
    `대상: ${(eligibility.student_levels || []).join(', ') || '-'}`,
    `학교: ${(eligibility.school_names || []).join(', ') || '전국/제한 없음'}`,
    `전공: ${(eligibility.majors || []).join(', ') || '제한 없음'}`,
    `학자금 지원구간: ${eligibility.income_band_min ?? 0}~${eligibility.income_band_max ?? 10}구간`,
    `자격 메모: ${(eligibility.notes || []).join('; ') || '-'}`,
    `설명: ${record.description || '-'}`,
    `공식 공고: ${record.source_url || '-'}`,
    `신청 링크: ${record.apply_url || '-'}`,
  ].join('\n');
}

const api = {
  buildClovaSummaryPayload,
  buildScholarshipSummaryInput,
  currentKstDateString,
  extractAmountKrw,
  filterScholarships,
  inferApplicationStatus,
  localFallbackSummary,
  parseKoreanWon,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}

if (typeof window !== 'undefined') {
  window.ScholarshipCore = api;
}
