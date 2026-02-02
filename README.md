# Mapmate (Project L7KT)

AI 기반 Metroidvania 맵 생성 도구 - 프로젝트 관리 대시보드 및 초안 생성 시스템

![CI](https://github.com/YOUR_USERNAME/mapmate/workflows/CI/badge.svg)

## 프로젝트 개요

Mapmate는 Metroidvania 스타일 게임 맵을 자동으로 생성해주는 AI 서비스입니다. 프로젝트 관리, 맵 초안 생성, 시각화 기능을 제공합니다.

### 주요 기능

- **프로젝트 관리**: 사용자별 프로젝트 CRUD
- **AI 맵 생성**: 지정된 크기의 연결된 룸 그래프 자동 생성
- **게이팅 시스템**: Key room과 locked edge 자동 배치
- **시각화**: D3.js 기반 인터랙티브 맵 그래프 뷰어

## 아키텍처

```
┌─────────────────┐
│   Frontend      │  React + Vite + TypeScript
│   (Port 5173)   │  - 프로젝트 대시보드
└────────┬────────┘  - 맵 시각화
         │
         │ REST API
         ↓
┌─────────────────┐
│  Backend API    │  Node.js + Express + Prisma
│  (Port 3000)    │  - JWT 인증
└────────┬────────┘  - 프로젝트 관리
         │            - AI 서비스 프록시
         │
         │ HTTP + Circuit Breaker
         ↓
┌─────────────────┐
│  Backend AI     │  FastAPI + Python
│  (Port 5000)    │  - 맵 그래프 생성
└────────┬────────┘  - 게이팅 로직
         │
         ↓
┌─────────────────┐
│   PostgreSQL    │  프로젝트 및 초안 데이터
│  (Port 15432)   │
└─────────────────┘
```

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite (빌드 도구)
- React Router (라우팅)
- Zustand (상태 관리)
- SWR (데이터 페칭)
- D3.js (그래프 시각화)

### Backend API
- Node.js + Express
- Prisma ORM (PostgreSQL)
- Passport.js (JWT 인증)
- Zod (스키마 검증)
- Axios + Opossum (AI 서비스 호출 + 서킷 브레이커)

### Backend AI
- FastAPI + Python
- NetworkX (그래프 알고리즘)
- Pydantic (데이터 검증)

### Database
- PostgreSQL 15

### DevOps
- Docker Compose (로컬 개발)
- GitHub Actions (CI/CD)
- Jest + Pytest (테스팅)

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- Python 3.11 이상
- Docker & Docker Compose
- pnpm 8 이상

### 설치

```bash
# 저장소 클론
git clone https://github.com/YOUR_USERNAME/mapmate.git
cd mapmate

# 의존성 설치 (monorepo 전체)
pnpm install

# AI 서비스 의존성 설치
cd packages/backend-ai
pip install -r requirements.txt
cd ../..
```

### 데이터베이스 설정

```bash
# Docker Compose로 PostgreSQL 시작
docker compose up -d

# Prisma 마이그레이션
pnpm -C packages/backend-api exec prisma migrate deploy

# 또는 개발 환경에서
pnpm -C packages/backend-api exec prisma db push
```

### 실행

#### 1. 백엔드 API 서버
```bash
# 터미널 1
cd packages/backend-api
pnpm dev
# → http://localhost:3000
```

#### 2. AI 서비스
```bash
# 터미널 2
cd packages/backend-ai
uvicorn main:app --reload --port 5000
# → http://localhost:5000
```

#### 3. 프론트엔드
```bash
# 터미널 3
cd packages/frontend
pnpm dev
# → http://localhost:5173
```

### 환경 변수

#### Backend API (`packages/backend-api/.env`)
```bash
DATABASE_URL="postgresql://mapmate:mapmate@localhost:15432/mapmate?schema=public"
JWT_SECRET="your-secret-key"
AI_SERVICE_URL="http://localhost:5000"
PORT=3000
```

#### Frontend (`packages/frontend/.env`)
```bash
VITE_API_URL=http://localhost:3000
```

## 테스트

### 전체 테스트 실행

```bash
# 백엔드 API 테스트 (Jest)
pnpm -C packages/backend-api test

# AI 서비스 테스트 (Pytest)
cd packages/backend-ai
pytest --cov=. --cov-report=term-missing

# 프론트엔드 타입 체크 및 린트
pnpm -C packages/frontend type-check
pnpm -C packages/frontend lint
```

### CI/CD

GitHub Actions가 다음 작업을 자동으로 수행합니다:

- ✅ Backend API 테스트 (통합 테스트 포함, PostgreSQL 서비스 사용)
- ✅ AI 서비스 테스트 (커버리지 80% 이상)
- ✅ Frontend 빌드 및 린트
- 📊 Codecov로 커버리지 리포트 업로드

## 프로젝트 구조

```
mapmate/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI 워크플로우
├── packages/
│   ├── backend-api/            # Node.js API 서버
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── src/
│   │   │   ├── routes/         # API 엔드포인트
│   │   │   ├── repositories/   # 데이터 레이어
│   │   │   ├── middleware/     # 인증/검증 미들웨어
│   │   │   ├── schemas/        # Zod 스키마
│   │   │   ├── test/           # 통합 테스트
│   │   │   └── index.ts
│   │   └── package.json
│   ├── backend-ai/             # Python AI 서비스
│   │   ├── main.py             # FastAPI 앱
│   │   ├── test_main.py        # Pytest 테스트
│   │   ├── requirements.txt
│   │   └── pytest.ini
│   └── frontend/               # React 대시보드
│       ├── src/
│       │   ├── ui/             # React 컴포넌트
│       │   ├── usecases/       # SWR 훅
│       │   ├── zustand/        # 상태 관리
│       │   └── lib/            # API 클라이언트
│       └── package.json
├── docker-compose.yml          # PostgreSQL 설정
├── pnpm-workspace.yaml         # pnpm monorepo 설정
└── README.md
```

## API 문서

### Backend API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/register` | 사용자 등록 | - |
| POST | `/auth/login` | 로그인 (JWT 발급) | - |
| GET | `/projects` | 프로젝트 목록 조회 | ✅ |
| POST | `/projects` | 프로젝트 생성 | ✅ |
| GET | `/projects/:id` | 프로젝트 상세 조회 | ✅ |
| PUT | `/projects/:id` | 프로젝트 수정 | ✅ |
| DELETE | `/projects/:id` | 프로젝트 삭제 | ✅ |
| POST | `/projects/:id/generate-draft` | 맵 초안 생성 | ✅ |
| GET | `/healthz` | 헬스체크 | - |

### AI Service Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | 서비스 상태 |
| POST | `/generate-draft` | 맵 그래프 생성 |
| GET | `/healthz` | 헬스체크 |

## 개발 가이드

### 코드 스타일

- **Backend API**: ESLint + Prettier (자동 포맷팅)
- **Frontend**: ESLint + Prettier (자동 포맷팅)
- **AI Service**: Black (권장)

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

### PostgreSQL 연결 실패
```bash
# Docker 컨테이너 상태 확인
docker compose ps

# 로그 확인
docker compose logs postgres

# 재시작
docker compose restart postgres
```

### Prisma Client 생성 오류
```bash
# Prisma Client 재생성
pnpm -C packages/backend-api exec prisma generate
```

### AI 서비스 타임아웃
- Circuit Breaker 설정 확인 (기본 25초)
- `packages/backend-api/src/routes/projects.ts`에서 타임아웃 조정 가능

### 프론트엔드 CORS 에러
- `packages/backend-api/src/index.ts`에서 CORS 설정 확인
- 로컬 개발 시 `http://localhost:5173` 허용 확인

## 성능 목표

- **AI 생성 속도**: size=300 기준 30초 이내
- **API 응답 시간**: 평균 < 200ms (DB 쿼리)
- **테스트 커버리지**: 
  - Backend API: 80% 이상
  - AI Service: 80% 이상

### 성능 벤치마크 실행

상세한 가이드는 [PERFORMANCE.md](./PERFORMANCE.md) 참조

```bash
# AI 서비스 단독
cd packages/backend-ai
python benchmark.py

# 엔드투엔드
cd packages/backend-api
JWT_TOKEN="<token>" npx ts-node benchmark.ts e2e

# 전체
JWT_TOKEN="<token>" npx ts-node benchmark.ts all
```

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

프로젝트 링크: [https://github.com/YOUR_USERNAME/mapmate](https://github.com/YOUR_USERNAME/mapmate)
