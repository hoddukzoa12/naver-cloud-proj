const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  buildClovaSummaryPayload,
  localFallbackSummary,
} = require('./scholarship-core.js');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8787);
const CLOVA_ENDPOINT = 'https://clovastudio.stream.ntruss.com/v1/api-tools/summarization/v2';
const MAX_BODY_BYTES = 120_000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

loadDotEnv(path.join(ROOT, '.env'));

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
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Scholarship Radar running at http://127.0.0.1:${PORT}`);
  });
}

module.exports = { callClovaSummary, server };
