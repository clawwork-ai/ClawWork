<div align="center">

<table border="0" cellspacing="0" cellpadding="0"><tr>
<td><img src="./docs/screenshot.png" alt="ClawWork Desktop" height="420" /></td>
<td><img src="https://github.com/user-attachments/assets/3dd775d0-8441-45d9-92f5-19e843f793c4" alt="ClawWork PWA" height="420" /></td>
</tr></table>

[English](./README.md) · [简体中文](./README.zh.md) · [繁體中文](./README.zh-TW.md) · [日本語](./README.ja.md) · **한국어**

# ClawWork

**Agent OS 시대를 위한 로컬 우선 워크스페이스.**

[OpenClaw](https://github.com/openclaw/openclaw)의 데스크톱 클라이언트 —— 에이전트 태스크를 병렬로 실행하고, 아티팩트를 영구 보존하며, 파일을 잃어버리지 않습니다.

[![GitHub release](https://img.shields.io/github/v/release/clawwork-ai/clawwork?style=flat-square)](https://github.com/clawwork-ai/clawwork/releases/latest)
[![License](https://img.shields.io/github/license/clawwork-ai/clawwork?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/clawwork-ai/clawwork?style=flat-square)](https://github.com/clawwork-ai/clawwork)

[다운로드](#다운로드) · [**PWA**](https://cpwa.pages.dev) · [빠른 시작](#빠른-시작) · [Teams](#teams) · [주요 기능](#주요-기능) · [데이터 & 아키텍처](#데이터--아키텍처) · [저장소 구조](#저장소-구조) · [Roadmap](#roadmap) · [기여](#기여) · [Keynote](https://clawwork-ai.github.io/ClawWork/keynote/)

</div>

> **⚠️ 공식 저장소**
> 이것은 ClawWork의 **공식** 프로젝트입니다: https://github.com/clawwork-ai/clawwork
>
> ClawWork 이름을 무단으로 사용한 유사 저장소(ClawWorkAi/ClawWork)와 유사 사이트(clawworkai.store)가 발견되었습니다. 위의 공식 링크를 이용해 주세요.
>
> 공식 사이트: https://clawwork-ai.github.io/ClawWork/

> **📝 번역 상태**
> 이 한국어 번역은 커뮤니티 초안입니다. 어색한 표현이 남아 있을 수 있습니다. 네이티브 스피커의 리뷰와 [Pull Request](https://github.com/clawwork-ai/clawwork/pulls)를 환영합니다.

## 왜 ClawWork인가

**에이전트는 계속 늘어나고 있다. 병목은 더 이상 능력이 아니라, 오퍼레이터의 조작 면이다.**

Agent Runtime이 우후죽순 등장하면서, 사용자는 채팅 창, 웹 UI, 터미널 사이를 왔다 갔다 해야 하고, 각자가 자신의 컨텍스트를 가지며, 서로 공유되는 메모리는 없습니다. IDE가 코드의 오퍼레이터 계층이 되었고 터미널이 Unix의 오퍼레이터 계층이 된 것처럼, Agent OS 또한 워크스페이스 계층이 필요합니다. ClawWork는 바로 그 계층을 만들고 있습니다 —— OpenClaw를 위한 최상의 클라이언트로 출발하여, 멀티 런타임의 미래로 확장해 나갑니다.

### 지금: OpenClaw, 채팅 기록의 늪에서 구하기

OpenClaw는 강력합니다. 그러나 순수한 채팅은 그 역량을 담아내기엔 나쁜 그릇입니다.

여러 세션, 장시간 실행되는 작업, 승인 대기, 생성된 파일, 반복되는 자동화, 여러 게이트웨이 —— 이 모든 것이 겹치는 순간, 채팅 기록은 진흙탕이 됩니다. 상태가 사라집니다. 파일이 사라집니다. 컨텍스트가 사라집니다.

ClawWork는 이 문제를 해결합니다. 모든 태스크는 독립된 세션, 아티팩트, 제어, 히스토리를 가진 영속적인 워크스페이스가 되고, 3 패널 레이아웃으로 배치됩니다: 왼쪽은 태스크 목록, 가운데는 진행 중인 작업, 오른쪽은 아티팩트와 컨텍스트.

## Teams

에이전트 하나는 유용합니다. 잘 조율된 에이전트 팀은 하나의 노동력이 됩니다.

ClawWork Teams는 여러 에이전트를 하나의 배포 가능한 단위로 묶습니다 —— 역할, 인격, 스킬, 워크플로우를 포함해서. **Coordinator** 에이전트가 태스크를 분해해 **Worker** 에이전트에게 위임하고, 각 Worker는 자신의 서브 세션에서 동작합니다. 전체 오케스트레이션을 실시간으로 확인할 수 있습니다.

```
skill → agent → team
```

### Team 구조

```
teams/clawwork-dev/
├── TEAM.md                  # 팀 메타데이터와 워크플로우
└── agents/
    ├── manager/             # coordinator —— 팀을 조율
    │   ├── IDENTITY.md      # 역할과 프롬프트
    │   ├── SOUL.md          # 인격과 스타일
    │   └── skills.json      # 스킬 의존성
    ├── architect/            # worker —— 설계 담당
    ├── frontend-dev/         # worker —— UI 구축
    ├── core-dev/             # worker —— 핵심 로직 구축
    └── ...
```

### Team을 얻는 세 가지 방법

- **[TeamsHub](https://github.com/clawwork-ai/teamshub-community)** —— Git 네이티브 레지스트리에서 커뮤니티 제공 Team을 탐색하고 설치.
- **직접 만들기** —— 단계별 마법사로 Agent, 아이덴티티, 스킬을 정의.
- **AI Builder** —— 원하는 바를 설명하면 LLM이 Team 구조, 역할, 프롬프트를 설계.

설치 후에는 태스크를 만들 때 Team을 고르기만 하면 됩니다. Coordinator가 그다음을 이어받습니다.

## 다운로드

### Homebrew (macOS)

```bash
brew tap clawwork-ai/clawwork
brew install --cask clawwork
```

### 릴리스

macOS, Windows, Linux 빌드는 [Releases 페이지](https://github.com/clawwork-ai/clawwork/releases/latest)에서 제공됩니다. 앱이 스스로 업데이트합니다 —— 새 버전을 백그라운드에서 내려받고 종료 시 설치합니다.

### PWA (브라우저)

설치 불필요 —— 모던 브라우저에서 **[cpwa.pages.dev](https://cpwa.pages.dev)**를 열기만 하면 됩니다. 데스크톱과 모바일 모두에서 동작하며, 홈 화면에 추가할 수 있습니다.

## 빠른 시작

1. OpenClaw Gateway를 실행합니다.
2. ClawWork를 열고 설정에서 gateway를 추가합니다. token, 비밀번호, 또는 페어링 코드로 인증합니다. 기본 로컬 엔드포인트: `ws://127.0.0.1:18789`.
3. 태스크를 만들고 gateway와 에이전트를 선택한 뒤, 작업 내용을 설명합니다.
4. 채팅: 메시지 전송, 이미지 첨부, `@`로 파일 참조, 또는 `/` 명령 사용.
5. 태스크 실행을 지켜보고, 도구 동작을 확인하고, 출력 파일을 보관합니다.

## 주요 기능

### ⚡ 태스크 중심의 워크플로우

- 태스크 병렬 실행, 각 태스크마다 격리된 OpenClaw 세션 —— 보관한 태스크도 나중에 다시 열 수 있음
- gateway별 세션 카탈로그
- 실질적으로 유용한 세션 제어: 중지, 리셋, 압축, 삭제, 동기화
- 백그라운드 작업이 긴 하나의 스레드로 뭉개지지 않고 가독성을 유지
- `cron`, `every`, `at` 표현식으로 태스크 예약 —— 프리셋에서 고르거나 직접 작성, 실행 히스토리 확인, 언제든 수동 트리거 가능
- 세션을 Markdown으로 내보내서 앱 밖에 깔끔한 기록을 남길 수 있음

### 👁 더 나은 가시성

- 실시간 스트리밍 응답
- 에이전트 작동 중 인라인으로 표시되는 도구 호출 카드
- 사이드 패널의 진행 상황 및 아티팩트
- 지출이 한눈에 —— gateway별 사용량, 세션별 비용 내역, 30일 롤링 대시보드

### 🎛 더 나은 제어

- 멀티 gateway 지원
- 태스크 단위로 에이전트와 모델 전환
- 에이전트 직접 관리 —— 앱을 떠나지 않고 생성, 편집, 삭제, 워크스페이스 파일 탐색
- 각 gateway의 전체 도구 카탈로그 확인 —— 에이전트가 접근할 수 있는 범위를 명확히
- 추론 수준 제어와 slash 명령
- 민감한 실행 동작에 대한 사전 승인 프롬프트
- 백그라운드 이벤트 알림 —— 태스크 완료, 승인 요청, gateway 연결 끊김 —— 알림을 클릭하면 해당 태스크로 이동. 이벤트별로 켜고 끌 수 있어 소음을 직접 제어.

### 📂 더 나은 파일 처리

- 실제로 쓸모 있는 컨텍스트: 이미지, `@` 파일 참조, 음성 입력, 감시 폴더
- 최대 10개 폴더 감시, 변경을 자동 감지해 재색인 —— 컨텍스트는 항상 최신
- 로컬 아티팩트 저장
- 어시스턴트 응답 속 코드 블록과 원격 이미지를 자동 추출해 워크스페이스에 저장 —— 수동 복붙 불필요
- 태스크, 메시지, 아티팩트를 가로지르는 전문 검색

### 🖥 더 나은 데스크톱 경험

- 시스템 트레이 지원
- 전역 단축키로 불러오는 퀵 런처 창 (기본 `Alt+Space`, 커스터마이즈 가능)
- 앱 전반의 키보드 단축키
- 백그라운드 자동 업데이트 —— 설정에서 진행도를 보고, 종료 시 설치
- 편안한 수준으로 UI 확대/축소, 설정은 기억됨
- 라이트/다크 테마 + 8개 언어 지원

### 🔧 디버깅

- 문제가 생겼을 때 디버그 번들(로그, gateway 상태, 비식별화된 설정) 내보내기 —— 버그 신고에 유용
- 연결된 Gateway 서버 버전을 설정에서 바로 확인

## 데이터 & 아키텍처

ClawWork는 단일 Gateway WebSocket 연결로 OpenClaw와 통신합니다. 태스크마다 자신의 session key로 격리되며, 모든 데이터는 사용자가 선택한 로컬 워크스페이스 디렉터리에 저장됩니다 —— 클라우드 동기화 없음, 외부 데이터베이스 없음.

- **Tasks** —— 태스크마다 독립된 OpenClaw 세션에 대응, 병렬 작업이 충돌하지 않음.
- **Messages** —— 사용자, 어시스턴트, 시스템 메시지(도구 호출 및 이미지 첨부 포함)를 모두 로컬에 영속화.
- **Artifacts** —— 에이전트가 만들어낸 코드 블록, 이미지, 파일. 어시스턴트 출력에서 자동 추출되어 유실되지 않음.
- **전문 검색** —— 위 모든 것을 가로질러 검색. 어느 태스크였는지 기억나지 않는 3주 전의 스니펫도 찾을 수 있음.

<div align="center">
<img src="./docs/architecture.svg" alt="ClawWork Architecture" width="840" />
</div>

## 저장소 구조

```
packages/shared/       — 프로토콜 타입, 상수 (의존성 없음)
packages/core/         — 공유 비즈니스 로직: stores, services, ports
packages/desktop/
  src/main/            — Electron 메인: gateway WS, IPC, DB, artifacts, OS 연동
  src/preload/         — 타입화된 window.clawwork 브리지
  src/renderer/        — React UI: components, layouts, stores, hooks, i18n
packages/pwa/          — Progressive Web App (브라우저 + 모바일)
docs/                  — 설계 문서, 아키텍처 불변 조건
e2e/                   — Playwright E2E 테스트 (스모크 + gateway 통합)
scripts/               — 빌드 및 검사 스크립트
website/               — 프로젝트 사이트 (React + Vite)
keynote/               — 프레젠테이션 슬라이드 (Slidev)
```

## 기술 스택

Electron 34, React 19, TypeScript, Tailwind CSS v4, Zustand, SQLite (Drizzle ORM + better-sqlite3), Framer Motion.

## 플랫폼 참고 사항

- 음성 입력은 로컬 [whisper.cpp](https://github.com/ggerganov/whisper.cpp) 바이너리와 모델이 필요합니다.
- 자동 업데이트는 패키지 빌드에서만 동작합니다. 개발 모드에서는 건너뜁니다.
- 컨텍스트 폴더 감시: 최대 10개 디렉터리, 깊이 4단계, 파일당 10 MB까지.

## Roadmap

### ✅ 출시됨

- 태스크별 세션 격리를 갖춘 병렬 실행
- 멀티 gateway 인증 (token, 비밀번호, 페어링 코드)
- cron 예약 태스크 + 실행 히스토리
- gateway와 세션을 가로지르는 사용량 및 비용 대시보드
- 태스크, 메시지, 아티팩트에 걸친 전문 검색
- Teams 및 TeamsHub —— 멀티 에이전트 편성 구축, 공유, 설치
- Skills (ClawHub 기반) —— 탐색 및 설치
- AI Builder —— LLM 지원 Team 생성
- PWA 오프라인 지원과 모바일 UI ([cpwa.pages.dev](https://cpwa.pages.dev))
- 크로스 플랫폼: macOS, Windows, Linux (AppImage + deb), 자동 업데이트 포함

### 🔮 다음 순서

- 대화 분기
- 아티팩트 diff 뷰
- 커스텀 테마
- 반복 워크플로우를 위한 세션 템플릿
- Skills, Teams, Adapters를 위한 확장 API 문서

### 🌐 비전 —— Agent OS의 워크스페이스 계층

ClawWork는 현재 OpenClaw에 최적화되어 있습니다. 우리가 향하는 미래는 워크스페이스 계층이 런타임에 종속되지 않는 세계입니다 —— 하나의 오퍼레이터 표면이 당신이 다루는 모든 에이전트를 맡는 세계.

- **멀티 런타임 어댑터** —— 다른 런타임의 에이전트를 동일한 task / session / artifact 모델로 흡수
- **더 풍부한 팀 오케스트레이션** —— coordinator / worker를 넘어서는 협업 패턴
- **엔터프라이즈 친화적인 로컬 우선** —— 로컬 데이터 소유권을 포기하지 않으면서 더 강력한 데이터 경계와 팀 협업 패턴 제공

범위가 잡힌 항목은 *다음 순서*로 올라갑니다. 이 섹션의 어떤 내용도 일정에 대한 약속이 아닙니다.

## Star History

[![Star History Chart](https://api.star-history.com/image?repos=clawwork-ai/ClawWork&type=date&legend=top-left)](https://www.star-history.com/?repos=clawwork-ai%2FClawWork&type=date&legend=top-left)

## 기여

참여 방법:

- 셋업과 프로젝트 구조는 [DEVELOPMENT.md](DEVELOPMENT.md)를 참고하세요
- [Issues](https://github.com/clawwork-ai/clawwork/issues) 확인
- [Pull Request](https://github.com/clawwork-ai/clawwork/pulls) 생성
- 제출 전에 `pnpm check` 실행 —— lint, 아키텍처, UI 계약, 렌더러 문구, i18n, 데드 코드, 포맷팅, 타입, 테스트를 일괄 검사합니다.

번역은 영문판보다 뒤처질 수 있습니다. 내용이 어긋난 부분을 발견하시면 PR을 환영합니다.

## License

[Apache 2.0](LICENSE)

<div align="center">

[OpenClaw](https://github.com/openclaw/openclaw)를 위해 만들어졌습니다. [Peter Steinberger](https://github.com/steipete)의 훌륭한 작업에 경의를 표하며.

</div>
