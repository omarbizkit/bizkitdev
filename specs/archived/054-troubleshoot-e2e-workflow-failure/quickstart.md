# Troubleshooting E2E Workflow Failures - Quickstart Guide

## Prerequisites

1. **GitHub CLI**: Install and authenticate
   ```bash
   # Install (Ubuntu/Debian)
   curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
   sudo apt update
   sudo apt install gh

   # Authenticate
   gh auth login
   ```

2. **Project Access**: Ensure you have read access to the `omarbizkitdev/bizkitdev` repository

3. **Local Environment**: Set up consistent development environment
   ```bash
   # Install dependencies
   npm ci

   # Set up environment variables
   cp .env.example .env.test
   # Edit .env.test with appropriate values
   ```

## Quick Start: 5-Minute Investigation

### Step 1: Prepare Investigation Environment
```bash
# Switch to troubleshooting branch
git checkout 054-troubleshoot-e2e-workflow-failure

# Ensure latest code is present
git pull origin main

# Verify workflow permissions
gh api repos/omarbizkitdev/bizkitdev/actions/workflows/e2e-test.yml --jq '.permissions'
```

### Step 2: Retrieve Failed Workflow Logs
```bash
# List recent workflow runs to find the failed one
gh run list --repo omarbizkitdev/bizkitdev --workflow="E2E Tests" --limit 5

# Download logs for the specific failed run (replace RUN_ID with actual ID)
gh run download RUN_ID --repo omarbizkitdev/bizkitdev
```

### Step 3: Local Reproduction
```bash
# Start development server in testing mode
npm run dev -- --port 4321 --mode test

# Wait for health endpoint to respond
curl -f http://localhost:4321/api/health

# Run specific failing test
npm run test:e2e -- --grep "failing test pattern"
```

### Step 4: Environment Comparison
```bash
# Check Node version (should match CI)
node --version

# Check key dependencies
npm list playwright
npm list @astrojs/node

# Verify environment variables
echo $NODE_ENV
echo $BROWSER_NAME (if set)
```

## Diagnostic Commands

### Fast Health Check
```bash
# Complete local setup validation
npm run test:contract -- --reporter=verbose

# Browser compatibility check
npx playwright install
npx playwright test --dry-run
```

### Detailed Analysis
```bash
# Full environment report
echo "=== System Info ==="
uname -a
echo "=== Node Version ==="
node --version
echo "=== NPM Version ==="
npm --version
echo "=== Playwright Version ==="
npx playwright --version

# Port availability check
netstat -tulpn | grep :4321

# Test configuration validation
npm run test:e2e -- --list
```

## Common Failure Patterns & Quick Fixes

### Pattern 1: Port Already in Use
**Symptoms**: "Error: listen EADDRINUSE: address already in use :::4321"
**Quick Fix**:
```bash
# Find and kill process on port 4321
lsof -ti:4321 | xargs kill -9

# Alternative: Use different port during testing
npm run dev -- --port 4322
```

### Pattern 2: Playwright Timeout
**Symptoms**: Test exceeds 30-60 second timeout
**Quick Fix**:
```bash
# Increase timeout in playwright.config.js
# Set expect timeout to 10s instead of 5s
# Set action timeout to 30s instead of 15s
```

### Pattern 3: Missing Browser Binaries
**Symptoms**: "Browser not found" or Playwright installation errors
**Quick Fix**:
```bash
# Ensure browser binaries are up to date
npx playwright install --force

# For WSL environments
export PLAYWRIGHT_BROWSERS_PATH=/tmp/browsers
npx playwright install chromium
```

### Pattern 4: Dependency Version Mismatch
**Symptoms**: "Module not found" or import errors
**Quick Fix**:
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Or update specific package
npm update @astrojs/node
```

## Monitoring & Prevention

### Ongoing Health Checks
```bash
# Add to development workflow
# Check server health before testing
curl -s -f http://localhost:4321/api/health || echo "Server not ready"

# Validate environment before CI
node -e "console.log('Node version:', process.version)"
```

### CI Environment Simulation
```bash
# Test with production-like settings
NODE_ENV=production npm run build

# Test with CI-like environment
export CI=true
export BROWSER_NAME=chromium
npm run test:e2e
```

## Escalation Process

If quick fixes don't resolve the issue:

1. **Document Environment**: Collect complete system report
2. **Capture Logs**: Save both local and CI log files
3. **Isolate Variables**: Test with minimal configuration
4. **Compare Configurations**: Check local vs CI environment differences
5. **Prepare Evidence**: Create minimal reproduction case

### Contact & Support
- **Project Issues**: Create detailed issue on GitHub repository
- **Documentation**: Update this guide with new failure patterns discovered
- **Prevention**: Implement automated health checks in CI pipeline

## Best Practice Checklist

- [ ] Environment setup validated (Node, npm, Playwright)
- [ ] Dependencies clean installed
- [ ] Port 4321 available
- [ ] Health endpoint responding
- [ ] Test configuration validated
- [ ] CI environment variables documented
- [ ] Browser binaries up-to-date
- [ ] Previous test runs cleaned up

## Success Criteria

✅ **Investigation Complete**: Root cause identified within 30 minutes
✅ **Local Reproduction**: Successfully reproduced CI failure locally
✅ **Fix Validated**: Fix works in both local and CI environments
✅ **Documentation Updated**: New findings added to this guide
✅ **Prevention Implemented**: Monitoring or automated checks added