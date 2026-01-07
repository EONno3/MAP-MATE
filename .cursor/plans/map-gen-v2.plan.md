# Map Generation Algorithm Reform: "Organic Compact Clusters"

## 1. Fundamental Shift in Philosophy
- **Old Way (Failed):** "Place a rectangle, then place another rectangle next to it." -> Result: Stringy, artificial chains.
- **New Way (Target):** "Grow a cluster of cells to form a room, then pack rooms tightly to form a zone." -> Result: Dense, complex, organic map.

## 2. Analysis of Target Style (Hollow Knight)
Based on the user-provided reference images:
1.  **Composite Rooms:** A single logical "Room" is rarely a perfect rectangle. It is often a composite of 2-5 overlapping rectangles (L-shapes, long corridors with distinct sections, vertical shafts with alcoves).
2.  **Zero-Gap Connectivity:** Rooms share long borders. There are very few "hallways" that are just empty space. The map is a solid block.
3.  **Zone Cohesion:** A Zone (e.g., Greenpath) is a massive, solid chunk of map, not a loose string of rooms.

## 3. New Algorithm Steps

### Phase 1: The "Metamap" (Zone Layout)
Instead of placing individual rooms immediately, we first define the **Zone Shapes**.
1.  Divide the world grid into huge sections (Voronoi or BSP).
2.  Assign each section to a Zone (Hub, Greenpath, Mines, etc.).
3.  This ensures Zones feel like "regions," not just colored boxes.

### Phase 2: Composite Room Generation (The "Tetromino" Approach)
We stop using single `x,y,w,h` for a room.
*   **Concept:** A `Room` consists of multiple `Rects`.
*   **Generation Logic:**
    *   Start with a seed rect (e.g., 4x3).
    *   "Grow" the room by attaching secondary rects to it (e.g., add a 2x5 shaft to the side).
    *   This naturally creates L-shapes, T-shapes, and irregular interiors.
    *   **Rule:** "Corridors" are just long chains of these rects fused together.

### Phase 3: Compact Placement (The "Magnet" Heuristic)
When placing a new room (Child) connected to an existing room (Parent):
1.  Do not just pick a random open side.
2.  **Score candidates:**
    *   Score +1 for touching Parent.
    *   Score +2 for touching *other* existing rooms (Neighbors).
    *   Score +5 for filling a "Hole" (surrounded on 3 sides).
3.  Select the position with the highest score.
4.  **Result:** The map naturally collapses inward, becoming dense and solid.

## 4. Data Structure Changes (`core_schema.py`)

```python
class RoomPhysical:
    id: int
    # Instead of one rect, a room is a list of rects
    rects: List[Tuple[x, y, w, h]] 
    # The bounding box is calculated from the union of rects
    bounds: Tuple[x, y, w, h] 
```

## 5. Execution Plan
1.  **Prototype `CompositeGen`:** Create a script that just generates *one* complex room shape (not the whole map yet) to verify the "shape" looks right.
2.  **Prototype `CompactPlacer`:** Create a script that packs these shapes tightly.
3.  **Visual Verification:** Show the user the *shape* of the rooms before connecting the backend.








