import os
import re

replacements = {
    r'Neural sync finished': 'Session sync finished',
    r'Neural Rest': 'Break Time',
    r'Main Timer Node': 'Timer',
    r'Node Alerts': 'Notifications',
    r'scrollToLedger': 'scrollToTransactions',
    r'Synchronizing with Ledger View': 'Navigating to Transactions',
    r'Internal Node': 'System Entry',
    r'Home Node': 'Home',
    r'Email Node': 'Email',
    r'Password Node': 'Password',
    r'Establish New Node': 'Add New Member',
    r'Active Node': 'Active Member',
    r'Comm Node \(Email\)': 'Contact (Email)',
    r'Identity Node Established': 'Account Created Successfully',
    r'Neural pathway blocked': 'Connection blocked',
    r'Analyzing Neural Pathways': 'Analyzing Data'
}

def refactor_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content
    for pattern, replacement in replacements.items():
        # We use a case-sensitive replace for these specific strings
        new_content = re.sub(pattern, replacement, new_content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Refactored: {filepath}")

# Scan src directory
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            refactor_file(os.path.join(root, file))
