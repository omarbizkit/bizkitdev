# WSL Headed Browser Setup Guide

## Current Status: System Dependencies Required

The headed browser mode requires additional system dependencies that need to be installed with sudo privileges.

## Option 1: Install Dependencies (Requires sudo)

```bash
# Install required system dependencies
sudo apt-get update
sudo apt-get install libasound2t64 libgtk-3-0 libgbm-dev libnss3 libxss1 libgconf-2-4

# Or use Playwright's installer
sudo npx playwright install-deps
```

## Option 2: Windows Browser Integration (Alternative)

Since WSL integration can be complex, you can:

1. **Use Windows Browser**: Run `explorer.exe http://localhost:4321` from WSL to open site in Windows browser
2. **Manual Testing**: Use Windows browser for visual testing while running development server in WSL
3. **Screenshots Only**: Use headless mode with screenshot capture for visual evidence

## Option 3: Remote Development (Recommended for GUI)

```bash
# Forward port to Windows and use Windows browser
# Access via Windows browser at: http://localhost:4321
```

## Current Workaround Implementation

The design-review agent will:
1. **Detect WSL Environment**: Check for WSL_DISTRO_NAME environment variable
2. **Fallback to Enhanced Screenshots**: Take comprehensive screenshots in headless mode
3. **Use Windows Browser Integration**: Suggest opening URLs in Windows browser for manual verification

## Test Commands

```bash
# Test headless mode with screenshots (works now)
PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-browsers node tests/design-review/scripts/design-review-test.js

# Test headed mode (requires deps)
PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-browsers DISPLAY=:0 node tests/design-review/scripts/wsl-headed-test.js --headed

# Open in Windows browser from WSL
explorer.exe http://localhost:4321
```

## Design Review Agent Enhancement

The agent now:
- ✅ Detects WSL environment automatically
- ✅ Uses appropriate browser mode based on system capabilities
- ✅ Provides comprehensive screenshots and analysis
- ✅ Suggests Windows browser integration when headed mode fails
- ✅ Documents system requirements for full GUI setup

## Quick Solution for Immediate Use

**For now, use this command to view your site in Windows browser:**

```bash
# From WSL terminal (with dev server running)
explorer.exe http://localhost:4321
```

This opens the site in your Windows default browser where you can manually inspect the UI while the design-review agent provides automated analysis and screenshots.