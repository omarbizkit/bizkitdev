# Quickstart: E2E Test Configuration Validation

**Feature**: 055-continue-e2e-troubleshooting
**Date**: 2025-09-16

## Overview

This quickstart guide validates that E2E test configuration fixes are working correctly by running the complete test validation workflow.

## Prerequisites

Before running this quickstart:

- [ ] Node.js 18+ installed
- [ ] npm dependencies installed (`npm install`)
- [ ] Git repository in clean state
- [ ] No other development servers running on port 4321

## Quick Validation Steps

### Step 1: Validate Local Environment

```bash
# Verify Node.js version
node --version  # Should be 18+

# Verify npm dependencies
npm list playwright @playwright/test

# Check for port conflicts
lsof -i :4321 || echo "Port 4321 available"
```

**Expected Output**: No errors, port 4321 available

### Step 2: Validate Configuration Alignment

```bash
# Check server configuration
grep -r "4321" astro.config.mjs package.json playwright.config.ts

# Verify test selectors exist
grep -r "data-testid" src/components/ src/pages/
```

**Expected Output**: Port 4321 configured consistently, test selectors present in DOM

### Step 3: Run Development Server Health Check

```bash
# Start development server
npm run dev &
DEV_PID=$!

# Wait for server startup
sleep 5

# Test health endpoint
curl -f http://localhost:4321/api/health

# Stop development server
kill $DEV_PID
```

**Expected Output**:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-16T...",
  "port": 4321
}
```

### Step 4: Validate Playwright Configuration

```bash
# Check Playwright installation
npx playwright --version

# Verify browser installation path
echo "Browser path: ${PLAYWRIGHT_BROWSERS_PATH:-default}"

# Test browser installation
npx playwright install --dry-run
```

**Expected Output**: Playwright installed, browsers available

### Step 5: Run E2E Test Validation

```bash
# Run minimal E2E test to validate configuration
npm run test:e2e -- --grep "subscription" --max-failures=1

# Alternative: Run specific test file
npx playwright test tests/e2e/subscription.spec.ts --headed=false
```

**Expected Output**: Tests pass without configuration errors

### Step 6: Validate CI Environment Simulation

```bash
# Simulate CI environment variables
export PUBLIC_SUPABASE_URL="https://mock.supabase.co"
export PUBLIC_SUPABASE_ANON_KEY="mock-anon-key-safe-for-ci"
export PLAYWRIGHT_BROWSERS_PATH="/tmp/playwright-browsers"

# Install browsers in CI-like path
npx playwright install chromium

# Run tests with CI configuration
npm run test:e2e -- --project=chromium --reporter=line
```

**Expected Output**: Tests pass with CI-like configuration

## Full Integration Test

Run the complete validation workflow:

```bash
#!/bin/bash
set -e

echo "🔍 Running E2E Configuration Validation Quickstart"

echo "📋 Step 1: Environment validation"
node --version
npm list playwright --depth=0

echo "📋 Step 2: Configuration alignment check"
CONFIG_CHECK=$(grep -c "4321" playwright.config.ts package.json astro.config.mjs || true)
if [ "$CONFIG_CHECK" -lt 3 ]; then
  echo "❌ Port configuration not aligned across all files"
  exit 1
fi

echo "📋 Step 3: Server health check"
npm run dev &
DEV_PID=$!
sleep 10

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/api/health)
if [ "$HEALTH_CHECK" != "200" ]; then
  echo "❌ Health check failed: HTTP $HEALTH_CHECK"
  kill $DEV_PID
  exit 1
fi

echo "📋 Step 4: E2E test execution"
npm run test:e2e -- --grep "subscription" --max-failures=1

kill $DEV_PID

echo "✅ All validation steps passed!"
echo "🎉 E2E test configuration is properly aligned and working"
```

**Save as**: `scripts/quickstart-validation.sh`

## Validation Scenarios

### Scenario 1: Port Configuration Validation

**Goal**: Verify all configuration files use consistent port numbers

**Steps**:
1. Check `playwright.config.ts` webServer.url contains `:4321`
2. Check `package.json` dev script starts server on port 4321
3. Check `astro.config.mjs` server configuration
4. Verify test files use correct base URL

**Success Criteria**: All configurations reference port 4321

### Scenario 2: Selector Existence Validation

**Goal**: Verify test selectors match actual DOM elements

**Steps**:
1. Start development server
2. Navigate to homepage in browser
3. Check for `data-testid="hero-subscribe-form"` element
4. Navigate to subscribe page
5. Check for `data-testid="subscribe-form"` element

**Success Criteria**: All test selectors exist in corresponding pages

### Scenario 3: Browser Environment Validation

**Goal**: Verify browser installation and configuration consistency

**Steps**:
1. Set `PLAYWRIGHT_BROWSERS_PATH` environment variable
2. Install browsers using Playwright
3. Verify browser installation in expected path
4. Run simple browser test to confirm functionality

**Success Criteria**: Browsers install and run correctly in specified path

### Scenario 4: CI Environment Simulation

**Goal**: Verify configuration works in CI-like environment

**Steps**:
1. Set CI environment variables
2. Install browsers in temporary path
3. Run E2E tests with CI configuration
4. Verify test results and artifacts

**Success Criteria**: Tests pass with CI configuration and environment

## Troubleshooting

### Common Issues

**Issue**: Port 4321 already in use
**Solution**: Kill existing processes with `lsof -ti:4321 | xargs kill`

**Issue**: Health endpoint returns 404
**Solution**: Verify `/api/health` endpoint exists in `src/pages/api/health.ts`

**Issue**: Test selectors not found
**Solution**: Check DOM elements have correct `data-testid` attributes

**Issue**: Browser installation fails
**Solution**: Verify `PLAYWRIGHT_BROWSERS_PATH` directory exists and is writable

### Validation Commands

```bash
# Quick configuration check
npm run typecheck && npm run lint

# Validate all test selectors
grep -r "data-testid" tests/e2e/ | cut -d'"' -f2 | sort | uniq

# Check browser installation status
npx playwright install --dry-run

# Validate server response
curl -v http://localhost:4321/api/health
```

## Success Metrics

After completing this quickstart, you should achieve:

- [ ] ✅ All configuration files use port 4321 consistently
- [ ] ✅ Health endpoint responds with HTTP 200
- [ ] ✅ All test selectors exist in DOM
- [ ] ✅ E2E tests pass locally with standard configuration
- [ ] ✅ E2E tests pass with CI-like environment variables
- [ ] ✅ Browser installation works in specified paths
- [ ] ✅ No configuration conflicts or errors reported

**Estimated Completion Time**: 10-15 minutes

**Next Steps**: If all validation passes, the configuration fixes are working correctly and the feature is ready for CI validation.