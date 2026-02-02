# AI Map Generation Master Plan (Spec-Aligned)

## 1. Data Schema Design (`core_schema.py`)
Align internal data structures with `AI_MAP_GENERATION_SPEC.md`.

- **`RoomNode` (Logical)**: Represents a node in the gameplay graph.
    - `id`: Unique ID.
    - `type`: `START`, `HUB`, `NORMAL`, `BOSS`, `ITEM`.
    - `zone`: Zone ID (e.g., `crossroads`).
    - `edges`: List of connections to other nodes with `conditions` (Locks).

- **`RoomPhysical` (Physical)**: Represents the actual spatial data.
    - `id`: Link to `RoomNode`.
    - `morphology`: `RECT`, `L_SHAPE`, `T_SHAPE`, `SHAFT`.
    - `bounds`: Bounding box (x, y, w, h).
    - `cells`: List of occupied grid coordinates (for non-rect shapes).

## 2. Logical Skeleton Generator (`logic_gen.py`)
Implements **Section 6. Procedural Generation Heuristics**.

1.  **Skeleton Graph**:
    - Create `Start Node` -> `Main Hub`.
    - Branch out to 3-4 `Zone Roots`.
2.  **Critical Path & Backtracking**:
    - Place `End Goal` at deep depth.
    - Assign `Key Abilities` (Dash, WallJump) to leaf nodes.
    - Add `Locks` on edges that require those abilities (Reverse Design).
    - Ensure `Loops`: Create edges that connect deep nodes back to earlier hubs (Shortcuts).

## 3. Physical Layout Generator (`layout_gen.py`)
Implements **Section 2. Structural Definition** & **Section 4. Visual Definition**.

1.  **Grid Initialization**: Large empty grid.
2.  **Zone Placement**: Assign broad regions on the grid for each logical Zone to prevent interleaving.
3.  **Room Growth (Morphology)**:
    - Iterate through the Logical Graph.
    - For each Node, generate a `RoomPhysical`.
    - **Shape Selection**: Based on Spec 4.1 (e.g., Greenpath = Horizontal L-shapes, Deepnest = Narrow Shafts).
    - **Placement**: Bin-packing algorithm that respects the graph connections (Child room must touch Parent room).

## 4. Integration (`core_gen.py` update)
- Pipeline: `Logic Gen` -> `Layout Gen` -> `Output`.
- This ensures the map isn't just random blocks, but a playable level design.

## Execution Order
1.  Define `schemas.py` (Data types).
2.  Implement `LogicGenerator`.
3.  Implement `LayoutGenerator`.
4.  Connect to `main.py` and Frontend.












