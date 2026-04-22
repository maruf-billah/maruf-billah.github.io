import re

with open('BD_Map_admin.svg', 'r', encoding='utf-8') as f:
    svg = f.read()

# Escape backticks and template literal syntax for JS
svg = svg.replace('\\', '\\\\')
svg = svg.replace('`', '\\`')
svg = svg.replace('${', '\\${')

with open('bd_map_data.js', 'w', encoding='utf-8') as f:
    f.write('// Auto-generated: Bangladesh SVG Map Data\n')
    f.write('const BD_MAP_SVG = `')
    f.write(svg)
    f.write('`;\n')

print('Done! Created bd_map_data.js')
