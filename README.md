# Mapmate (MAP-MATE) v1.6

Metroidvania 스타일 맵(룸/연결/게이팅)을 **AI로 생성**하고, 생성 결과를 **웹 UI에서 편집/내보내기** 할 수 있는 도구입니다.

[![CI](https://github.com/EONno3/MAP-MATE/actions/workflows/ci.yml/badge.svg)](https://github.com/EONno3/MAP-MATE/actions/workflows/ci.yml)

## 🌟 v1.6 업데이트 주요 내역
- **인터랙티브 튜토리얼(Tutorial) 시스템 추가**: 처음 사용하는 사용자를 위한 단계별 가이드 기능 및 튜토리얼 전용 오버레이 UI 도입
- **다국어 튜토리얼 지원**: 한국어/영어 튜토리얼 번역 데이터 분리 및 통합 관리
- **툴바 및 룸 에디터 UI 개선**: 튜토리얼 진행을 위한 핵심 버튼 강조 및 헬프 섹션 보강

## 🌟 v1.51 업데이트 주요 내역
- **플레이 테스트 모드(PlayTestMode) 연동 강화**: 룸 에디터와의 상태 동기화 및 전역 단축키(Escape) 처리 개선
- **전역 상태 관리 최적화**: `App.tsx` 내의 맵 데이터 갱신 로직 및 타입 정의(`map.ts`) 정합성 강화
- **UI 마이너 버그 수정**: 룸 타입 변경 시 캔버스 즉시 미반영 이슈 및 검색 정렬 기능 보정

## 🌟 v1.5 업데이트 주요 내역
- **룸 타입 선정 시스템 도입**: 맵 설정 창에서 룸 타입(일반, 보스, 세이브 등)을 직접 선택하고 관리할 수 있는 기능 추가
- **툴팁(Tooltip) 시스템 강화**: UI 요소 전반에 상세 설명을 제공하는 공통 툴팁 컴포넌트 적용
- **맵 캔버스 및 룸 에디터 안정화**: 룸 배치 정밀도 향상 및 플레이 테스트 모드 레이아웃 개선
- **사이드바 UI 가독성 개선**: 맵 파라미터 조절창 및 존(Zone) 관리 패널의 시각적 피드백 강화

## 🌟 v1.2 업데이트 주요 내역
- **룸 에디터 UI/UX 전체 개편**: 스페이스바(Spacebar) 화면 맵 패닝 기능 추가, 다중 탭(Tile/Object) 팔레트 적용, 플로팅 툴박스(Floating Toolbox) 및 단축키 지원(B: 브러시, G: 채우기, E: 지우기 등)
- **플레이어 시점 테스트 모드(PlayTestMode) 추가**: 에디터 내에서 맵을 넓게 볼 수 있는 전체 화면 모드 추가
- **이미지 로딩 단면 개선**: Danbooru API 연동으로 보다 빠르고 안정적인 NPC/오브젝트 이미지 프로필 로딩 처리
- **어드민(Admin) 대시보드 연동 완료**: 백엔드와 연동되어 프로젝트 리스트, 데이터 조회 기능 및 검색 필터 UI 개선
- **AI 맵 제너레이션 버그 수정**: 맵 생성 실패 문제 및 룸 연결성 향상 등 다수 기능 안정화

## 현재 동작 기준(중요)

이 저장소는 여러 패키지(모노레포)로 구성되어 있고, **현재 “바로 실행되는 기본 경로”는 `frontend + backend-ai`** 입니다.

- **Docker 실행(권장)**: `start-docker.bat` → `frontend(nginx)` + `backend-ai(FastAPI)` 구동
- **로컬 개발**: `backend-ai`를 `:8000`에 띄우고 `frontend`는 Vite dev server로 실행
- **`backend-api` 패키지**: 현재 레포에는 존재하지만, “Prisma/DB 기반 백엔드” 문서는 최신 코드와 맞지 않는 부분이 있어 **WIP(정리/개발 중)** 으로 취급합니다.

## 빠른 시작 (Docker, 권장)

Windows라면 아래 2개만으로 바로 확인 가능합니다.

- **실행**: `start-docker.bat` 더블클릭
- **종료**: `stop-docker.bat` 더블클릭

### 접속 주소

- **Web UI**: `http://localhost:3000`
- **Backend AI(health)**: `http://localhost:8000/healthz`

자세한 내용은 `README-Docker.md`를 참고하세요.

## 프로젝트 개요

Mapmate는 Metroidvania 스타일 게임 맵을 자동으로 생성하고, 결과를 웹 UI에서 편집/내보내기 할 수 있는 도구입니다.

### 주요 기능

- **AI 맵 생성**: `/generate`(쿼리) 또는 `/generate/prompt`(자연어)로 룸/연결 생성
- **월드 맵 편집**: 룸/연결 편집, 존(Zone) 관리, Undo/Redo
- **룸 상세 편집**: 룸 단위의 상세 타일/오브젝트 편집(룸 에디터)
- **내보내기/가져오기**: JSON Export/Import, Unity Export v1 지원

## 아키텍처

```
┌─────────────────┐
│   Frontend      │  React + Vite + TypeScript
│   (Port 3000)   │  - 맵 생성/편집 UI
└────────┬────────┘
         │  (same-origin proxy)
         │  /generate, /healthz, /api/*
         ↓
┌─────────────────┐
│  Backend AI     │  FastAPI + Python
│  (Port 8000)    │  - 맵 생성/검증/내보내기
└─────────────────┘
```

> `backend-api`(Node)는 현재 레포에 포함돼 있으나, Docker 기본 경로에는 연결되어 있지 않은 **WIP 패키지**입니다.

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite (빌드 도구)
- Vitest (유닛 테스트)
- Axios (HTTP)

### Backend AI
- FastAPI + Python
- NetworkX (그래프 알고리즘)
- Pydantic (데이터 검증)
- (선택) OpenAI SDK (`OPENAI_API_KEY`가 있을 때 일부 기능에서 사용)

### DevOps
- Docker Compose (로컬 실행)
- GitHub Actions (CI)

### Backend API (WIP)
- Node.js + Express (초기 스캐폴딩)

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- Python 3.11 이상
- Docker & Docker Compose
- pnpm 8 이상

### 설치

```powershell
# 저장소 클론
git clone https://github.com/EONno3/MAP-MATE.git
cd MAP-MATE

# 의존성 설치 (monorepo 전체)
pnpm install

# AI 서비스 의존성 설치
cd packages\backend-ai
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..\..
```

### Docker 실행(권장)

```powershell
# Windows: 더블클릭해도 됩니다.
.\start-docker.bat
```

- Web UI: `http://localhost:3000`
- Backend AI: `http://localhost:8000/healthz`

### 실행

#### 1. Backend AI (FastAPI)

```powershell
cd packages\backend-ai
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --port 8000
```

#### 2. Frontend (Vite)

```powershell
cd packages\frontend
pnpm dev
# → http://localhost:3000
```

#### (선택) Windows 통합 런처

```powershell
# 3개 창을 띄워서 backend-ai / backend-api(WIP) / frontend를 함께 실행합니다.
.\start-mapmate.bat
```

### 환경 변수

#### Backend AI (`packages/backend-ai`)

- **`OPENAI_API_KEY` (선택)**: 설정되어 있고 `openai` 패키지가 설치된 경우 일부 프롬프트 기반 기능에서 OpenAI 호출을 시도합니다. 미설정이면 키워드 기반 폴백으로 동작합니다.

#### Frontend (`packages/frontend/.env`)
```env
# 기본값(빈 값)은 same-origin 프록시를 사용합니다. (Docker nginx / Vite proxy)
VITE_API_URL=

# 원하면 백엔드 직접 지정도 가능합니다(프록시 우회).
# VITE_API_URL=http://localhost:8000
```

## 테스트

### 전체 테스트 실행

```powershell
# Frontend (Vitest)
pnpm install
pnpm -C packages/frontend test
```

### CI/CD

GitHub Actions가 다음 작업을 자동으로 수행합니다:

- ✅ 프론트엔드 빌드/검증(상세는 `.github/workflows/ci.yml` 참고)
- ✅ 파이썬 백엔드 관련 체크(정리 중)

## 프로젝트 구조

```
MAP-MATE/
├── .github/workflows/          # CI
├── packages/
│   ├── backend-ai/             # FastAPI (맵 생성/검증/내보내기)
│   ├── backend-api/            # (WIP) Node API 스캐폴딩
│   └── frontend/               # React + Vite (+ nginx for Docker)
├── docker-compose.yml          # Docker: frontend + backend-ai
├── start-docker.bat
├── stop-docker.bat
├── start_ai.bat
├── start-mapmate.bat           # (실험/레거시 성격의 통합 런처)
└── README.md
```

## API 문서

### Backend AI Endpoints (기본 `:8000`)

- **GET** `/healthz`: 헬스체크
- **GET** `/generate`: 쿼리 파라미터로 맵 생성
- **POST** `/generate/prompt`: 자연어 프롬프트 기반 생성
- **POST** `/generate/room-detail`: 룸 상세 타일/오브젝트 생성
- **POST** `/api/validate`: rooms/connections 정합성 검사

## 개발 가이드

### 코드 스타일

- **Frontend**: TypeScript + Vitest (테스트 우선 권장)
- **Backend AI**: Python (포맷터/린터는 정리 중)
- **Backend API**: WIP

### 커밋 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
test: 테스트 코드 추가/수정
refactor: 코드 리팩토링
chore: 빌드 설정, 의존성 업데이트 등
```

### 브랜치 전략

- `main` / `master`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치

## 트러블슈팅

### Docker 실행이 실패하는 경우

- Docker Desktop이 실행 중인지 확인한 뒤, `start-docker.bat`를 다시 실행하세요.
- 실패 로그는 프로젝트 루트의 `docker-launch.log`에 남습니다.

### 로컬에서 프론트가 백엔드에 연결되지 않는 경우

- `backend-ai`가 `http://localhost:8000/healthz`에 응답하는지 먼저 확인하세요.
- `packages/frontend/vite.config.ts`의 프록시가 `http://localhost:8000`을 가리키는지 확인하세요.

### 포트 충돌

- 기본 포트:
  - Frontend: `3000`
  - Backend AI: `8000`
- 이미 사용 중이면:
  - Docker를 끄고(`stop-docker.bat`) 로컬로 실행하거나
  - `packages/frontend/vite.config.ts`에서 프론트 포트를 변경하세요.

## 성능

성능 관련 기록/목표/벤치마크는 `PERFORMANCE.md`를 참고하세요.

## 라이선스

MIT License

## 기여

이슈 제보 및 PR은 언제든지 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 연락처

프로젝트 링크: `https://github.com/EONno3/MAP-MATE`
