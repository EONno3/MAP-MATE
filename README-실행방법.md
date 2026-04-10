# Mapmate 실행 방법 (Windows)

> 지금은 **루트의 `mapmate.bat` 하나**가 공식 진입점입니다. (기존 `start-*.bat` 파일들은 `scripts/legacy/`로 이동)

## 가장 쉬운 실행

- **방법 A (권장)**: `mapmate.bat` 더블클릭 → **메뉴**에서 선택
- **방법 B (명령으로 실행)**: 아래 커맨드 그대로 실행

## Docker로 실행 (권장)

```bat
mapmate.bat start docker
```

- **Web UI**: `http://localhost:3080`
- **AI (FastAPI)**: `http://localhost:8000` (헬스체크: `/healthz`)
- 상세는 `README-Docker.md` 참고

### Docker 종료

```bat
mapmate.bat stop docker
```

## 로컬 개발 모드 (AI + Backend API + Frontend)

```bat
mapmate.bat start local
```

- **Frontend (Vite)**: `http://localhost:5173`
- **Backend API (Express)**: `http://localhost:3001` (헬스체크: `/health`)
- **Backend AI (FastAPI)**: `http://localhost:8000` (헬스체크: `/healthz`)

> 로컬 모드 종료는 각 콘솔 창에서 `Ctrl+C` 또는 창 닫기로 정지합니다. (`stop local`은 현재 제공하지 않습니다)

## AI만 실행 (FastAPI)

```bat
mapmate.bat start ai
```

- **AI (FastAPI)**: `http://localhost:8000` (헬스체크: `/healthz`)

## 레거시 스크립트 (호환용)

기존 파일명으로 실행하던 흐름을 유지해야 하면 아래 경로를 사용하세요.

- `scripts/legacy/start-docker.bat` → `mapmate.bat start docker`
- `scripts/legacy/start-mapmate.bat` → `mapmate.bat start local`
- `scripts/legacy/start_ai.bat` → `mapmate.bat start ai`
- `scripts/legacy/stop-docker.bat` → `mapmate.bat stop docker`

## 문제 해결

- **Docker가 안 떠요**: Docker Desktop을 먼저 실행한 뒤 `mapmate.bat start docker`
- **포트 충돌**: 이미 떠 있는 프로세스를 종료 후 재실행

## 더 자세한 문서

- `GETTING_STARTED.md`
- `README-Docker.md`
- `README.md`

