# 🤖 AI 기능 사용 가이드

## ✅ 완성! 이제 사용자가 직접 API 키를 입력할 수 있습니다!

---

## 📋 빠른 시작 가이드

### 1️⃣ AI 서비스 실행

```powershell
# 터미널 1: AI Service (필수)
cd packages\backend-ai
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000

# 터미널 2: Backend API (필수)
cd packages\backend-api
npm start

# 터미널 3: Frontend (필수)
cd packages\frontend
npm run dev
```

### 2️⃣ 브라우저에서 테스트

1. **http://localhost:5173** 접속
2. **New Project** 클릭 → 프로젝트 생성
3. **Generate Draft** 버튼 클릭

---

## 🎨 **새로운 UI 기능!**

### **맵 초안 생성 모달**

"Generate Draft" 버튼을 클릭하면 **새로운 모달**이 나타납니다:

```
┌─────────────────────────────────────────────┐
│  맵 초안 생성                                │
│                                             │
│  던전의 테마와 분위기를 설명하세요           │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ A dark medieval dungeon...          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  🤖 AI 고급 설정 ▼                          │
│  ┌───────────────────────────────────────┐ │
│  │ ☑ AI 모드 활성화 (LLM 사용)           │ │
│  │                                        │ │
│  │ AI 제공자:                            │ │
│  │ [OpenAI] [Anthropic] [Google]        │ │
│  │                                        │ │
│  │ API 키:                               │ │
│  │ sk-proj-...                           │ │
│  │                                        │ │
│  │ 📌 API 키 발급: → OpenAI Platform    │ │
│  │ 💡 API 키는 브라우저에 안전하게 저장  │ │
│  └───────────────────────────────────────┘ │
│                                             │
│           [취소]  [확인 (Ctrl+Enter)]       │
└─────────────────────────────────────────────┘
```

---

## 🎯 **사용 시나리오**

### **시나리오 1: 기본 모드 (AI 서비스만 사용)**

1. "Generate Draft" 클릭
2. 프롬프트 입력: "A dark medieval dungeon"
3. **AI 고급 설정은 펼치지 않음**
4. "확인" 클릭

**결과:**
- AI 서비스의 알고리즘으로 맵 생성
- 빠른 속도 (< 1초)
- 무료
- 프롬프트는 존 이름에만 반영

---

### **시나리오 2: LLM 모드 (OpenAI GPT-4 사용)**

1. "Generate Draft" 클릭
2. 프롬프트 입력:
   ```
   A mysterious underwater temple with three distinct zones:
   1. Crystal Caverns (blue theme, water puzzles)
   2. Ancient Library (purple theme, knowledge trials)
   3. Dragon's Chamber (red theme, boss fight)
   ```
3. **"🤖 AI 고급 설정" 클릭하여 펼치기**
4. ☑ "AI 모드 활성화" 체크
5. "OpenAI (GPT-4)" 버튼 클릭
6. API 키 입력: `sk-proj-...`
7. "확인" 클릭

**결과:**
- GPT-4가 프롬프트를 완전히 해석
- 3개 존이 명확하게 구분됨
- 각 존마다 테마 색상 자동 지정
- 느린 속도 (5-10초)
- API 비용 발생 (~$0.02)

---

### **시나리오 3: Anthropic Claude 사용**

1. 같은 방식으로 모달 오픈
2. **"Anthropic (Claude)" 선택**
3. API 키 입력: `sk-ant-...`
4. 확인

**특징:**
- Claude는 더 창의적인 레이아웃 생성
- 비용: ~$0.015-0.075

---

### **시나리오 4: Google Gemini 사용 (무료 티어 가능)**

1. 같은 방식으로 모달 오픈
2. **"Google (Gemini)" 선택**
3. API 키 입력: `AIza...`
4. 확인

**특징:**
- Gemini는 무료 티어 제공!
- 빠른 속도 (2-5초)
- 품질도 우수

---

## 🔑 **API 키 발급 방법**

### **OpenAI**
1. https://platform.openai.com/api-keys 접속
2. "Create new secret key" 클릭
3. 키 복사 (sk-proj-...)
4. 모달에 붙여넣기

**비용:**
- GPT-4o: ~$0.01-0.05 per request
- GPT-3.5-turbo: ~$0.001-0.005 per request

### **Anthropic**
1. https://console.anthropic.com/ 접속
2. "API Keys" 메뉴
3. "Create Key" 클릭
4. 키 복사 (sk-ant-...)

**비용:**
- Claude-3.5-sonnet: ~$0.015 per request
- Claude-3-opus: ~$0.075 per request

### **Google Gemini**
1. https://makersuite.google.com/app/apikey 접속
2. "Create API Key" 클릭
3. 키 복사 (AIza...)

**비용:**
- **무료 티어 있음!** (월 60회 요청)
- Gemini-1.5-pro: 무료 → $0.01
- Gemini-1.5-flash: 무료 → $0.005

---

## 💾 **API 키 저장**

- API 키는 **브라우저 로컬스토리지**에 안전하게 저장됩니다
- 다음번에는 자동으로 불러옵니다
- 프로젝트별이 아닌 **브라우저별**로 저장됩니다
- 서버에는 전송되지 않습니다 (직접 AI 제공자에게만 전송)

**저장 위치:**
```
localStorage.setItem('ai_api_key', 'sk-...')
localStorage.setItem('ai_provider', 'openai')
```

---

## 🧪 **테스트 시나리오**

### **테스트 1: 기본 모드**

**목표:** AI 서비스만으로 맵 생성 확인

**단계:**
1. Generate Draft 클릭
2. "A dark dungeon" 입력
3. AI 설정 펼치지 않음
4. 확인 클릭

**예상 결과:**
- 1초 이내에 맵 생성
- 백엔드 로그: `Calling AI service to generate draft (Simple)`
- 폴백이 아닌 AI 서비스 응답

---

### **테스트 2: OpenAI 모드**

**목표:** GPT-4로 창의적인 맵 생성

**준비물:** OpenAI API 키 필요 (무료 크레딧 있으면 사용 가능)

**단계:**
1. Generate Draft 클릭
2. 프롬프트:
   ```
   A futuristic space station with:
   - Command Center (entry)
   - Research Labs (3 zones)
   - Engine Room (boss area)
   - Secret Hangar (hidden zone)
   ```
3. AI 고급 설정 펼치기
4. AI 모드 활성화 체크
5. OpenAI 선택
6. API 키 입력
7. 확인

**예상 결과:**
- 5-10초 후 맵 생성
- 명확한 5개 존 구분
- 테마별 색상 자동 지정
- 백엔드 로그: `Calling AI service to generate draft (AI-powered)`

---

### **테스트 3: API 키 재사용**

**목표:** API 키가 저장되는지 확인

**단계:**
1. 테스트 2 완료 후
2. 새 프로젝트 생성
3. Generate Draft 클릭
4. AI 고급 설정 펼치기

**예상 결과:**
- API 키가 이미 입력되어 있음 (******로 마스킹)
- 제공자도 자동 선택됨

---

## 📊 **성능 비교**

| 모드 | 속도 | 비용 | 창의성 | 프롬프트 반영 | 추천 사용처 |
|------|------|------|--------|--------------|------------|
| 기본 (AI Service) | ⚡ < 1초 | 무료 | ★☆☆ | 존 이름만 | 개발/테스트 |
| GPT-4o | 🐌 5-10초 | ~$0.02 | ★★★ | 완벽 | 프로덕션 |
| Claude-3.5 | 🚶 3-7초 | ~$0.02 | ★★★ | 완벽 | 프로덕션 |
| Gemini-1.5-pro | 🏃 2-5초 | 무료! | ★★☆ | 좋음 | 프로덕션 (무료) |

---

## 🎓 **개발자를 위한 정보**

### **코드 구조**

```typescript
// 1. PromptModal.tsx - AI 설정 UI
interface AISettings {
  useAI: boolean
  provider: 'openai' | 'anthropic' | 'google' | null
  apiKey: string
}

// 2. ProjectDetail.tsx - 모달 호출
const handleDraftGenModalConfirm = async (
  userPrompt: string,
  aiSettings?: AISettings
) => {
  await gen(
    projectId,
    size,
    userPrompt,
    difficulty,
    aiSettings?.useAI ?? false,
    aiSettings?.provider ?? null,
    aiSettings?.apiKey ?? ''
  )
}

// 3. useGenerateDraft.ts - API 호출
export function useGenerateDraft() {
  return async (
    projectId: string,
    size: number,
    prompt?: string,
    difficulty?: string,
    useAI?: boolean,
    aiProvider?: string | null,
    aiApiKey?: string
  ) => {
    return apiPost(`/projects/${projectId}/generate-draft`, {
      size,
      prompt,
      difficulty,
      useAI,        // ⭐ AI 모드 플래그
      aiProvider,   // ⭐ 제공자
      aiApiKey,     // ⭐ API 키
    })
  }
}

// 4. Backend - projects.ts
router.post('/:id/generate-draft', async (req, res) => {
  const { useAI, aiProvider, aiApiKey } = req.body
  
  const endpoint = useAI ? '/generate-draft-ai' : '/generate-draft'
  const payload = useAI
    ? { size, prompt, difficulty, provider: aiProvider, api_key: aiApiKey }
    : { size, prompt, difficulty }
  
  const response = await axios.post(`${AI_SERVICE_URL}${endpoint}`, payload)
  // ...
})

// 5. AI Service - main.py
@app.post("/generate-draft-ai")
def generate_draft_ai(req: AIGenReq):
  if req.provider == "openai":
    return call_openai_for_map(req.prompt, req.size, req.difficulty, req.api_key)
  elif req.provider == "anthropic":
    return call_anthropic_for_map(...)
  elif req.provider == "google":
    return call_google_for_map(...)
```

### **데이터 플로우**

```
사용자 입력
    ↓
[PromptModal]
    ↓
{ prompt, useAI, provider, apiKey }
    ↓
[ProjectDetail.handleDraftGenModalConfirm]
    ↓
[useGenerateDraft]
    ↓
POST /projects/:id/generate-draft
{
  size: 10,
  prompt: "...",
  useAI: true,
  aiProvider: "openai",
  aiApiKey: "sk-..."
}
    ↓
[Backend API]
    ↓
POST http://localhost:8000/generate-draft-ai
{
  size: 10,
  prompt: "...",
  provider: "openai",
  api_key: "sk-..."
}
    ↓
[AI Service - Python]
    ↓
POST https://api.openai.com/v1/chat/completions
{
  model: "gpt-4o",
  messages: [
    { role: "system", content: "You are a game level designer..." },
    { role: "user", content: "..." }
  ]
}
    ↓
GPT-4 응답
    ↓
맵 데이터 반환
```

---

## 🐛 **문제 해결**

### **문제 1: AI 고급 설정이 안 보여요**

**원인:** `showAISettings` prop이 `false`

**확인:**
```tsx
<PromptModal
  showAISettings={true}  // ⭐ 이것이 true인지 확인
  ...
/>
```

---

### **문제 2: API 키 입력해도 기본 모드로 동작해요**

**원인:** "AI 모드 활성화" 체크박스를 체크하지 않음

**해결책:**
1. AI 고급 설정 펼치기
2. **☑ "AI 모드 활성화 (LLM 사용)"** 체크
3. 제공자 선택
4. API 키 입력

---

### **문제 3: OpenAI API 에러**

**에러 메시지:**
```
OpenAI API error: Invalid API key
```

**확인 사항:**
1. API 키가 올바른지 확인 (`sk-proj-...` 형식)
2. OpenAI 계정에 크레딧이 있는지 확인
3. API 키가 활성화되어 있는지 확인

---

### **문제 4: API 키가 저장 안 돼요**

**원인:** 로컬스토리지 용량 초과 또는 브라우저 설정

**해결책:**
```javascript
// 개발자 도구 콘솔에서 확인
console.log(localStorage.getItem('ai_api_key'))
console.log(localStorage.getItem('ai_provider'))

// 수동 저장
localStorage.setItem('ai_api_key', 'sk-...')
localStorage.setItem('ai_provider', 'openai')
```

---

## 🎉 **완성!**

이제 사용자가:
- ✅ **기본 모드** (무료, 빠름)로 맵 생성 가능
- ✅ **LLM 모드** (OpenAI/Anthropic/Google)로 창의적인 맵 생성 가능
- ✅ **API 키를 직접 입력**하고 브라우저에 저장 가능
- ✅ **제공자별 도움말 링크**로 API 키 발급 가능
- ✅ **히스토리 기능**으로 이전 프롬프트 재사용 가능

---

## 📚 **추가 자료**

- **전체 가이드:** `AI_USAGE_GUIDE.md`
- **Unity 연동:** `packages/backend-api/UNITY_INTEGRATION_GUIDE.md`
- **성능 최적화:** `packages/frontend/PERFORMANCE_OPTIMIZATION_GUIDE.md`
- **인증 디버깅:** `packages/backend-api/DEBUG_AUTH.md`

---

**질문이나 문제가 있으면 언제든지 물어보세요!** 🚀


