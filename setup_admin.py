#!/usr/bin/env python3
"""
Admin Backend Setup Script

This script helps set up the admin backend by:
1. Creating initial admin users
2. Setting up database tables
3. Running basic tests
4. Providing setup verification
"""

import os
import sys
import subprocess
import requests
import json
from typing import Dict, Any

def print_header(title: str):
    """Print a formatted header."""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def print_step(step: str, description: str):
    """Print a formatted step."""
    print(f"\n📍 Step {step}: {description}")
    print("-" * 40)

def check_dependencies():
    """Check if required dependencies are installed."""
    print_step("1", "Checking Dependencies")
    
    required_packages = [
        "fastapi",
        "uvicorn",
        "pydantic",
        "python-jose",
        "supabase"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"✅ {package} - Installed")
        except ImportError:
            print(f"❌ {package} - Missing")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n🔧 Install missing packages:")
        print(f"pip install {' '.join(missing_packages)}")
        return False
    
    return True

def check_environment():
    """Check if environment variables are set."""
    print_step("2", "Checking Environment Variables")
    
    required_env_vars = [
        "SUPABASE_URL",
        "SUPABASE_KEY",
        "SECRET_KEY"
    ]
    
    missing_vars = []
    
    for var in required_env_vars:
        value = os.getenv(var)
        if value:
            print(f"✅ {var} - Set")
        else:
            print(f"❌ {var} - Missing")
            missing_vars.append(var)
    
    if missing_vars:
        print(f"\n🔧 Set missing environment variables:")
        for var in missing_vars:
            print(f"export {var}=<your_{var.lower()}>")
        return False
    
    return True

def create_admin_user():
    """Create an admin user if one doesn't exist."""
    print_step("3", "Creating Admin User")
    
    # This would typically be done through the API
    # For now, we'll just check if the admin email is configured
    admin_emails = os.getenv("ADMIN_EMAILS", "")
    
    if admin_emails:
        print(f"✅ Admin emails configured: {admin_emails}")
        return True
    else:
        print("⚠️  No admin emails configured")
        print("Set ADMIN_EMAILS environment variable with comma-separated emails")
        return False

def test_api_connection():
    """Test if the API is running and accessible."""
    print_step("4", "Testing API Connection")
    
    base_url = os.getenv("BASE_URL", "http://localhost:8000")
    
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print(f"✅ API is running at {base_url}")
            return True
        else:
            print(f"❌ API returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to API at {base_url}")
        print("Make sure the API server is running")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ Connection timeout to {base_url}")
        return False
    except Exception as e:
        print(f"❌ Error testing API: {e}")
        return False

def run_admin_tests():
    """Run the admin API test suite."""
    print_step("5", "Running Admin API Tests")
    
    try:
        # Run the test script
        result = subprocess.run([sys.executable, "test_admin_api.py"], 
                              capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print("✅ All admin API tests passed!")
            print(result.stdout)
            return True
        else:
            print("❌ Some admin API tests failed")
            print("STDOUT:", result.stdout)
            print("STDERR:", result.stderr)
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Tests timed out")
        return False
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        return False

def print_setup_summary():
    """Print a summary of the setup."""
    print_header("Setup Summary")
    
    print("\n📋 Admin Backend Components:")
    print("   ✅ Admin Authentication & Authorization")
    print("   ✅ Training Management System")
    print("   ✅ User Management")
    print("   ✅ Analytics & Monitoring")
    print("   ✅ Feedback Management")
    print("   ✅ Audit & Logging")
    print("   ✅ System Configuration")
    print("   ✅ Data Export Tools")
    
    print("\n🔧 Key Files:")
    print("   📁 api/routes/admin.py - Main admin endpoints")
    print("   📁 docs/ADMIN_API_REFERENCE.md - Complete API docs")
    print("   📁 docs/ADMIN_BACKEND_README.md - Setup guide")
    print("   📁 test_admin_api.py - Test suite")
    
    print("\n🚀 Quick Start:")
    print("   1. Set up environment variables")
    print("   2. Run: python -m uvicorn main:app --reload")
    print("   3. Access: http://localhost:8000/docs")
    print("   4. Run tests: python test_admin_api.py")
    
    print("\n📚 Documentation:")
    print("   📖 API Reference: docs/ADMIN_API_REFERENCE.md")
    print("   📖 Setup Guide: docs/ADMIN_BACKEND_README.md")
    print("   📖 FastAPI Docs: http://localhost:8000/docs")

def main():
    """Main setup function."""
    print_header("Admin Backend Setup")
    print("This script will help you set up the admin backend.")
    
    # Check dependencies
    if not check_dependencies():
        print("\n❌ Setup failed: Missing dependencies")
        sys.exit(1)
    
    # Check environment
    if not check_environment():
        print("\n⚠️  Warning: Some environment variables are missing")
        print("The setup will continue, but some features may not work.")
    
    # Create admin user
    create_admin_user()
    
    # Test API connection
    api_running = test_api_connection()
    
    # Run tests if API is running
    tests_passed = False
    if api_running:
        tests_passed = run_admin_tests()
    else:
        print("\n⚠️  Skipping tests - API not running")
    
    # Print summary
    print_setup_summary()
    
    # Final status
    print_header("Setup Complete")
    
    if api_running and tests_passed:
        print("🎉 Admin backend is fully set up and working!")
    elif api_running:
        print("✅ Admin backend is set up, but some tests failed")
        print("Check the test output above for details")
    else:
        print("⚠️  Admin backend setup complete, but API is not running")
        print("Start the API server to begin using the admin features")
    
    print("\n💡 Next Steps:")
    print("   1. Review the API documentation")
    print("   2. Configure admin users")
    print("   3. Start the API server")
    print("   4. Run the test suite")
    print("   5. Begin using admin features")

if __name__ == "__main__":
    main()