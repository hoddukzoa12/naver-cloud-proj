'use strict';
// scraper.js — kosaf.go.kr 크롤러. 사용: node scraper.js [--dry-run]

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
const CLOVA_CHAT_ENDPOINT = 'https://clovastudio.stream.ntruss.com/v1/chat-completions/HCX-DASH-001';

// kosaf.go.kr 장학금 목록 페이지 목록
const KOSAF_PAGES = [
  {
    url: 'https://www.kosaf.go.kr/ko/scholar.do?pg=scholarship05_11_01',
    label: '푸른등대 기부장학금',
  },
  {
    url: 'https://www.kosaf.go.kr/ko/scholar.do?pg=scholarship02_01_01',
    label: '국가장학금',
  },
];

function bearerValue(rawKey) {
  if (!rawKey) return '';
  return rawKey.startsWith('Bearer ') ? rawKey : `Bearer ${rawKey}`;
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ScholarshipRadarBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    console.warn(`[scraper] fetch 실패 (${url}): ${err.message}`);
    return null;
  }
}

function extractTextFromHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 4000);
}

// HyperCLOVA X로 원문 텍스트 → 장학금 JSON 정규화
async function normalizeWithHyperClova(rawText, label) {
  const apiKey = process.env.CLOVA_STUDIO_API_KEY;
  if (!apiKey) {
    return mockNormalize(rawText, label);
  }

  const prompt = `아래는 ${label} 장학금 공고 페이지의 텍스트입니다.
이 텍스트에서 장학금 정보를 추출해 다음 JSON 형식으로 반환하세요.
반드시 유효한 JSON만 반환하고, 마크다운 코드 블록 없이 순수 JSON만 출력하세요.

{
  "name": "장학금명",
  "org": "운영기관명",
  "type": "등록금|생활비|혼합",
  "status": "모집중|예정|마감",
  "tier": "구간 텍스트 (예: 1~8구간)",
  "tier_min": 1,
  "tier_max": 8,
  "amount_semester": 0,
  "amount_year": 0,
  "deadline": "YYYY-MM-DD",
  "eligibility": ["조건1", "조건2"]
}

텍스트:
${rawText.slice(0, 2000)}`;

  try {
    const requestId = crypto.randomUUID();
    const res = await fetch(CLOVA_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: bearerValue(apiKey),
        'X-NCP-CLOVASTUDIO-REQUEST-ID': requestId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: '당신은 장학금 공고 정보를 JSON으로 추출하는 전문가입니다.' },
          { role: 'user', content: prompt },
        ],
        maxTokens: 512,
        temperature: 0.1,
        topP: 0.8,
        repeatPenalty: 1.0,
      }),
      signal: AbortSignal.timeout(20000),
    });
    const data = await res.json().catch(() => ({}));
    const content = data?.result?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.warn(`[scraper] HyperCLOVA X 정규화 실패: ${err.message}`);
  }
  return mockNormalize(rawText, label);
}

// API 키 없을 때 로컬 mock 정규화
function mockNormalize(rawText, label) {
  const hasDeadline = rawText.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  const deadline = hasDeadline
    ? `${hasDeadline[1]}-${String(hasDeadline[2]).padStart(2, '0')}-${String(hasDeadline[3]).padStart(2, '0')}`
    : null;

  return {
    name: label,
    org: '한국장학재단',
    type: rawText.includes('생활비') ? '생활비' : '등록금',
    status: rawText.includes('마감') ? '마감' : '모집중',
    tier: '1~8구간',
    tier_min: 1,
    tier_max: 8,
    amount_semester: 0,
    amount_year: 0,
    deadline,
    eligibility: ['한국장학재단 공식 공고 확인 필요'],
  };
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
  let dbQuery = null;
  if (!DRY_RUN) {
    const db = require('./db.js');
    if (!db.DB_AVAILABLE) {
      console.log('[scraper] DB not configured — dry-run mode로 전환');
    } else {
      dbQuery = db.query;
    }
  }

  const results = [];

  for (const page of KOSAF_PAGES) {
    console.log(`[scraper] 수집 중: ${page.label} (${page.url})`);
    const html = await fetchPage(page.url);
    const rawText = extractTextFromHtml(html);

    if (!rawText) {
      console.warn(`[scraper] 빈 응답 — ${page.label} 건너뜀`);
      continue;
    }

    const normalized = await normalizeWithHyperClova(rawText, page.label);
    const id = `kosaf-${crypto.createHash('md5').update(page.url).digest('hex').slice(0, 8)}`;

    const record = {
      id,
      name: normalized.name || page.label,
      org: normalized.org || '한국장학재단',
      type: normalized.type || '혼합',
      status: normalized.status || '모집중',
      tier: normalized.tier || '전 구간',
      tier_min: Number(normalized.tier_min) || 1,
      tier_max: Number(normalized.tier_max) || 10,
      amount_semester: Number(normalized.amount_semester) || 0,
      amount_year: Number(normalized.amount_year) || 0,
      deadline: normalized.deadline || null,
      eligibility: Array.isArray(normalized.eligibility) ? normalized.eligibility : [],
      notice_url: page.url,
      apply_url: 'https://www.kosaf.go.kr/',
      source_url: page.url,
    };

    results.push(record);
    console.log(`  ✓ ${record.id}: ${record.name} (${record.status})`);

    if (dbQuery) {
      try {
        await dbQuery(UPSERT_SQL, [
          record.id, record.name, record.org, record.type, record.status,
          record.tier, record.tier_min, record.tier_max,
          record.amount_semester, record.amount_year, record.deadline,
          'unverified', record.eligibility, record.notice_url,
          record.apply_url, record.source_url,
        ]);
        console.log(`  → DB upsert 완료`);
      } catch (err) {
        console.error(`  → DB upsert 실패: ${err.message}`);
      }
    }
  }

  console.log(`\n[scraper] 완료 — ${results.length}건 처리`);
  if (DRY_RUN) console.log('[scraper] dry-run 결과:', JSON.stringify(results, null, 2));
  return results;
}

if (require.main === module) {
  runScraper()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[scraper] 치명적 오류:', err.message);
      process.exit(1);
    });
}

module.exports = { runScraper, normalizeWithHyperClova, mockNormalize };
