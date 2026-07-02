import os
import re

replacements = {
    r'Borrow more assets': 'Borrow more books',
    r'global assets': 'global collections',
    r'SELECT ASSET': 'SELECT BOOK',
    r'ASSET ID': 'BOOK ID',
    r'asset requests': 'book requests',
    r'asset procurement': 'book management',
    r'Legacy Asset': 'Legacy Book',
    r'Syncing Legacy Asset': 'Syncing Legacy Book',
    r'Asset Synced Successfully': 'Book Synced Successfully',
    r'sync asset': 'sync book'
}

def refactor_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content
    for pattern, replacement in replacements.items():
        # Case insensitive for these general terms
        new_content = re.sub(pattern, replacement, new_content, flags=re.IGNORECASE)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Refactored: {filepath}")

# Scan src directory
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            refactor_file(os.path.join(root, file))
