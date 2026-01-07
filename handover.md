# 프로젝트 인계 메모

## 프로젝트 개요와 최종 목표
- **최종 목표**: 프롬프트 기반으로 메트로이드배니아 스타일의 존/룸/락 구조를 자동 생성하고, 생성된 맵을 웹 UI에서 직관적으로 편집(룸 위치·크기 조정, 존 드로잉, 세부 타일 편집)하며, 편집 결과를 서버·DB에 안정적으로 저장하는 통합 워크플로 구축.
- **핵심 기능 범위**
  - 새 Metroidvania 파이프라인(프롬프트 분석 → 존 그래프 생성 → 그리드 배치 → 룸 타입/락 배정 → MapDraft 구조화)
  - 프론트엔드 `DraftGraphView` 상의 인터랙션(룸 드래그/리사이즈, 존 드로잉)과 자동 저장
  - `TileEditor`를 통한 존 내부 타일 맵 생성/편집(구현 예정)
  - FastAPI(`backend-ai`) 및 Express(`backend-api`) 기반 API, Prisma를 사용하는 PostgreSQL 영속화

## 완료된 핵심 작업
- **백엔드 AI (`packages/backend-ai/main.py`)**
  - 프롬프트 분석(`analyze_prompt`): 구조·룸 크기 성향·존 테마·락/능력 힌트·룸 타입 타깃 비율 파싱.
  - 존 그래프 생성 및 깊이 계산(`generate_zone_graph`, `compute_zone_depths`), 룸 배치(`distribute_rooms`, `grow_zone`, `fill_missing_rooms`): 그리드 기반, 오버랩 없이 배치.
  - 룸 타입 배정(`assign_room_types`): 깊이·크기·존 정보로 `boss/save/shop/puzzle/secret/challenge/treasure/normal` 결정.
  - 룸 타입 비율 조정(`parse_room_type_targets`, `calculate_room_type_counts`): 퍼센트 키워드 확장, 순서/우선순위 조정으로 사용자 목표 비율을 우선 반영.
  - 락 배정(`assign_zone_locks`): 존 경계/깊이/난이도 기반으로 `key/ability/event/boss/item` 락 부여.
  - 레거시 제너레이터는 fallback 용도로 유지.
  - 테스트(`test_main.py`): API·핵심 로직 28개 테스트, 커버리지 80% 이상.

- **백엔드 API (`packages/backend-api`)**
  - `MapDraftSchema`에 `.passthrough()` 적용으로 `width/height/zoneColor` 등 확장 필드 유지.
  - 존 타일 저장소(`ZoneTile`) 구축 및 `/projects/:id/zones/:zoneId/tiles` API로 프론트 연동.
  - `PUT /projects/:id/draft`에 `updatedAt` 기반 낙관적 잠금 적용, 버전 충돌 시 409 반환 및 로그 남김.

- **프론트엔드 (`packages/frontend`)**
  - 타입 정의 갱신(`src/types/draft.ts`): `width/height/zone/zoneColor/zone_color` 옵션 추가.
  - `DraftGraphView` 개편: 멀티 선택·박스 드래그, Undo/Redo 스택, 단축키, 스냅 가이드.
  - `TileEditor` 완성: 백엔드 REST 연동, 다중 레이어·엔티티 편집, 로컬 히스토리·Undo/Redo, 로딩/저장 상태 UI.
  - `ProjectDetail` 자동 저장: 버전 토큰 전송, 지수 백오프 재시도, 충돌 배너/재시도 & 새로고침 동작.
- **QA & 커버리지**
  - Vitest 기반 단위 테스트 추가(`DraftGraphView`, `TileEditor` 등) 및 커버리지 설정(`pnpm --filter frontend test:coverage`).
  - Jest 통합 테스트 확장(`generate-draft` 낙관적 잠금, `/healthz` 스모크).
  - Express 앱 팩터링(`createApp`)으로 슈퍼테스트 재사용 및 health 체크 보장.

- **유틸리티**
  - `tmp_prompt_probe.py`: 대표 프롬프트 세트를 돌려 타깃 비율과 실제 결과 비교, 룸 타입 분배 디버깅용.

## 문제와 해결 방안
1. **룸 크기 균일 문제**: 새 파이프라인이 실패해 레거시 제너레이터로 fallback → 새 파이프라인 안정화 및 룸 타입 로직 개선으로 해결.
2. **룸 타입 비율 불일치**: 퍼센트 키워드 매칭/감산 순서 문제 → 키워드 확장, 후행 키워드 페널티, 목표 타입 보호로 해결.
3. **존 드로잉 오작동/오해**: 최소 크기·스냅 미흡, 기능 설명 부족 → 스냅/최소 크기 보정, 사용자 안내.
4. **확장 필드 손실**: Zod 기본 동작으로 필드 삭제 → `.passthrough()` 적용으로 해결.
5. **FastAPI 로딩 실패**: `_legacy_generate_map_draft` 들여쓰기 오류 → 들여쓰기 수정.
6. **lock 타입 충돌**: `lock`이 null 허용되지 않아 경고 → `string | null` 수용.

## 현재 진행 상황
- 생성 파이프라인: 40~60룸 규모에서 안정적, `tmp_prompt_probe.py` 기준 목표 비율과 ±0.5룸 수준.
- 편집 기능: DraftGraphView/TileEditor 전 기능(멀티 선택, Undo/Redo, 타일 저장) 동작. 존 새로고침 시 버전 충돌 배너 노출.
- 데이터 저장: `PUT /projects/:id/draft`가 `updatedAt` 기반 낙관적 잠금을 사용, 409 처리 및 사용자 재시도 UI 제공.
- 테스트/커버리지: 백엔드 AI 82% 유지 + API 스모크/버전 충돌 테스트 추가. 프론트는 Vitest + Testing Library, 커버리지 실행 스크립트 제공. Playwright E2E는 스캐폴딩 예정.

## 남은 주요 과제
1. **실사용 프롬프트 검증**: 실제 사용자 프롬프트 샘플 확보 및 주기적 통계 리포트 자동화.
2. **특수 룸 배치 고도화**: 보스/세이브/보물 위치 검증 로직 추가, 시각화 도구 보강.
3. **E2E & 관측 고도화**: Playwright 기반 브라우저 시나리오, 백엔드 헬스 메트릭 수집·대시보드 연동.
4. **운영 문서 정비**: TRD/PRD 최신화, QA 체크리스트·온보딩 가이드 확장.

## 추가 제안 및 관점
- 난이도별 기본 룸 타입 비율 재검토: 프롬프트 비지정 시 default 비율이 적절한지 점검.
- 락/능력 배정 밸런스 검증: `assign_zone_locks` 결과가 실제 플레이 경로를 막지 않는지 시뮬레이션.
- 존 구조 시각화 도구: QA용으로 존/락 그래프를 SVG 등으로 출력하는 보조 툴 추천.
- 대규모 맵 성능: 100룸 이상에서 `fill_missing_rooms` 반복 횟수 제한 및 최적화 검토.
- 다국어 프롬프트 지원 대비: 키워드 사전을 외부화하여 확장 용이성 확보.
- 규칙 엔진화 가능성: 룸 타입/락 배분 규칙을 JSON/DSL로 외부화해 추후 게임 룰 변경 대응 용이.

## 인수인계 팁
- **셋업**: 루트에서 `start-mapmate-cmd.bat` 실행 또는 각 패키지 별 `pnpm dev`, `uvicorn main:app --reload`.
- **검증 루틴 예시**
  1. `packages/backend-ai`: `venv\Scripts\python tmp_prompt_probe.py --rooms 40 --samples 3`
  2. `packages/backend-api`: `pnpm --filter backend-api test:coverage` (jest 커버리지 + health 스모크)
  3. `packages/frontend`: `pnpm --filter frontend test:coverage` (Vitest + JSDOM)
  4. 변경점은 README/TRD/이슈 갱신 후 PR
- **주요 파일**
  - 백엔드 AI: `packages/backend-ai/main.py`, `test_main.py`, `tmp_prompt_probe.py`
  - 백엔드 API: `packages/backend-api/src/routes/projects.ts`, `src/schemas/mapDraft.ts`
  - 프론트: `packages/frontend/src/ui/DraftGraphView.tsx`, `src/pages/ProjectDetail.tsx`, `src/types/draft.ts`
  - DB 관련: `packages/backend-api/prisma/*`



