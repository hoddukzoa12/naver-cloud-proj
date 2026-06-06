'use strict';
/* scripts/seed.js — data.js 샘플 데이터를 PostgreSQL에 초기 적재 */

const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.join(__dirname, '..');

// .env 로드
(function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const idx = t.indexOf('=');
    if (idx === -1) continue;
    const k = t.slice(0, idx).trim();
    const v = t.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (k && process.env[k] === undefined) process.env[k] = v;
  }
})();

const { DB_AVAILABLE, query } = require('../db.js');

// data.js 스키마 기준 샘플 데이터 (7개)
const SEED_SCHOLARSHIPS = [
  {
    id: 's1', name: '신입생 성적우수 장학금', org: '한빛대학교 장학복지처',
    type: '등록금', status: '모집중', tier: '1~4구간', tier_min: 1, tier_max: 4,
    amount_semester: 2000000, amount_year: 4000000, deadline: '2026-06-20',
    verification_status: 'verified',
    eligibility: ['직전 학기 평점 3.5 이상', '재학 중인 학부생', '타 교내 장학금과 중복 수혜 불가'],
    notice_url: 'https://example.kr/notice/s1', apply_url: 'https://example.kr/apply/s1',
    source_url: null,
  },
  {
    id: 's2', name: '저소득층 생활비 지원', org: '미래나눔장학재단',
    type: '생활비', status: '모집중', tier: '1~3구간', tier_min: 1, tier_max: 3,
    amount_semester: 1500000, amount_year: 3000000, deadline: '2026-06-12',
    verification_status: 'verified',
    eligibility: ['학자금 지원구간 1~3구간', '직전 학기 12학점 이상 이수', '소득 증빙 서류 제출'],
    notice_url: 'https://example.kr/notice/s2', apply_url: 'https://example.kr/apply/s2',
    source_url: null,
  },
  {
    id: 's3', name: '이공계 미래인재 장학금', org: '푸른꿈과학장학회',
    type: '혼합', status: '모집중', tier: '전 구간', tier_min: 1, tier_max: 10,
    amount_semester: 1800000, amount_year: 3600000, deadline: '2026-06-30',
    verification_status: 'unverified',
    eligibility: ['이공계열 재학생', '직전 학기 평점 3.0 이상', '공고문 기준 추가 서류 확인 필요'],
    notice_url: 'https://example.kr/notice/s3', apply_url: 'https://example.kr/apply/s3',
    source_url: null,
  },
  {
    id: 's6', name: '전공우수 등록금 장학금', org: '한빛대학교 공과대학',
    type: '등록금', status: '모집중', tier: '전 구간', tier_min: 1, tier_max: 10,
    amount_semester: 2400000, amount_year: 4800000, deadline: '2026-06-25',
    verification_status: 'verified',
    eligibility: ['공과대학 소속 재학생', '직전 학기 전공 평점 4.0 이상', '학과 추천 필요'],
    notice_url: 'https://example.kr/notice/s6', apply_url: 'https://example.kr/apply/s6',
    source_url: null,
  },
  {
    id: 's7', name: '글로벌 교환학생 지원금', org: '세계로장학문화재단',
    type: '생활비', status: '모집중', tier: '1~8구간', tier_min: 1, tier_max: 8,
    amount_semester: 1300000, amount_year: 2600000, deadline: '2026-07-05',
    verification_status: 'verified',
    eligibility: ['교환학생 파견 확정자', '공인 어학 성적 보유', '직전 학기 평점 3.2 이상'],
    notice_url: 'https://example.kr/notice/s7', apply_url: 'https://example.kr/apply/s7',
    source_url: null,
  },
  {
    id: 's4', name: '지역인재 육성 장학금', org: '한빛시 인재육성재단',
    type: '혼합', status: '예정', tier: '1~6구간', tier_min: 1, tier_max: 6,
    amount_semester: 1200000, amount_year: 2400000, deadline: '2026-07-15',
    verification_status: 'verified',
    eligibility: ['지역 소재 고교 졸업자', '관내 대학 재학생', '모집 시작 후 신청 가능'],
    notice_url: 'https://example.kr/notice/s4', apply_url: 'https://example.kr/apply/s4',
    source_url: null,
  },
  {
    id: 's5', name: '근로·복지 연계 장학금', org: '함께걷는복지재단',
    type: '생활비', status: '마감', tier: '1~5구간', tier_min: 1, tier_max: 5,
    amount_semester: 1000000, amount_year: 2000000, deadline: '2026-05-30',
    verification_status: 'verified',
    eligibility: ['교내 근로장학 참여자', '학자금 지원구간 1~5구간', '마감된 공고'],
    notice_url: 'https://example.kr/notice/s5', apply_url: 'https://example.kr/apply/s5',
    source_url: null,
  },
];

const UPSERT_SQL = `
INSERT INTO scholarships
  (id, name, org, type, status, tier, tier_min, tier_max,
   amount_semester, amount_year, deadline, verification_status,
   eligibility, notice_url, apply_url, source_url, collected_at)
VALUES
  ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  org = EXCLUDED.org,
  type = EXCLUDED.type,
  status = EXCLUDED.status,
  tier = EXCLUDED.tier,
  tier_min = EXCLUDED.tier_min,
  tier_max = EXCLUDED.tier_max,
  amount_semester = EXCLUDED.amount_semester,
  amount_year = EXCLUDED.amount_year,
  deadline = EXCLUDED.deadline,
  verification_status = EXCLUDED.verification_status,
  eligibility = EXCLUDED.eligibility,
  notice_url = EXCLUDED.notice_url,
  apply_url = EXCLUDED.apply_url,
  source_url = EXCLUDED.source_url,
  collected_at = NOW()
`;

async function seed() {
  if (!DB_AVAILABLE) {
    console.log('DB not configured, skipping seed');
    return;
  }
  console.log(`[seed] ${SEED_SCHOLARSHIPS.length}개 레코드 적재 시작...`);
  for (const s of SEED_SCHOLARSHIPS) {
    await query(UPSERT_SQL, [
      s.id, s.name, s.org, s.type, s.status, s.tier,
      s.tier_min, s.tier_max, s.amount_semester, s.amount_year,
      s.deadline, s.verification_status, s.eligibility,
      s.notice_url, s.apply_url, s.source_url,
    ]);
    console.log(`  ✓ ${s.id}: ${s.name}`);
  }
  console.log('[seed] 완료');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] 오류:', err.message);
  process.exit(1);
});
