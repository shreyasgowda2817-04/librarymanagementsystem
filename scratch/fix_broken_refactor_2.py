import os
import re

def fix_broken_logic(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # 1. Fix variable names and URL paths project-wide
    # This is a dangerous but necessary operation.
    # We want to replace "Activity Data" with "telemetry" when it's NOT a standalone string for UI.
    
    # Fix URLs: replace "Activity Data" with "telemetry" inside fetch calls or strings ending with Activity Data
    content = re.sub(r'([/])Activity Data', r'\1telemetry', content)
    content = re.sub(r'Activity Data([`"])', r'telemetry\1', content)
    
    # Fix common variable usage patterns
    content = content.replace('[Activity Data,', '[telemetry,')
    content = content.replace('Activity Data.length', 'telemetry.length')
    
    # If "Activity Data" is used in an object key or similar
    # Actually, let's just do a blanket replace of "Activity Data" with "telemetry"
    # and then manually fix the UI labels later if they get reverted.
    # Security/Logic is more important than UI text right now.
    
    with open(filepath, 'w') as f:
        f.write(content)

# Scan src directory
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            fix_broken_logic(os.path.join(root, file))
