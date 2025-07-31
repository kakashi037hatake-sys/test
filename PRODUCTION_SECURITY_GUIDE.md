<!-- @format -->

# Production Deployment Security Guide

## Overview

This document outlines security best practices for deploying the Music DJ Feature application to production environments.

## Package Management Security

### ⚠️ Security Issue: Runtime Package Installation

The application previously had runtime package installation logic that would automatically install missing Python packages using `pip install` during execution. **This has been removed for security reasons.**

### ✅ Secure Deployment Practices

#### 1. Pre-installed Dependencies

- All dependencies must be pre-installed in the deployment environment
- Use `requirements.txt` to specify exact versions of all dependencies
- Never install packages at runtime in production

#### 2. Container-Based Deployment (Recommended)

Create a `Dockerfile` that installs all dependencies during the build process:

```dockerfile
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies during build
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Run application
CMD ["python", "server/index.py"]
```

#### 3. Virtual Environment for Traditional Deployments

If not using containers:

```bash
# Create virtual environment
python -m venv production_env

# Activate virtual environment
source production_env/bin/activate  # Linux/Mac
# or
production_env\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Verify installation
python scripts/setup-dev-environment.py
```

#### 4. Dependency Pinning

Ensure `requirements.txt` pins exact versions:

```text
librosa==0.10.1
pydub==0.25.1
numpy==1.24.3
# etc.
```

#### 5. Security Scanning

Run security scans on dependencies:

```bash
# Install safety
pip install safety

# Check for known vulnerabilities
safety check -r requirements.txt

# Use bandit for code security analysis
pip install bandit
bandit -r server/
```

## Environment Configuration

### 1. Environment Variables

Store sensitive configuration in environment variables, not in code:

```bash
export TEMP_DIR="/secure/temp/path"
export LOG_LEVEL="WARNING"
export MAX_FILE_SIZE="100MB"
```

### 2. File System Security

- Ensure upload directories have restricted permissions
- Use temporary directories with proper cleanup
- Validate file types and sizes before processing

### 3. Network Security

- Use HTTPS in production
- Implement proper CORS policies
- Consider rate limiting for API endpoints

## Monitoring and Logging

### 1. Security Logging

- Log all file upload attempts
- Monitor for unusual package import failures
- Track resource usage to detect potential attacks

### 2. Error Handling

- Never expose internal error details to users
- Log errors securely for debugging
- Implement graceful fallbacks for missing dependencies

## Deployment Checklist

- [ ] All dependencies pre-installed via requirements.txt
- [ ] No runtime package installation code present
- [ ] Dependencies scanned for vulnerabilities
- [ ] Environment variables configured
- [ ] File upload restrictions in place
- [ ] Security logging enabled
- [ ] HTTPS configured
- [ ] Rate limiting implemented
- [ ] Error handling reviewed
- [ ] Monitoring setup complete

## Emergency Response

If runtime package installation is discovered in production:

1. Immediately disable the affected service
2. Review logs for any unauthorized package installations
3. Rebuild the environment with proper dependency management
4. Conduct security audit of the deployment process

## Resources

- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)
- [Python Security Best Practices](https://python.org/dev/security/)
- [Container Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
