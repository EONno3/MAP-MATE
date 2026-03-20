# Mapmate AI Generator - Copyright (c) 2026 EONno3. All rights reserved.
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import json
import re
from core_gen import MapGenerator

app = FastAPI(title="Mapmate AI Generator", version="1.0.0")

# Optional OpenAI integration
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class GenerateParams(BaseModel):
    seed: Optional[int] = None
    zone_count: int = 4
    zone_size: str = "medium"  # small, medium, large
    gate_density: str = "medium"  # low, medium, high

class PromptRequest(BaseModel):
    prompt: str

class RoomDetailRequest(BaseModel):
    prompt: str
    room_type: str = "normal"
    width: int = 40
    height: int = 24
    theme: str = "default"

class ValidateRequest(BaseModel):
    rooms: List[Dict[str, Any]]
    connections: List[Dict[str, Any]]

# AI Helper functions
def parse_prompt_to_params(prompt: str) -> Dict[str, Any]:
    """Parse natural language prompt to generation parameters using keyword matching"""
    prompt_lower = prompt.lower()
    
    params = {
        "zone_count": 4,
        "zone_size": "medium",
        "gate_density": "medium",
        "seed": None,
        "theme_hints": []
    }
    
    # Size keywords
    if any(k in prompt_lower for k in ["거대", "massive", "huge", "large", "큰", "넓은", "광대"]):
        params["zone_size"] = "large"
        params["zone_count"] = 6
    elif any(k in prompt_lower for k in ["작은", "small", "compact", "tight", "좁은", "미니"]):
        params["zone_size"] = "small"
        params["zone_count"] = 3
    
    # Complexity keywords
    if any(k in prompt_lower for k in ["복잡", "complex", "maze", "미로", "intricate", "elaborate"]):
        params["gate_density"] = "high"
    elif any(k in prompt_lower for k in ["단순", "simple", "linear", "직선", "쉬운"]):
        params["gate_density"] = "low"
    
    # Theme keywords
    if any(k in prompt_lower for k in ["도시", "city", "urban", "건물", "building", "사이버펑크", "cyberpunk"]):
        params["theme_hints"].append("city")
    if any(k in prompt_lower for k in ["숲", "forest", "nature", "자연", "나무", "tree", "정글", "jungle"]):
        params["theme_hints"].append("forest")
    if any(k in prompt_lower for k in ["던전", "dungeon", "지하", "underground", "동굴", "cave"]):
        params["theme_hints"].append("dungeon")
    if any(k in prompt_lower for k in ["성", "castle", "궁전", "palace", "왕국", "kingdom"]):
        params["theme_hints"].append("castle")
    if any(k in prompt_lower for k in ["바다", "ocean", "sea", "수중", "underwater", "해저"]):
        params["theme_hints"].append("ocean")
    
    # Height/Layer keywords
    if any(k in prompt_lower for k in ["고층", "tall", "vertical", "높은", "층고", "multi-story", "skyscraper"]):
        params["zone_size"] = "large"
    
    return params

def generate_room_tiles_simple(width: int, height: int, room_type: str, prompt: str) -> Dict[str, Any]:
    """Generate room tiles using simple procedural generation based on prompt"""
    import random
    
    prompt_lower = prompt.lower()
    tiles = [["empty" for _ in range(width)] for _ in range(height)]
    objects = []
    
    # ========================================
    # 1. 테마 분석
    # ========================================
    theme = "default"
    if any(k in prompt_lower for k in ["도시", "city", "urban", "사이버펑크", "cyberpunk", "건물", "마을", "town"]):
        theme = "city"
    elif any(k in prompt_lower for k in ["숲", "forest", "자연", "나무", "정글", "jungle", "초원"]):
        theme = "forest"
    elif any(k in prompt_lower for k in ["동굴", "cave", "지하", "underground", "던전", "dungeon"]):
        theme = "dungeon"
    elif any(k in prompt_lower for k in ["성", "castle", "궁전", "palace", "왕궁"]):
        theme = "castle"
    elif any(k in prompt_lower for k in ["바다", "수중", "underwater", "해저", "물속"]):
        theme = "underwater"
    
    # ========================================
    # 2. 분위기 분석
    # ========================================
    is_desolate = any(k in prompt_lower for k in ["삭막", "황량", "desolate", "barren", "폐허", "ruins", "버려진", "abandoned"])
    is_dark = any(k in prompt_lower for k in ["어두운", "dark", "음침", "gloomy", "그림자", "shadow"])
    is_bright = any(k in prompt_lower for k in ["밝은", "bright", "화려한", "colorful", "빛나는"])
    is_dangerous = any(k in prompt_lower for k in ["위험", "danger", "치명", "deadly", "험난"])
    
    # ========================================
    # 3. 구조 분석
    # ========================================
    is_vertical = any(k in prompt_lower for k in ["수직", "vertical", "높은", "tall", "탑", "tower", "층", "floor", "고층"])
    is_horizontal = any(k in prompt_lower for k in ["수평", "horizontal", "넓은", "wide", "평평"])
    has_many_platforms = any(k in prompt_lower for k in ["플랫폼", "platform", "발판", "점프", "jump", "계단"])
    is_open = any(k in prompt_lower for k in ["개방", "open", "넓은", "spacious", "아레나", "arena"])
    
    # ========================================
    # 4. 기본 벽 생성
    # ========================================
    for x in range(width):
        tiles[0][x] = "solid"
        tiles[height-1][x] = "solid"
    for y in range(height):
        tiles[y][0] = "solid"
        tiles[y][width-1] = "solid"
    
    # ========================================
    # 5. 테마별 기본 구조 생성
    # ========================================
    if theme == "city":
        # 도시: 건물 형태의 블록들, 평평한 바닥
        # 바닥 생성
        floor_y = height - 2
        for x in range(1, width - 1):
            tiles[floor_y][x] = "solid"
        
        if is_vertical or "고층" in prompt_lower or "층고" in prompt_lower:
            # 고층 건물 스타일: 여러 층의 플랫폼
            num_floors = min(4, (height - 4) // 4)
            for floor in range(num_floors):
                floor_y = height - 3 - (floor * 4)
                # 각 층마다 플랫폼 (중간에 간격)
                for x in range(3, width // 2 - 1):
                    if floor_y > 1:
                        tiles[floor_y][x] = "platform"
                for x in range(width // 2 + 2, width - 3):
                    if floor_y > 1:
                        tiles[floor_y][x] = "platform"
        else:
            # 일반 도시: 건물 형태의 블록들
            num_buildings = random.randint(2, 4)
            for i in range(num_buildings):
                bx = random.randint(3, width - 8)
                bw = random.randint(4, 8)
                bh = random.randint(3, min(height // 2, 8))
                for by in range(height - 2 - bh, height - 2):
                    for bxx in range(bx, min(bx + bw, width - 2)):
                        if by > 0:
                            tiles[by][bxx] = "solid"
        
        # 가로등/NPC (삭막하면 적게, 아니면 많이)
        if "가로등" in prompt_lower or "street" in prompt_lower:
            num_lamps = 1 if is_desolate else random.randint(2, 4)
            for i in range(num_lamps):
                lx = random.randint(5, width - 5)
                objects.append({"id": f"lamp_npc_{i}", "type": "npc", "x": lx, "y": height - 3})
        
    elif theme == "forest":
        # 숲: 자연스러운 지형, 불규칙한 플랫폼
        # 불규칙한 바닥
        floor_level = height - 2
        for x in range(1, width - 1):
            variation = random.randint(-1, 1)
            for y in range(floor_level + variation, height - 1):
                if y > 0:
                    tiles[y][x] = "solid"
        
        # 나무 형태의 플랫폼 (가지처럼)
        num_trees = random.randint(2, 4)
        for i in range(num_trees):
            tx = random.randint(5, width - 5)
            # 줄기
            trunk_height = random.randint(3, height // 2)
            for ty in range(height - 2 - trunk_height, height - 2):
                if ty > 0 and tiles[ty][tx] == "empty":
                    tiles[ty][tx] = "solid"
            # 가지 (플랫폼)
            branch_y = height - 2 - trunk_height
            if branch_y > 1:
                branch_len = random.randint(3, 6)
                for bx in range(tx - branch_len // 2, tx + branch_len // 2):
                    if 0 < bx < width - 1:
                        tiles[branch_y][bx] = "platform"
        
    elif theme == "dungeon":
        # 던전/동굴: 불규칙한 벽, 좁은 통로
        # 바닥
        for x in range(1, width - 1):
            tiles[height-2][x] = "solid"
        
        # 천장에서 내려오는 종유석
        for x in range(3, width - 3, random.randint(3, 5)):
            stalactite_len = random.randint(2, height // 4)
            for y in range(1, min(1 + stalactite_len, height - 3)):
                tiles[y][x] = "solid"
        
        # 중간 플랫폼
        num_platforms = random.randint(3, 6)
        for i in range(num_platforms):
            py = random.randint(height // 3, 2 * height // 3)
            px_start = random.randint(2, width - 8)
            px_len = random.randint(3, 6)
            for x in range(px_start, min(px_start + px_len, width - 2)):
                tiles[py][x] = "platform"
        
        if is_dark:
            # 어두운 던전: 산성 웅덩이 추가
            acid_start = random.randint(width // 4, width // 2)
            acid_len = random.randint(3, 6)
            for x in range(acid_start, min(acid_start + acid_len, width - 2)):
                tiles[height-2][x] = "acid"
        
    elif theme == "castle":
        # 성: 정돈된 구조, 대칭적
        # 평평한 바닥
        for x in range(1, width - 1):
            tiles[height-2][x] = "solid"
        
        # 대칭적인 플랫폼
        center = width // 2
        for level in range(1, 4):
            platform_y = height - 2 - (level * 4)
            if platform_y > 2:
                # 좌우 대칭 플랫폼
                platform_half = width // 4 - level
                for x in range(center - platform_half, center + platform_half):
                    if 0 < x < width - 1:
                        tiles[platform_y][x] = "platform"
        
        # 기둥
        for x in [width // 4, 3 * width // 4]:
            for y in range(2, height - 2):
                tiles[y][x] = "solid"
        
    else:
        # 기본: 랜덤 플랫폼
        for x in range(1, width - 1):
            tiles[height-2][x] = "solid"
        
        num_platforms = random.randint(3, 6) if has_many_platforms else random.randint(2, 4)
        for i in range(num_platforms):
            py = random.randint(height // 4, 3 * height // 4)
            px_start = random.randint(2, width // 2)
            px_len = random.randint(4, width // 3)
            for x in range(px_start, min(px_start + px_len, width - 2)):
                tiles[py][x] = "platform"
    
    # ========================================
    # 6. 방 타입별 오브젝트 추가
    # ========================================
    if room_type == "boss" or "보스" in prompt_lower or "boss" in prompt_lower:
        objects.append({"id": "boss_spawn", "type": "enemy_spawn", "x": width // 2, "y": height - 3})
        objects.append({"id": "player_spawn", "type": "spawn_point", "x": 3, "y": height - 3})
        
    elif room_type == "shop" or "상점" in prompt_lower or "shop" in prompt_lower:
        objects.append({"id": "npc_1", "type": "npc", "x": width // 2, "y": height - 3})
        objects.append({"id": "chest_1", "type": "chest", "x": width // 3, "y": height - 3})
        objects.append({"id": "chest_2", "type": "chest", "x": 2 * width // 3, "y": height - 3})
        
    elif room_type == "save" or "세이브" in prompt_lower or "save" in prompt_lower:
        objects.append({"id": "save_1", "type": "save_point", "x": width // 2, "y": height - 3})
        
    else:
        # 일반 방: 적 배치 (위험하면 더 많이)
        num_enemies = random.randint(2, 4) if is_dangerous else random.randint(0, 2)
        for i in range(num_enemies):
            ex = random.randint(5, width - 5)
            ey = random.randint(3, height - 4)
            objects.append({"id": f"enemy_{i}", "type": "enemy_spawn", "x": ex, "y": ey})
    
    # ========================================
    # 7. 위험 요소 추가
    # ========================================
    if any(k in prompt_lower for k in ["가시", "spike", "위험", "danger", "함정", "trap"]) or is_dangerous:
        # 가시 추가
        spike_count = random.randint(3, 8) if is_dangerous else random.randint(2, 4)
        for i in range(spike_count):
            sx = random.randint(3, width - 3)
            if tiles[height-2][sx] == "solid" and tiles[height-3][sx] == "empty":
                tiles[height-3][sx] = "spike"
    
    if any(k in prompt_lower for k in ["산성", "acid", "독", "poison", "용암", "lava"]):
        # 산성 웅덩이
        acid_start = random.randint(width // 4, width // 2)
        acid_len = random.randint(4, 8)
        for x in range(acid_start, min(acid_start + acid_len, width - 2)):
            tiles[height-2][x] = "acid"
    
    # ========================================
    # 8. 전환점 추가 (양 끝)
    # ========================================
    objects.append({"id": "trans_left", "type": "transition", "x": 1, "y": height - 3})
    objects.append({"id": "trans_right", "type": "transition", "x": width - 2, "y": height - 3})
    
    # ========================================
    # 9. 분위기에 따른 추가 오브젝트
    # ========================================
    if is_desolate:
        # 삭막: 아이템 없음, 적 많음
        pass
    elif is_bright:
        # 밝은: 아이템 추가
        objects.append({"id": "item_1", "type": "item", "x": width // 2, "y": height // 2})
    
    # NPC/가로등 키워드
    if any(k in prompt_lower for k in ["가로등", "lamp", "등불", "light", "조명"]):
        num_lamps = random.randint(1, 3)
        for i in range(num_lamps):
            lx = random.randint(5, width - 5)
            objects.append({"id": f"lamp_{i}", "type": "npc", "x": lx, "y": height - 3})
    
    return {"tiles": tiles, "objects": objects}

# Helper to convert zone_size to room count multiplier
def get_size_multiplier(zone_size: str) -> float:
    return {"small": 0.7, "medium": 1.0, "large": 1.5}.get(zone_size, 1.0)

def build_response(gen: MapGenerator) -> Dict[str, Any]:
    """Convert MapGenerator output to API response format"""
    rooms_data = []
    
    if not gen.rooms:
        return {"width": 50, "height": 50, "rooms": [], "zones": {}, "connections": []}
    
    # Calculate total bounds
    min_x = min(r.x for r in gen.rooms.values())
    min_y = min(r.y for r in gen.rooms.values())
    max_x = max(r.x + r.width for r in gen.rooms.values())
    max_y = max(r.y + r.height for r in gen.rooms.values())
    
    width = max_x - min_x + 10  # Buffer
    height = max_y - min_y + 10  # Buffer
    
    # Build connections from logic nodes
    connections = []
    processed_edges = set()
    
    for node in gen.logic_nodes.values():
        for edge in node.edges:
            edge_key = tuple(sorted([node.id, edge.target_id]))
            if edge_key not in processed_edges:
                processed_edges.add(edge_key)
                connections.append({
                    "fromId": node.id,
                    "toId": edge.target_id,
                    "condition": edge.condition.value
                })
    
    for r in gen.rooms.values():
        # Get corresponding logic node for additional info
        logic_node = gen.logic_nodes.get(r.id)
        
        room_data = {
            "id": r.id,
            "x": r.x - min_x + 5,  # Normalize coordinates
            "y": r.y - min_y + 5,
            "w": r.width,
            "h": r.height,
            "zone_id": r.zone_id,
            "neighbors": list(r.neighbors),
            "type": r.type.value if hasattr(r.type, 'value') else str(r.type),
            "rects": r.rects
        }
        
        # Add extra info from logic node
        if logic_node:
            room_data["depth"] = logic_node.depth
            if logic_node.name:
                room_data["name"] = logic_node.name
        
        rooms_data.append(room_data)
        
    return {
        "width": width,
        "height": height,
        "rooms": rooms_data,
        "zones": {z.id: {"name": z.name, "color": z.primary_color} for z in gen.zones.values()},
        "connections": connections
    }

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.get("/generate")
def generate_map_get(
    seed: Optional[int] = None,
    zone_count: int = 4,
    zone_size: str = "medium",
    gate_density: str = "medium"
):
    """Generate map via GET request (for simple usage)"""
    gen = MapGenerator()
    gen.generate(seed=seed, zone_count=zone_count, zone_size=zone_size, gate_density=gate_density)
    return build_response(gen)

@app.post("/api/generate")
def generate_map_post(params: GenerateParams):
    """Generate map via POST request with full parameters"""
    gen = MapGenerator()
    gen.generate(params.seed)
    return build_response(gen)

@app.post("/api/validate")
def validate_map(request: ValidateRequest):
    """Validate a map's structure and connectivity"""
    errors = []
    warnings = []
    
    rooms = request.rooms
    connections = request.connections
    
    # Check for empty map
    if not rooms:
        errors.append("Map has no rooms")
        return {"valid": False, "errors": errors, "warnings": warnings}
    
    # Check for start room
    start_rooms = [r for r in rooms if r.get("type") == "start"]
    if len(start_rooms) == 0:
        errors.append("No start room found")
    elif len(start_rooms) > 1:
        warnings.append("Multiple start rooms found")
    
    # Check for boss rooms
    boss_rooms = [r for r in rooms if r.get("type") == "boss"]
    if len(boss_rooms) == 0:
        warnings.append("No boss rooms found")
    
    # Check connectivity (simple check)
    room_ids = {r["id"] for r in rooms}
    for conn in connections:
        if conn.get("fromId") not in room_ids:
            errors.append(f"Connection references non-existent room: {conn.get('fromId')}")
        if conn.get("toId") not in room_ids:
            errors.append(f"Connection references non-existent room: {conn.get('toId')}")
    
    # Check for isolated rooms
    connected_rooms = set()
    for conn in connections:
        connected_rooms.add(conn.get("fromId"))
        connected_rooms.add(conn.get("toId"))
    
    isolated = room_ids - connected_rooms
    if isolated and len(rooms) > 1:
        warnings.append(f"Isolated rooms found: {list(isolated)}")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }

@app.post("/api/export")
def export_map(rooms: List[Dict], connections: List[Dict], zones: Dict):
    """Export map in standard format"""
    # Group rooms by zone
    zone_data = {}
    for zone_id, zone_info in zones.items():
        zone_rooms = [r for r in rooms if str(r.get("zone_id")) == str(zone_id)]
        zone_connections = [c for c in connections 
                          if any(r["id"] == c["fromId"] for r in zone_rooms)]
        
        zone_data[zone_id] = {
            "id": f"zone_{zone_id}",
            "name": zone_info.get("name", f"Zone {zone_id}"),
            "theme": zone_info.get("theme", "UNKNOWN"),
            "color": zone_info.get("color", "#888888"),
            "rooms": zone_rooms,
            "connections": zone_connections
        }
    
    return {
        "version": "1.0",
        "zones": list(zone_data.values()),
        "metadata": {
            "totalRooms": len(rooms),
            "totalConnections": len(connections),
            "totalZones": len(zones)
        }
    }

@app.post("/generate/prompt")
def generate_from_prompt(request: PromptRequest):
    """Generate map from natural language prompt"""
    # Parse prompt to parameters
    params = parse_prompt_to_params(request.prompt)
    
    # Try OpenAI if available and API key is set
    openai_key = os.environ.get("OPENAI_API_KEY")
    if OPENAI_AVAILABLE and openai_key:
        try:
            client = OpenAI(api_key=openai_key)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": """You are a map generation parameter optimizer for a Metroidvania game.
Given a user's description, output JSON with these fields:
- zone_count: int (2-8)
- zone_size: "small", "medium", or "large"
- gate_density: "low", "medium", or "high"
- special_rooms: list of room types to include (boss, shop, save, item, hub)
Only output valid JSON, no explanation."""},
                    {"role": "user", "content": request.prompt}
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            ai_params = json.loads(response.choices[0].message.content)
            params.update(ai_params)
        except Exception as e:
            # Fall back to keyword parsing
            print(f"OpenAI failed, using keyword parsing: {e}")
    
    # Generate map with parameters
    gen = MapGenerator()
    gen.generate(params.get("seed"))
    
    return build_response(gen)

@app.post("/generate/room-detail")
def generate_room_detail(request: RoomDetailRequest):
    """Generate detailed room layout from prompt"""
    
    # Try OpenAI if available
    openai_key = os.environ.get("OPENAI_API_KEY")
    if OPENAI_AVAILABLE and openai_key:
        try:
            client = OpenAI(api_key=openai_key)
            
            system_prompt = f"""You are a Metroidvania room layout generator.
Create a room layout for a {request.width}x{request.height} tile room.
Room type: {request.room_type}
Theme: {request.theme}

Output JSON with:
1. "tiles": 2D array [{request.height}][{request.width}] with values: "empty", "solid", "platform", "spike", "acid", "breakable", "door"
2. "objects": array of {{"id": string, "type": string, "x": int, "y": int}}
   Object types: spawn_point, enemy_spawn, item, chest, switch, npc, save_point, transition

Rules:
- Walls on edges (solid)
- Ensure playable path exists
- Match room type (boss = arena, shop = flat with NPC, etc.)
- Add appropriate hazards and platforms for Metroidvania gameplay

Only output valid JSON."""

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.prompt}
                ],
                max_tokens=2000,
                temperature=0.8
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            print(f"OpenAI room generation failed: {e}")
    
    # Fallback to simple procedural generation
    return generate_room_tiles_simple(
        request.width, 
        request.height, 
        request.room_type, 
        request.prompt
    )
