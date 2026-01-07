# 성능 벤치마크 가이드

## 목표

- **AI 서비스**: size=300 기준 **30초 이내** 맵 생성
- **엔드투엔드**: size=300 기준 **30초 이내** 전체 플로우 완료

## 벤치마크 스크립트

### 1. AI 서비스 단독 측정

```bash
cd packages/backend-ai
python benchmark.py
```

**측정 항목:**
- 다양한 크기(10, 50, 100, 200, 300, 500)에서 성능
- 연결성 검증 (모든 노드가 연결되어 있는지)
- 게이팅 로직 검증 (key room과 locked edge)
- 각 크기별 5회 반복 측정

**출력 예시:**
```
📊 Size: 300 (반복: 5회)
  Run 1: 2.345s - Rooms: 300, Edges: 374 ✅ PASS
  Run 2: 2.401s - Rooms: 300, Edges: 375 ✅ PASS
  ...
  
  📈 통계:
     최소:  2.234s
     평균:  2.367s
     중간:  2.345s
     최대:  2.512s
     표준편차: 0.098s
     평균 Rooms: 300.0
     평균 Edges: 374.2
     성공률: 100.0%
  
  ✅ 목표 달성: size=300 평균 2.367s (< 30s)
```

### 2. 엔드투엔드 측정 (Backend API → AI Service)

```bash
cd packages/backend-api

# JWT 토큰 필요 (Google OAuth 또는 테스트 토큰)
# 먼저 로그인하여 토큰 획득
export JWT_TOKEN="<your-jwt-token>"

# 또는 Windows PowerShell
$env:JWT_TOKEN="<your-jwt-token>"

# TypeScript 벤치마크 실행
npx ts-node benchmark.ts e2e
```

**측정 항목:**
- Backend API 요청 처리
- AI 서비스 호출 (Circuit Breaker 포함)
- 데이터베이스 저장
- 전체 플로우 end-to-end

**출력 예시:**
```
엔드투엔드 벤치마크 (Backend API → AI Service)
✅ 프로젝트 생성됨: abc-123-def

📊 Size: 300 (반복: 3회)
  Run 1: 2.567s - Rooms: 300, Edges: 374 ✅ PASS
  Run 2: 2.612s - Rooms: 300, Edges: 375 ✅ PASS
  ...
  
  ✅ 목표 달성: size=300 평균 2.589s (< 30s)
```

### 3. 전체 벤치마크

```bash
# AI 서비스 + 엔드투엔드 모두 실행
cd packages/backend-api
JWT_TOKEN="<your-token>" npx ts-node benchmark.ts all
```

## 벤치마크 모드

### AI 서비스만
```bash
npx ts-node benchmark.ts ai
```

### 엔드투엔드만
```bash
JWT_TOKEN="<token>" npx ts-node benchmark.ts e2e
```

### 전체
```bash
JWT_TOKEN="<token>" npx ts-node benchmark.ts all
```

## 성능 최적화 팁

### 1. AI 서비스 최적화

**현재 알고리즘:**
- Nearest neighbor MST로 연결성 확보
- 거리 기반 휴리스틱으로 extra edge 추가
- O(n²) 복잡도

**개선 방안:**
- Kruskal's MST 또는 Prim's 알고리즘 사용
- 공간 분할 자료구조 (Quadtree) 활용
- 병렬 처리 (multiprocessing)

### 2. Backend API 최적화

**현재 설정:**
- Circuit Breaker timeout: 28초
- AI 요청 timeout: 25초
- 1회 자동 재시도

**개선 방안:**
- 타임아웃 조정
- 캐싱 레이어 추가 (Redis)
- 비동기 작업 큐 (Bull, BullMQ)

### 3. 데이터베이스 최적화

**개선 방안:**
- 인덱스 추가 (userId, createdAt)
- Connection pooling 튜닝
- JSONB 필드 최적화

## 예상 성능 (참고)

| Size | 예상 시간 | 목표 |
|------|----------|------|
| 10   | < 0.1s   | ✅    |
| 50   | < 0.5s   | ✅    |
| 100  | < 1.0s   | ✅    |
| 200  | < 2.0s   | ✅    |
| 300  | < 3.0s   | ✅    |
| 500  | < 5.0s   | ✅    |

**참고:** 실제 성능은 하드웨어 및 부하 상황에 따라 다를 수 있습니다.

## 성능 모니터링

### 개발 환경

로그에서 `durationMs` 확인:
```json
{
  "level": "info",
  "message": "Map draft generated successfully",
  "requestId": "...",
  "size": 300,
  "durationMs": 2345,
  "roomCount": 300,
  "edgeCount": 374
}
```

### 프로덕션 환경

로그 집계 도구 (ELK Stack, Datadog 등)로 모니터링:
- P50, P95, P99 latency
- 에러율
- Circuit Breaker 상태

## 트러블슈팅

### 성능이 느린 경우

1. **AI 서비스 CPU 사용률 확인**
   ```bash
   top -p $(pgrep -f uvicorn)
   ```

2. **메모리 사용량 확인**
   ```bash
   free -h
   ```

3. **네트워크 지연 확인**
   ```bash
   curl -w "\nTime: %{time_total}s\n" http://localhost:5000/healthz
   ```

### 타임아웃 발생 시

1. **Circuit Breaker 타임아웃 증가**
   - `packages/backend-api/src/routes/projects.ts`
   - `timeout: 28000` → `timeout: 60000`

2. **AI 서비스 타임아웃 증가**
   - `timeout: 25000` → `timeout: 55000`

## 성능 테스트 체크리스트

- [ ] AI 서비스 단독 벤치마크 실행
- [ ] size=300 기준 30초 이내 달성 확인
- [ ] 연결성 검증 통과 확인
- [ ] 게이팅 로직 정상 동작 확인
- [ ] 엔드투엔드 벤치마크 실행
- [ ] Circuit Breaker 정상 동작 확인
- [ ] 성능 결과 문서화
- [ ] (선택) 성능 개선 작업

## 결과 보고 템플릿

```markdown
## 성능 벤치마크 결과

**테스트 일시:** 2025-09-30
**환경:** Windows 11, Node.js 18, Python 3.11

### AI 서비스 단독

| Size | 평균 시간 | 목표 달성 |
|------|----------|----------|
| 10   | 0.123s   | ✅        |
| 50   | 0.456s   | ✅        |
| 100  | 0.987s   | ✅        |
| 200  | 1.234s   | ✅        |
| 300  | 2.345s   | ✅        |
| 500  | 4.567s   | ✅        |

**목표 달성:** ✅ size=300 평균 2.345s (< 30s)

### 엔드투엔드

| Size | 평균 시간 | 목표 달성 |
|------|----------|----------|
| 10   | 0.234s   | ✅        |
| 50   | 0.567s   | ✅        |
| 100  | 1.123s   | ✅        |
| 200  | 1.456s   | ✅        |
| 300  | 2.678s   | ✅        |

**목표 달성:** ✅ size=300 평균 2.678s (< 30s)

### 결론

모든 성능 목표를 달성했습니다. 추가 최적화 불필요.
```



