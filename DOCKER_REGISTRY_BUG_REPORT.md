# Docker Registry Push Failure - Bug Report

## Issue Summary
Docker images cannot be pushed to the registry `registry.sajboch.cz` due to "unknown blob" errors occurring consistently across different environments and image types.

## Environment Details
- **Registry URL**: `registry.sajboch.cz`
- **Registry Version**: Docker Registry v2.0 (confirmed via API headers)
- **CDN/Proxy**: Cloudflare
- **Authentication**: Basic Auth (working correctly)
- **Client Environments Tested**: 
  - Local macOS (Docker Desktop)
  - GitHub Actions Ubuntu runners

## Error Details

### Primary Error Message
```
ERROR: failed to build: unknown blob
```

### Full Error Context
```bash
The push refers to repository [registry.sajboch.cz/filmdex]
3ffdde35f009: Preparing
d18f3fd60c52: Preparing
ff9f222507a6: Preparing
[... layers preparing ...]
ERROR: unknown blob
```

## Reproduction Steps

### 1. Local Docker Push Test
```bash
# Authentication (working)
echo "fasxnuDgmST5jVP84OoFQK45asFASGw" | docker login registry.sajboch.cz -u tonda --password-stdin
# Result: Login Succeeded

# Build image (working)
docker build -f docker/Dockerfile.api -t registry.sajboch.cz/filmdex:test .
# Result: Build completed successfully

# Push image (failing)
docker push registry.sajboch.cz/filmdex:test
# Result: unknown blob error
```

### 2. Simple Image Test
```bash
# Test with minimal image
docker pull hello-world
docker tag hello-world registry.sajboch.cz/hello-world:test
docker push registry.sajboch.cz/hello-world:test
# Result: Same "unknown blob" error
```

### 3. GitHub Actions Pipeline Test
- **Workflow**: `.github/workflows/docker.yml`
- **Authentication**: GitHub Secrets configured correctly
- **Build**: Completes successfully in CI
- **Push**: Fails with same "unknown blob" error

## Registry Connectivity Tests

### API Endpoint Tests (All Working)
```bash
# Registry root endpoint
curl -u "tonda:fasxnuDgmST5jVP84OoFQK45asFASGw" https://registry.sajboch.cz/v2/ -I
# Result: HTTP/2 200 OK

# Registry catalog
curl -u "tonda:fasxnuDgmST5jVP84OoFQK45asFASGw" https://registry.sajboch.cz/v2/_catalog
# Result: {"repositories":[]} (empty but valid response)
```

### Registry Headers
```
docker-distribution-api-version: registry/2.0
server: cloudflare
```

## Analysis

### What's Working ✅
- Registry authentication via Basic Auth
- Docker image builds (local and CI)
- Registry API connectivity
- Registry catalog access
- Docker login process

### What's Failing ❌
- Blob upload during push operation
- Occurs with both complex multi-layer images and simple single-layer images
- Consistent across different Docker environments
- Affects both manual and automated pushes

## Technical Investigation Results

### Authentication Verification
- Credentials work for API endpoints
- `docker login` succeeds
- GitHub Actions secrets configured correctly
- No 401/403 errors during push initiation

### Build Process Verification  
- Docker builds complete successfully
- Images are properly tagged
- No build-time errors
- Image layers are created correctly locally

### Network/Connectivity Verification
- Registry responds to API calls
- No DNS resolution issues
- No network timeouts during API calls
- Cloudflare proxy allowing connections

## Suspected Root Causes

### 1. Registry Storage Backend Issue (High Probability)
- Blob storage misconfiguration
- Corrupted blob storage directory
- Insufficient disk space on registry server
- Storage backend permission issues

### 2. Registry Version/Compatibility Issue (Medium Probability)
- Older registry version with blob handling bugs
- Docker client version incompatibility
- Registry configuration outdated

### 3. Cloudflare Proxy Interference (Medium Probability)
- Cloudflare settings interfering with blob uploads
- Request size limits
- Timeout configurations
- SSL/TLS termination issues

### 4. Registry Configuration Issue (Medium Probability)
- Incorrect storage driver configuration
- Missing or misconfigured storage parameters
- Registry-specific blob handling settings

## Recommended Investigation Steps

### 1. Server-Side Checks (High Priority)
```bash
# Check registry server logs
docker logs <registry-container-name>

# Check disk space
df -h

# Check storage directory permissions
ls -la /var/lib/registry/

# Check registry configuration
cat /etc/docker/registry/config.yml
```

### 2. Registry Configuration Review
- Verify storage driver configuration
- Check blob upload settings
- Review any size limits or restrictions
- Validate storage backend connectivity

### 3. Cloudflare Configuration Review
- Check request size limits
- Verify timeout settings
- Review SSL/TLS configuration  
- Consider temporary bypass for testing

### 4. Registry Version Check
```bash
# Check registry version
curl -u "tonda:fasxnuDgmST5jVP84OoFQK45asFASGw" https://registry.sajboch.cz/v2/ -v
```

## Workaround Attempts

### Attempted Solutions (All Failed)
1. **Docker Driver Changes**: Tested both `docker` and `docker-container` drivers
2. **Authentication Methods**: Tried multiple credential passing methods
3. **Build Strategies**: Attempted different build and push strategies
4. **Timeout Adjustments**: Increased client timeout settings
5. **Image Simplification**: Tested with minimal hello-world image

## Impact Assessment

### Development Impact
- ⚠️ **Blocking**: Unable to deploy containerized applications
- ⚠️ **CI/CD Pipeline**: GitHub Actions deployment pipeline non-functional
- ⚠️ **Development Workflow**: Manual deployment process required

### Business Impact
- 🔄 **Deployment Process**: Manual workarounds required
- ⏱️ **Development Velocity**: Reduced due to deployment friction
- 🔧 **DevOps Automation**: Container deployment automation broken

## Next Steps

### Immediate Actions Required
1. **Registry Server Investigation**: Check server logs and storage configuration
2. **Storage Backend Verification**: Verify disk space and permissions
3. **Configuration Review**: Audit registry configuration files

### Alternative Solutions
1. **Temporary Registry**: Set up alternative registry for immediate needs
2. **Direct Server Deployment**: Bypass registry for critical deployments  
3. **Registry Migration**: Consider migrating to managed registry service

## Attachments

### Configuration Files
- GitHub Actions Workflow: `.github/workflows/docker.yml`
- Dockerfile: `docker/Dockerfile.api`
- Environment Variables: Configured in GitHub Secrets

### Test Commands Used
```bash
# Registry connectivity
curl -u "tonda:fasxnuDgmST5jVP84OoFQK45asFASGw" https://registry.sajboch.cz/v2/ -I

# Docker operations
docker build -f docker/Dockerfile.api -t registry.sajboch.cz/filmdex:test .
docker push registry.sajboch.cz/filmdex:test

# Simple image test
docker pull hello-world
docker tag hello-world registry.sajboch.cz/hello-world:test  
docker push registry.sajboch.cz/hello-world:test
```

---

**Report Generated**: July 31, 2025  
**Reporter**: Claude Code Assistant  
**Severity**: High - Blocking Development Operations  
**Status**: Investigation Required