#!/usr/bin/env python3
"""
Development Environment Setup Script

This script sets up the development environment by:
1. Checking Python version compatibility
2. Installing all required dependencies from requirements.txt
3. Verifying that critical packages are properly installed
4. Setting up any necessary configuration

This should be used ONLY in development environments, not in production.
"""

import subprocess
import sys
import os
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_python_version():
    """Check if Python version is compatible."""
    if sys.version_info < (3, 8):
        logger.error("Python 3.8 or higher is required. Current version: %s", sys.version)
        return False
    logger.info("Python version check passed: %s", sys.version)
    return True

def install_requirements():
    """Install all requirements from requirements.txt."""
    requirements_path = os.path.join(os.path.dirname(__file__), '..', 'requirements.txt')
    
    if not os.path.exists(requirements_path):
        logger.error("requirements.txt not found at %s", requirements_path)
        return False
    
    try:
        logger.info("Installing requirements from %s", requirements_path)
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", requirements_path],
            capture_output=True,
            text=True,
            check=True
        )
        logger.info("Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error("Failed to install requirements: %s", e.stderr)
        return False

def verify_critical_packages():
    """Verify that critical packages are installed and importable."""
    critical_packages = [
        'librosa',
        'pydub', 
        'numpy',
        'madmom',
        'spleeter',
        'tensorflow'
    ]
    
    failed_packages = []
    
    for package in critical_packages:
        try:
            __import__(package)
            logger.info("✓ %s is installed and importable", package)
        except ImportError:
            logger.error("✗ %s failed to import", package)
            failed_packages.append(package)
    
    if failed_packages:
        logger.error("The following critical packages failed to import: %s", failed_packages)
        logger.error("Please ensure all dependencies are properly installed")
        return False
    
    logger.info("All critical packages verified successfully")
    return True

def setup_virtual_environment():
    """Check if running in a virtual environment and recommend one if not."""
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        logger.info("✓ Running in virtual environment: %s", sys.prefix)
        return True
    else:
        logger.warning("⚠ Not running in a virtual environment")
        logger.warning("It's recommended to use a virtual environment:")
        logger.warning("  python -m venv venv")
        logger.warning("  venv\\Scripts\\activate  # Windows")
        logger.warning("  source venv/bin/activate  # Linux/Mac")
        return False

def main():
    """Main setup function."""
    logger.info("Starting development environment setup...")
    
    success = True
    
    # Check Python version
    if not check_python_version():
        success = False
    
    # Check virtual environment
    setup_virtual_environment()
    
    # Install requirements
    if not install_requirements():
        success = False
    
    # Verify critical packages
    if not verify_critical_packages():
        success = False
    
    if success:
        logger.info("✓ Development environment setup completed successfully!")
        logger.info("You can now run the application.")
    else:
        logger.error("✗ Development environment setup failed!")
        logger.error("Please resolve the issues above before running the application.")
        sys.exit(1)

if __name__ == "__main__":
    main()
