import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Define API_URL if not already defined or imported
    if 'API_URL' not in content and 'localhost:5001' in content:
        # Add import at the top
        if 'from "../config"' not in content and 'from "./config"' not in content:
            # Try to find a good spot for import
            lines = content.split('\n')
            inserted = False
            for i, line in enumerate(lines):
                if line.startswith('import ') and 'react' not in line:
                    lines.insert(i, 'import { API_URL } from "../config";')
                    inserted = True
                    break
            if not inserted:
                lines.insert(0, 'import { API_URL } from "../config";')
            content = '\n'.join(lines)

    # Replace "http://localhost:5001..." with `${API_URL}...`
    # and 'http://localhost:5001...' with `${API_URL}...`
    
    # Replace double quoted
    content = re.sub(r'"http://localhost:5001([^"]*)"', r'`${API_URL}\1`', content)
    # Replace single quoted
    content = re.sub(r"'http://localhost:5001([^']*)'", r'`${API_URL}\1`', content)
    
    # Special case for io("http://localhost:5001") which might become io(`${API_URL}`)
    # but could just be io(API_URL)
    content = content.replace('io(`${API_URL}`)', 'io(API_URL)')

    with open(filepath, 'w') as f:
        f.write(content)

# Scan src directory
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            fix_file(os.path.join(root, file))
