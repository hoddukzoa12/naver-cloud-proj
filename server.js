const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;

// .env를 db.js require 전에 반드시 먼저 로드해야 DB_AVAILABLE이 올바르게 계산됨
function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}
loadDotEnv(path.join(ROOT, '.env'));

const {
  buildClovaSummaryPayload,
  localFallbackSummary,
  localFallbackChat,
} = require('./scholarship-core.js');
const { DB_AVAILABLE, query: dbQuery } = require('./db.js');

const PORT = Number(process.env.PORT || 8787);
const CLOVA_ENDPOINT = 'https://clovastudio.stream.ntruss.com/v1/api-tools/summarization/v2';
const CLOVA_CHAT_ENDPOINT = 'https://clovastudio.stream.ntruss.com/v1/chat-completions/HCX-DASH-001';
const MAX_BODY_BYTES = 120_000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function collectJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
        reject(new Error('요청 본문이 너무 큽니다.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error('JSON 요청만 지원합니다.'));
      }
    });
    req.on('error', reject);
  });
}

function bearerValue(rawKey) {
  if (!rawKey) return '';
  return rawKey.startsWith('Bearer ') ? rawKey : `Bearer ${rawKey}`;
}

async function callClovaSummary(text) {
  const apiKey = process.env.CLOVA_STUDIO_API_KEY;
  if (!apiKey) {
    return {
      ...localFallbackSummary(text),
      warning: 'CLOVA_STUDIO_API_KEY가 없어 로컬 데모 요약을 반환했습니다.',
    };
  }

  const requestId = process.env.CLOVA_STUDIO_REQUEST_ID || crypto.randomUUID();
  const response = await fetch(CLOVA_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: bearerValue(apiKey),
      'X-NCP-CLOVASTUDIO-REQUEST-ID': requestId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildClovaSummaryPayload(text)),
  });
  const data = await response.json().catch(() => ({}));
  const statusCode = String(data?.status?.code || '');
  const isClovaSuccess = !statusCode || statusCode === '20000';
  if (!response.ok || !isClovaSuccess) {
    const fallback = localFallbackSummary(text);
    return {
      ...fallback,
      warning: `CLOVA Studio 호출 실패(${response.status}/${statusCode || 'no-code'}): ${data?.status?.message || data?.error?.message || 'unknown error'}`,
    };
  }
  return {
    provider: 'clova-studio',
    mock: false,
    text: data?.result?.text || '',
    inputTokens: data?.result?.inputTokens || 0,
    status: data?.status,
  };
}

function mapDbRow(r) {
  return {
    id: r.id,
    name: r.name,
    org: r.org,
    type: r.type,
    status: r.status,
    tier: r.tier,
    tierMin: r.tier_min,
    tierMax: r.tier_max,
    amountSemester: r.amount_semester,
    amountYear: r.amount_year,
    deadline: r.deadline,
    verification_status: r.source_url ? 'verified' : r.verification_status,
    eligibility: r.eligibility,
    noticeUrl: r.notice_url && r.notice_url !== 'https://www.kosaf.go.kr/'
      ? r.notice_url
      : `https://www.kosaf.go.kr/ko/scholar.do?pg=scholarship05_05_01`,
    applyUrl: r.apply_url && r.apply_url !== 'https://www.kosaf.go.kr/'
      ? r.apply_url
      : `https://www.kosaf.go.kr/ko/scholar.do?pg=scholarship05_05_01`,
  };
}

// DB에서 메시지 키워드로 장학금 검색
async function searchScholarships(message) {
  if (!DB_AVAILABLE) return [];
  // 메시지를 단어 단위로 분리해 각 키워드별로 OR 검색
  const words = message.trim().split(/\s+/).filter(Boolean).slice(0, 5);
  const conditions = words.map((_, i) => {
    const p = `$${i + 1}`;
    return `(name ILIKE ${p} OR org ILIKE ${p} OR type ILIKE ${p} OR tier ILIKE ${p} OR eligibility::text ILIKE ${p})`;
  }).join(' OR ');
  const params = words.map(w => `%${w}%`);
  try {
    if (conditions) {
      const result = await dbQuery(
        `SELECT id, name, org, type, status, tier, tier_min, tier_max,
                amount_semester, amount_year, deadline, verification_status,
                eligibility, notice_url, apply_url, source_url, source_url
         FROM scholarships
         WHERE status IN ('모집중', '예정')
           AND source_url IS NOT NULL
           AND (${conditions})
         ORDER BY deadline ASC NULLS LAST
         LIMIT 30`,
        params,
      );
      if (result.rows.length > 0) return result.rows.map(mapDbRow);
    }
  } catch { /* fall through */ }
  // 키워드 매치 없거나 오류 → 모집중/예정 전체 반환
  try {
    const result = await dbQuery(
      `SELECT id, name, org, type, status, tier, tier_min, tier_max,
              amount_semester, amount_year, deadline, verification_status,
              eligibility, notice_url, apply_url, source_url
       FROM scholarships
       WHERE status IN ('모집중', '예정')
         AND source_url IS NOT NULL
       ORDER BY
         CASE status WHEN '모집중' THEN 1 ELSE 2 END,
         deadline ASC NULLS LAST
       LIMIT 20`,
    );
    return result.rows.map(mapDbRow);
  } catch {
    return [];
  }
}

function buildRagContext(scholarships) {
  if (!scholarships.length) return '현재 조건에 맞는 장학금 정보가 없습니다.';
  return scholarships.map((s, i) =>
    `[${i + 1}] ${s.name}\n  기관: ${s.org}\n  유형: ${s.type}\n  구간: ${s.tier}\n  금액(학기): ${s.amount_semester ? s.amount_semester.toLocaleString() + '원' : '미정'}\n  마감: ${s.deadline || '미정'}\n  상태: ${s.status}\n  자격: ${Array.isArray(s.eligibility) ? s.eligibility.join(', ') : s.eligibility || '-'}\n  공고: ${s.notice_url || '-'}`,
  ).join('\n\n');
}

async function callClovaChat(message, scholarships) {
  const apiKey = process.env.CLOVA_STUDIO_API_KEY;
  if (!apiKey) return localFallbackChat(message, scholarships);

  const context = buildRagContext(scholarships);
  const systemPrompt = `당신은 대학생 장학금 안내 전문가입니다.
아래 제공된 공식 장학금 목록에서만 답변하세요.
목록에 없는 장학금을 임의로 만들지 마세요.
미검증(unverified) 장학금은 "공식 공고를 꼭 확인하세요"라고 안내하세요.
한국어로 친절하게 답변하세요.`;

  const userContent = `${message}\n\n[참고 장학금 목록]\n${context}`;

  try {
    const requestId = process.env.CLOVA_STUDIO_REQUEST_ID || crypto.randomUUID();
    const res = await fetch(CLOVA_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: bearerValue(apiKey),
        'X-NCP-CLOVASTUDIO-REQUEST-ID': requestId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        maxTokens: 1024,
        temperature: 0.5,
        topP: 0.8,
        repeatPenalty: 5.0,
        includeAiFilters: true,
      }),
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json().catch(() => ({}));
    const statusCode = String(data?.status?.code || '');
    const isClovaSuccess = !statusCode || statusCode === '20000';
    if (!res.ok || !isClovaSuccess) {
      return {
        ...localFallbackChat(message, scholarships),
        warning: `HyperCLOVA X 호출 실패(${res.status}/${statusCode}): ${data?.status?.message || 'unknown'}`,
      };
    }
    return {
      provider: 'hyperclova-x',
      mock: false,
      reply: data?.result?.message?.content || '응답을 가져오지 못했어요.',
      scholarships,
      source: 'hyperclova',
    };
  } catch (err) {
    return {
      ...localFallbackChat(message, scholarships),
      warning: `HyperCLOVA X 연결 오류: ${err.message}`,
    };
  }
}

async function handleScholarships(req, res) {
  if (!DB_AVAILABLE) {
    return sendJson(res, 200, { ok: true, scholarships: [], source: 'fallback' });
  }
  try {
    const url = new URL(req.url, `http://localhost`);
    const status = url.searchParams.get('status') || '';
    const whereClause = status
      ? `WHERE source_url IS NOT NULL AND status = $1`
      : `WHERE source_url IS NOT NULL`;
    const params = status ? [status] : [];
    const result = await dbQuery(
      `SELECT id, name, org, type, status, tier, tier_min, tier_max,
              amount_semester, amount_year, deadline, verification_status,
              eligibility, notice_url, apply_url, source_url
       FROM scholarships
       ${whereClause}
       ORDER BY
         CASE status WHEN '모집중' THEN 1 WHEN '예정' THEN 2 ELSE 3 END,
         deadline ASC NULLS LAST`,
      params,
    );
    return sendJson(res, 200, { ok: true, scholarships: result.rows.map(mapDbRow), source: 'db' });
  } catch (err) {
    return sendJson(res, 200, { ok: true, scholarships: [], source: 'fallback', warning: err.message });
  }
}

async function handleChat(req, res) {
  try {
    const body = await collectJson(req);
    const message = String(body.message || '').trim();
    if (!message) return sendJson(res, 400, { error: 'message 필드가 필요합니다.' });

    const scholarships = await searchScholarships(message);
    const result = await callClovaChat(message, scholarships);
    return sendJson(res, 200, {
      ok: true,
      reply: result.reply,
      scholarships: result.scholarships || [],
      source: result.source || 'fallback',
      mock: result.mock || false,
      warning: result.warning,
    });
  } catch (err) {
    return sendJson(res, 500, { ok: false, error: err.message });
  }
}

async function handleSummary(req, res) {
  try {
    const body = await collectJson(req);
    const text = String(body.text || (Array.isArray(body.texts) ? body.texts.join('\n') : '')).trim();
    if (!text) return sendJson(res, 400, { error: 'text 필드가 필요합니다.' });
    if (text.length > 35000) return sendJson(res, 400, { error: 'CLOVA 요약 API는 한글 기준 35,000자까지 지원합니다.' });
    const result = await callClovaSummary(text);
    return sendJson(res, 200, { ok: true, result });
  } catch (error) {
    return sendJson(res, 400, { ok: false, error: error.message });
  }
}

function staticFilePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  if (decoded === '/') return path.join(ROOT, 'index.html');
  const safePath = path.normalize(decoded).replace(/^([.][.][\/\\])+/, '');
  const relative = safePath.replace(/^[\/\\]/, '') || 'index.html';
  const fullPath = path.join(ROOT, relative);
  if (!fullPath.startsWith(ROOT)) return null;
  return fullPath;
}

function serveStatic(req, res) {
  const filePath = staticFilePath(req.url || '/');
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=60',
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && (req.url || '').startsWith('/api/scholarships')) {
    handleScholarships(req, res);
    return;
  }
  if (req.method === 'POST' && (req.url || '').startsWith('/api/chat')) {
    handleChat(req, res);
    return;
  }
  if (req.method === 'POST' && (req.url || '').startsWith('/api/summary')) {
    handleSummary(req, res);
    return;
  }
  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res);
    return;
  }
  res.writeHead(405, { Allow: 'GET, HEAD, POST' });
  res.end('Method not allowed');
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Scholarship Radar running at http://0.0.0.0:${PORT}`);
  });
}

module.exports = { callClovaSummary, server };
