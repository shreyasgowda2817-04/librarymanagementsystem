import os
import re

replacements = {
    r'\bNeural Discovery\b': 'Recommended Books',
    r'\bNeural Assistant\b': 'AI Assistant',
    r'\bDiscovery Node\b': 'Recommendations',
    r'\bNeural Link Stable\b': 'System Online',
    r'\bTelemetry Link Severed\b': 'System Offline',
    r'\bOperational Ledger\b': 'Transactions',
    r'\bPersonal Research Ledger\b': 'My Transactions',
    r'\bResearch Ledger\b': 'Activity',
    r'\bCentral Hub\b': 'Dashboard',
    r'\bQuick Stats\b': 'System Overview',
    r'\bIdentity Vault\b': 'User Data',
    # Vault can be tricky, but mapping says Vault -> Saved Books in Data and Vault -> My Library in Tabs.
    # I'll use "Saved Books" as a general replacement for now, and handle tabs specifically if needed.
    # Actually, I'll be careful with "Vault".
    r'\bAssets in circulation\b': 'Books Issued',
    r'\bNode Active\b': 'Online',
    r'\bSocket Node Disconnected\b': 'Realtime Disconnected',
    r'\bSystem health optimized\b': 'System Health',
    r'\bAudit Protocol\b': 'Audit Logs',
    r'\bAudit Ledger\b': 'Activity Logs',
    r'\bProtocol Handshake Error\b': 'Request Failed',
    r'\bGlobal Identity Reset\b': 'Logout All Sessions',
    r'\bInstitutional\b': 'System',
    r'\bResearch Node\b': 'Feature',
    r'\bIdentity Token\b': 'Data Export',
    r'\bProtocol Updated\b': 'Settings Updated',
    r'\bLink Severed\b': 'Connection Failed',
    r'\bTelemetry\b': 'Activity Data'
}

def refactor_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content
    for pattern, replacement in replacements.items():
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
