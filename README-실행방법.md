# 🚀 Mapmate 간편 실행 가이드

## 원클릭 실행!

### 처음 사용하시는 경우

**1단계: 초기 설정 (최초 1회만)**
```
install-dependencies.bat 더블클릭
```
- Node.js, Python, Docker 확인
- 필요한 모든 의존성 자동 설치
- 환경 변수 파일 자동 생성

**2단계: 실행**
```
start-mapmate.bat 더블클릭
```
- 모든 서비스 자동 시작
- 브라우저 자동 실행
- 완료!

### 이미 사용 중이신 경우

**실행:**
```
start-mapmate.bat 더블클릭
```

**종료:**
```
stop-mapmate.bat 더블클릭
```

**상태 확인:**
```
check-status.bat 더블클릭
```

---

## 📁 실행 스크립트 설명

| 파일 | 용도 |
|------|------|
| **install-dependencies.bat** | 🔧 최초 1회 실행 - 모든 의존성 설치 |
| **start-mapmate.bat** | ▶️ Mapmate 실행 - 모든 서비스 시작 |
| **stop-mapmate.bat** | ⏹️ Mapmate 종료 - 모든 서비스 정지 |
| **check-status.bat** | 📊 상태 확인 - 서비스 실행 여부 확인 |

---

## 🎯 접속 URL

서비스 시작 후:

- **프론트엔드**: http://localhost:5173
- **Backend API**: http://localhost:3000/healthz
- **AI Service**: http://localhost:8000/healthz

---

## ⚡ 빠른 시작 순서

```
1. install-dependencies.bat 실행 (처음만)
   ↓
2. start-mapmate.bat 실행
   ↓
3. 브라우저 자동 실행됨
   ↓
4. JWT 토큰 입력 (테스트용 토큰 생성 방법 아래 참조)
   ↓
5. 프로젝트 생성 및 맵 생성 시작!
```

---

## 🔑 JWT 토큰 생성

### **개발/테스트용 토큰 생성 (권장)**

**방법 1: 기본 테스트 토큰** ⭐ 가장 간편
```
generate-test-token.bat 더블클릭
```
- 고정된 테스트 사용자 ID (`test-user-123`)
- 즉시 사용 가능

**방법 2: 커스텀 사용자 ID 토큰**
```
generate-custom-token.bat 더블클릭
```
- 원하는 사용자 ID 입력 가능
- 여러 사용자 테스트 시 유용

**방법 3: PowerShell에서 수동 생성**
```powershell
cd packages\backend-api
node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({ id: 'your-user-id' }, 'mapmate-secret-key-change-in-production', { expiresIn: '24h' }));"
```

### **프로덕션용 Google OAuth (선택)**

```
setup-google-oauth.bat 더블클릭
```
- Google Cloud Console 설정 가이드 확인
- 실제 Google 계정으로 로그인
- `.env` 파일에 OAuth 설정 추가 필요

생성된 토큰을 복사하여 프론트엔드 입력칸에 붙여넣기

---

## ❗ 문제 해결

### Docker Desktop이 자동으로 시작되지 않는 경우
1. 수동으로 Docker Desktop 실행
2. Docker가 완전히 시작될 때까지 대기 (1-2분)
3. `start-mapmate.bat` 다시 실행

### 포트 충돌 (이미 사용 중)
1. `stop-mapmate.bat` 실행
2. 충돌하는 프로세스 종료 대기
3. `start-mapmate.bat` 다시 실행

### 서비스가 시작되지 않는 경우
1. `check-status.bat`로 상태 확인
2. 각 터미널 창의 오류 메시지 확인
3. `stop-mapmate.bat`로 전체 종료 후 재시작

### Python 가상환경 오류
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
PowerShell 관리자 권한으로 실행 후 위 명령어 입력

---

## 📚 더 자세한 정보

- [GETTING_STARTED.md](./GETTING_STARTED.md) - 상세 실행 가이드
- [README.md](./README.md) - 프로젝트 전체 문서
- [PERFORMANCE.md](./PERFORMANCE.md) - 성능 벤치마크

---

## 🎉 완료!

이제 `start-mapmate.bat`만 더블클릭하면 Mapmate가 실행됩니다!

즐거운 맵 제작 되세요! 🗺️✨

