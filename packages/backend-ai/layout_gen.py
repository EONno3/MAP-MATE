import random
from typing import Dict, List, Tuple, Set, Optional
from core_schema import RoomNode, RoomPhysical, Morphology, RoomType

# Keep Templates for better shapes (User liked chunky rooms, disliked random noise)
TEMPLATES = {
    "HUB_MAIN": (6, 5),
    "ARENA_BOSS": (8, 6),
    "CORRIDOR_H": (6, 3), # Chunky corridor
    "CORRIDOR_LONG": (8, 3),
    "SHAFT_V": (3, 6), # Chunky shaft
    "SHAFT_LONG": (3, 8),
    "ROOM_STD": (4, 4),
    "ROOM_L": (4, 4),
}

class LayoutGenerator:
    def __init__(self, nodes: Dict[int, RoomNode]):
        self.nodes = nodes
        self.physical_rooms: Dict[int, RoomPhysical] = {}
        self.placed_ids: set = set()
        self.grid_occupancy: Dict[Tuple[int, int], int] = {} 
        
        # Remove rigid Zone Bounds that caused islands
        # Use "Growth Direction" instead

    def generate_layout(self, seed: int = None) -> Dict[int, RoomPhysical]:
        if seed:
            random.seed(seed)
            
        # 1. Place Start Room (Center)
        start_id = next((nid for nid, node in self.nodes.items() if node.type == RoomType.START), None)
        if not start_id:
            return {}

        # Start Room
        self._place_room_at(start_id, 100, 100, [(0,0,6,4)]) # Solid starting block
        
        # 2. Breadth-First Growth (Ensures connectivity)
        queue = [start_id]
        
        # To prevent stringy maps, we can shuffle the queue or use a priority queue
        # But BFS is safest for connectivity
        
        while queue:
            current_id = queue.pop(0)
            current_phys = self.physical_rooms[current_id]
            current_node = self.nodes[current_id]
            
            # Get unplaced neighbors
            neighbors = [e.target_id for e in current_node.edges if e.target_id not in self.placed_ids]
            random.shuffle(neighbors) # Random order for organic look
            
            for nid in neighbors:
                child_node = self.nodes[nid]
                
                # 1. Generate Shape
                rects, w, h = self._get_template_shape(child_node)
                
                # 2. Find Valid Connection Point
                # MUST touch 'current_phys'
                best_pos = self._find_connection_point(current_phys, rects, w, h, child_node.zone_id)
                
                if best_pos:
                    bx, by = best_pos
                    self._place_room_at(nid, bx, by, rects)
                    queue.append(nid)
                else:
                    # Retry with simpler shape?
                    print(f"Failed to place room {nid} attached to {current_id}")

        return self.physical_rooms

    def _get_template_shape(self, node: RoomNode) -> Tuple[List[Tuple[int, int, int, int]], int, int]:
        # Select Template based on Node Type and Zone
        t_name = "ROOM_STD"
        
        if node.type == RoomType.HUB:
            t_name = "HUB_MAIN"
        elif node.type == RoomType.BOSS:
            t_name = "ARENA_BOSS"
        elif node.zone_id == 3: # Vertical Zone
            t_name = "SHAFT_LONG" if random.random() < 0.6 else "SHAFT_V"
        elif node.zone_id == 2: # Horizontal Zone
            t_name = "CORRIDOR_LONG" if random.random() < 0.6 else "CORRIDOR_H"
            
        base_w, base_h = TEMPLATES.get(t_name, (4, 4))
        
        # Base Shape
        rects = [(0, 0, base_w, base_h)]
        
        # Occasional "L" shape for variety (not too messy)
        if random.random() < 0.3 and node.type == RoomType.NORMAL:
            if base_w > base_h:
                 rects.append((random.randint(0, base_w-2), -2, 2, 2))
            else:
                 rects.append((-2, random.randint(0, base_h-2), 2, 2))
                 
        # Normalize
        min_x = min(r[0] for r in rects)
        min_y = min(r[1] for r in rects)
        max_x = max(r[0] + r[2] for r in rects)
        max_y = max(r[1] + r[3] for r in rects)
        
        normalized = []
        for r in rects:
            normalized.append((r[0] - min_x, r[1] - min_y, r[2], r[3]))
            
        return normalized, max_x - min_x, max_y - min_y

    def _find_connection_point(self, parent: RoomPhysical, rects: List[Tuple], w: int, h: int, zone_id: int) -> Optional[Tuple[int, int]]:
        candidates = []
        
        # Parent bounds (Approximation for speed)
        px, py, pw, ph = parent.x, parent.y, parent.width, parent.height
        
        # Try to place Child around Parent
        # Prioritize Zone Direction to keep zones somewhat organized, but ALLOW overlap if needed
        # Zone 1 (Hub): Center
        # Zone 2 (Left): dx < 0
        # Zone 3 (Right): dx > 0
        # Zone 4 (Bottom): dy > 0
        
        # Scan perimeter
        # Top
        for dx in range(-w + 1, pw): 
            candidates.append((px + dx, py - h))
        # Bottom
        for dx in range(-w + 1, pw):
            candidates.append((px + dx, py + ph))
        # Left
        for dy in range(-h + 1, ph):
            candidates.append((px - w, py + dy))
        # Right
        for dy in range(-h + 1, ph):
            candidates.append((px + pw, py + dy))
            
        # Heuristic Sort:
        # Prefer positions that match the Zone Direction
        
        def score_pos(pos):
            cx, cy = pos
            score = 0
            
            # Direction Score
            if zone_id == 2 and cx < px: score += 10 # Left
            if zone_id == 3 and cx > px: score += 10 # Right
            if zone_id == 4 and cy > py: score += 10 # Bottom
            
            # Compactness Score (Touching other rooms?)
            # Check corners
            if (cx-1, cy) in self.grid_occupancy: score += 2
            if (cx+w, cy) in self.grid_occupancy: score += 2
            if (cx, cy-1) in self.grid_occupancy: score += 2
            if (cx, cy+h) in self.grid_occupancy: score += 2
            
            return score

        candidates.sort(key=score_pos, reverse=True)
        
        for cx, cy in candidates:
            if not self._check_collision_composite(cx, cy, rects):
                return cx, cy
                
        return None

    def _place_room_at(self, nid: int, x: int, y: int, rects: List[Tuple]):
        node = self.nodes[nid]
        w = max(r[0] + r[2] for r in rects)
        h = max(r[1] + r[3] for r in rects)
        
        phys = RoomPhysical(
            id=nid,
            x=x,
            y=y,
            width=w,
            height=h,
            zone_id=node.zone_id,
            type=node.type,
            rects=rects,
            neighbors={e.target_id for e in node.edges},
            color=self._get_zone_color(node.zone_id)
        )
        self.physical_rooms[nid] = phys
        self.placed_ids.add(nid)
        
        for rx, ry, rw, rh in rects:
            for dy in range(rh):
                for dx in range(rw):
                    self.grid_occupancy[(x + rx + dx, y + ry + dy)] = nid

    def _check_collision_composite(self, x: int, y: int, rects: List[Tuple]) -> bool:
        for rx, ry, rw, rh in rects:
            for dy in range(rh):
                for dx in range(rw):
                    if (x + rx + dx, y + ry + dy) in self.grid_occupancy:
                        return True
        return False

    def _get_zone_color(self, zone_id: int) -> str:
        """Zone colors from AI_MAP_GENERATION_SPEC.md Section 4.1"""
        colors = {
            1: "#A0A0A0",  # Forgotten Crossroads (Grey)
            2: "#408040",  # Greenpath (Green)
            3: "#303080",  # City of Tears (Dark Blue)
            4: "#303030",  # Deepnest (Dark Grey)
            5: "#FF80FF",  # Crystal Peak (Pink/Purple)
            6: "#A0A080"   # Kingdom's Edge (Yellow/Brown)
        }
        return colors.get(zone_id, "#888888")
