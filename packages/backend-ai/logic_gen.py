import random
import networkx as nx
from typing import Dict, List, Set, Optional, Tuple
from core_schema import RoomNode, RoomType, Edge, GateCondition

class LogicGenerator:
    """
    Generates Metroidvania-style logic graphs with:
    - Circular dependencies (A -> B -> C -> A')
    - Key/Lock placement validation
    - Backtracking loops
    
    Based on AI_MAP_GENERATION_SPEC.md Section 3 & 6
    """
    def __init__(self, zone_count: int = 4):
        self.zone_count = zone_count
        self.graph = nx.Graph() # Logic Graph
        self.nodes: Dict[int, RoomNode] = {}
        self.next_id = 1
        self.ability_locations: Dict[GateCondition, int] = {}  # ability -> room_id
        
    def generate_skeleton(self, seed: int = None) -> Dict[int, RoomNode]:
        if seed:
            random.seed(seed)
            
        # Step 1: Skeleton Generation (Spec Section 6, Step 1)
        start_node = self._create_node(RoomType.START, zone_id=1)
        hub_node = self._create_node(RoomType.HUB, zone_id=1)
        self._connect(start_node, hub_node)
        
        # Step 2: Critical Path & Gating (Spec Section 6, Step 2)
        # Define progression: Zone2 (free) -> Zone3 (needs DASH) -> Zone4 (needs WALL_JUMP)
        
        # Zone 2: Greenpath (No requirements, rewards DASH)
        zone2_branch = self._create_gated_branch(
            hub_node, 
            zone_id=2, 
            length=4, 
            gate_condition=GateCondition.NONE,
            reward_ability=GateCondition.DASH
        )
        
        # Zone 3: City/Crystal (Requires DASH, rewards WALL_JUMP)
        zone3_branch = self._create_gated_branch(
            hub_node,
            zone_id=3,
            length=5,
            gate_condition=GateCondition.DASH,
            reward_ability=GateCondition.WALL_JUMP
        )
        
        # Zone 4: Deepnest (Requires WALL_JUMP, end game)
        zone4_branch = self._create_gated_branch(
            hub_node,
            zone_id=4,
            length=6,
            gate_condition=GateCondition.WALL_JUMP,
            reward_ability=None  # Final area, no reward
        )
        
        # Step 3: Room Filling (Add some side branches)
        self._add_side_branches(hub_node, zone_id=1, count=2)
        
        # Step 4: Shortcut Connections (Spec Section 6, Step 4)
        # Create backtracking loops: A -> B -> C -> A'
        self._create_backtracking_loops()
        
        # Step 5: POI Placement (Spec Section 5.1)
        self._place_essential_objects()
        
        # Validate key placement
        self._validate_key_placement()
        
        # Calculate depths
        self._calculate_depths(start_node.id)
        
        return self.nodes
    
    def _create_gated_branch(
        self, 
        start_node: RoomNode, 
        zone_id: int, 
        length: int,
        gate_condition: GateCondition,
        reward_ability: Optional[GateCondition]
    ) -> List[RoomNode]:
        """
        Creates a branch with:
        - Entrance gate (requires gate_condition)
        - Chain of rooms
        - Boss room at end (gives reward_ability)
        """
        # Entrance (gated)
        entrance = self._create_node(RoomType.NORMAL, zone_id)
        self._connect(start_node, entrance, condition=gate_condition)
        entrance.required_ability = gate_condition
        
        # Chain
        chain = self._create_chain(entrance, zone_id, length)
        
        # Boss room (rewards ability)
        boss = self._create_node(RoomType.BOSS, zone_id)
        self._connect(chain[-1], boss)
        
        if reward_ability:
            # Mark this boss room as ability location
            self.ability_locations[reward_ability] = boss.id
            boss.name = f"Boss ({reward_ability.value})"
        
        return [entrance] + chain + [boss]
    
    def _add_side_branches(self, hub_node: RoomNode, zone_id: int, count: int):
        """Add small side branches for exploration"""
        for _ in range(count):
            side_chain = self._create_chain(hub_node, zone_id, length=random.randint(2, 3))
            # Add save point or item at end
            end_type = random.choice([RoomType.SAVE, RoomType.ITEM])
            end_room = self._create_node(end_type, zone_id)
            self._connect(side_chain[-1], end_room)
    
    def _create_backtracking_loops(self):
        """
        Create loops: A -> B -> C -> A'
        Where A' is a new area in zone A accessible after getting ability from C
        
        Spec Section 3.3: Circular Dependency & Backtracking
        """
        # Example: After getting DASH in Zone 2, can access new area in Zone 1 (Hub)
        if GateCondition.DASH in self.ability_locations:
            hub_nodes = [n for n in self.nodes.values() if n.zone_id == 1 and n.type == RoomType.HUB]
            if hub_nodes:
                hub = hub_nodes[0]
                # Create hidden area accessible with DASH
                hidden_area = self._create_node(RoomType.ITEM, zone_id=1)
                hidden_area.name = "Hidden Area (DASH required)"
                self._connect(hub, hidden_area, condition=GateCondition.DASH)
        
        # After WALL_JUMP, can shortcut back from Zone 4 to Zone 2
        if GateCondition.WALL_JUMP in self.ability_locations:
            zone4_nodes = [n for n in self.nodes.values() if n.zone_id == 4 and n.type == RoomType.NORMAL]
            zone2_nodes = [n for n in self.nodes.values() if n.zone_id == 2 and n.type == RoomType.NORMAL]
            
            if zone4_nodes and zone2_nodes:
                # Pick random nodes from each zone
                z4_node = random.choice(zone4_nodes[:len(zone4_nodes)//2])  # Early zone 4
                z2_node = random.choice(zone2_nodes[len(zone2_nodes)//2:])  # Late zone 2
                
                # Create shortcut (requires WALL_JUMP)
                self._connect(z4_node, z2_node, condition=GateCondition.WALL_JUMP)
    
    def _validate_key_placement(self):
        """
        Validate that keys (abilities) are obtainable before their locks
        
        Spec Section 3.3: Key Placement Rule
        "잠긴 문(Lock)을 여는 열쇠(Key/Ability)는 반드시 잠긴 문보다 접근 가능한 이전 경로에 배치"
        """
        for ability, room_id in self.ability_locations.items():
            # Find all gates that require this ability
            gates_needing_ability = []
            for node in self.nodes.values():
                for edge in node.edges:
                    if edge.condition == ability:
                        gates_needing_ability.append((node.id, edge.target_id))
            
            # Check if ability room is reachable without the ability
            if gates_needing_ability:
                reachable = self._get_reachable_nodes(start_id=1, forbidden_conditions={ability})
                if room_id not in reachable:
                    print(f"WARNING: Ability {ability.value} at room {room_id} may not be reachable!")
    
    def _get_reachable_nodes(
        self, 
        start_id: int, 
        forbidden_conditions: Set[GateCondition] = None
    ) -> Set[int]:
        """
        BFS to find all reachable nodes without using forbidden abilities
        Used for key placement validation
        """
        if forbidden_conditions is None:
            forbidden_conditions = set()
        
        visited = set()
        queue = [start_id]
        
        while queue:
            current_id = queue.pop(0)
            if current_id in visited:
                continue
            visited.add(current_id)
            
            for edge in self.nodes[current_id].edges:
                # Skip edges that require forbidden abilities
                if edge.condition in forbidden_conditions:
                    continue
                
                if edge.target_id not in visited:
                    queue.append(edge.target_id)
        
        return visited

    def _calculate_depths(self, start_id: int):
        """BFS to calculate distance from start"""
        queue = [(start_id, 0)]
        visited = {start_id}
        
        while queue:
            current_id, depth = queue.pop(0)
            self.nodes[current_id].depth = depth
            
            for edge in self.nodes[current_id].edges:
                if edge.target_id not in visited:
                    visited.add(edge.target_id)
                    queue.append((edge.target_id, depth + 1))

    def _create_node(self, r_type: RoomType, zone_id: int) -> RoomNode:
        nid = self.next_id
        self.next_id += 1
        node = RoomNode(id=nid, type=r_type, zone_id=zone_id)
        self.nodes[nid] = node
        self.graph.add_node(nid, data=node)
        return node

    def _create_chain(self, start_node: RoomNode, zone_id: int, length: int) -> List[RoomNode]:
        """Create a linear chain of rooms"""
        chain = []
        current = start_node
        for _ in range(length):
            nxt = self._create_node(RoomType.NORMAL, zone_id)
            self._connect(current, nxt)
            chain.append(nxt)
            current = nxt
        return chain

    def _connect(self, node_a: RoomNode, node_b: RoomNode, condition: GateCondition = GateCondition.NONE):
        """Create bidirectional edge between two nodes"""
        node_a.edges.append(Edge(target_id=node_b.id, condition=condition))
        node_b.edges.append(Edge(target_id=node_a.id, condition=condition))
        self.graph.add_edge(node_a.id, node_b.id, condition=condition)

    def _place_essential_objects(self):
        """
        Place POIs according to Spec Section 5.1:
        - Benches (Save Points) near bosses and zone entrances
        - Stag Stations (Fast Travel) at zone edges
        - Map Makers (Cornifer) at zone entry paths
        """
        # 1. Place Benches near Boss rooms
        boss_nodes = [n for n in self.nodes.values() if n.type == RoomType.BOSS]
        
        for boss in boss_nodes:
            # Find nodes 3-5 steps before boss
            nearby_nodes = self._find_nodes_before(boss.id, distance_range=(3, 5))
            
            if nearby_nodes:
                # Pick one to convert to SAVE (Bench)
                bench_candidate = random.choice(nearby_nodes)
                if self.nodes[bench_candidate].type == RoomType.NORMAL:
                    self.nodes[bench_candidate].type = RoomType.SAVE
                    self.nodes[bench_candidate].name = f"Bench (near Boss {boss.id})"
        
        # 2. Place Stag Stations (1 per zone, at edges)
        for zone_id in range(1, self.zone_count + 1):
            zone_nodes = [n for n in self.nodes.values() 
                         if n.zone_id == zone_id and n.type == RoomType.NORMAL]
            
            if zone_nodes:
                # Pick a node with few connections (edge of zone)
                edge_nodes = sorted(zone_nodes, key=lambda n: len(n.edges))
                if edge_nodes:
                    stag_node = edge_nodes[0]
                    stag_node.type = RoomType.STAG
                    stag_node.name = f"Stag Station (Zone {zone_id})"
        
        # 3. Place Map Makers (Cornifer) at zone entry points
        for zone_id in range(2, self.zone_count + 1):  # Skip zone 1 (hub)
            zone_nodes = [n for n in self.nodes.values() if n.zone_id == zone_id]
            
            if zone_nodes:
                # Find entry point (node with lowest depth in this zone)
                entry_node = min(zone_nodes, key=lambda n: n.depth)
                
                # Place Map Maker nearby
                nearby = self._find_nodes_after(entry_node.id, distance_range=(1, 2))
                if nearby:
                    map_maker_node = random.choice(nearby)
                    if self.nodes[map_maker_node].type == RoomType.NORMAL:
                        self.nodes[map_maker_node].type = RoomType.MAP
                        self.nodes[map_maker_node].name = f"Map Maker (Zone {zone_id})"
    
    def _find_nodes_before(self, target_id: int, distance_range: Tuple[int, int]) -> List[int]:
        """Find nodes that are N steps before target (reverse BFS)"""
        min_dist, max_dist = distance_range
        candidates = []
        
        # BFS backwards from all nodes to find those at correct distance from target
        for node_id in self.nodes.keys():
            if node_id == target_id:
                continue
            
            # Check distance from node_id to target_id
            dist = self._get_distance(node_id, target_id)
            if dist and min_dist <= dist <= max_dist:
                candidates.append(node_id)
        
        return candidates
    
    def _find_nodes_after(self, start_id: int, distance_range: Tuple[int, int]) -> List[int]:
        """Find nodes that are N steps after start"""
        min_dist, max_dist = distance_range
        candidates = []
        
        # BFS from start
        queue = [(start_id, 0)]
        visited = {start_id}
        
        while queue:
            current_id, dist = queue.pop(0)
            
            if min_dist <= dist <= max_dist:
                candidates.append(current_id)
            
            if dist < max_dist:
                for edge in self.nodes[current_id].edges:
                    if edge.target_id not in visited:
                        visited.add(edge.target_id)
                        queue.append((edge.target_id, dist + 1))
        
        return candidates
    
    def _get_distance(self, from_id: int, to_id: int) -> Optional[int]:
        """Get shortest path distance between two nodes"""
        if from_id == to_id:
            return 0
        
        queue = [(from_id, 0)]
        visited = {from_id}
        
        while queue:
            current_id, dist = queue.pop(0)
            
            for edge in self.nodes[current_id].edges:
                if edge.target_id == to_id:
                    return dist + 1
                
                if edge.target_id not in visited:
                    visited.add(edge.target_id)
                    queue.append((edge.target_id, dist + 1))
        
        return None  # No path found
