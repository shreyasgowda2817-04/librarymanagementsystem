import os
import re

def fix_broken_logic(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # 1. Fix variable names (no spaces allowed)
    # Pattern: const [Activity Data, setActivity Data] or let Activity Data
    # Actually, the state setter is probably setTelemetry if it was telemetry.
    content = content.replace('[Activity Data, setTelemetry]', '[telemetry, setTelemetry]')
    content = content.replace('Activity Data.length', 'telemetry.length')
    content = content.replace('? Activity Data', '? telemetry')
    content = content.replace(': Activity Data', ': telemetry')

    # 2. Fix URL paths (no spaces in URLs)
    # Pattern: /api/.../Activity Data
    content = content.replace('/Activity Data', '/telemetry')
    
    # 3. Fix any other obvious variable issues
    # If "Activity Data" is used as a standalone variable
    # But we want to keep "Activity Data" as a label in JSX.
    
    # Better approach for variables: find "Activity Data" not in quotes
    # But that's hard with regex. 
    # Let's just fix the known ones.
    
    with open(filepath, 'w') as f:
        f.write(content)

# Scan src directory
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            fix_broken_logic(os.path.join(root, file))
