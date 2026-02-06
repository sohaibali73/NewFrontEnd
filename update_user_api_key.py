"""
Update user's Claude API key in the database
"""
import os
from db.supabase_client import get_supabase

def update_user_api_key(email: str, new_api_key: str):
    """Update the Claude API key for a specific user."""
    db = get_supabase()
    
    # Update the user's API key
    result = db.table("users").update({
        "claude_api_key": new_api_key
    }).eq("email", email).execute()
    
    if result.data:
        print(f"✅ Successfully updated API key for {email}")
        return True
    else:
        print(f"❌ Failed to update API key for {email}")
        return False

if __name__ == "__main__":
    # IMPORTANT: Replace this with your actual Claude API key
    # You can get one from https://console.anthropic.com/
    CLAUDE_API_KEY = "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"
    
    if CLAUDE_API_KEY == "YOUR_ACTUAL_CLAUDE_API_KEY_HERE":
        print("❌ Please replace 'YOUR_ACTUAL_CLAUDE_API_KEY_HERE' with your actual Claude API key")
        print("Edit this file and replace the placeholder with your key from https://console.anthropic.com/")
        exit(1)
    
    if not CLAUDE_API_KEY.startswith("sk-ant-"):
        print("❌ Invalid API key format. Claude API keys start with 'sk-ant-'")
        exit(1)
    
    # Update for the test user
    update_user_api_key("test@example.com", CLAUDE_API_KEY)
    print("\n✨ Done! You can now test the streaming functionality in the chat interface.")
