#!/usr/bin/env python3
"""
Admin API Test Suite

This script tests all admin endpoints to ensure they work correctly.
Run this script to verify the admin backend functionality.
"""

import requests
import json
import time
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "test@gamil.com"
ADMIN_PASSWORD = "test123"  # Change this to your actual password

class AdminAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.admin_id = None
        
    def login(self):
        """Login as admin to get JWT token."""
        print("🔐 Logging in as admin...")
        
        login_data = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        response = requests.post(f"{self.base_url}/auth/login", json=login_data)
        
        if response.status_code == 200:
            result = response.json()
            self.token = result.get("access_token")
            print(f"✅ Login successful! Token: {self.token[:20]}...")
            return True
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
    
    def get_headers(self):
        """Get headers with authorization."""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_admin_status(self):
        """Test admin status endpoint."""
        print("\n📋 Testing admin status...")
        
        response = requests.get(f"{self.base_url}/admin/status", headers=self.get_headers())
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Admin status: {result['status']}")
            print(f"   Users: {result['stats']['total_users']}")
            print(f"   Training: {result['stats']['training']['total']}")
            return True
        else:
            print(f"❌ Admin status failed: {response.status_code} - {response.text}")
            return False
    
    def test_list_users(self):
        """Test list users endpoint."""
        print("\n👥 Testing list users...")
        
        response = requests.get(f"{self.base_url}/admin/users", headers=self.get_headers())
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['count']} users out of {result['total']}")
            if result['users']:
                user = result['users'][0]
                print(f"   Sample user: {user['email']} (admin: {user['is_admin']})")
            return True
        else:
            print(f"❌ List users failed: {response.status_code} - {response.text}")
            return False
    
    def test_get_config(self):
        """Test get config endpoint."""
        print("\n⚙️  Testing get config...")
        
        response = requests.get(f"{self.base_url}/admin/config", headers=self.get_headers())
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Config loaded")
            print(f"   Admin emails: {len(result['admin_emails'])} configured")
            print(f"   Training types: {len(result['training_types'])}")
            return True
        else:
            print(f"❌ Get config failed: {response.status_code} - {response.text}")
            return False
    
    def test_add_training(self):
        """Test add training endpoint."""
        print("\n🎓 Testing add training...")
        
        training_data = {
            "training_type": "rule",
            "title": "Test Rule - Always use SetTradeDelays",
            "input_prompt": "trade timing",
            "expected_output": "SetTradeDelays(0, 0, 0, 0); // for same bar execution",
            "explanation": "SetTradeDelays must be specified to avoid look-ahead bias",
            "category": "afl",
            "tags": ["timing", "execution"],
            "priority": 9
        }
        
        response = requests.post(
            f"{self.base_url}/admin/train",
            headers=self.get_headers(),
            json=training_data
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("status") == "success":
                training_id = result["data"]["id"]
                print(f"✅ Training added: {training_id}")
                return training_id
            else:
                print(f"❌ Training creation failed: {result}")
                return None
        else:
            print(f"❌ Add training failed: {response.status_code} - {response.text}")
            return None
    
    def test_list_training(self):
        """Test list training endpoint."""
        print("\n📚 Testing list training...")
        
        response = requests.get(f"{self.base_url}/admin/training", headers=self.get_headers())
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['count']} training examples")
            if result['examples']:
                example = result['examples'][0]
                print(f"   Sample: {example['title']} (type: {example['training_type']})")
            return True
        else:
            print(f"❌ List training failed: {response.status_code} - {response.text}")
            return False
    
    def test_training_stats(self):
        """Test training stats endpoint."""
        print("\n📊 Testing training stats...")
        
        response = requests.get(f"{self.base_url}/admin/training/stats/overview", headers=self.get_headers())
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Training stats:")
            print(f"   Total: {result['total']}")
            print(f"   Active: {result['active']}")
            print(f"   By type: {result['by_type']}")
            return True
        else:
            print(f"❌ Training stats failed: {response.status_code} - {response.text}")
            return False
    
    def test_preview_training_context(self):
        """Test preview training context endpoint."""
        print("\n🔍 Testing preview training context...")
        
        response = requests.get(f"{self.base_url}/admin/training/context/preview", headers=self.get_headers())
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Context preview:")
            print(f"   Length: {result['context_length']} characters")
            if result['context']:
                preview = result['context'][:200] + "..." if len(result['context']) > 200 else result['context']
                print(f"   Preview: {preview}")
            return True
        else:
            print(f"❌ Preview context failed: {response.status_code} - {response.text}")
            return False
    
    def test_list_feedback(self):
        """Test list feedback endpoint."""
        print("\n💬 Testing list feedback...")
        
        response = requests.get(f"{self.base_url}/admin/feedback", headers=self.get_headers())
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['count']} feedback items")
            if result['feedback']:
                feedback = result['feedback'][0]
                print(f"   Sample: {feedback['feedback_type']} (rating: {feedback.get('rating', 'N/A')})")
            return True
        else:
            print(f"❌ List feedback failed: {response.status_code} - {response.text}")
            return False
    
    def test_list_suggestions(self):
        """Test list suggestions endpoint."""
        print("\n💡 Testing list suggestions...")
        
        response = requests.get(f"{self.base_url}/admin/suggestions", headers=self.get_headers())
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['count']} suggestions")
            if result['suggestions']:
                suggestion = result['suggestions'][0]
                print(f"   Sample: {suggestion['title']} (status: {suggestion['status']})")
            return True
        else:
            print(f"❌ List suggestions failed: {response.status_code} - {response.text}")
            return False
    
    def test_analytics_overview(self):
        """Test analytics overview endpoint."""
        print("\n📈 Testing analytics overview...")
        
        response = requests.get(f"{self.base_url}/admin/analytics/overview?days=7", headers=self.get_headers())
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Analytics for {result['period']}:")
            print(f"   Users: {result['users']['total']} total, {result['users']['active']} active")
            print(f"   Code generation: {result['code_generation']['recent_codes']} in period")
            print(f"   Feedback: {result['feedback']['total']} total, avg rating {result['feedback']['average_rating']}")
            return True
        else:
            print(f"❌ Analytics overview failed: {response.status_code} - {response.text}")
            return False
    
    def test_system_health(self):
        """Test system health endpoint."""
        print("\n🏥 Testing system health...")
        
        response = requests.get(f"{self.base_url}/admin/health/system", headers=self.get_headers())
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ System status: {result['status']}")
            print(f"   Components: {result['components']}")
            print(f"   Metrics: {result['metrics']}")
            return True
        else:
            print(f"❌ System health failed: {response.status_code} - {response.text}")
            return False
    
    def test_export_users(self):
        """Test export users endpoint."""
        print("\n📤 Testing export users...")
        
        response = requests.get(f"{self.base_url}/admin/export/users", headers=self.get_headers())
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Exported {result['total_users']} users")
            if result['users']:
                user = result['users'][0]
                print(f"   Sample export: {user['email']} ({user['codes_generated']} codes, {user['feedback_submitted']} feedback)")
            return True
        else:
            print(f"❌ Export users failed: {response.status_code} - {response.text}")
            return False
    
    def test_export_training(self):
        """Test export training endpoint."""
        print("\n📤 Testing export training...")
        
        response = requests.get(f"{self.base_url}/admin/export/training", headers=self.get_headers())
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Exported {result['total_training']} training examples")
            return True
        else:
            print(f"❌ Export training failed: {response.status_code} - {response.text}")
            return False
    
    def run_all_tests(self):
        """Run all admin API tests."""
        print("🚀 Starting Admin API Test Suite")
        print("=" * 50)
        
        # Login first
        if not self.login():
            print("❌ Cannot proceed without login")
            return False
        
        # Run tests
        tests = [
            self.test_admin_status,
            self.test_list_users,
            self.test_get_config,
            self.test_add_training,
            self.test_list_training,
            self.test_training_stats,
            self.test_preview_training_context,
            self.test_list_feedback,
            self.test_list_suggestions,
            self.test_analytics_overview,
            self.test_system_health,
            self.test_export_users,
            self.test_export_training,
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with exception: {e}")
                failed += 1
        
        print("\n" + "=" * 50)
        print(f"🏁 Test Results: {passed} passed, {failed} failed")
        
        if failed == 0:
            print("🎉 All tests passed!")
        else:
            print(f"⚠️  {failed} tests failed. Check the output above for details.")
        
        return failed == 0

def main():
    """Main function to run the test suite."""
    tester = AdminAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Admin API is working correctly!")
    else:
        print("\n❌ Admin API has issues that need to be addressed.")
    
    return success

if __name__ == "__main__":
    main()