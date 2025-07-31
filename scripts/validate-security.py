#!/usr/bin/env python3
"""
Security Validation Script

This script validates that security best practices are in place:
1. No runtime package installation code exists
2. All dependencies are properly specified in requirements.txt
3. Critical security patterns are followed

Run this script before deployment to ensure security compliance.
"""

import os
import re
import sys
from pathlib import Path

def check_runtime_installation():
    """Check for runtime package installation patterns."""
    print("🔍 Checking for runtime package installation patterns...")
    
    dangerous_patterns = [
        r'subprocess.*pip.*install',
        r'pip.*install.*subprocess',
        r'os\.system.*pip.*install',
        r'import.*subprocess.*pip'
    ]
    
    violations = []
    
    # Check Python files
    for py_file in Path('.').rglob('*.py'):
        if ('venv' in str(py_file) or 
            '__pycache__' in str(py_file) or 
            'validate-security.py' in str(py_file)):
            continue
            
        try:
            content = py_file.read_text(encoding='utf-8')
            for pattern in dangerous_patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    violations.append(f"{py_file}: Contains runtime installation pattern")
        except Exception as e:
            print(f"⚠️  Could not read {py_file}: {e}")
    
    if violations:
        print("❌ Security violations found:")
        for violation in violations:
            print(f"   {violation}")
        return False
    else:
        print("✅ No runtime package installation patterns found")
        return True

def check_requirements_file():
    """Check that requirements.txt exists and has necessary packages."""
    print("\n🔍 Checking requirements.txt...")
    
    requirements_path = Path('requirements.txt')
    if not requirements_path.exists():
        print("❌ requirements.txt not found")
        return False
    
    content = requirements_path.read_text()
    critical_packages = ['librosa', 'pydub', 'numpy', 'madmom', 'spleeter']
    missing_packages = []
    
    for package in critical_packages:
        if package not in content.lower():
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing critical packages in requirements.txt: {missing_packages}")
        return False
    else:
        print("✅ All critical packages found in requirements.txt")
        return True

def check_error_handling():
    """Check for proper error handling in import statements."""
    print("\n🔍 Checking import error handling...")
    
    violations = []
    
    for py_file in Path('.').rglob('*.py'):
        if ('venv' in str(py_file) or 
            '__pycache__' in str(py_file) or
            'validate-security.py' in str(py_file)):
            continue
            
        try:
            content = py_file.read_text(encoding='utf-8')
            
            # Check for bare import statements of critical packages
            if 'import madmom' in content or 'from spleeter' in content:
                if 'except ImportError' not in content:
                    violations.append(f"{py_file}: Missing ImportError handling")
                    
        except Exception as e:
            print(f"⚠️  Could not read {py_file}: {e}")
    
    if violations:
        print("❌ Import error handling violations found:")
        for violation in violations:
            print(f"   {violation}")
        return False
    else:
        print("✅ Proper import error handling found")
        return True

def check_security_documentation():
    """Check that security documentation exists."""
    print("\n🔍 Checking security documentation...")
    
    docs = [
        'PRODUCTION_SECURITY_GUIDE.md',
        'scripts/setup-dev-environment.py'
    ]
    
    missing_docs = []
    for doc in docs:
        if not Path(doc).exists():
            missing_docs.append(doc)
    
    if missing_docs:
        print(f"❌ Missing security documentation: {missing_docs}")
        return False
    else:
        print("✅ Security documentation found")
        return True

def main():
    """Run all security validation checks."""
    print("🔒 Music DJ Feature - Security Validation")
    print("=" * 50)
    
    checks = [
        check_runtime_installation,
        check_requirements_file,
        check_error_handling,
        check_security_documentation
    ]
    
    all_passed = True
    for check in checks:
        if not check():
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("✅ All security checks passed!")
        print("🚀 Application is ready for secure deployment")
        sys.exit(0)
    else:
        print("❌ Security validation failed!")
        print("🛑 Please fix the issues above before deployment")
        sys.exit(1)

if __name__ == "__main__":
    main()
