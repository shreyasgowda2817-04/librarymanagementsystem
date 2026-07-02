import os
import re

def fix_broken_quotes(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find patterns like `${API_URL}/something" and replace with `${API_URL}/something`
    # We look for `${API_URL}` followed by non-backtick characters ending with a double quote
    new_content = re.sub(r'(\$\{API_URL\}[^`"]*)"', r'\1`', content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
            print(f"Fixed quotes in {filepath}")

# Scan src directory
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            fix_broken_quotes(os.path.join(root, file))
