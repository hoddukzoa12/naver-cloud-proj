# Scholarship Radar — 대학생 장학금 검색 MVP

`naver-cloud-proj`는 기존 OMC 런북 앱에서 **대학생 장학금 검색 사이트**로 전환됐다.
한국 장학금 검색용 k-skill(`korean-scholarship-search`)의 공식 공고 우선 원칙을 UI와 필터링 로직에 반영하고, 긴 모집요강은 Naver Cloud **CLOVA Studio 요약 API**로 요약한다.

## 핵심 기능

- 장학금 샘플 데이터 검색/필터링
  - 키워드, 학교명
  - 기관 유형: 학교, 재단, 정부/공공기관, 지자체, 기업, 기타
  - 학생 구분: 학부생/대학원생
  - 장학금 유형: 등록금형/생활비형/혼합형
  - 학자금 지원구간, 최소 금액
  - 지금 지원 가능/곧 열림/마감됨
- 장학금 상세 패널
  - 기관, 금액, 신청 기간, 자격, 학자금 지원구간, 공식 공고 링크, 신청 링크
- 관심 장학금 localStorage 저장
- CLOVA Studio 기반 AI 요약
  - 선택한 장학금 요약
  - 사용자가 붙여넣은 공고문 요약
  - API 키가 없으면 로컬 데모 요약으로 fallback

## 실행 방법

Node 18+ 권장. 외부 npm dependency는 없다.

```bash
node server.js
# http://127.0.0.1:8787 접속
```

포트를 바꾸려면:

```bash
PORT=3000 node server.js
```

정적 파일만 열 수도 있지만, `data/scholarships.json` fetch와 `/api/summary` 프록시를 위해 `node server.js` 실행을 권장한다.

## CLOVA Studio 설정

`.env.example`을 복사해서 `.env`를 만든다.

```bash
cp .env.example .env
```

`.env` 예시:

```env
PORT=8787
CLOVA_STUDIO_API_KEY=nv-your-api-key
CLOVA_STUDIO_REQUEST_ID=optional-request-id
```

보안 규칙:

- API 키는 절대 `index.html`, `runbook.js`, GitHub public repo에 넣지 않는다.
- 프론트엔드는 `/api/summary`만 호출한다.
- `server.js`가 환경변수의 API 키로 CLOVA Studio를 호출한다.

## CLOVA Studio 요약 API 근거

Naver Cloud 문서 기준:

- 공통 문서: <https://api.ncloud-docs.com/docs/ai-naver-clovastudio-summary>
- 요약 API: <https://api.ncloud-docs.com/docs/clovastudio-summarization>
- Base URL: `https://clovastudio.stream.ntruss.com/`
- Endpoint: `POST /v1/api-tools/summarization/v2`
- Header:
  - `Authorization: Bearer <CLOVA_STUDIO_API_KEY>`
  - `X-NCP-CLOVASTUDIO-REQUEST-ID` optional
  - `Content-Type: application/json`
- Request body:

```json
{
  "texts": ["요약 대상 문장"],
  "autoSentenceSplitter": true,
  "segCount": -1,
  "segMaxSize": 1000,
  "segMinSize": 300,
  "includeAiFilters": false
}
```

- Response body:
  - `result.text`: 요약 결과
  - `result.inputTokens`: 입력 토큰 수

## k-skill 출처와 원칙

이 프로젝트는 `NomaDamas/k-skill`의 `korean-scholarship-search` 스킬 파일을 참고한다.

- 출처: <https://github.com/NomaDamas/k-skill>
- 로컬 reference: `vendor/k-skill/korean-scholarship-search/`

반영한 검색 원칙:

1. 한국장학재단(`kosaf.go.kr`) 우선
2. 대학 공식 도메인(`*.ac.kr`)의 학생지원처/장학공지/학사공지 우선
3. 공공기관/지자체/재단/기업 공식 페이지 우선
4. 블로그/커뮤니티/모음글은 공식 공고를 찾기 위한 단서로만 사용
5. 최종 결과에는 공식 공고 링크와 신청 링크를 남긴다
6. 마감일은 상대 표현이 아니라 절대 날짜로 정리한다
7. 학자금 지원구간은 0~10 정수 범위로 정규화한다

## 데이터 주의

`data/scholarships.json`은 **MVP용 샘플/공식 링크 기반 데모 데이터**다.
실시간 최신 모집 공고가 아니며, 신청 전 반드시 공식 공고와 신청 링크에서 최신 모집 여부·자격·금액·마감일을 확인해야 한다.

## 테스트

```bash
node --check scholarship-core.js
node --check runbook.js
node --check server.js
node --test tests/*.test.mjs
```

서버 fallback 요약 smoke test:

```bash
node server.js
curl -sS http://127.0.0.1:8787/ -o /dev/null -w '%{http_code}\n'
curl -sS -X POST http://127.0.0.1:8787/api/summary \
  -H 'Content-Type: application/json' \
  -d '{"text":"푸른등대 기부장학금은 학부생 생활비 지원 장학금입니다. 신청 기간은 2026-05-01부터 2026-06-30까지입니다."}'
```
