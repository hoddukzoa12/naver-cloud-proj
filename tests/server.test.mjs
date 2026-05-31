import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { callClovaSummary } = require('../server.js');

test('callClovaSummary uses local fallback when CLOVA_STUDIO_API_KEY is absent', async () => {
  const previousKey = process.env.CLOVA_STUDIO_API_KEY;
  delete process.env.CLOVA_STUDIO_API_KEY;

  const result = await callClovaSummary('장학금 공고문입니다. 신청 기간과 자격을 확인해야 합니다.');

  assert.equal(result.provider, 'local-fallback');
  assert.equal(result.mock, true);
  assert.match(result.warning, /CLOVA_STUDIO_API_KEY/);

  if (previousKey !== undefined) process.env.CLOVA_STUDIO_API_KEY = previousKey;
});

test('callClovaSummary falls back when CLOVA status code is not success', async () => {
  const previousKey = process.env.CLOVA_STUDIO_API_KEY;
  const previousFetch = global.fetch;
  process.env.CLOVA_STUDIO_API_KEY = 'nv-test-placeholder';
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ status: { code: '40000', message: 'Bad Request' } }),
  });

  const result = await callClovaSummary('잘못된 요청도 서비스는 데모 요약으로 복구해야 합니다.');

  assert.equal(result.provider, 'local-fallback');
  assert.equal(result.mock, true);
  assert.match(result.warning, /Bad Request/);

  global.fetch = previousFetch;
  if (previousKey === undefined) delete process.env.CLOVA_STUDIO_API_KEY;
  else process.env.CLOVA_STUDIO_API_KEY = previousKey;
});
