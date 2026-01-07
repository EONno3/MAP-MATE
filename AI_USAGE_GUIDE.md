# 🤖 Mapmate AI 기능 완전 가이드

## 📋 목차
1. [AI 서비스 개요](#ai-서비스-개요)
2. [AI 서비스 실행 방법](#ai-서비스-실행-방법)
3. [3가지 AI 기능](#3가지-ai-기능)
4. [프런트엔드에서 사용하기](#프런트엔드에서-사용하기)
5. [테스트 방법](#테스트-방법)
6. [LLM 제공자 설정](#llm-제공자-설정)
7. [문제 해결](#문제-해결)

---

## 🎯 AI 서비스 개요

Mapmate는 **2단계 AI 생성** 시스템을 사용합니다:

```
┌─────────────────────────────────────────────────────────┐
│  1단계: 맵 초안 생성 (Draft Generation)                   │
│  - 전체 던전 구조 생성 (방 배치, 연결, 존 구성)             │
│  - AI Service (Python) 담당                              │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  2단계: 존 상세화 (Zone Refinement)                      │
│  - 개별 방의 타일맵 생성 (벽, 바닥, 장애물)                │
│  - AI Service (Python) 담당                              │
└─────────────────────────────────────────────────────────┘
```

### 아키텍처

```
Frontend (React)           Backend API (Express)        AI Service (Python/FastAPI)
   Port: 5173        →        Port: 3000         →           Port: 8000
                                                   
[사용자 입력]         →    [요청 처리 + DB]      →      [AI 맵 생성 + LLM 호출]
[맵 시각화]          ←    [응답 저장]           ←      [JSON 응답]
```

---

## 🚀 AI 서비스 실행 방법

### Step 1: 가상환경 확인

```powershell
# 프로젝트 루트에서
cd packages\backend-ai

# 가상환경 활성화
.\venv\Scripts\Activate.ps1

# Python 버전 확인 (3.11+ 필요)
python --version
```

### Step 2: 의존성 설치 (처음 한 번만)

```powershell
pip install -r requirements.txt
```

**주요 패키지:**
- `fastapi` - 웹 프레임워크
- `uvicorn` - ASGI 서버
- `pydantic` - 데이터 검증
- `openai` - OpenAI API 클라이언트
- `anthropic` - Anthropic Claude API 클라이언트

### Step 3: 서버 실행

```powershell
# 개발 모드 (자동 재시작)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 프로덕션 모드 (멀티 워커)
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Step 4: 헬스체크

```powershell
# 다른 터미널에서
curl http://localhost:8000/healthz
# 응답: {"status":"ok","service":"backend-ai"}
```

---

## 🎮 3가지 AI 기능

### 1️⃣ 기본 맵 초안 생성 (`/generate-draft`)

**특징:**
- 알고리즘 기반 (LLM 미사용)
- 빠른 생성 속도 (< 1초)
- 프롬프트는 존 이름에만 반영
- 무료

**요청 예시:**
```json
POST http://localhost:8000/generate-draft
{
  "size": 10,
  "prompt": "A dark medieval dungeon",
  "difficulty": "medium"
}
```

**응답:**
```json
{
  "rooms": [
    {
      "id": 0,
      "type": "save",
      "position": { "x": 0, "y": 2 },
      "width": 2,
      "height": 3,
      "zone": "Sacred Temple",
      "zone_color": "#fbbf24"
    },
    ...
  ],
  "edges": [
    {
      "from": 0,
      "to": 1,
      "lock": "ability"
    },
    ...
  ]
}
```

**생성 규칙:**
- Entry (1개) → Normal (n개) → Boss (1개) 구조
- 존(Zone) 자동 분류 (3-5개 존)
- 게이팅 로직 (열쇠/능력 잠금)
- Metroidvania 스타일 비선형 레이아웃

### 2️⃣ LLM 기반 맵 초안 생성 (`/generate-draft-ai`)

**특징:**
- GPT-4, Claude, Gemini 사용
- 프롬프트 완전 반영
- 창의적인 레이아웃
- 느린 속도 (5-30초)
- API 키 필요

**요청 예시:**
```json
POST http://localhost:8000/generate-draft-ai
{
  "size": 15,
  "prompt": "A mysterious underwater temple with ancient ruins and sea creatures. The player must find three keys hidden in different zones to unlock the final chamber.",
  "difficulty": "hard",
  "provider": "openai",
  "api_key": "sk-..."
}
```

**지원 제공자:**
- `"openai"`: GPT-4o, GPT-4, GPT-3.5-turbo
- `"anthropic"`: Claude-3.5-sonnet, Claude-3-opus
- `"google"`: Gemini-1.5-pro, Gemini-1.5-flash

### 3️⃣ 존 상세화 (`/refine-zone`)

**특징:**
- 개별 방의 타일맵 생성
- 프롬프트 기반 스타일링
- 인접 방 출입구 자동 배치

**요청 예시:**
```json
POST http://localhost:8000/refine-zone
{
  "width": 20,
  "height": 15,
  "prompt": "A dark treasure room with traps",
  "roomId": "room-123",
  "connections": [
    { "side": "left", "offset": 7 }
  ]
}
```

**응답:**
```json
{
  "width": 20,
  "height": 15,
  "layers": {
    "floor": [...],
    "walls": [...],
    "obstacles": [...]
  },
  "entities": [
    { "type": "chest", "x": 10, "y": 7 },
    { "type": "trap", "x": 5, "y": 3 }
  ]
}
```

---

## 💻 프런트엔드에서 사용하기

### 1. 프로젝트 생성

```typescript
// packages/frontend/src/pages/Home.tsx
const handleCreateProject = async (name: string) => {
  const response = await apiPost('/projects', { name });
  const projectId = response.id;
  navigate(`/projects/${projectId}`);
};
```

### 2. 맵 초안 생성 (기본 모드)

```typescript
// packages/frontend/src/pages/ProjectDetail.tsx
const handleGenerateDraft = async () => {
  try {
    const response = await apiPost(
      `/projects/${projectId}/generate-draft`,
      {
        size: 10,
        prompt: "A dark medieval dungeon",
        difficulty: "medium",
        // useAI: false (기본값)
      }
    );
    
    // response.rooms, response.edges 사용
    setDraft(response);
  } catch (error) {
    console.error('Draft generation failed:', error);
  }
};
```

### 3. 맵 초안 생성 (LLM 모드)

```typescript
const handleGenerateDraftWithAI = async () => {
  const apiKey = prompt('OpenAI API Key를 입력하세요:');
  
  try {
    const response = await apiPost(
      `/projects/${projectId}/generate-draft`,
      {
        size: 15,
        prompt: "An ancient underwater temple with mysterious artifacts",
        difficulty: "hard",
        useAI: true,                    // ⭐ AI 모드 활성화
        aiProvider: "openai",           // "openai" | "anthropic" | "google"
        aiApiKey: apiKey
      }
    );
    
    setDraft(response);
  } catch (error) {
    console.error('AI generation failed:', error);
  }
};
```

### 4. 존 상세화 (타일 생성)

```typescript
const handleRefineZone = async (zoneId: string) => {
  try {
    const response = await apiPost(
      `/projects/${projectId}/zones/${zoneId}/refine`,
      {
        prompt: "A dark treasure room with spike traps"
      }
    );
    
    // response.layers, response.entities 사용
    setZoneTiles(zoneId, response);
  } catch (error) {
    console.error('Zone refinement failed:', error);
  }
};
```

---

## 🧪 테스트 방법

### 방법 1: PowerShell로 직접 테스트

```powershell
# 기본 맵 생성
$body = @{ 
  size = 8
  prompt = "A mystical forest temple"
  difficulty = "easy"
}

$response = Invoke-RestMethod `
  -Uri "http://localhost:8000/generate-draft" `
  -Method POST `
  -Body ($body | ConvertTo-Json) `
  -ContentType "application/json"

# 결과 확인
$response | ConvertTo-Json -Depth 10
```

### 방법 2: 프런트엔드에서 테스트

1. **서버 3개 모두 실행:**
   ```powershell
   # Terminal 1: AI Service
   cd packages\backend-ai
   .\venv\Scripts\Activate.ps1
   uvicorn main:app --reload --port 8000
   
   # Terminal 2: Backend API
   cd packages\backend-api
   npm start
   
   # Terminal 3: Frontend
   cd packages\frontend
   npm run dev
   ```

2. **브라우저에서 테스트:**
   - `http://localhost:5173` 접속
   - "New Project" 클릭
   - "Generate Draft" 클릭
   - 프롬프트 입력: "A dark underground cavern"
   - 크기 선택: 10
   - Generate 클릭

3. **백엔드 로그 확인:**
   ```
   ✅ Calling AI service to generate draft (Simple)
   ✅ AI service response received
   ✅ Draft saved: 8 rooms, 3 zones
   ```

### 방법 3: 통합 테스트 실행

```powershell
cd packages\backend-api
npm test -- zone-tile-generation
```

---

## 🔑 LLM 제공자 설정

### OpenAI

1. **API 키 발급**: https://platform.openai.com/api-keys
2. **사용 예시:**
   ```json
   {
     "provider": "openai",
     "api_key": "sk-proj-...",
     "size": 10,
     "prompt": "A futuristic space station"
   }
   ```
3. **모델**: GPT-4o (기본), GPT-4, GPT-3.5-turbo
4. **비용**: ~$0.01-0.05 per request

### Anthropic Claude

1. **API 키 발급**: https://console.anthropic.com/
2. **사용 예시:**
   ```json
   {
     "provider": "anthropic",
     "api_key": "sk-ant-...",
     "size": 10,
     "prompt": "A haunted mansion"
   }
   ```
3. **모델**: Claude-3.5-sonnet (기본), Claude-3-opus
4. **비용**: ~$0.015-0.075 per request

### Google Gemini

1. **API 키 발급**: https://makersuite.google.com/app/apikey
2. **사용 예시:**
   ```json
   {
     "provider": "google",
     "api_key": "AIza...",
     "size": 10,
     "prompt": "A desert pyramid"
   }
   ```
3. **모델**: Gemini-1.5-pro (기본), Gemini-1.5-flash
4. **비용**: Free tier available

---

## 🐛 문제 해결

### 문제 1: AI 서비스가 응답하지 않음

**증상:**
```
Failed to communicate with AI service
Using fallback draft generation
```

**해결책:**
```powershell
# 1. AI 서비스 실행 중인지 확인
curl http://localhost:8000/healthz

# 2. 포트 충돌 확인
netstat -ano | findstr :8000

# 3. 로그 확인
cd packages\backend-ai
# 터미널에 에러 로그 확인
```

### 문제 2: LLM API 호출 실패

**증상:**
```
OpenAI API error: Invalid API key
```

**해결책:**
1. API 키 유효성 확인
2. 계정 크레딧 확인
3. Rate limit 확인
4. 네트워크 연결 확인

### 문제 3: 타임아웃 에러

**증상:**
```
Circuit breaker timeout
```

**해결책:**
```typescript
// packages/backend-api/src/routes/projects.ts
// 타임아웃 증가
const breaker = new CircuitBreaker(async () => {
  // ...
}, { 
  timeout: 60000, // 30초 → 60초
  // ...
});
```

### 문제 4: 폴백 모드만 작동

**원인:**
- AI 서비스가 실행되지 않음
- `AI_SERVICE_URL` 환경변수 미설정

**해결책:**
```powershell
# .env 파일 확인
cd packages\backend-api
type .env | findstr AI_SERVICE_URL
# 출력: AI_SERVICE_URL=http://localhost:8000

# AI 서비스 실행 상태 확인
curl http://localhost:8000/healthz
```

---

## 📊 성능 벤치마크

| 작업 | AI Service | Backend API | 총 시간 |
|------|-----------|-------------|--------|
| 기본 맵 생성 (10개 방) | ~50ms | ~200ms | ~250ms |
| LLM 맵 생성 (GPT-4o) | ~5-10초 | ~200ms | ~5-10초 |
| LLM 맵 생성 (Claude) | ~3-7초 | ~200ms | ~3-7초 |
| LLM 맵 생성 (Gemini) | ~2-5초 | ~200ms | ~2-5초 |
| 존 상세화 (20x15) | ~100ms | ~300ms | ~400ms |

---

## 🎓 추가 학습 자료

- **알고리즘 상세**: `packages/backend-ai/README.md`
- **API 문서**: `packages/backend-api/README.md`
- **Unity 연동**: `packages/backend-api/UNITY_INTEGRATION_GUIDE.md`
- **성능 최적화**: `packages/frontend/PERFORMANCE_OPTIMIZATION_GUIDE.md`

---

## 📝 요약

1. **AI 서비스는 필수가 아닙니다** - 폴백 모드로 작동 가능
2. **기본 모드는 무료이고 빠릅니다** - 알고리즘 기반
3. **LLM 모드는 창의적이지만 느립니다** - API 키 필요
4. **프런트엔드에서 투명하게 사용 가능** - `useAI` 플래그만 변경

**추천 워크플로우:**
1. 개발 중: 폴백/기본 모드 사용
2. 데모/테스트: 기본 모드 사용
3. 실제 사용자: LLM 모드 옵션 제공

이제 AI 기능을 마음껏 활용하세요! 🚀


