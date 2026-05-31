# OMC + Superpowers 프로젝트 런북

> Day 6 · 실습 5 — Claude Code 심화 과정

---

## 수업 위치

| 항목 | 내용 |
|------|------|
| 과정 | Claude Code 실전 활용 (Day 6–8) |
| 위치 | Day 6 / 실습 5 |
| 선수 실습 | Day 6 실습 1–4 (기본 프롬프트·OMC·Superpowers 개념) |
| 다음 단계 | Day 7–8 자유 프로젝트 |

---

## 프로젝트 목표

학생이 **Day 7·Day 8에서 만들고 싶은 프로젝트 주제**를 입력하면,  
Claude Code에게 지시를 내리는 **프롬프트 흐름**을 단계별로 안내한다.

### 핵심 학습 목표

1. **OMC vs Superpowers 선택 기준**을 실제 예시로 익힌다.
2. 프로젝트를 **질문 → 팀 검토 → 계획 → 구현 → 검증** 순으로 분해하는 습관을 기른다.
3. 직접 긴 코드를 쓰지 않고 **프롬프트로 작업을 지시**하는 워크플로를 경험한다.

### 도구 선택 가이드라인

| 상황 | 도구 |
|------|------|
| 요구사항이 모호하거나 아이디어 정리가 필요할 때 | Superpowers `brainstorming` |
| 여러 파일·역할 분담이 필요한 큰 작업 | OMC `team` / `ultrawork` |
| 다단계 구현 계획이 필요할 때 | Superpowers `writing-plans` |
| 버그·테스트 실패가 반복될 때 | OMC `ralph` / Superpowers `systematic-debugging` |
| 완료 전 품질 검토 | OMC `ultraqa` / Superpowers `requesting-code-review` |
| 외부 SDK·API 사용법이 불확실할 때 | OMC `document-specialist` |

---

## 런북 단계 개요

```
1. BRIEF     — 주제 입력 및 요구사항 명확화
2. TEAM      — OMC 팀으로 다각도 검토
3. PLAN      — Superpowers writing-plans로 구현 계획 수립
4. BUILD     — Superpowers executing-plans / OMC executor로 구현
5. VERIFY    — Superpowers verification-before-completion으로 검증
```

각 단계마다 **학생이 입력하는 프롬프트 예시**와  
**Claude Code가 수행하는 작업 예시**를 나란히 제공한다.

---

## 최종 산출물

| 산출물 | 설명 |
|--------|------|
| `index.html` | 단일 파일 브라우저 앱 — 런북 UI |
| `runbook.js` | 단계별 상태·프롬프트 템플릿 관리 로직 |
| `style.css` | 런북 스타일시트 |
| `prompts/` | 각 단계별 프롬프트 예시 모음 (`.txt`) |
| `README.md` | 이 파일 — 목표·구조·사용법 |

### 앱 동작 방식

- **외부 API 없이** 브라우저에서 완전히 동작 (`file://` 또는 로컬 서버)
- 학생이 주제를 입력 → 각 단계별 **프롬프트 템플릿이 자동 생성**
- 생성된 프롬프트를 복사해서 Claude Code에 붙여넣기만 하면 됨
- 단계 완료 체크박스로 진행 상황 추적

---

## 사용 방법 (학생용)

1. `index.html`을 브라우저로 연다.
2. "내 프로젝트 주제" 입력칸에 Day 7–8에서 만들고 싶은 것을 적는다.
3. **BRIEF** 단계의 프롬프트를 복사해 Claude Code에 붙여넣는다.
4. Claude Code의 응답을 보고 단계를 체크한 뒤, 다음 단계로 넘어간다.
5. VERIFY 단계까지 완료하면 자신만의 프로젝트 런북이 완성된다.

---

## 개발 시작 전 확인 사항

- [ ] Day 6 실습 1–4 완료
- [ ] Claude Code CLI 설치 및 OMC 플러그인 활성화 확인
- [ ] 브라우저에서 `file://` 경로 파일 열기 가능 여부 확인

---

*이 폴더는 실습 진행 중 Claude Code에게 프롬프트를 지시해 소스코드를 채워나간다.*

---

## 실행 방법

### 방법 1 — 파일 직접 열기 (가장 간단)

```
proj5/index.html 파일을 브라우저로 드래그하거나 더블클릭
```

> Chrome/Edge 권장. Safari는 `file://` 클립보드 복사가 일부 제한됩니다.

### 방법 2 — VS Code Live Server

1. VS Code에서 `proj5/` 폴더 열기
2. `index.html` 우클릭 → **Open with Live Server**
3. 브라우저에서 `http://127.0.0.1:5500` 자동 실행

### 방법 3 — Python 로컬 서버

```bash
# proj5/ 폴더에서 실행
python -m http.server 8080
# 브라우저에서 http://localhost:8080 접속
```

### 방법 4 — Node.js 로컬 서버

```bash
# proj5/ 폴더에서 실행
npx serve .
# 브라우저에서 출력된 주소 접속
```

### 데이터 저장 위치

모든 입력값은 브라우저 `localStorage`에 자동 저장됩니다.
같은 브라우저에서 다시 열면 이전 작업이 그대로 복원됩니다.
초기화하려면 앱 우상단 **↺ 초기화** 버튼을 누르세요.
