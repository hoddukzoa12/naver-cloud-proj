# PPT_EVIDENCE.md — Day 8 발표 자료 근거 모음

> 수정 없이 현재 코드베이스에서 추출한 사실만 기재. 날짜 기준: 2026-06-07

---

## 1. 프로젝트 한 줄 설명

> **HyperCLOVA X 기반 대학생 장학금 실시간 맞춤 검색 서비스**
> 사용자 조건을 입력하면 공식 공고 우선 원칙으로 맞는 장학금을 찾아준다.

출처: `CLAUDE.md` §1

---

## 2. 대상 사용자와 문제

**대상**: 국내 대학교 학부생·대학원생

**해결하는 문제**:
- 장학금 공고가 한국장학재단·대학 홈페이지·재단·지자체 등 여러 곳에 분산
- 자격 조건(학자금 지원구간·전공·학교)이 복잡해 직접 탐색 비용이 높음
- 모집 마감일 파악이 어렵고, 이미 마감된 공고와 모집 중 공고가 뒤섞임

출처: `CLAUDE.md` §2, `README.md`, `scholarship-core.js:31-39`

---

## 3. 실제 동작하는 MVP 주요 기능 흐름

### 흐름 A — 챗봇 맞춤 추천
```
사용자 메시지 입력
  → POST /api/chat
  → searchScholarships(message): 키워드 OR 검색, 모집중·예정, source_url 있는 항목, LIMIT 30
  → buildRagContext(scholarships): 최대 30건 장학금 정보를 텍스트 컨텍스트로 조합
  → HyperCLOVA X (HCX-DASH-001) API 호출
  → 응답 텍스트 + 관련 장학금 카드(최대 3개) 반환
  → 챗 화면에 AI 말풍선·카드 렌더링
```

### 흐름 B — 필터 검색
```
키워드·학교·구간·모집상태·유형 필터 설정
  → doSearch() → GET /api/scholarships
  → DB: source_url IS NOT NULL 조건, 모집상태 정렬
  → 결과 카드 리스트 렌더링
  → 카드 탭 → 장학금 상세 패널
```

### 흐름 C — 공고문 AI 요약
```
장학금 상세 패널에서 "요약" 버튼 탭
  → POST /api/summary { text: 장학금명+기관+자격 }
  → CLOVA Studio Summarization v2 API 호출
  → 요약문 반환 (API 키 없으면 로컬 fallback 자동 전환)
  → SummarySheet에 요약 텍스트 표시
```

### 흐름 D — 공식 링크 이동
```
"공식 공고 보기" / "신청하기" 버튼 탭
  → window.open(noticeUrl / applyUrl, '_blank', 'noreferrer')
  → 실제 KOSAF 장학금 목록 페이지로 직접 이동
```

출처: `server.js:143-253`, `app.jsx:90-162`

---

## 4. AI 기능의 입력과 출력

### HyperCLOVA X 챗 (HCX-DASH-001)

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `POST /v1/chat-completions/HCX-DASH-001` |
| **입력** | system 프롬프트 (전문가 역할 정의) + user 메시지 + DB에서 조회한 장학금 컨텍스트 (최대 30건) |
| **출력** | AI 추천 텍스트 + 관련 장학금 배열 |
| fallback | API 키 없으면 `localFallbackChat()` — DB 조회 결과 상위 3건을 목록 형식으로 반환 |
| 파라미터 | maxTokens: 1024, temperature: 0.5, topP: 0.8, repeatPenalty: 5.0 |
| timeout | 30초 (`AbortSignal.timeout(30000)`) |

출처: `server.js:196-253`

### CLOVA Studio 요약 (Summarization v2)

| 항목 | 내용 |
|------|------|
| 엔드포인트 | `POST /v1/api-tools/summarization/v2` |
| **입력** | 장학금명 + 기관 + 자격조건 텍스트 (최대 35,000자) |
| **출력** | 요약 텍스트 (`result.text`) + 입력 토큰 수 (`result.inputTokens`) |
| fallback | API 키 없거나 오류 시 `localFallbackSummary()` — 앞 3문장 추출 반환 |
| 요청 형태 | `autoSentenceSplitter: true`, `segCount: -1`, `segMaxSize: 1000`, `segMinSize: 300` |

출처: `server.js:80-116`, `scholarship-core.js:148-157`

---

## 5. 사용한 Ncloud 서비스와 이유

| 서비스 | 사용 목적 | 상태 | 환경변수 |
|--------|-----------|------|----------|
| **HyperCLOVA X** (HCX-DASH-001) | 사용자 조건 기반 장학금 맞춤 추천 — RAG 패턴 적용 | 구현됨 | `CLOVA_STUDIO_API_KEY` |
| **CLOVA Studio Summarization v2** | 긴 공고문 자동 요약 (35,000자 지원) | 구현됨 | `CLOVA_STUDIO_API_KEY`, `CLOVA_STUDIO_REQUEST_ID` |
| **Server (VPC, Ubuntu 22.04)** | Node.js 18 앱 호스팅, 포트 80 개방 | 배포됨 | `PORT=80` |
| **PostgreSQL DB** | 장학금 메타데이터 영구 저장 (1,850건+) | 연결됨 | `DB_DOMAIN`, `DB_NAME`, `DB_USER_ID`, `DB_USER_PASSWORD` |

**선택 이유 요약**:
- HyperCLOVA X: 한국어 특화 LLM으로 장학금 관련 한국어 질의응답 품질 확보
- CLOVA Studio: 같은 API 키로 요약·채팅 통합 운용, Ncloud 서비스 일원화
- 공공데이터 수집 (`odcloud.kr` API) → PostgreSQL 저장 → 실시간 조회 파이프라인 구성

출처: `CLAUDE.md` §4, `db.js`, `server.js:33`

---

## 6. 데모 화면 목록

| 화면 | 진입 조건 | 주요 컴포넌트 |
|------|-----------|--------------|
| **챗봇** (기본 진입) | 앱 실행 시 | ChatScreen — 메시지 목록, 장학금 카드, 칩 버튼 |
| **메인 검색** | 하단 탭 "검색" | MainScreen — 모집 중 건수 배지, 상위 카드 3개, 필터 버튼 |
| **필터** | 메인에서 "필터" 탭 | FilterScreen — 학자금 구간 슬라이더, 모집상태, 유형 선택 |
| **검색 결과** | 필터 적용 후 | ResultsScreen — 카드 리스트, 정렬 |
| **빈 결과** | 조건 매칭 0건 | EmptyScreen — "필터를 조정해 보세요" 안내 |
| **장학금 상세** | 카드 탭 | DetailScreen — 금액·마감·자격·링크 + 요약 버튼 |
| **AI 요약 시트** | 상세에서 "요약" 탭 | SummarySheet — 로딩·완료·오류 3상태 |
| **저장됨** | 하단 탭 "저장" | SavedScreen |
| **데스크탑 레이아웃** | 화면 너비 1000px+ 자동 전환 | DesktopShell — 좌우 분할 패널 |

출처: `app.jsx:184-209`, `CLAUDE.md` §5

---

## 7. 테스트 결과와 오류 수정 기록

### 자동화 테스트 (총 7건)

**`tests/scholarship-core.test.mjs`** — 5개 테스트
| 테스트 | 검증 내용 |
|--------|-----------|
| `inferApplicationStatus` | 절대 날짜 기준 open·upcoming·closed 분류 |
| `filterScholarships` — 복합 필터 | 키워드·학교·구간·상태 동시 적용, 정확히 1건 반환 |
| `filterScholarships` — all-level | 전체 대상 장학금이 학부생 필터에도 매칭됨 |
| `buildClovaSummaryPayload` | CLOVA Studio 공식 문서 request shape 일치 확인 |
| `localFallbackSummary` | API 키 없이도 요약 마커·원문 내용 포함 확인 |

**`tests/server.test.mjs`** — 2개 테스트
| 테스트 | 검증 내용 |
|--------|-----------|
| API 키 없을 때 fallback | `provider: 'local-fallback'`, `mock: true`, 경고 메시지 포함 |
| CLOVA 실패 응답 시 복구 | status code `40000` 반환 시 fallback으로 전환, 서비스 유지 |

### 세션 중 수정한 주요 버그

| 버그 | 원인 | 수정 |
|------|------|------|
| 모든 장학금이 "미검증" 표시 | `source_url`이 SELECT에 없어 `mapDbRow`가 항상 `undefined` 읽음 | 3개 SELECT 쿼리 모두에 `source_url` 추가 |
| 공식 링크 클릭 시 toast 표시 | `noticeAction`/`applyAction`이 `window.open` 대신 `showToast` 호출 | `window.open(url, '_blank', 'noreferrer')` 로 변경 |
| 외부에서 서버 접속 불가 | `server.listen(PORT, '127.0.0.1', ...)` — localhost만 바인딩 | `'0.0.0.0'` 으로 변경 |
| 시드 데이터(s1~s7) 일반 목록에 노출 | 가짜 기관 데이터가 DB에 포함됨 | 모든 쿼리에 `AND source_url IS NOT NULL` 추가 |
| 챗봇이 최근 10건만 조회 | LIMIT 10 + 단순 ORDER BY | 키워드 OR 검색 + LIMIT 30, fallback LIMIT 20으로 개선 |

출처: `tests/`, `server.js:143-187`, `app.jsx:155-162`

---

## 8. README 및 사용 방법 문서 상태

**`README.md`** — 존재함, 최신 상태

포함 내용:
- 프로젝트 한 줄 설명
- 핵심 기능 목록
- 실행 방법 (`node server.js`, PORT 변경법)
- `.env` 설정 방법 (`.env.example` 복사 지시)
- CLOVA Studio API 엔드포인트·헤더·요청 형태 문서화
- k-skill 출처 및 적용한 7가지 공식 공고 우선 원칙
- 데이터 주의 사항 (샘플 데이터임을 명시)
- 테스트 명령어 (`node --check`, `node --test`, curl smoke test)

**`.env.example`** — 존재 여부: 코드에서 참조됨 (`README.md:44`)

출처: `README.md`

---

## 9. 발표에서 빼야 할 민감정보

아래 정보는 PPT·화면 캡처·데모 영상 어디에도 노출하지 말 것:

| 항목 | 위치 | 조치 |
|------|------|------|
| `CLOVA_STUDIO_API_KEY` | 서버 `.env` | 환경변수명만 언급, 값 미노출 |
| `OPENAPI_DECODING` (공공데이터 서비스키) | 서버 `.env` | 환경변수명만 언급, 값 미노출 |
| `DB_DOMAIN`, `DB_USER_ID`, `DB_USER_PASSWORD` | 서버 `.env` | 환경변수명만 언급, 값 미노출 |
| 서버 IP | `server.txt` | 발표 자료에서 제거 |
| 서버 접속 비밀번호 | `server.txt` | 절대 노출 금지 |
| SSH 개인키 내용 | 로컬 파일 | 노출 금지 |

**발표용 대체 표현**:
- API 키 → "환경변수로 관리, 코드에 포함 없음"
- 서버 IP → "Ncloud VPC 서버, 포트 80 운영 중"
- DB 접속 정보 → "Ncloud DB 서비스 연결, pg 드라이버 사용"

출처: `CLAUDE.md` §8, `server.txt` (발표 화면 공유 시 닫아둘 것)
