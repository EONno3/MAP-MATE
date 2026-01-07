"""
Map Exporter - Converts generated maps to JSON format
Based on AI_MAP_GENERATION_SPEC.md Section 7.1
"""
import json
from typing import Dict
from core_schema import RoomNode, RoomPhysical, ZoneInfo, MapData, ZoneData, ConnectionData

class MapExporter:
    """Exports generated maps to JSON format (Spec Section 7.1)"""
    
    def __init__(self, nodes: Dict[int, RoomNode], physical_rooms: Dict[int, RoomPhysical], zones: Dict[int, ZoneInfo]):
        self.nodes = nodes
        self.physical_rooms = physical_rooms
        self.zones = zones
    
    def export_to_json(self, filepath: str = None) -> str:
        """
        Export map to JSON format matching Spec Section 7.1
        
        Returns JSON string, optionally writes to file
        """
        map_data = self._build_map_data()
        json_str = json.dumps(map_data.model_dump(by_alias=True), indent=2, ensure_ascii=False)
        
        if filepath:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(json_str)
        
        return json_str
    
    def _build_map_data(self) -> MapData:
        """Build MapData structure from nodes and physical rooms"""
        zone_data_list = []
        
        # Group rooms by zone
        for zone_id, zone_info in self.zones.items():
            zone_rooms = [n for n in self.nodes.values() if n.zone_id == zone_id]
            
            if not zone_rooms:
                continue
            
            # Build room data
            rooms = []
            for node in zone_rooms:
                phys = self.physical_rooms.get(node.id)
                if phys:
                    room_dict = {
                        "id": f"room_{node.id:03d}",
                        "type": node.type.value,
                        "x": phys.x,
                        "y": phys.y,
                        "width": phys.width,
                        "height": phys.height,
                        "morphology": phys.morphology.value,
                        "rects": phys.rects,
                        "depth": node.depth
                    }
                    if node.name:
                        room_dict["name"] = node.name
                    rooms.append(room_dict)
            
            # Build connections
            connections = []
            processed_edges = set()
            
            for node in zone_rooms:
                for edge in node.edges:
                    # Avoid duplicates (bidirectional edges)
                    edge_key = tuple(sorted([node.id, edge.target_id]))
                    if edge_key in processed_edges:
                        continue
                    processed_edges.add(edge_key)
                    
                    # Determine direction
                    target = self.nodes[edge.target_id]
                    direction = self._infer_direction(node, target)
                    
                    conn = ConnectionData(
                        from_id=f"room_{node.id:03d}",
                        to_id=f"room_{edge.target_id:03d}",
                        direction=direction,
                        condition=edge.condition.value
                    )
                    connections.append(conn)
            
            zone_data = ZoneData(
                id=f"zone_{zone_id}",
                name=zone_info.name,
                theme=zone_info.theme,
                rooms=rooms,
                connections=connections
            )
            zone_data_list.append(zone_data)
        
        return MapData(zones=zone_data_list)
    
    def _infer_direction(self, from_node: RoomNode, to_node: RoomNode) -> str:
        """Infer connection direction based on physical positions"""
        from_phys = self.physical_rooms.get(from_node.id)
        to_phys = self.physical_rooms.get(to_node.id)
        
        if not from_phys or not to_phys:
            return "UNKNOWN"
        
        dx = to_phys.x - from_phys.x
        dy = to_phys.y - from_phys.y
        
        # Determine primary direction
        if abs(dx) > abs(dy):
            return "RIGHT" if dx > 0 else "LEFT"
        else:
            return "DOWN" if dy > 0 else "UP"
    
    def export_summary(self) -> Dict:
        """Export a summary of the map for quick inspection"""
        summary = {
            "total_rooms": len(self.nodes),
            "total_zones": len(self.zones),
            "room_types": {},
            "zone_distribution": {},
            "abilities_placed": [],
            "pois": {
                "benches": 0,
                "stag_stations": 0,
                "map_makers": 0,
                "bosses": 0
            }
        }
        
        # Count room types
        for node in self.nodes.values():
            room_type = node.type.value
            summary["room_types"][room_type] = summary["room_types"].get(room_type, 0) + 1
            
            # Count POIs
            if node.type.value == "save":
                summary["pois"]["benches"] += 1
            elif node.type.value == "stag":
                summary["pois"]["stag_stations"] += 1
            elif node.type.value == "map":
                summary["pois"]["map_makers"] += 1
            elif node.type.value == "boss":
                summary["pois"]["bosses"] += 1
        
        # Zone distribution
        for node in self.nodes.values():
            zone_id = node.zone_id
            summary["zone_distribution"][f"zone_{zone_id}"] = \
                summary["zone_distribution"].get(f"zone_{zone_id}", 0) + 1
        
        return summary





