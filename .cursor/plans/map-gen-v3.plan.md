# Map Generation Algorithm V3: Structure First, Details Later

## 1. Core Philosophy: "The Skeleton Before The Flesh"
Instead of growing rooms randomly like mold (V2), we will build the map like a building:
1.  **Zoning:** Allocate land for each area.
2.  **Structure:** Build the main hallways (Critical Path).
3.  **Filling:** Add extra rooms to make it dense.

## 2. Key Algorithm Steps

### Phase 1: Space Partitioning (Zone Assignment)
Fixes: "Mixed Zones" and "Messy Layout"
*   **Grid:** 200x200
*   **Technique:** BSP (Binary Space Partitioning) or Voronoi.
*   **Logic:**
    1.  Split the grid into 4 large regions.
    2.  Assign `Center` -> Hub.
    3.  Assign `Left/Right/Bottom` -> Other Zones.
    4.  **Result:** Zones are guaranteed to be separate. Greenpath will strictly be on the left, Crystal Peak on the right.

### Phase 2: The Spine (Critical Path)
Fixes: "Disconnected Paths" and "Unreachable Rooms"
*   **Logic:**
    1.  Identify the "Main Route" in the Logic Graph (e.g., Hub -> Greenpath Boss).
    2.  Place these rooms **explicitly** as a chain from the Zone Entrance to the Zone End.
    3.  **Pathfinding:** Use A* or a "Drunkard's Walk" constrained within the Zone's assigned territory to draw this path.
    4.  **Result:** A guaranteed playable path from Start to End.

### Phase 3: Room Templates (Meaningful Shapes)
Fixes: "Ugly/Nonsense Blocks"
*   **Logic:**
    *   Discard random rectangle merging.
    *   Use a **Pre-defined Dictionary of Shapes**:
        *   `CORRIDOR_H`: 6x2, 8x2
        *   `SHAFT_V`: 2x6, 3x8
        *   `ARENA`: 5x4, 6x5
        *   `L_TURN`: L-shape 4x4
    *   Select a shape based on the Room Node's requirements (e.g., A "Shaft" node gets a `SHAFT_V` shape).

### Phase 4: Gap Filling (Snapping)
Fixes: "Meaningless Dead Space"
*   **Logic:**
    *   After placing the Spine and major branches, scan for gaps.
    *   If a gap is small (1-2 cells), expand neighbor rooms to fill it.
    *   If a gap is medium, insert a "Secret Room" or "Connector".

## 3. Updated Execution Flow
1.  **`LogicGenerator` (Existing):** Creates the graph (Nodes & Edges).
2.  **`ZoneManager` (New):** Allocates bounds (x_min, x_max, y_min, y_max) for each Zone ID.
3.  **`SpinePlacer` (New):** Places the Critical Path rooms within those bounds.
4.  **`BranchPlacer` (New):** Attaches side rooms to the Spine.
5.  **`MapRenderer` (Frontend):** Draws the result.

## 4. Verification Criteria
*   **Visual:** Distinct, large colored regions (Zones).
*   **Flow:** Clear main roads vs. small side rooms.
*   **Playability:** No rooms overlapping in a way that blocks movement.








