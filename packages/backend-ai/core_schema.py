from typing import List, Optional, Dict, Set, Tuple
from enum import Enum
from pydantic import BaseModel, Field

class RoomType(str, Enum):
    START = "start"
    HUB = "hub"
    NORMAL = "normal"
    BOSS = "boss"
    ITEM = "item"
    SAVE = "save" # Bench
    SHOP = "shop"
    STAG = "stag" # Stag Station (Fast Travel)
    MAP = "map" # Map Maker (Cornifer)

class Morphology(str, Enum):
    RECT = "rect"
    L_SHAPE = "l_shape"
    T_SHAPE = "t_shape"
    SHAFT = "shaft" # Vertical Shaft
    CORRIDOR = "corridor" # Horizontal Corridor

class GateCondition(str, Enum):
    NONE = "none"
    # Abilities
    DASH = "dash"
    WALL_JUMP = "wall_jump" # Mantis Claw
    DOUBLE_JUMP = "double_jump" # Monarch Wings
    SUPER_DASH = "super_dash" # Crystal Heart
    SWIM = "swim" # Isma's Tear
    LANTERN = "lantern" # Lumafly Lantern
    DESOLATE_DIVE = "desolate_dive"
    # Items / Events
    SIMPLE_KEY = "simple_key"
    CITY_CREST = "city_crest"
    TRAM_PASS = "tram_pass"
    EVENT_LOCK = "event_lock" # Boss defeat or Switch

class Direction(str, Enum):
    UP = "UP"
    DOWN = "DOWN"
    LEFT = "LEFT"
    RIGHT = "RIGHT"

class Edge(BaseModel):
    target_id: int
    condition: GateCondition = GateCondition.NONE
    bidirectional: bool = True
    direction: Optional[Direction] = None # Direction from source to target

class RoomNode(BaseModel):
    """
    Logical representation of a room in the gameplay graph.
    Focuses on connectivity and purpose, not physical shape.
    """
    id: int
    type: RoomType = RoomType.NORMAL
    zone_id: int
    edges: List[Edge] = Field(default_factory=list)
    depth: int = 0 # Distance from start
    required_ability: Optional[GateCondition] = None # If this node is gated (entrance requirement)
    name: Optional[str] = None # e.g., "Mantis Village"

class RoomPhysical(BaseModel):
    """
    Physical representation of a room on the 2D grid.
    Linked to a Logical RoomNode.
    """
    id: int # Links to RoomNode.id
    morphology: Morphology = Morphology.RECT
    x: int # Bounding Box X
    y: int # Bounding Box Y
    width: int # Bounding Box Width
    height: int # Bounding Box Height
    zone_id: int
    type: RoomType = RoomType.NORMAL
    # List of (relative_x, relative_y, w, h) defining the room's shape
    rects: List[Tuple[int, int, int, int]] = Field(default_factory=list) 
    neighbors: Set[int] = Field(default_factory=set)
    color: str = "#888888"

class ConnectionData(BaseModel):
    """
    For JSON Output (Appendix 7.1)
    """
    from_id: str = Field(..., serialization_alias="from")
    to_id: str = Field(..., serialization_alias="to")
    direction: str
    condition: str
    
    model_config = {"populate_by_name": True}

class ZoneData(BaseModel):
    """
    For JSON Output (Appendix 7.1)
    """
    id: str
    name: str
    theme: str
    rooms: List[dict] = Field(default_factory=list) # Simplified room data
    connections: List[ConnectionData] = Field(default_factory=list)

class MapData(BaseModel):
    """
    Top-level JSON structure (Appendix 7.1)
    """
    zones: List[ZoneData] = Field(default_factory=list)

class ZoneInfo(BaseModel):
    id: int
    name: str
    theme: str
    primary_color: str
