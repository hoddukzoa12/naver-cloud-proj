import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  buildClovaSummaryPayload,
  filterScholarships,
  inferApplicationStatus,
  localFallbackSummary,
} = require('../scholarship-core.js');

const fixtureScholarships = [
  {
    id: 'open-foundation',
    name: '테스트 재단 생활비 장학금',
    organization: { name: '테스트장학재단', type: 'foundation' },
    amount: { text: '학기당 300만 원', per_semester_krw: 3000000, category: 'living' },
    deadline: { start: '2026-05-01', end: '2026-06-30' },
    eligibility: {
      student_levels: ['undergraduate'],
      school_names: ['가천대학교'],
      income_band_min: 0,
      income_band_max: 6,
      notes: ['직전학기 12학점 이상'],
    },
    source_kind: 'official',
    verification_status: 'verified',
    source_url: 'https://foundation.example.org/notice',
    apply_url: 'https://foundation.example.org/apply',
  },
  {
    id: 'upcoming-school',
    name: '교내 등록금 감면 장학금',
    organization: { name: '서울대학교', type: 'school' },
    amount: { text: '등록금 전액', max_krw: 4000000, category: 'tuition' },
    deadline: { start: '2026-07-01', end: '2026-07-15' },
    eligibility: {
      student_levels: ['undergraduate', 'graduate'],
      school_names: ['서울대학교'],
      income_band_min: 0,
      income_band_max: 8,
    },
    source_kind: 'official',
    verification_status: 'verified',
    source_url: 'https://www.snu.ac.kr/scholarship',
    apply_url: 'https://my.snu.ac.kr/apply',
  },
  {
    id: 'closed-company',
    name: '기업 미래인재 장학금',
    organization: { name: '샘플전자', type: 'company' },
    amount: { text: '연 500만 원', annual_krw: 5000000, category: 'mixed' },
    deadline: { start: '2026-01-01', end: '2026-01-31' },
    eligibility: {
      student_levels: ['all'],
      school_names: [],
      income_band_min: 0,
      income_band_max: 10,
    },
    source_kind: 'unverified-demo',
    verification_status: 'unverified',
    source_url: 'https://company.example.com/csr',
    apply_url: '',
  },
];

test('inferApplicationStatus classifies open, upcoming, and closed from absolute dates', () => {
  assert.equal(inferApplicationStatus({ start: '2026-05-01', end: '2026-06-30' }, '2026-05-31'), 'open');
  assert.equal(inferApplicationStatus({ start: '2026-07-01', end: '2026-07-15' }, '2026-05-31'), 'upcoming');
  assert.equal(inferApplicationStatus({ start: '2026-01-01', end: '2026-01-31' }, '2026-05-31'), 'closed');
});

test('filterScholarships applies keyword, school, org type, student level, scholarship type, income band, minimum amount, and status filters', () => {
  const results = filterScholarships(fixtureScholarships, {
    keyword: '생활비',
    schoolName: '가천',
    orgType: 'foundation',
    studentLevel: 'undergraduate',
    scholarshipType: 'living',
    incomeBand: 5,
    minAmount: 2000000,
    status: 'open',
    today: '2026-05-31',
  });

  assert.deepEqual(results.map((item) => item.id), ['open-foundation']);
  assert.equal(results[0]._computed.status, 'open');
  assert.equal(results[0]._computed.amountKrw, 3000000);
});

test('filterScholarships treats all-level scholarships as matching undergraduate and preserves unverified demo entries when asked', () => {
  const results = filterScholarships(fixtureScholarships, {
    studentLevel: 'undergraduate',
    orgType: 'company',
    status: 'closed',
    today: '2026-05-31',
  });

  assert.deepEqual(results.map((item) => item.id), ['closed-company']);
  assert.equal(results[0].verification_status, 'unverified');
});

test('buildClovaSummaryPayload uses documented CLOVA Studio summarization request shape', () => {
  assert.deepEqual(buildClovaSummaryPayload('공고문 본문입니다.'), {
    texts: ['공고문 본문입니다.'],
    autoSentenceSplitter: true,
    segCount: -1,
    segMaxSize: 1000,
    segMinSize: 300,
    includeAiFilters: false,
  });
});

test('localFallbackSummary returns a local demo summary marker without needing API credentials', () => {
  const result = localFallbackSummary([
    '푸른등대 기부장학금은 학부생 생활비 지원을 위한 장학금입니다.',
    '신청 기간은 2026-05-01부터 2026-06-30까지입니다.',
    '학자금 지원구간 6구간 이하 학생을 우선합니다.',
    '공식 공고와 신청 링크를 반드시 확인해야 합니다.',
  ].join(' '));

  assert.equal(result.provider, 'local-fallback');
  assert.equal(result.mock, true);
  assert.match(result.text, /로컬 데모 요약/);
  assert.match(result.text, /푸른등대 기부장학금/);
});
