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
3. JSON(TextAsset) 또는 JSON 파일 경로, `MapmateTilePalette` / `MapmatePrefabPalette` / `MapmateImportSettings` 에셋을 지정 후 Import

## 매핑(필수)
Unity는 타일/오브젝트를 실제 에셋으로 매핑해야 합니다.
- `MapmateTilePalette`: tileId(정수) → TileBase
- `MapmatePrefabPalette`: prefabKey(문자열) → Prefab

