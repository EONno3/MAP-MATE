# Mapmate Docker 실행 가이드

이 문서는 **Docker Desktop + Docker Compose**로 Mapmate(맵 에디터/뷰어)를 실행하는 방법을 정리합니다.

## 실행

1) **Docker Desktop**을 실행한 뒤, 완전히 켜질 때까지 대기합니다.

2) 프로젝트 루트에서 `start-docker.bat`를 **더블클릭**합니다.

- 스크립트는 **프론트엔드 이미지를 `--no-cache`로 강제 재빌드**하여, 코드 수정이 Docker에 반영되지 않는 문제를 방지합니다.
- 모든 출력은 `docker-launch.log`에 기록됩니다.

## 접속 주소

- **Web UI**: `http://localhost:3080`
- **Backend(health)**: `http://localhost:8000/healthz`

## 최신 빌드 확인(중요)

상단 좌측 `Mapmate` 아래에 **build id**(예: `fix-undo-ui-20260202`)가 표시됩니다.

- 화면이 바뀌지 않거나 예전 UI가 보이면:
  - `start-docker.bat`를 다시 실행해서 재빌드하거나
  - 실패 시 `docker-launch.log`를 확인하세요.

## 문제 해결

### 실행 중 오류가 나거나 창이 닫혀버리는 경우

- `start-docker.bat`는 실패 시 자동으로 `docker-launch.log`를 메모장으로 엽니다.
- 그래도 확인이 어렵다면, `docker-launch.log`를 열어 **가장 아래쪽 에러 메시지**를 확인하세요.

