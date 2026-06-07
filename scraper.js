'use strict';
// scraper.js — odcloud.kr 장학금 공공데이터 API 수집. 사용: node scraper.js [--dry-run]

const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const ROOT = __dirname;

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

const DRY_RUN = process.argv.includes('--dry-run');
const API_BASE = 'https://api.odcloud.kr/api/15028252/v1/uddi:1f3a4185-ba91-4a2c-bf04-bac01d2dc8ce';
const PER_PAGE = 100;

// 모집시작일/모집종료일 → status
function inferStatus(startStr, endStr) {
  if (!endStr) return '예정';
  const today = new Date().toISOString().slice(0, 10);
  const end = endStr.slice(0, 10);
  if (end < today) return '마감';
  if (startStr && startStr.slice(0, 10) > today) return '예정';
  return '모집중';
}

// 소득기준 텍스트에서 구간 추출 (예: "1구간~8구간" → {min:1, max:8})
function parseTier(text) {
  if (!text) return { tier: '전 구간', min: 1, max: 10 };
  const match = text.match(/(\d+)\s*구간?\s*[~～\-]\s*(\d+)\s*구간/);
  if (match) {
    return { tier: `${match[1]}~${match[2]}구간`, min: Number(match[1]), max: Number(match[2]) };
  }
  const single = text.match(/(\d+)\s*구간/);
  if (single) {
    const n = Number(single[1]);
    return { tier: `${n}구간 이하`, min: 1, max: n };
  }
  return { tier: '전 구간', min: 1, max: 10 };
}

// 지원내역 텍스트에서 금액(원) 추출
function parseAmount(text) {
  if (!text) return 0;
  // "등록금 전액" → 0 (금액 불명)
  const match = text.match(/([\d,]+)\s*만?\s*원/);
  if (!match) return 0;
  const raw = Number(match[1].replace(/,/g, ''));
  // "만 원" 단위면 ×10000
  return text.includes('만') && raw < 10000 ? raw * 10000 : raw;
}

// 공공데이터 row → DB 레코드
function mapApiRow(row) {
  const status = inferStatus(row['모집시작일'], row['모집종료일']);
  const tierInfo = parseTier(row['소득기준 상세내용'] || '');
  const amountSemester = parseAmount(row['지원내역 상세내용'] || '');

  const eligibility = [];
  if (row['자격제한 상세내용']) eligibility.push(row['자격제한 상세내용'].slice(0, 200));
  if (row['소득기준 상세내용']) eligibility.push(row['소득기준 상세내용'].slice(0, 200));
  if (row['신청접수일 등 상세내용']) eligibility.push(row['신청접수일 등 상세내용'].slice(0, 100));

  const type = row['학자금유형구분'] || '혼합';
  const deadline = row['모집종료일'] ? row['모집종료일'].slice(0, 10) : null;
  const id = `od-${crypto.createHash('md5').update(String(row['번호'] || row['상품명'] || '')).digest('hex').slice(0, 8)}`;

  return {
    id,
    name: (row['상품명'] || '').slice(0, 200),
    org: (row['운영기관명'] || '').slice(0, 100),
    type: ['등록금', '생활비', '혼합'].includes(type) ? type : '혼합',
    status,
    tier: tierInfo.tier,
    tier_min: tierInfo.min,
    tier_max: tierInfo.max,
    amount_semester: amountSemester,
    amount_year: amountSemester * 2,
    deadline,
    eligibility: eligibility.filter(Boolean),
    notice_url: 'https://www.kosaf.go.kr/ko/scholar.do?pg=scholarship05_05_01',
    apply_url: 'https://www.kosaf.go.kr/ko/scholar.do?pg=scholarship05_05_01',
    source_url: API_BASE,
  };
}

async function fetchPage(serviceKey, page) {
  const url = `${API_BASE}?serviceKey=${encodeURIComponent(serviceKey)}&page=${page}&perPage=${PER_PAGE}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`API HTTP ${res.status}`);
  return res.json();
}

const UPSERT_SQL = `
INSERT INTO scholarships
  (id, name, org, type, status, tier, tier_min, tier_max,
   amount_semester, amount_year, deadline, verification_status,
   eligibility, notice_url, apply_url, source_url, collected_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())
ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name, org=EXCLUDED.org, type=EXCLUDED.type,
  status=EXCLUDED.status, tier=EXCLUDED.tier,
  tier_min=EXCLUDED.tier_min, tier_max=EXCLUDED.tier_max,
  amount_semester=EXCLUDED.amount_semester, amount_year=EXCLUDED.amount_year,
  deadline=EXCLUDED.deadline, verification_status=EXCLUDED.verification_status,
  eligibility=EXCLUDED.eligibility, notice_url=EXCLUDED.notice_url,
  apply_url=EXCLUDED.apply_url, source_url=EXCLUDED.source_url,
  collected_at=NOW()
`;

async function runScraper() {
  const serviceKey = process.env.OPENAPI_DECODING;
  if (!serviceKey) {
    console.error('[scraper] OPENAPI_DECODING 환경변수가 없습니다.');
    process.exit(1);
  }

  let dbQuery = null;
  if (!DRY_RUN) {
    const db = require('./db.js');
    if (!db.DB_AVAILABLE) {
      console.log('[scraper] DB 미설정 — dry-run 모드로 전환');
    } else {
      dbQuery = db.query;
    }
  }

  console.log('[scraper] 1페이지 수집 중...');
  const first = await fetchPage(serviceKey, 1);
  const total = first.totalCount || 0;
  const pages = Math.ceil(total / PER_PAGE);
  console.log(`[scraper] 전체 ${total}건 / ${pages}페이지`);

  const allRows = [...(first.data || [])];
  for (let p = 2; p <= pages; p++) {
    console.log(`[scraper] ${p}/${pages} 페이지 수집 중...`);
    const page = await fetchPage(serviceKey, p);
    allRows.push(...(page.data || []));
  }

  const records = allRows.map(mapApiRow);
  let upserted = 0;

  for (const r of records) {
    if (dbQuery) {
      try {
        await dbQuery(UPSERT_SQL, [
          r.id, r.name, r.org, r.type, r.status, r.tier,
          r.tier_min, r.tier_max, r.amount_semester, r.amount_year,
          r.deadline, 'verified', r.eligibility,
          r.notice_url, r.apply_url, r.source_url,
        ]);
        upserted++;
      } catch (err) {
        console.error(`  → upsert 실패 (${r.id}): ${err.message}`);
      }
    }
  }

  console.log(`\n[scraper] 완료 — ${records.length}건 처리${dbQuery ? `, ${upserted}건 DB upsert` : ' (dry-run)'}`);
  if (DRY_RUN) {
    console.log('[scraper] 샘플 (처음 3건):');
    console.log(JSON.stringify(records.slice(0, 3), null, 2));
  }
  return records;
}

if (require.main === module) {
  runScraper()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[scraper] 치명적 오류:', err.message);
      process.exit(1);
    });
}

module.exports = { runScraper, mapApiRow, inferStatus, parseTier };
