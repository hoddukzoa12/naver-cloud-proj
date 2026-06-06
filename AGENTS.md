# AGENTS.md — Scholarship Radar

## 프로젝트 개요

- 이 프로젝트는 HyperCLOVA X 기반 대학생 장학금 실시간 맞춤 검색 서비스다.
- 사용자가 학교·학과·학자금 지원구간·학년 등 조건을 입력하면 HyperCLOVA X가 맞는 장학금을 추천한다.
- k-skill `korean-scholarship-search`의 공식 공고 우선 원칙을 검색·정규화 전략의 뼈대로 사용한다.
- CLOVA Studio 요약 API는 긴 모집요강을 짧게 요약하는 보조 기능으로 사용한다.

## 기술 규칙

- 외부 npm dependency 없이 Node 18+ 기본 기능을 사용한다.
- 프론트엔드는 정적 HTML/CSS/JS로 유지한다.
- 공통 필터 로직은 `scholarship-core.js`에 둔다.
- CLOVA Studio API 키는 서버 환경변수에서만 읽고 브라우저 코드에 노출하지 않는다.
- `/api/chat` 서버 프록시만 HyperCLOVA X Chat API를 호출한다.
- `/api/summary` 서버 프록시만 CLOVA Studio 요약 API를 호출한다.
- API 키가 없으면 로컬 fallback으로 데모가 계속 동작해야 한다.

## 장학금 데이터 원칙

- `data/scholarships.json`은 데모 데이터다. 최신 모집 공고라고 과장하지 않는다.
- 공식 공고 링크와 신청 링크를 가능한 한 분리해서 남긴다.
- `verification_status`가 `verified`가 아니면 UI에서 공식 재확인이 필요하다고 보여준다.
- 학자금 지원구간은 `income_band_min`, `income_band_max`로 정규화한다.
- 기관 유형은 `school`, `foundation`, `government`, `local-government`, `company`, `other` 중 하나를 사용한다.

## 검증 규칙

변경 후 최소한 아래를 실행한다.

```bash
node --check scholarship-core.js
node --check runbook.js
node --check server.js
node --test tests/*.test.mjs
```

가능하면 서버 smoke test도 실행한다.

```bash
node server.js
curl -I http://127.0.0.1:8787/
curl -X POST http://127.0.0.1:8787/api/summary -H 'Content-Type: application/json' -d '{"text":"장학금 공고문"}'
```

## 금지

- API 키, 토큰, 개인키를 git에 커밋하지 않는다.
- `.omc/state/`, 세션 replay, checkpoint 같은 agent 상태 파일을 커밋하지 않는다.
- 비공식 블로그 글만 근거로 장학금 결과를 `verified` 처리하지 않는다.
- AI 요약 결과를 공식 공고보다 우선하지 않는다.
