# Mapmate Unity Importer (v1)

Mapmate의 **`mapmate.unity/v1` Export JSON** 파일을 Unity 씬에 **Tilemap으로 자동 생성**하는 Importer 패키지입니다.

## 무엇이 자동으로 되나?
- `rooms[].worldTileOrigin` 기준으로 `rooms[].detail.tiles`를 Tilemap에 합성 렌더링
- `connections[]`를 **문(Door)으로 단일화**하여 트리거 오브젝트 생성  
  - `doorwayA/B`가 있으면 사용
  - 없으면 `portalA/B`를 **문 좌표로 fallback** (추후 포탈 분리 가능)
- `condition`(dash 등)을 링크 컴포넌트(`MapmateDoorLink`, `MapmateLinkEndpoint`)에 저장(게임 로직은 프로젝트에서 구현)
- 각 Door 엔드포인트(`A`, `B`)에 다음이 자동 부착됨(기본값)
  - `BoxCollider2D`(trigger)
  - `MapmateDoorTrigger`(목적지 룸 계산 + Gizmo 디버그)

## 설치
### 방법 1) Local Package로 추가(권장)
Unity 프로젝트에서:
- `Window > Package Manager` → `+` → `Add package from disk...`
- 이 폴더의 `package.json` 선택

> 이 패키지는 JSON 파싱을 위해 `com.unity.nuget.newtonsoft-json`에 의존합니다.

### 방법 2) 소스 복사
Unity 프로젝트의 `Packages/` 또는 `Assets/` 아래로 이 폴더를 복사해도 됩니다.

## 사용 방법(에디터)
1. Mapmate에서 **Unity 내보내기** 버튼으로 `.mapmate.unity.json` 파일 생성
2. Unity에서 `Tools > Mapmate > Import Mapmate Unity JSON` 실행
3. JSON(TextAsset) 또는 JSON 파일을 지정한 뒤, `Import & Make Editable (Recommended)`를 눌러 임포트 + 편집 준비까지 한 번에 완료합니다.
   - 고급 설정이 필요하면 `Import to Scene (Advanced)`를 사용하고, 필요 시 팔레트/설정을 직접 지정합니다(비어 있어도 자동 생성됨).

## Unity에서 편집하기(권장 워크플로우)
임포트된 타일은 기본적으로 `Auto` 영역(예: `AutoRooms/.../AutoTilemap`)에 그려집니다.  
유니티에서 편집한 결과를 **재임포트에도 보존**하려면 `User` 영역(예: `UserRooms/.../UserTilemap`)을 사용하세요.

### 레이어 타일맵(권장)
`MapmateImportSettings.useLayeredTilemaps = true`(기본값)이면 방마다 타일을 역할별 타일맵으로 분리합니다:
- `AutoTilemap` (Ground/충돌)
- `AutoTilemap_OneWay` (원웨이 플랫폼)
- `AutoTilemap_Hazard` (가시/산성 등 트리거)
- `AutoTilemap_Deco` (장식/표시 전용)

베이크 후에는 `UserTilemap*` 쪽에서 각 레이어를 개별적으로 편집할 수 있습니다.

### Auto → User 베이크(복사)
가장 쉬운 방법은 Import 창의 `Import & Make Editable (Recommended)` 버튼을 사용하는 것입니다(자동으로 베이크/정리까지 수행).

임포트 결과를 편집의 시작점으로 삼고 싶다면, 씬에서 맵 루트(`MapmateMapRoot`)를 선택한 뒤:
- `Tools > Mapmate > Bake Auto -> User (Selected Root, Overwrite & Clear Auto)`  
  - Auto 타일을 User로 복사하고 Auto를 비웁니다(편집 시작용).
- `Tools > Mapmate > Bake Auto -> User (Selected Root, Merge & Clear Auto)`  
  - User에 비어있는 칸만 채우고 Auto를 비웁니다(기존 User 편집 유지).

### 재임포트 시 Auto 타일 그리기 끄기(선택)
베이크 후에는 `MapmateImportSettings.importTilesIntoAutoTilemaps = false`로 설정하면  
재임포트가 **타일을 다시 그리지 않고(중복 방지)** 오브젝트/연결만 갱신하도록 할 수 있습니다.

### Auto 편집 실수 방지(잠금)
Auto 타일맵은 실수 편집을 막기 위해 `NotEditable`로 잠글 수 있습니다:
- `Tools > Mapmate > Auto Area > Lock Auto Tilemaps (Selected Root)`
- `Tools > Mapmate > Auto Area > Unlock Auto Tilemaps (Selected Root)`

## 매핑(필수)
Unity는 타일/오브젝트를 실제 에셋으로 매핑해야 합니다.
- `MapmateTilePalette`: tileId(정수) → TileBase
- `MapmatePrefabPalette`: prefabKey(문자열) → Prefab

