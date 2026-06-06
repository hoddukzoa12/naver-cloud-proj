# Verification — Scholarship Radar

검증 기준일: 2026-05-31 KST

## 정적/단위 테스트

```bash
node --version
node --check scholarship-core.js
node --check runbook.js
node --check server.js
node --test tests/*.test.mjs
```

결과:

```text
v24.12.0
scholarship-core.js OK
runbook.js OK
server.js OK
✔ inferApplicationStatus classifies open, upcoming, and closed from absolute dates
✔ filterScholarships applies keyword, school, org type, student level, scholarship type, income band, minimum amount, and status filters
✔ filterScholarships treats all-level scholarships as matching undergraduate and preserves unverified demo entries when asked
✔ buildClovaSummaryPayload uses documented CLOVA Studio summarization request shape
✔ localFallbackSummary returns a local demo summary marker without needing API credentials
✔ callClovaSummary uses local fallback when CLOVA_STUDIO_API_KEY is absent
✔ callClovaSummary falls back when CLOVA status code is not success
ℹ tests 7
ℹ pass 7
ℹ fail 0
```

## 서버 smoke test

서버 실행:

```bash
PORT=8787 node server.js
```

확인:

```bash
curl -sS -o /tmp/scholarship-index.html -w '%{http_code}\n' http://127.0.0.1:8787/
curl -sS -o /tmp/scholarships.json -w '%{http_code}\n' http://127.0.0.1:8787/data/scholarships.json
curl -sS -X POST http://127.0.0.1:8787/api/summary \
  -H 'Content-Type: application/json' \
  -d '{"text":"푸른등대 기부장학금은 학부생 생활비 지원 장학금입니다. 신청 기간은 2026-05-01부터 2026-06-30까지입니다. 학자금 지원구간 6구간 이하를 우대합니다."}'
```

결과:

```text
GET / -> 200
GET data -> 200
POST /api/summary -> 200
summary ok True provider local-fallback mock True
로컬 데모 요약: 푸른등대 기부장학금은 학부생 생활비 지원 장학금입니다...
```

## 브라우저 QA

- URL: `http://127.0.0.1:8787/`
- 타이틀: `Scholarship Radar · 대학생 장학금 검색`
- 콘솔 오류: 없음
- 초기 검색 결과: 8개
- 키워드 `생활비` 입력 후 검색 결과: 5개
- 선택 카드: `한국장학재단 푸른등대 기부장학금 (데모)`
- 선택 카드 AI 요약: `로컬 데모 요약 local-fallback` 표시 확인
- 스크린샷: `/Users/hoddukzoa/.hermes/cache/screenshots/browser_screenshot_d1ff0b10bf14462dba688abab9b37dcd.png`

## 보안/정리 확인

```bash
git check-ignore -v .omc/state/foo.json
git ls-files | grep -Ei '(\.env$|\.pem$|\.key$|\.p12$|\.zip$|\.jsonl$|\.omc/state)' || true
```

결과:

- `.gitignore`가 `.omc/state/`를 ignore 처리함.
- tracked sensitive/generated file 없음.
- 실제 CLOVA API 키는 커밋하지 않음. `.env.example`만 제공.
