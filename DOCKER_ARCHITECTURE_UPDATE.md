# Docker Architecture Update - linux/amd64 Only

This update modifies all CI/CD pipelines to build Docker images exclusively for `linux/amd64` architecture, removing ARM64 support for faster builds and simplified deployment.

## Changes Made

### 1. GitHub Workflows Updated

#### **`.github/workflows/crawler.yml`**
- Updated `platforms: linux/amd64` (removed `linux/arm64`)
- Added build args for platform specification:
  ```yaml
  build-args: |
    BUILDPLATFORM=linux/amd64
    TARGETPLATFORM=linux/amd64
  ```

#### **`.github/workflows/api.yml`**
- Updated `platforms: linux/amd64` (removed `linux/arm64`)
- Added build args for platform specification:
  ```yaml
  build-args: |
    ENABLE_SWAGGER=${{ inputs.enable_swagger }}
    BUILDPLATFORM=linux/amd64
    TARGETPLATFORM=linux/amd64
  ```

#### **`.github/workflows/docker.yml`** (Original)
- Updated `platforms: linux/amd64` (removed `linux/arm64`)
- Added build args for platform specification

### 2. Dockerfile Updates

#### **`docker/Dockerfile.crawler`**
```dockerfile
# Added platform args
ARG BUILDPLATFORM=linux/amd64
ARG TARGETPLATFORM=linux/amd64

# Updated base images
FROM --platform=$BUILDPLATFORM node:20-alpine AS base
FROM --platform=$TARGETPLATFORM node:20-alpine AS production
```

#### **`docker/Dockerfile.api`**
```dockerfile
# Added platform args
ARG BUILDPLATFORM=linux/amd64
ARG TARGETPLATFORM=linux/amd64

# Updated base images
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
FROM --platform=$TARGETPLATFORM node:20-alpine
```

## Benefits

### **Performance**
- ✅ **Faster builds** - Single architecture builds are significantly faster
- ✅ **Reduced build time** - No cross-compilation overhead
- ✅ **Smaller cache requirements** - Less storage needed for build cache

### **Deployment**
- ✅ **Simplified deployment** - Single target architecture
- ✅ **Consistent runtime** - All containers run on same architecture
- ✅ **Better resource utilization** - Optimized for x86_64 servers

### **Maintenance**
- ✅ **Simpler debugging** - Single architecture to troubleshoot
- ✅ **Consistent behavior** - No architecture-specific issues
- ✅ **Faster CI/CD** - Reduced pipeline execution time

## Migration Notes

### **Existing Deployments**
- Images tagged with `:latest` will automatically use linux/amd64
- No manual intervention required for existing deployments
- ARM64 users will need to use emulation or switch to x86_64 hosts

### **New Deployments**
All new deployments will automatically use linux/amd64:
```bash
# Crawler
docker pull registry.sajboch.cz/filmdex-crawler:latest

# API
docker pull registry.sajboch.cz/filmdex-api:latest
```

### **Build Commands**
Local builds now target linux/amd64 by default:
```bash
# Build crawler
docker build -f docker/Dockerfile.crawler --platform linux/amd64 -t filmdex-crawler .

# Build API
docker build -f docker/Dockerfile.api --platform linux/amd64 -t filmdex-api .
```

## Verification

### **Pipeline Verification**
- ✅ Crawler pipeline builds for linux/amd64 only
- ✅ API pipeline builds for linux/amd64 only  
- ✅ Original docker pipeline builds for linux/amd64 only
- ✅ All build args properly configured

### **Dockerfile Verification**
- ✅ Platform args defined in all Dockerfiles
- ✅ Base images use platform specification
- ✅ Multi-stage builds properly configured

### **Registry Images**
After next deployment, all images will be linux/amd64:
- `filmdex-crawler:latest` → linux/amd64
- `filmdex-api:latest` → linux/amd64
- `filmdex:latest` → linux/amd64

## Rollback Plan

If ARM64 support is needed again, revert these changes:
1. Add `linux/arm64` back to `platforms` in workflows
2. Remove platform args from Dockerfiles
3. Remove `--platform` flags from FROM statements

The rollback is straightforward and fully supported by the existing infrastructure.