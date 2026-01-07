# 시작하기 - Mapmate 실행 가이드

## 🚀 빠른 시작 (5분)

### 1단계: 데이터베이스 시작

```powershell
# 워크스페이스 루트에서
docker compose up -d
```

**확인:**
```powershell
docker compose ps
# mapmate-db가 "running" 상태여야 함
```

### 2단계: 백엔드 API 실행

```powershell
# 새 PowerShell 터미널 1
cd packages\backend-api

# Prisma 클라이언트 생성
pnpm exec prisma generate

# 데이터베이스 스키마 동기화
pnpm exec prisma db push

# 개발 서버 시작
pnpm dev
```

**확인:** 브라우저에서 http://localhost:3000/healthz 접속
```json
{"status":"ok","service":"backend-api","timestamp":"..."}
```

### 3단계: AI 서비스 실행

```powershell
# 새 PowerShell 터미널 2
cd packages\backend-ai

# Python 가상환경 생성 (처음만)
python -m venv venv

# 가상환경 활성화
.\venv\Scripts\Activate.ps1

# 의존성 설치 (처음만)
pip install -r requirements.txt

# 서비스 시작
uvicorn main:app --reload --port 5000
```

**확인:** 브라우저에서 http://localhost:5000/healthz 접속
```json
{"status":"ok","service":"backend-ai"}
```

### 4단계: 프론트엔드 실행

```powershell
# 새 PowerShell 터미널 3
cd packages\frontend

# 개발 서버 시작
pnpm dev
```

**확인:** 브라우저에서 http://localhost:5173 접속

---

## 📋 상세 설정 가이드

### 사전 요구사항

- ✅ Node.js 18 이상
- ✅ Python 3.11 이상
- ✅ Docker Desktop (Windows용)
- ✅ pnpm 8 이상

**설치 확인:**
```powershell
node --version   # v18.0.0 이상
python --version # 3.11.0 이상
docker --version # 최신 버전
pnpm --version   # 8.0.0 이상
```

### 초기 설정

#### 1. 저장소 클론 및 의존성 설치

```powershell
# 클론 (이미 했다면 스킵)
git clone <repository-url>
cd mapmate

# 전체 의존성 설치 (monorepo)
pnpm install

# AI 서비스 의존성
cd packages\backend-ai
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..\..
```

#### 2. 환경 변수 설정

**Backend API** (`packages/backend-api/.env`):
```env
DATABASE_URL="postgresql://mapmate:mapmate@localhost:15432/mapmate?schema=public"
JWT_SECRET="your-super-secret-key-change-in-production"
AI_SERVICE_URL="http://localhost:5000"
PORT=3000
```

**Frontend** (`packages/frontend/.env`):
```env
VITE_API_URL=http://localhost:3000
```

#### 3. 데이터베이스 초기화

```powershell
# Docker Compose로 PostgreSQL 시작
docker compose up -d

# Prisma 설정
cd packages\backend-api
pnpm exec prisma generate
pnpm exec prisma db push
cd ..\..
```

---

## 🎯 실행 시나리오

### 시나리오 1: 개발 환경 전체 실행

**터미널 1 - 데이터베이스:**
```powershell
docker compose up -d
docker compose logs -f postgres  # 로그 모니터링
```

**터미널 2 - Backend API:**
```powershell
cd packages\backend-api
pnpm dev
```

**터미널 3 - AI Service:**
```powershell
cd packages\backend-ai
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 5000
```

**터미널 4 - Frontend:**
```powershell
cd packages\frontend
pnpm dev
```

**접속:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- AI Service: http://localhost:5000

### 시나리오 2: 백엔드만 실행 (API 테스트)

```powershell
# 터미널 1
docker compose up -d

# 터미널 2
cd packages\backend-api
pnpm dev

# 터미널 3
cd packages\backend-ai
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 5000
```

**테스트:**
```powershell
# Healthcheck
curl http://localhost:3000/healthz
curl http://localhost:5000/healthz

# AI 서비스 직접 호출
curl -X POST http://localhost:5000/generate-draft -H "Content-Type: application/json" -d "{\"size\":20}"
```

### 시나리오 3: 프론트엔드만 실행 (UI 개발)

```powershell
# 백엔드가 이미 실행 중이라고 가정
cd packages\frontend
pnpm dev
```

---

## 🔐 인증 (Google OAuth)

현재는 Google OAuth로 JWT 토큰을 발급받아야 합니다.

### 방법 1: Google OAuth 플로우 (권장)

1. **Google Cloud Console 설정 필요**
   - OAuth 2.0 클라이언트 ID 생성
   - 리다이렉트 URI: `http://localhost:3000/auth/google/callback`

2. **환경 변수 추가** (`packages/backend-api/.env`):
   ```env
   GOOGLE_CLIENT_ID="your-client-id"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

3. **로그인 플로우:**
   - 브라우저에서 `http://localhost:3000/auth/google` 접속
   - Google 로그인
   - JWT 토큰 응답 받음

### 방법 2: 테스트 토큰 직접 생성 (개발용)

```powershell
cd packages\backend-api
node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({ id: 'test-user-123' }, 'your-super-secret-key-change-in-production', { expiresIn: '24h' }));"
```

생성된 토큰을 프론트엔드 입력칸에 붙여넣기

---

## 🧪 테스트 실행

### Backend API 테스트

```powershell
cd packages\backend-api

# 단위 테스트
pnpm test src\routes\projects.test.ts

# 통합 테스트
pnpm test src\test\projects.int.test.ts

# 전체 테스트
pnpm test

# Watch 모드
pnpm test --watch
```

### AI Service 테스트

```powershell
cd packages\backend-ai
.\venv\Scripts\Activate.ps1

# 전체 테스트 + 커버리지
pytest

# 특정 테스트만
pytest -k "test_generate_map_graph_basic_structure"

# Verbose
pytest -v
```

### Frontend 품질 검사

```powershell
cd packages\frontend

# 타입 체크
pnpm type-check

# Lint
pnpm lint

# 포맷 체크
pnpm format:check

# 빌드 테스트
pnpm build
```

---

## 🏃 사용 방법

### 1. 프론트엔드 접속

브라우저에서 http://localhost:5173 접속

### 2. 인증

상단 입력칸에 JWT 토큰 붙여넣기 (위의 인증 섹션 참조)

### 3. 프로젝트 생성

1. "+ New Project" 버튼 클릭
2. 프로젝트 이름 입력 (예: "My Awesome Game")
3. "Create" 버튼 클릭
4. 목록에 자동으로 추가됨

### 4. 맵 초안 생성

1. 프로젝트 클릭하여 상세 페이지 이동
2. "Generate Draft" 버튼 클릭
3. Size 입력 (2-500, 예: 20)
4. "Generate" 버튼 클릭
5. 맵 그래프가 시각화되어 표시됨

### 5. 맵 그래프 조작

- **줌/팬**: 마우스 휠로 줌, 드래그로 팬
- **리셋**: "Reset Zoom" 버튼
- **노드 클릭**: 상세 정보 패널에 룸 정보 표시
- **엣지 클릭**: Lock 정보 표시
- **필터**: "Only Keys", "Only Locks" 토글

---

## 🔧 트러블슈팅

### 1. PowerShell 스크립트 실행 오류

```
이 시스템에서 스크립트를 실행할 수 없으므로...
```

**해결:**
```powershell
# 관리자 권한으로 PowerShell 실행 후
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. Docker 연결 실패

**확인:**
```powershell
docker compose ps
docker compose logs postgres
```

**재시작:**
```powershell
docker compose down
docker compose up -d
```

### 3. Prisma Client 오류

```
Cannot find module '@prisma/client'
```

**해결:**
```powershell
cd packages\backend-api
pnpm exec prisma generate
```

### 4. 포트 충돌

```
Port 3000 is already in use
```

**해결:**
```powershell
# 사용 중인 프로세스 찾기
netstat -ano | findstr :3000

# 프로세스 종료 (PID 확인 후)
taskkill /PID <PID> /F
```

### 5. Python 가상환경 활성화 오류

```
cannot be loaded because running scripts is disabled
```

**해결:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 6. CORS 에러

**확인:** `packages/backend-api/src/index.ts`에서 CORS 설정

**임시 해결:**
```typescript
app.use(cors({ origin: '*' }));  // 개발용만
```

### 7. AI 서비스 502 에러

**원인:** AI 서비스가 실행되지 않았거나 타임아웃

**해결:**
1. AI 서비스 실행 확인: http://localhost:5000/healthz
2. 로그 확인: AI 서비스 터미널
3. Circuit Breaker 로그 확인: Backend API 터미널

---

## 📊 성능 벤치마크 실행

### AI 서비스 단독

```powershell
cd packages\backend-ai
.\venv\Scripts\Activate.ps1
python benchmark.py
```

### 엔드투엔드

```powershell
cd packages\backend-api

# JWT 토큰 설정
$env:JWT_TOKEN="<your-jwt-token>"

# 벤치마크 실행
npx ts-node benchmark.ts e2e
```

---

## 🛑 전체 종료

```powershell
# 각 터미널에서 Ctrl+C

# Docker 종료
docker compose down

# 또는 모든 리소스 제거
docker compose down -v
```

---

## 📚 추가 문서

- [README.md](./README.md) - 프로젝트 개요
- [PERFORMANCE.md](./PERFORMANCE.md) - 성능 벤치마크 상세 가이드
- [packages/backend-api/README.md](./packages/backend-api/README.md) - Backend API 문서
- [packages/backend-ai/README.md](./packages/backend-ai/README.md) - AI Service 문서
- [packages/frontend/README.md](./packages/frontend/README.md) - Frontend 문서

---

## 🎉 완료!

이제 Mapmate가 실행되고 있습니다! 

**접속 URL:**
- 프론트엔드: http://localhost:5173
- Backend API: http://localhost:3000
- AI Service: http://localhost:5000

질문이나 문제가 있으면 이슈를 등록하거나 문의해주세요!



