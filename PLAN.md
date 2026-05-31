# Scholarship Radar Implementation Plan

## 목표

`naver-cloud-proj`를 대학생 장학금 검색 MVP로 전환한다.

- 공식 공고 우선 원칙 기반 검색/필터링
- 대학생 조건(학교, 학부/대학원, 학자금 지원구간, 금액, 유형) 필터
- 장학금 상세 카드와 공식 링크/신청 링크 표시
- Naver Cloud CLOVA Studio 요약 API를 서버 프록시로 연결
- API 키가 없을 때도 로컬 데모 요약으로 앱이 동작

## 아키텍처

```text
Browser
  ├─ index.html / style.css / runbook.js
  ├─ data/scholarships.json fetch
  └─ POST /api/summary
        ↓
Node server.js
  ├─ static file server
  ├─ CLOVA_STUDIO_API_KEY 있으면 CLOVA Studio summarization 호출
  └─ 없으면 localFallbackSummary 반환
```

## 파일 책임

- `index.html`: 앱 구조, 검색 폼, 결과 영역, 요약 입력 UI
- `style.css`: 반응형 UI와 카드/상세/요약 스타일
- `runbook.js`: 브라우저 상태, 필터 폼, 렌더링, 요약 API 호출
- `scholarship-core.js`: 브라우저/Node 공용 필터·상태·요약 payload 로직
- `server.js`: 정적 서버와 `/api/summary` CLOVA 프록시
- `data/scholarships.json`: MVP용 샘플/공식 링크 기반 데모 데이터
- `tests/*.test.mjs`: Node 기본 test runner 기반 단위 테스트
- `vendor/k-skill/`: 원본 장학금 검색 skill reference

## 완료 기준

- [x] 기존 OMC 런북 UI를 장학금 검색 사이트로 교체
- [x] 장학금 조건 필터와 상세 패널 구현
- [x] CLOVA Studio 요약 API 프록시 구현
- [x] API 키 없는 fallback 요약 구현
- [x] `.env.example`, `.gitignore`, README/AGENTS 갱신
- [x] agent 상태 파일 `.omc/state`를 git 추적에서 제거
- [ ] `node --check`/`node --test` 통과
- [ ] 서버 smoke test 통과
- [ ] 브라우저 QA 통과
- [ ] commit/push
