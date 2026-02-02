print("DEBUG: Starting core_gen.py imports...", flush=True)
import random
import sys
import traceback
from typing import Dict, List, Optional

try:
    print("DEBUG: Importing logic_gen...", flush=True)
    from logic_gen import LogicGenerator
    print("DEBUG: Importing layout_gen...", flush=True)
    from layout_gen import LayoutGenerator
    print("DEBUG: Importing core_schema...", flush=True)
    from core_schema import RoomPhysical, ZoneInfo
    print("DEBUG: Importing map_exporter...", flush=True)
    from map_exporter import MapExporter
except ImportError as e:
    print(f"DEBUG: Import Error: {e}")
    sys.exit(1)

class MapGenerator:
    def __init__(self, width=200, height=200):
        self.width = width
        self.height = height
        self.rooms: Dict[int, RoomPhysical] = {} # Store physical rooms for compatibility
        self.logic_nodes = {}  # Store logical nodes
        # Zones based on AI_MAP_GENERATION_SPEC.md Section 4.1
        self.zones = {
            1: ZoneInfo(id=1, name="Forgotten Crossroads", theme="CENTRAL_HUB", primary_color="#A0A0A0"),
            2: ZoneInfo(id=2, name="Greenpath", theme="OVERGROWN", primary_color="#408040"),
            3: ZoneInfo(id=3, name="City of Tears", theme="URBAN", primary_color="#303080"),
            4: ZoneInfo(id=4, name="Deepnest", theme="DARK_LABYRINTH", primary_color="#303030"),
            5: ZoneInfo(id=5, name="Crystal Peak", theme="CRYSTALLINE", primary_color="#FF80FF"),
            6: ZoneInfo(id=6, name="Kingdom's Edge", theme="WASTELAND", primary_color="#A0A080")
        }

    def generate(self, seed: int = None, zone_count: int = 4, zone_size: str = "medium", gate_density: str = "medium"):
        if seed:
            random.seed(seed)
            
        try:
            print(f"Step 1: Generating Logic Skeleton (zone_count={zone_count}, zone_size={zone_size}, gate_density={gate_density})...", flush=True)
            # 1. Generate Logic Skeleton (The Brain)
            logic_gen = LogicGenerator(zone_count=zone_count)
            logic_nodes = logic_gen.generate_skeleton(seed)
            print(f"Generated Logic Graph: {len(logic_nodes)} nodes", flush=True)
            
            print("Step 2: Generating Physical Layout...", flush=True)
            # 2. Generate Physical Layout (The Body)
            layout_gen = LayoutGenerator(logic_nodes)
            physical_rooms = layout_gen.generate_layout(seed)
            print(f"Generated Layout: {len(physical_rooms)} rooms placed", flush=True)
            
            self.rooms = physical_rooms
            self.logic_nodes = logic_nodes
            
            # Filter zones to match zone_count
            self.zones = {k: v for k, v in self.zones.items() if k <= zone_count}
            print(f"Filtered zones to {len(self.zones)} zones", flush=True)
        except Exception as e:
            print(f"ERROR in MapGenerator: {e}", file=sys.stderr)
            traceback.print_exc()
    
    def export_json(self, filepath: str = "generated_map.json") -> str:
        """Export generated map to JSON format (Spec Section 7.1)"""
        if not self.rooms or not self.logic_nodes:
            raise ValueError("No map generated yet. Call generate() first.")
        
        exporter = MapExporter(self.logic_nodes, self.rooms, self.zones)
        return exporter.export_to_json(filepath)
    
    def get_summary(self) -> dict:
        """Get a summary of the generated map"""
        if not self.rooms or not self.logic_nodes:
            return {"error": "No map generated"}
        
        exporter = MapExporter(self.logic_nodes, self.rooms, self.zones)
        return exporter.export_summary()

    def print_ascii(self):
        # Simple visualizer
        if not self.rooms:
            print("No rooms generated.")
            return
            
        min_x = min(r.x for r in self.rooms.values())
        max_x = max(r.x + r.width for r in self.rooms.values())
        min_y = min(r.y for r in self.rooms.values())
        max_y = max(r.y + r.height for r in self.rooms.values())
        
        width = max_x - min_x
        height = max_y - min_y
        
        grid = [['.'] * width for _ in range(height)]
        
        colors = {"#A0A0A0": 'W', "#408040": 'G', "#FF80FF": 'M', "#303030": 'B', "#888888": '?'}
        
        for r in self.rooms.values():
            char = colors.get(r.color, '?')
            for rx, ry, rw, rh in r.rects:
                for dy in range(rh):
                    for dx in range(rw):
                        gy = r.y + ry + dy - min_y
                        gx = r.x + rx + dx - min_x
                        if 0 <= gy < height and 0 <= gx < width:
                            grid[gy][gx] = char
                        
        for row in grid:
            print("".join(row))

if __name__ == "__main__":
    print("Starting Map Generation Test...", flush=True)
    try:
        gen = MapGenerator()
        gen.generate(seed=42)
        gen.print_ascii()
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        traceback.print_exc()
