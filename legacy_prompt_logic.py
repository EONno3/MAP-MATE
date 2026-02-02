from typing import List, Optional, Dict, Tuple, Any
import re

# -----------------------------------------------------------------------------
# Legacy Prompt Logic extracted from old backend-ai
# -----------------------------------------------------------------------------

ROOM_TYPE_KEYWORDS: Dict[str, List[str]] = {
    "boss": [
        "boss",
        "보스",
        "mini boss",
        "mini-boss",
        "miniboss",
        "guardian",
        "champion",
        "미니보스",
        "강적",
    ],
    "puzzle": ["퍼즐", "puzzle", "trial", "riddle", "수수께끼"],
    "secret": ["비밀", "secret", "숨겨", "은닉", "hidden", "숨겨진"],
    "save": [
        "save",
        "safe",
        "안전",
        "휴식",
        "쉼터",
        "캠프",
        "세이브",
        "bench",
        "rest",
        "sanctuary",
    ],
    "shop": ["상점", "상인", "merchant", "shop", "거래", "시장"],
    "challenge": ["도전", "challenge", "시험", "trial", "arena"],
    "treasure": ["보물", "treasure", "loot", "보상", "reward", "artifact", "유물"],
    "normal": [
        "normal",
        "일반",
        "탐험",
        "전투",
        "combat",
        "기본",
        "메인",
        "common",
        "standard",
        "routine",
        "regular",
    ],
}

ROOM_TYPE_PRIORITY: Dict[str, int] = {
    "boss": 0,
    "secret": 1,
    "puzzle": 2,
    "save": 3,
    "shop": 4,
    "challenge": 5,
    "treasure": 6,
    "normal": 7,
}

ZONE_TEMPLATES: Dict[str, Dict[str, List[str]]] = {
    "cave": {
        "names": ["Forgotten Crossroads", "Crystal Mines", "Deep Cavern", "Dark Depths", "Twilight Grotto"],
        "colors": ["#94a3b8", "#718096", "#475569", "#1e293b"]
    },
    "forest": {
        "names": ["Green Path", "Overgrown Garden", "Ancient Woods", "Mossy Hollow"],
        "colors": ["#4ade80", "#22c55e", "#16a34a", "#15803d"]
    },
    "city": {
        "names": ["City of Tears", "Royal Quarter", "Abandoned Capital", "Skyline Ward"],
        "colors": ["#818cf8", "#6366f1", "#4338ca", "#312e81"]
    },
    "temple": {
        "names": ["Sacred Temple", "Ancient Shrine", "Moonlit Sanctum", "Divine Archive"],
        "colors": ["#fcd34d", "#fbbf24", "#f59e0b", "#d97706"]
    },
    "fungus": {
        "names": ["Fungal Wastes", "Spore Grove", "Molded Depths", "Blooming Cavern"],
        "colors": ["#a855f7", "#d946ef", "#7c3aed", "#6d28d9"]
    },
    "water": {
        "names": ["Resting Grounds", "Mist Harbor", "Flooded Ruins", "Azure Abyss"],
        "colors": ["#5eead4", "#14b8a6", "#0d9488", "#0f766e"]
    },
    "fire": {
        "names": ["Volcanic Core", "Smoldering Forge", "Ashen Vault", "Molten Keep"],
        "colors": ["#f97316", "#ea580c", "#c2410c", "#9a3412"]
    },
    "dark": {
        "names": ["The Abyss", "Shadow Reliquary", "Void Hall", "Umbral Depths"],
        "colors": ["#64748b", "#475569", "#334155", "#1e293b"]
    }
}

DEFAULT_ZONE_THEME = {
    "names": ["Unknown Zone"],
    "colors": ["#94a3b8"]
}

def parse_room_type_targets(text: str) -> Dict[str, float]:
    if not text:
        return {}

    targets: Dict[str, float] = {}
    window_radius = 48

    for match in re.finditer(r"(\d{1,3})\s*%", text):
        try:
            value = min(100, int(match.group(1)))
        except ValueError:
            continue
        if value <= 0:
            continue
        percent_index = match.start()
        window_start = max(0, percent_index - window_radius)
        window_end = min(len(text), match.end() + window_radius)
        window = text[window_start:window_end]

        best_type: Optional[str] = None
        best_candidate: Optional[Tuple[int, bool, int]] = None

        for type_name, keywords in ROOM_TYPE_KEYWORDS.items():
            for keyword in keywords:
                for kw_match in re.finditer(re.escape(keyword), window):
                    kw_pos = window_start + kw_match.start()
                    distance = abs(kw_pos - percent_index)
                    is_after = kw_pos > percent_index
                    priority = ROOM_TYPE_PRIORITY.get(type_name, 99)
                    adjusted = distance + (20 if is_after else 0)
                    candidate = (adjusted, priority)
                    if best_candidate is None or candidate < best_candidate:
                        best_type = type_name
                        best_candidate = candidate

        if best_type:
            ratio = value / 100.0
            existing = targets.get(best_type)
            if existing is None or ratio > existing:
                targets[best_type] = ratio

    return targets

def analyze_prompt(prompt: Optional[str]) -> Dict[str, Any]:
    text = (prompt or "").lower()
    structure = "branching"
    zone_theme = "cave"
    room_size_pref = "balanced"
    zone_count_hint: Optional[str] = None
    difficulty_hint: Optional[str] = None
    lock_preferences: List[str] = []
    ability_hints: List[str] = []
    combat_focus = 0.0
    puzzle_focus = 0.0
    treasure_focus = 0.0
    secret_focus = 0.0
    rest_focus = 0.0

    if any(word in text for word in ["linear", "corridor", "straight", "튜토리얼", "직선"]):
        structure = "linear"
    elif any(word in text for word in ["hub", "central", "spoke", "중심", "허브"]):
        structure = "hub"
    elif any(word in text for word in ["maze", "labyrinth", "complex", "미로", "복잡"]):
        structure = "maze"
    elif any(word in text for word in ["open", "nonlinear", "exploration", "개방", "자유"]):
        structure = "open"

    if any(word in text for word in ["grand", "vast", "거대", "대형", "광대"]):
        room_size_pref = "large"
        zone_count_hint = "large"
    elif any(word in text for word in ["tight", "narrow", "좁", "밀폐", "claust"]):
        room_size_pref = "small"
        zone_count_hint = "small"
    elif any(word in text for word in ["varied", "mixed", "다양", "복합"]):
        room_size_pref = "varied"

    if any(word in text for word in ["hard", "brutal", "어려", "가혹"]):
        difficulty_hint = "hard"
    elif any(word in text for word in ["easy", "gentle", "쉬운", "편한"]):
        difficulty_hint = "easy"

    for theme_key in ZONE_TEMPLATES.keys():
        if theme_key in text:
            zone_theme = theme_key
            break
    if "fung" in text or "spore" in text or "버섯" in text:
        zone_theme = "fungus"
    if "city" in text or "도시" in text:
        zone_theme = "city"
    if "temple" in text or "사원" in text or "신전" in text:
        zone_theme = "temple"

    if any(word in text for word in ["key", "locked", "열쇠", "문"]):
        lock_preferences.append("key")
    if any(word in text for word in ["ability", "skill", "능력", "스킬"]):
        lock_preferences.append("ability")
    if any(word in text for word in ["ritual", "event", "quest", "이벤트", "제사"]):
        lock_preferences.append("event")
    if any(word in text for word in ["artifact", "유물", "장치"]):
        lock_preferences.append("item")

    if "dash" in text or "대시" in text:
        ability_hints.append("dash")
    if "double jump" in text or "더블" in text:
        ability_hints.append("double_jump")
    if "wall" in text or "climb" in text or "벽" in text:
        ability_hints.append("wall_climb")
    if "swim" in text or "acid" in text or "잠수" in text:
        ability_hints.append("acid_swim")

    if any(word in text for word in ["secret", "hidden", "숨겨", "비밀", "은닉"]):
        secret_focus = 0.4

    if any(word in text for word in ["safe", "안전", "휴식", "쉼터", "캠프", "세이브", "rest", "bench", "회복"]):
        rest_focus = 0.3

    if any(word in text for word in ["combat", "battle", "전투", "싸움"]):
        combat_focus = 0.4
    if any(word in text for word in ["puzzle", "퍼즐", "mystery", "수수께끼"]):
        puzzle_focus = 0.4
    if any(word in text for word in ["treasure", "loot", "보물", "보상"]):
        treasure_focus = 0.4

    if not lock_preferences:
        lock_preferences = ["ability", "key", "event"]

    room_type_targets = parse_room_type_targets(text)

    return {
        "structure": structure,
        "zone_theme": zone_theme,
        "room_size_pref": room_size_pref,
        "zone_count_hint": zone_count_hint,
        "difficulty_hint": difficulty_hint,
        "lock_preferences": lock_preferences,
        "ability_hints": ability_hints,
        "combat_focus": combat_focus,
        "puzzle_focus": puzzle_focus,
        "treasure_focus": treasure_focus,
        "secret_focus": secret_focus,
        "rest_focus": rest_focus,
        "room_type_targets": room_type_targets,
    }













