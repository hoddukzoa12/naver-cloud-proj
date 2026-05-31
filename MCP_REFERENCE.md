# MCP_REFERENCE.md — MCP 사용 지침

## 이 프로젝트에서 MCP를 쓰는 방식

이 프로젝트에서 MCP는 **외부 서비스 호출이 아니라 문서 확인용**으로 사용한다.
기능 구현에 MCP가 반드시 필요하지 않으며, 연결되지 않아도 앱은 동작한다.

---

## MCP별 용도

| MCP | 연결 여부 | 이 프로젝트에서 쓰는 경우 |
|-----|-----------|--------------------------|
| **context7** | 선택 | UI 라이브러리, 브라우저 API, `localStorage` 사용법 확인 |
| **Playwright MCP** | 선택 | 화면이 깨지지 않는지 브라우저 자동화로 확인 |
| **GitHub MCP** | 선택 | 디자인 레퍼런스나 README 예시 검색 |

---

## 규칙

- 연결되지 않은 MCP를 억지로 설치하지 않는다.
- API 키나 토큰이 필요한 MCP는 이번 프로젝트에서 제외한다.
- MCP가 없어도 브라우저 `localStorage`와 vanilla JS만으로 앱을 완성할 수 있다.

---

## Claude Code에게 물어볼 MCP 확인 프롬프트

### 프롬프트 1 — 현재 연결된 MCP 확인

```
현재 이 세션에서 연결된 MCP 서버 목록을 알려줘.
context7, Playwright, GitHub MCP 중 어떤 것이 활성화되어 있어?
```

### 프롬프트 2 — context7으로 localStorage 사용법 조회

```
context7이 연결되어 있으면, 브라우저 localStorage에서
JSON 객체를 저장하고 불러오는 최신 패턴을 확인해줘.
연결되어 있지 않으면 네가 알고 있는 방식으로 알려줘.
```

### 프롬프트 3 — Playwright MCP로 화면 깨짐 확인

```
Playwright MCP가 연결되어 있으면, index.html을 열어서
모바일 너비(375px)에서 텍스트가 겹치거나 버튼이 잘리는지 확인해줘.
연결되어 있지 않으면 어떤 CSS를 추가해야 하는지 알려줘.
```
