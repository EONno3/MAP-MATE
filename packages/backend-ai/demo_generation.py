"""
Demo script to generate and inspect a Metroidvania map
"""
import json
from core_gen import MapGenerator

print("="*80)
print("METROIDVANIA MAP GENERATOR - DEMO")
print("Based on AI_MAP_GENERATION_SPEC.md")
print("="*80)

# Generate map
print("\n[1] Generating Map...")
gen = MapGenerator()
gen.generate(seed=12345)  # Use different seed for variety

print("\n[2] Map Summary:")
summary = gen.get_summary()
print(json.dumps(summary, indent=2, ensure_ascii=False))

print("\n[3] ASCII Visualization:")
gen.print_ascii()

print("\n[4] Exporting to JSON...")
json_output = gen.export_json("demo_output.json")
print(f"✓ Exported to demo_output.json ({len(json_output)} bytes)")

# Parse and show sample data
print("\n[5] Sample JSON Structure:")
data = json.loads(json_output)
print(f"Total Zones: {len(data['zones'])}")

for zone in data['zones'][:2]:  # Show first 2 zones
    print(f"\n  Zone: {zone['name']} ({zone['theme']})")
    print(f"    - Rooms: {len(zone['rooms'])}")
    print(f"    - Connections: {len(zone['connections'])}")
    
    # Show sample connection
    if zone['connections']:
        conn = zone['connections'][0]
        print(f"    - Sample connection: {conn['from']} → {conn['to']} ({conn['direction']}, requires: {conn['condition']})")
    
    # Show POI rooms
    poi_rooms = [r for r in zone['rooms'] if r['type'] in ['save', 'stag', 'map', 'boss']]
    if poi_rooms:
        print(f"    - POIs in this zone:")
        for room in poi_rooms[:3]:
            room_name = room.get('name', room['id'])
            print(f"      • {room['type']}: {room_name}")

print("\n" + "="*80)
print("✓ Map generation complete!")
print("="*80)





