# AI 맵 생성 및 파싱 명세서 (AI Map Generation Specification)

**문서 버전:** 1.0  
**대상:** AI 모델 (Metroidvania 스타일 맵 생성 및 분석용)  
**참고 자료:** 할로우 나이트 맵 (Hollow Knight Map.png)

---

## 1. 개요 (Introduction)

본 문서는 할로우 나이트(Hollow Knight) 스타일의 메트로배니아(Metroidvania) 월드 맵을 AI가 이해하고, 절차적으로 생성하거나 분석할 수 있도록 **기술적 사양(Technical Specification)**을 정의한다. 시각적 요소를 데이터 구조로 변환하고, 탐험 경험을 논리적 그래프로 모델링하는 데 중점을 둔다.

---

## 2. 구조적 정의 (Structural Definition)

맵의 물리적 형태를 정의하는 기본 단위 및 좌표계 시스템이다.

### 2.1 격자 시스템 (Grid System)
모든 맵 데이터는 2차원 격자(Grid) 위에 배치된다.
*   **Unit Tile (1x1):** 플레이어가 서 있을 수 있는 최소 공간 단위. (약 16x16 픽셀 등)
*   **Room Chunk (Screen):** 카메라가 고정되거나 스크롤되는 기본 방의 단위. (예: 16x9 Unit Tiles)
*   **World Coordinate (X, Y):** `(0, 0)`을 기준으로 한 전체 월드 좌표.

### 2.2 방의 형태학 (Room Morphology)
방(`Room`)은 하나 이상의 `Room Chunk`가 결합된 형태다.
*   **Rectangular:** 기본 사각형 (1x1, 2x1, 1x2 등).
*   **L-Shape / T-Shape:** 복합적인 형태로 결합된 방.
*   **Vertical Shaft:** 높이가 너비보다 훨씬 큰 수직 통로 (예: 1x4).
*   **Corridor:** 너비가 높이보다 훨씬 큰 수평 통로 (예: 4x1).

**데이터 모델 예시 (JSON):**
```json
{
  "roomId": "room_001",
  "type": "L_SHAPE",
  "gridPositions": [
    {"x": 10, "y": 5}, {"x": 10, "y": 6}, {"x": 11, "y": 6}
  ],
  "dimensions": {"width": 2, "height": 2}
}
```

---

## 3. 논리적 정의 (Logical Definition)

맵을 탐험 가능한 그래프(Graph)로 추상화하여 정의한다.

### 3.1 메트로배니아 그래프 (Metroidvania Graph)
*   **Node (노드):** 개별 `Room`.
*   **Edge (엣지):** 두 방을 연결하는 통로 (`Transition Gate`).
*   **Direction (방향):** 양방향(Bidirectional)이 기본이나, 절벽 등으로 인한 단방향(Unidirectional) 통행 가능.

### 3.2 게이트 및 잠금 (Gates & Locks)
각 `Edge`는 통과하기 위한 조건(`Condition`)을 가질 수 있다.
*   **None:** 조건 없음. 자유롭게 이동 가능.
*   **Ability Gate:** 특정 능력 필요 (예: `DoubleJump`, `Dash`, `WallClimb`).
*   **Item Lock:** 특정 아이템 필요 (예: `SimpleKey`, `CityCrest`).
*   **Event Lock:** 특정 보스 처치 또는 스위치 작동 후 해제.

### 3.3 순환 종속성 (Circular Dependency) & 백트래킹 (Backtracking)
AI 생성 시 가장 중요한 로직이다.
1.  **Key Placement:** 잠긴 문(Lock)을 여는 열쇠(Key/Ability)는 반드시 **잠긴 문보다 접근 가능한 이전 경로**에 배치되어야 한다. (단, 해당 경로가 너무 가깝지 않도록 루프를 형성).
2.  **Loop Structure:** `A -> B -> C -> A'` 형태의 경로를 생성하여, 능력을 얻은 후 기존 지역(A)의 새로운 구역(A')으로 돌아오는 구조를 의무화한다.

---

## 4. 시각적 및 테마 정의 (Visual & Thematic Definition)

이미지 분석(Parsing) 시 색상 및 스타일을 기반으로 구역(Zone)을 식별한다.

### 4.1 바이옴 매핑 (Biome Mapping)
이미지의 색상 코드를 기반으로 구역을 구분한다.

| Zone Name | Primary Color (Hex) | Structural Characteristic |
|---|---|---|
| **Forgotten Crossroads** | `#A0A0A0` (Grey/Blue) | 중앙 허브, 수직/수평 밸런스, 초반 지역 |
| **Greenpath** | `#408040` (Green) | 덩굴, 산성 물(Hazard), 수평으로 긴 방 많음 |
| **City of Tears** | `#303080` (Dark Blue) | 엘리베이터(긴 수직 방), 개방된 넓은 공간 |
| **Deepnest** | `#303030` (Dark Grey) | 좁고 복잡한 미로, 수직 하강 구조, 시야 제한 |
| **Crystal Peak** | `#FF80FF` (Pink/Purple) | 수정 가시(Hazard), 수직 상승 구조, 컨베이어 벨트 |
| **Kingdom's Edge** | `#A0A080` (Yellow/Brown) | 거대한 수직 절벽, 독립된 아레나 |

### 4.2 시각적 기호 (Visual Symbols)
*   **굵은 테두리:** 구역(Zone) 간의 경계.
*   **얇은 선:** 방(Room) 간의 연결 통로.
*   **점선/반투명:** 숨겨진 길(Hidden Path) 또는 조건부 해금 구역.

---

## 5. 오브젝트 및 POI 정의 (Object & POI Definition)

주요 관심 지점(Point of Interest)의 배치 규칙이다.

### 5.1 필수 오브젝트 (Essential Objects)
*   **Bench (Save Point):** 
    *   규칙: 보스 방 전 3~5 방 이내에 반드시 1개 존재.
    *   규칙: 각 구역(Zone)의 입구 근처 또는 중앙 교차점에 배치.
*   **Stag Station (Fast Travel):** 
    *   규칙: 구역 당 1개 (대형 구역은 2개). 
    *   규칙: 다른 구역과 연결되기 쉬운 가장자리에 위치.
*   **Map Maker (Cornifer):** 
    *   규칙: 플레이어가 해당 구역에 진입한 초기 경로 상에 위치 (종이 조각 힌트).

### 5.2 주요 아이템 (Major Items)
*   **Abilities (Dash, Claw, Wings):** 
    *   규칙: 해당 구역의 보스를 처치하거나, 복잡한 플랫폼 챌린지 끝에 배치.
    *   규칙: 획득 즉시 해당 능력을 사용해야만 나갈 수 있는 '튜토리얼 룸' 구조 형성.

---

## 6. 절차적 생성 가이드 (Procedural Generation Heuristics)

AI가 맵을 생성할 때 따르는 알고리즘적 단계다.

### Step 1: 골격 형성 (Skeleton Generation)
1.  `Start Node`(마을) 생성.
2.  `Main Hub`(Crossroads) 연결.
3.  3~4개의 분기(`Branch`)를 생성하여 주요 구역(Biomes)의 위치를 잡음.

### Step 2: 핵심 경로 및 잠금 배치 (Critical Path & Gating)
1.  최종 목표(End Game) 위치 설정.
2.  목표 도달에 필요한 필수 능력(Key Abilities) 목록 정의.
3.  각 능력을 획득할 수 있는 던전을 골격 끝부분에 배치.
4.  던전 입구에 해당 능력이 있어야만 통과 가능한 장애물(Gate) 설치 (역순 설계).

### Step 3: 방 채우기 및 연결 (Room Filling & Connection)
1.  설정된 경로 사이에 구역 테마에 맞는 방들을 무작위/템플릿 기반으로 채워 넣음.
2.  **Dead-end Curation:** 연결되지 않고 남은 막다른 길에는 반드시 보상(Money, Upgrade Item)을 배치.

### Step 4: 숏컷 연결 (Shortcut Connection)
1.  서로 인접하지만 연결되지 않은 두 방을 찾음.
2.  후반부 능력(예: 벽 부수기, 슈퍼 대시)으로만 열 수 있는 숏컷을 생성하여 백트래킹의 편의성 제공.

---

## 7. 부록: 데이터 구조 예시 (Appendix: Data Structures)

### 7.1 맵 데이터 (Map JSON)
```json
{
  "zones": [
    {
      "id": "greenpath",
      "name": "Greenpath",
      "theme": "OVERGROWN",
      "rooms": [ ... ],
      "connections": [
        {"from": "room_01", "to": "room_02", "direction": "RIGHT", "condition": "NONE"},
        {"from": "room_05", "to": "fog_canyon_01", "direction": "DOWN", "condition": "ACID_SWIM"}
      ]
    }
  ]
}
```












