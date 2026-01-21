
import re
import shutil
from pathlib import Path

# Define project root relative to this script
PROJECT_ROOT = Path(__file__).parent

def fix_claude_integration():
    """Fix incomplete function in core/claude_integration.py"""
    print("\nFixing core/claude_integration.py...")

    file_path = PROJECT_ROOT / "core" / "claude_integration.py"
    if not file_path.exists():
        print(f"⚠️  File not found: {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    incomplete_pattern = r'```afl\n\{code\}\n    response = await self\.generate_with_kb_context.*?raise'

    fixed_func = '''```afl
{code}

{kb_context}"""

        response = await self.generate_with_kb_context(
            prompt,
            kb_query="AFL code validation best practices",
            max_tokens=2000,
        )

        return {
            "analysis_type": analysis_type,
            "code_length": len(code),
            "analysis": response,
        }

    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise'''

    content = re.sub(incomplete_pattern, fixed_func, content, flags=re.DOTALL)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("✓ Fixed core/claude_integration.py")


def consolidate_main_files():
    """Consolidate the two main.py files"""
    print("\nConsolidating main.py files...")

    api_main = PROJECT_ROOT / "api" / "main.py"
    if api_main.exists():
        api_main_old = PROJECT_ROOT / "api" / "main_old.py"
        if not api_main_old.exists():
            shutil.move(str(api_main), str(api_main_old))
            print("✓ Moved api/main.py to api/main_old.py")
        else:
            print("⚠️  api/main_old.py already exists, skipping move")


def fix_db_module():
    """Fix circular dependency in db module"""
    print("\nFixing db module...")

    init_file = PROJECT_ROOT / "db" / "__init__.py"
    if not init_file.exists():
        print(f"⚠️  File not found: {init_file}")
        return

    content = '''"""Database module."""

from .supabase_client import get_supabase, get_supabase as get_db

__all__ = ["get_db", "get_supabase"]
'''

    with open(init_file, 'w', encoding='utf-8') as f:
        f.write(content)

    print("✓ Fixed db/__init__.py")

if __name__ == "__main__":
    consolidate_main_files()
    fix_db_module()
    fix_claude_integration()

