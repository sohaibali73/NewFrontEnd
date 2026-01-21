"""
Patch script to add sanity_check_afl dispatcher entry to core/tools.py
Run this script once to apply the fix.
"""

import os

# Read the file
file_path = os.path.join(os.path.dirname(__file__), 'core', 'tools.py')
with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Check if already patched
if 'elif tool_name == "sanity_check_afl"' in content:
    print("✓ Already patched - sanity_check_afl is in dispatcher")
else:
    # Find and replace
    old_text = '''        elif tool_name == "explain_afl_code":
            result = explain_afl_code(
                code=tool_input.get("code", ""),
                api_key=api_key
            )
        
        else:
            result = {"error": f"Unknown tool: {tool_name}"}'''
    
    new_text = '''        elif tool_name == "explain_afl_code":
            result = explain_afl_code(
                code=tool_input.get("code", ""),
                api_key=api_key
            )
        
        elif tool_name == "sanity_check_afl":
            result = sanity_check_afl(
                code=tool_input.get("code", ""),
                auto_fix=tool_input.get("auto_fix", True)
            )
        
        else:
            result = {"error": f"Unknown tool: {tool_name}"}'''
    
    if old_text in content:
        content = content.replace(old_text, new_text)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✓ Successfully patched - sanity_check_afl added to dispatcher")
    else:
        print("✗ Could not find the expected pattern to patch")
        print("Manual fix needed: Add the sanity_check_afl dispatcher entry after explain_afl_code")

# Verify
with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

if 'elif tool_name == "sanity_check_afl"' in content:
    print("✓ Verification passed!")
else:
    print("✗ Verification failed - please check file manually")