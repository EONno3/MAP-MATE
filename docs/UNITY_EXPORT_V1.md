# Mapmate → Unity 자동 맵 생성 Export 포맷 (v1)

## 목표
Mapmate에서 Export한 파일을 Unity에 넣으면, **추론 없이** 다음이 자동으로 가능해야 합니다.

- **전체 월드 타일맵 생성**: 각 방의 상세 타일맵을 월드 좌표에 맞춰 합성
- **연결 관계 반영**: 문/포탈/트리거(전환) 오브젝트 자동 생성
- **잠금/조건 반영**: `condition`(dash 등)을 Door/Trigger에 설정

> v1의 핵심은 “Unity가 문 위치(doorway)를 추론하지 않는다” 입니다.  
> 따라서 `connections[]`에 `doorwayA/B` 또는 `portalA/B`가 **반드시 포함**됩니다.

---

## 파일 확장자/이름(권장)
- `*.mapmate.unity.json` (권장)

---

## 좌표계(매우 중요)
### 1) Room Grid(방 배치 격자)
- `roomGrid.x/y/w/h`는 “방 단위 그리드”입니다.
- 이 값은 **Mapmate 편집기의 배치 결과**를 그대로 담습니다.

### 2) Unity World Tile(타일맵 월드 타일 좌표)
- Unity 생성은 `worldTileOrigin`(월드 타일 좌표)을 **기준으로만** 진행합니다.
- 즉, Unity Importer는 `roomGrid`의 y축 방향을 추측하지 않아도 됩니다.

**규칙**
- `worldTileOrigin.x = roomGrid.x * tilesPerChunkX`
- `worldTileOrigin.y = roomGrid.y * tilesPerChunkY`

> 만약 Mapmate 내부 y축이 “아래로 증가”이고 Unity는 “위로 증가”를 쓰고 싶다면,  
> 그 변환은 Export 시점에 수행해서 `worldTileOrigin`에 반영해야 합니다.

---

## 팔레트(필수)
Unity는 문자열 타일 타입(예: `"solid"`)만으로 어떤 Tile을 배치할지 알 수 없습니다.
따라서 Import 전에 매핑이 필요합니다.

- `tilePalette`: Export 파일 내 “타일 ID ↔ 타일 키” 정의
- Unity 프로젝트 내 `MapmateTilePalette.asset`: “tileKey/tileId → TileBase” 매핑

같은 방식으로 오브젝트도:
- `objectPalette`: Export 파일 내 “오브젝트 키” 정의
- Unity 프로젝트 내 `MapmatePrefabPalette.asset`: “prefabKey → Prefab” 매핑

---

## tiles 인코딩(권장)
작은 맵은 `raw2d`(2D 배열)로도 가능하지만, 큰 맵은 용량이 커집니다.

- `raw2d`: 2D 배열(행=Y, 열=X)의 `tileId`
- `rle1d`: row-major(왼→오, 위→아래) 1D 런렝스 인코딩 `[{ id, run }]`

---

## connections(필수: doorway/portal 명시)
`connections[]`는 다음 중 하나를 반드시 선택합니다.

- **door**: 두 방이 실제로 인접하고, 문을 “타일 좌표”로 만들 수 있는 경우  
  - `doorwayA/B` 필요
- **portal**: 두 방이 비인접이거나, 문 대신 순간 이동/전환 트리거로 처리할 경우  
  - `portalA/B` 필요

`condition`은 Unity 쪽에서 Door/Portal에 붙는 스크립트 파라미터로 전달됩니다.

---

## 검증(Export 시점에 반드시 수행)
Unity에서 실패/오작동하기 쉬운 케이스는 Export에서 차단합니다.

- roomId가 없는 connection 금지
- `detail` 누락 금지(없으면 자동 생성)
- `door`인데 인접하지 않으면:
  - 권장: 자동으로 `portal`로 강등 + 경고
  - 또는 Export 실패
- `doorway/portal` 좌표가 방의 월드 타일 범위 밖이면 Export 실패

---

## 샘플
- `docs/samples/unity-export-v1/small.mapmate.unity.v1.json`
- `docs/samples/unity-export-v1/medium.mapmate.unity.v1.json`
- `docs/samples/unity-export-v1/large.mapmate.unity.v1.json`

---

## (다음 단계) Unity Importer 구현 가이드(요약)
1. JSON 로드 → `schemaVersion` 확인
2. Tile/Prefab palette asset 로드
3. `rooms[]` 순회:
   - `worldTileOrigin` 기준으로 `detail.tiles`를 Tilemap에 합성
4. `connections[]` 순회:
   - `door`면 doorway 좌표에 Door prefab 생성
   - `portal`이면 portal 좌표에 Trigger prefab 생성

