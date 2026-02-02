"""
Detailed analysis of generated map
"""
import json

print("="*80)
print("MAP ANALYSIS REPORT")
print("="*80)

with open("demo_output.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"\n📊 Overview:")
print(f"  • Total Zones: {len(data['zones'])}")

total_rooms = sum(len(zone['rooms']) for zone in data['zones'])
total_connections = sum(len(zone['connections']) for zone in data['zones'])

print(f"  • Total Rooms: {total_rooms}")
print(f"  • Total Connections: {total_connections}")

print(f"\n🗺️  Zone Details:")
for zone in data['zones']:
    print(f"\n  {zone['name']} ({zone['theme']})")
    print(f"    ├─ Rooms: {len(zone['rooms'])}")
    print(f"    ├─ Connections: {len(zone['connections'])}")
    
    # Count room types
    room_types = {}
    for room in zone['rooms']:
        rtype = room['type']
        room_types[rtype] = room_types.get(rtype, 0) + 1
    
    print(f"    └─ Room Types:", ", ".join([f"{k}: {v}" for k, v in room_types.items()]))
    
    # Show POIs
    pois = [r for r in zone['rooms'] if r['type'] in ['save', 'stag', 'map', 'boss', 'item']]
    if pois:
        print(f"       Points of Interest:")
        for poi in pois:
            poi_name = poi.get('name', poi['id'])
            print(f"         • [{poi['type']}] {poi_name} at ({poi['x']}, {poi['y']})")

print(f"\n🔒 Gate Analysis:")
gated_connections = []
for zone in data['zones']:
    for conn in zone['connections']:
        if conn['condition'] != 'none':
            gated_connections.append((conn['from'], conn['to'], conn['condition']))

print(f"  • Total Gated Connections: {len(gated_connections)}")
if gated_connections:
    print(f"  • Gates:")
    ability_counts = {}
    for from_id, to_id, condition in gated_connections[:10]:  # Show first 10
        ability_counts[condition] = ability_counts.get(condition, 0) + 1
        print(f"      {from_id} → {to_id} (requires: {condition})")
    
    if len(gated_connections) > 10:
        print(f"      ... and {len(gated_connections) - 10} more")
    
    print(f"  • Ability Usage:")
    for ability, count in ability_counts.items():
        print(f"      {ability}: {count} gates")

print(f"\n📍 Critical Path:")
# Find START and BOSS rooms
start_room = None
boss_rooms = []

for zone in data['zones']:
    for room in zone['rooms']:
        if room['type'] == 'start':
            start_room = room
        elif room['type'] == 'boss':
            boss_rooms.append(room)

if start_room:
    print(f"  • Start: {start_room['id']} at ({start_room['x']}, {start_room['y']})")

if boss_rooms:
    print(f"  • Bosses ({len(boss_rooms)}):")
    for boss in boss_rooms:
        boss_name = boss.get('name', boss['id'])
        print(f"      {boss_name} at ({boss['x']}, {boss['y']}), depth: {boss['depth']}")

print(f"\n💾 Save Points (Benches):")
benches = []
for zone in data['zones']:
    for room in zone['rooms']:
        if room['type'] == 'save':
            benches.append((zone['name'], room))

print(f"  • Total: {len(benches)}")
for zone_name, bench in benches:
    bench_name = bench.get('name', bench['id'])
    print(f"      [{zone_name}] {bench_name}")

print(f"\n🚉 Fast Travel (Stag Stations):")
stags = []
for zone in data['zones']:
    for room in zone['rooms']:
        if room['type'] == 'stag':
            stags.append((zone['name'], room))

print(f"  • Total: {len(stags)}")
for zone_name, stag in stags:
    stag_name = stag.get('name', stag['id'])
    print(f"      [{zone_name}] {stag_name}")

print("\n" + "="*80)
print("✅ Analysis Complete")
print("="*80)





