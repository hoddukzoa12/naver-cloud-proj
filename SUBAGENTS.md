# SUBAGENTS.md — Sub Agent 가이드

## 공통 컨텍스트 (모든 에이전트)

작업 전 반드시 로드:

```
AGENTS.md           — 프로젝트 원칙과 금지 사항
CLAUDE.md           — 아키텍처·파일 맵·검증 명령어
scholarship-core.js — 공용 로직 (항상 현재 상태 기준)
```

---

## executor (구현)

**담당**: `scholarship-core.js`, `server.js`, `runbook.js`, `index.html` 수정·구현

**작업 전 확인**:
- `scholarship-core.js`는 브라우저·Node 양쪽에서 로드됨. `module.exports` + `window.ScholarshipCore` 이중 export를 깨지 말 것
- 외부 npm 패키지 사용 금지 (`node:*` 내장만 허용)
- `CLOVA_STUDIO_API_KEY`는 `server.js`에서만. 클라이언트 코드에 절대 포함 금지
- 필터 로직 추가는 `scholarship-core.js`의 `filterScholarships()` 내부에만
- 새 데이터 필드 추가 시 `scholarshipHaystack()`에도 반영

**완료 기준**: `node --check` 3파일 + `node --test tests/*.test.mjs` 모두 통과

---

## researcher / document-specialist (데이터·API 조사)

**담당**: 장학금 데이터 수집, Ncloud API 문서 조사, `data/scholarships.json` 항목 추가

**Ncloud 공식 문서 우선**:
- CLOVA Studio Summarization API 엔드포인트: `https://clovastudio.stream.ntruss.com/v1/api-tools/summarization/v2`
- 비공식 블로그 글만 근거로 데이터를 `verified` 처리하지 않는다

**장학금 항목 추가 체크리스트**:
- [ ] `id`: 소문자 kebab-case (예: `kosaf-blue-ladder-2026`)
- [ ] `source_url` / `apply_url`: 공식 공고 URL과 신청 URL 분리
- [ ] `verification_status`: 공식 사이트 URL 직접 확인 후에만 `verified`
- [ ] `income_band_min` / `income_band_max`: 0~10 숫자
- [ ] `organization.type`: `school | foundation | government | local-government | company | other`
- [ ] `deadline.start` / `deadline.end`: `YYYY-MM-DD` 형식
- [ ] `updated_at`: 확인 날짜 `YYYY-MM-DD`

**Ncloud Object Storage / DB 연동 조사 시**:
- 연동 코드는 `server.js`에만 추가 (브라우저 노출 금지)
- 환경변수 이름은 `.env.example`에 먼저 등록 후 구현

---

## verifier (검증)

**담당**: 구현 완료 후 실제 동작 확인. 완료 주장 전에 반드시 실행.

**검증 체크리스트**:
- [ ] `node --check scholarship-core.js` 통과
- [ ] `node --check runbook.js` 통과
- [ ] `node --check server.js` 통과
- [ ] `node --test tests/*.test.mjs` 전체 통과
- [ ] 서버 기동 후 `curl -I http://127.0.0.1:8787/` → 200 응답
- [ ] `POST /api/summary {"text":"장학금 공고문"}` → `{ ok: true, result: { provider, text } }` 반환
- [ ] API 키 없을 때 `provider: 'local-fallback'` 반환 확인
- [ ] `verification_status !== 'verified'` 항목이 UI에서 경고 표시되는지 확인
- [ ] 필터(키워드·학교·소득구간·상태) 각 항목 동작 확인

---

## code-reviewer (코드 리뷰)

**집중 포인트**:

1. `scholarship-core.js` 브라우저 전용 API 오염 여부 (`document`, `window.fetch` 직접 사용 금지)
2. `server.js` 환경변수 노출 경로 — 응답 body나 로그에 API 키 포함 여부
3. `filterScholarships()` 필터 조건 누락 또는 단락 평가 오류
4. `staticFilePath()`의 경로 traversal 방어 유지 (`../ ` 차단)
5. 테스트 픽스처가 실제 JSON 스키마와 일치하는지
6. CLOVA fallback 경로가 API 키 없는 환경에서 정상 동작하는지

---

## test-engineer (테스트 작성)

**테스트 파일**: `tests/*.test.mjs`

**규칙**:
- 외부 테스트 프레임워크(jest, mocha, vitest 등) 사용 금지
- `import test from 'node:test'; import assert from 'node:assert/strict'` 패턴 유지
- 서버 테스트는 실제 HTTP 요청 사용 (`tests/server.test.mjs` 기존 패턴 참조)
- CLOVA API 호출: `CLOVA_STUDIO_API_KEY` 미설정 상태로 fallback 경로 테스트

**커버리지 우선순위**:
1. `filterScholarships()` — 키워드·학교·소득구간·상태 각 필터 경계값
2. `inferApplicationStatus()` — open / upcoming / closed / unknown 날짜 경계
3. `/api/summary` — API 키 있음/없음 두 경로
4. `parseKoreanWon()` — 억·만·원 복합 파싱 엣지케이스
5. `matchesIncomeBand()` — 구간 경계 (min/max 포함/미포함)

---

## 공통 금지 사항

- API 키·토큰을 git에 커밋하거나 로그·응답에 출력하지 않는다
- `.omc/state/` 등 agent 상태 파일을 커밋하지 않는다
- AI 요약 결과를 공식 공고 정보보다 우선하지 않는다
- 비공식 블로그 글만 근거로 `verification_status: "verified"` 처리하지 않는다
- 외부 npm 패키지를 `package.json` 없이 `require()` 시도하지 않는다
