"""
Generate HTML visualization of the map
"""
import json
import webbrowser
import os

def generate_html_visualization(json_file="demo_output.json", output_file="map_visualization.html"):
    """Generate interactive HTML visualization"""
    
    with open(json_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Calculate bounds
    all_rooms = []
    for zone in data['zones']:
        all_rooms.extend(zone['rooms'])
    
    if not all_rooms:
        print("No rooms to visualize!")
        return
    
    min_x = min(r['x'] for r in all_rooms)
    max_x = max(r['x'] + r['width'] for r in all_rooms)
    min_y = min(r['y'] for r in all_rooms)
    max_y = max(r['y'] + r['height'] for r in all_rooms)
    
    width = max_x - min_x
    height = max_y - min_y
    
    # Scale factor for visualization
    scale = 10
    
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Metroidvania Map Visualization</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #1a1a1a;
            color: #fff;
            margin: 0;
            padding: 20px;
        }}
        .container {{
            max-width: 1400px;
            margin: 0 auto;
        }}
        h1 {{
            text-align: center;
            color: #fff;
            margin-bottom: 10px;
        }}
        .subtitle {{
            text-align: center;
            color: #888;
            margin-bottom: 30px;
        }}
        .map-container {{
            background: #000;
            border: 2px solid #444;
            border-radius: 8px;
            padding: 20px;
            overflow: auto;
            margin-bottom: 30px;
        }}
        svg {{
            display: block;
            margin: 0 auto;
        }}
        .room {{
            stroke: #666;
            stroke-width: 1;
            cursor: pointer;
            transition: opacity 0.2s;
        }}
        .room:hover {{
            opacity: 0.8;
            stroke: #fff;
            stroke-width: 2;
        }}
        .connection {{
            stroke: #444;
            stroke-width: 2;
            fill: none;
        }}
        .connection.gated {{
            stroke: #ff6b6b;
            stroke-dasharray: 5,5;
            stroke-width: 2;
        }}
        .room-label {{
            font-size: 10px;
            fill: #fff;
            text-anchor: middle;
            pointer-events: none;
        }}
        .legend {{
            background: #222;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }}
        .legend h3 {{
            margin-top: 0;
            color: #fff;
        }}
        .legend-item {{
            display: inline-block;
            margin-right: 20px;
            margin-bottom: 10px;
        }}
        .legend-color {{
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 1px solid #666;
            margin-right: 5px;
            vertical-align: middle;
        }}
        .stats {{
            background: #222;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 20px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }}
        .stat-box {{
            background: #2a2a2a;
            padding: 15px;
            border-radius: 5px;
            border-left: 3px solid #4CAF50;
        }}
        .stat-label {{
            color: #888;
            font-size: 12px;
            text-transform: uppercase;
        }}
        .stat-value {{
            font-size: 24px;
            font-weight: bold;
            color: #fff;
            margin-top: 5px;
        }}
        .tooltip {{
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid #666;
            border-radius: 5px;
            padding: 10px;
            pointer-events: none;
            display: none;
            max-width: 300px;
            z-index: 1000;
        }}
        .tooltip-title {{
            font-weight: bold;
            color: #4CAF50;
            margin-bottom: 5px;
        }}
        .tooltip-detail {{
            font-size: 12px;
            color: #ccc;
            margin: 2px 0;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🗺️ Metroidvania Map Visualization</h1>
        <p class="subtitle">Generated from AI_MAP_GENERATION_SPEC.md</p>
        
        <div class="legend">
            <h3>🎨 Legend</h3>
"""
    
    # Add zone colors to legend
    zone_colors = {
        "Forgotten Crossroads": "#A0A0A0",
        "Greenpath": "#408040",
        "City of Tears": "#303080",
        "Deepnest": "#303030",
        "Crystal Peak": "#FF80FF",
        "Kingdom's Edge": "#A0A080"
    }
    
    for zone in data['zones']:
        color = zone_colors.get(zone['name'], '#888888')
        html += f'<div class="legend-item"><span class="legend-color" style="background: {color};"></span>{zone["name"]}</div>'
    
    html += """
            <br>
            <div class="legend-item"><span class="legend-color" style="background: #ff6b6b; border-style: dashed;"></span>Gated Connection</div>
            <div class="legend-item"><span class="legend-color" style="background: #444;"></span>Free Connection</div>
        </div>
        
        <div class="stats">
"""
    
    # Add statistics
    total_rooms = sum(len(zone['rooms']) for zone in data['zones'])
    total_connections = sum(len(zone['connections']) for zone in data['zones'])
    gated_connections = sum(1 for zone in data['zones'] for conn in zone['connections'] if conn['condition'] != 'none')
    
    stats = [
        ("Total Zones", len(data['zones'])),
        ("Total Rooms", total_rooms),
        ("Total Connections", total_connections),
        ("Gated Connections", gated_connections),
    ]
    
    for label, value in stats:
        html += f"""
            <div class="stat-box">
                <div class="stat-label">{label}</div>
                <div class="stat-value">{value}</div>
            </div>
"""
    
    html += """
        </div>
        
        <div class="map-container">
"""
    
    # Generate SVG
    svg_width = width * scale + 100
    svg_height = height * scale + 100
    
    html += f'<svg width="{svg_width}" height="{svg_height}" viewBox="0 0 {svg_width} {svg_height}">\n'
    
    # Draw connections first (so they appear behind rooms)
    html += '<!-- Connections -->\n'
    for zone in data['zones']:
        for conn in zone['connections']:
            # Find room positions
            from_room = None
            to_room = None
            
            for z in data['zones']:
                for r in z['rooms']:
                    if r['id'] == conn['from']:
                        from_room = r
                    if r['id'] == conn['to']:
                        to_room = r
            
            if from_room and to_room:
                x1 = (from_room['x'] - min_x + from_room['width'] / 2) * scale + 50
                y1 = (from_room['y'] - min_y + from_room['height'] / 2) * scale + 50
                x2 = (to_room['x'] - min_x + to_room['width'] / 2) * scale + 50
                y2 = (to_room['y'] - min_y + to_room['height'] / 2) * scale + 50
                
                conn_class = "connection gated" if conn['condition'] != 'none' else "connection"
                html += f'<line class="{conn_class}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" />\n'
    
    # Draw rooms
    html += '<!-- Rooms -->\n'
    for zone in data['zones']:
        color = zone_colors.get(zone['name'], '#888888')
        
        for room in zone['rooms']:
            x = (room['x'] - min_x) * scale + 50
            y = (room['y'] - min_y) * scale + 50
            w = room['width'] * scale
            h = room['height'] * scale
            
            # Room type specific styling
            opacity = 0.7
            if room['type'] == 'start':
                opacity = 1.0
                color = '#FFD700'  # Gold
            elif room['type'] == 'boss':
                opacity = 0.9
                color = '#FF0000'  # Red
            elif room['type'] == 'save':
                color = '#4CAF50'  # Green
            elif room['type'] == 'stag':
                color = '#2196F3'  # Blue
            
            room_name = room.get('name', room['id'])
            room_info = f"{room_name}|Type: {room['type']}|Depth: {room['depth']}"
            
            html += f'<rect class="room" x="{x}" y="{y}" width="{w}" height="{h}" fill="{color}" opacity="{opacity}" data-info="{room_info}" />\n'
            
            # Add label for special rooms
            if room['type'] in ['start', 'boss', 'save', 'stag', 'map']:
                label = room['type'].upper()[0]
                if room['type'] == 'start':
                    label = 'S'
                elif room['type'] == 'boss':
                    label = 'B'
                elif room['type'] == 'save':
                    label = '💾'
                elif room['type'] == 'stag':
                    label = '🚉'
                elif room['type'] == 'map':
                    label = '🗺️'
                
                label_x = x + w / 2
                label_y = y + h / 2 + 4
                html += f'<text class="room-label" x="{label_x}" y="{label_y}">{label}</text>\n'
    
    html += """
</svg>
        </div>
    </div>
    
    <div id="tooltip" class="tooltip"></div>
    
    <script>
        const rooms = document.querySelectorAll('.room');
        const tooltip = document.getElementById('tooltip');
        
        rooms.forEach(room => {
            room.addEventListener('mouseenter', (e) => {
                const info = room.dataset.info.split('|');
                tooltip.innerHTML = `
                    <div class="tooltip-title">${info[0]}</div>
                    <div class="tooltip-detail">${info[1]}</div>
                    <div class="tooltip-detail">${info[2]}</div>
                `;
                tooltip.style.display = 'block';
            });
            
            room.addEventListener('mousemove', (e) => {
                tooltip.style.left = (e.pageX + 10) + 'px';
                tooltip.style.top = (e.pageY + 10) + 'px';
            });
            
            room.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        });
    </script>
</body>
</html>
"""
    
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(html)
    
    print(f"✅ HTML visualization created: {output_file}")
    return os.path.abspath(output_file)

if __name__ == "__main__":
    print("🎨 Generating HTML visualization...")
    filepath = generate_html_visualization()
    
    print(f"🌐 Opening in browser...")
    webbrowser.open('file://' + filepath)
    
    print("✨ Done!")





