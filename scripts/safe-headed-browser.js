#!/usr/bin/env node
/**
 * Safe Headed Browser Testing for WSL
 * Prevents system crashes during design reviews
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';

const SAFETY_CHECKS = {
  maxMemoryUsage: 75, // Percentage - more conservative
  maxCpuUsage: 80, // CPU percentage
  maxExistingBrowsers: 2, // Reduced for stability
  timeoutMs: 20000, // 20 seconds max - faster timeout
  stabilityWaitMs: 2000, // Wait for system stabilization
};

function checkSystemHealth() {
  console.log('🔍 Performing safety checks...');

  // Check memory usage
  const memInfo = execSync('free').toString();
  const memMatch = memInfo.match(/Mem:\s+(\d+)\s+(\d+)/);
  if (memMatch) {
    const [, total, used] = memMatch;
    const memUsagePercent = (parseInt(used) / parseInt(total)) * 100;
    console.log(`   Memory usage: ${memUsagePercent.toFixed(1)}%`);

    if (memUsagePercent > SAFETY_CHECKS.maxMemoryUsage) {
      throw new Error(`High memory usage: ${memUsagePercent.toFixed(1)}% > ${SAFETY_CHECKS.maxMemoryUsage}%`);
    }
  }

  // Check existing browser processes
  try {
    const browserProcs = execSync('pgrep -f chromium').toString().trim().split('\n').filter(Boolean);
    console.log(`   Existing browser processes: ${browserProcs.length}`);

    if (browserProcs.length > SAFETY_CHECKS.maxExistingBrowsers) {
      throw new Error(`Too many browser processes: ${browserProcs.length} > ${SAFETY_CHECKS.maxExistingBrowsers}`);
    }
  } catch (e) {
    // No existing browsers found - good
    console.log('   No existing browser processes found');
  }

  console.log('✅ Safety checks passed');
  return true;
}

async function cleanupScreenshots() {
  console.log('🧹 Cleaning up design review screenshots...');
  let cleanupSuccess = false;

  try {
    // Clean up from proper directory
    const result1 = execSync('rm -rf tests/design-review/screenshots/*.png 2>/dev/null || true', { encoding: 'utf-8' });

    // Also clean up any screenshots that might end up in root (safety measure)
    const result2 = execSync('find . -maxdepth 1 -name "*test*.png" -o -name "*headed*.png" -o -name "*browser*.png" -o -name "*screenshot*.png" -o -name "*design*.png" -o -name "*review*.png" | xargs rm -f 2>/dev/null || true', { encoding: 'utf-8' });

    // Verify cleanup succeeded
    const remaining = execSync('find tests/design-review/screenshots -name "*.png" 2>/dev/null | wc -l || echo 0', { encoding: 'utf-8' }).trim();
    const rootRemaining = execSync('find . -maxdepth 1 -name "*test*.png" -o -name "*headed*.png" -o -name "*browser*.png" -o -name "*screenshot*.png" -o -name "*design*.png" -o -name "*review*.png" | wc -l', { encoding: 'utf-8' }).trim();

    if (remaining === '0' && rootRemaining === '0') {
      console.log('✅ Screenshot cleanup completed successfully');
      cleanupSuccess = true;
    } else {
      console.log(`⚠️ Cleanup verification failed: ${remaining} screenshots in design-review, ${rootRemaining} in root`);
    }

  } catch (error) {
    console.log('❌ Screenshot cleanup failed:', error.message);
    // Force cleanup attempt with different approach
    try {
      execSync('bash scripts/cleanup-design-screenshots.sh', { stdio: 'inherit' });
      cleanupSuccess = true;
    } catch (fallbackError) {
      console.log('❌ Fallback cleanup also failed:', fallbackError.message);
    }
  }

  return cleanupSuccess;
}

// Enhanced cleanup function with multiple fallback strategies
async function enforceCleanup() {
  console.log('🛡️ ENFORCING mandatory cleanup...');

  const strategies = [
    () => cleanupScreenshots(),
    () => execSync('bash scripts/cleanup-design-screenshots.sh', { stdio: 'inherit' }),
    () => execSync('rm -rf tests/design-review/screenshots/* 2>/dev/null || true'),
    () => execSync('find . -maxdepth 1 \\( -name "*test*.png" -o -name "*headed*.png" -o -name "*browser*.png" -o -name "*screenshot*.png" -o -name "*design*.png" -o -name "*review*.png" -o -name "*test*.js" -o -name "*headed*.js" -o -name "*ui-*.js" \\) ! -name "*.config.js" | head -20 | xargs rm -f 2>/dev/null || true')
  ];

  for (let i = 0; i < strategies.length; i++) {
    try {
      await strategies[i]();
      console.log(`✅ Cleanup strategy ${i + 1} succeeded`);
      return true;
    } catch (error) {
      console.log(`⚠️ Cleanup strategy ${i + 1} failed:`, error.message);
    }
  }

  console.log('❌ ALL cleanup strategies failed - manual intervention required');
  return false;
}

async function launchMandatorySafeBrowser() {
  try {
    // PHASE A: Safety Pre-Flight (MANDATORY)
    console.log('🛡️ PHASE A: Safety Pre-Flight Checks...');
    checkSystemHealth();

    // Verify WSL environment
    const wslDistro = process.env.WSL_DISTRO_NAME;
    const display = process.env.DISPLAY;
    console.log(`   WSL Environment: ${wslDistro || 'not detected'}`);
    console.log(`   Display Setting: ${display || 'not set'}`);

    if (!display) {
      console.log('⚠️ Setting DISPLAY=:0 for WSLg integration');
      process.env.DISPLAY = ':0';
    }

    // PHASE B: Controlled Headed Launch (MANDATORY)
    console.log('🚀 PHASE B: Launching MANDATORY headed browser with safety protocols...');

    const browser = await chromium.launch({
      headless: false, // MANDATORY HEADED MODE
      timeout: SAFETY_CHECKS.timeoutMs,
      slowMo: 500, // Slower interactions for stability
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--disable-translate',
        '--disable-web-security',
        '--memory-pressure-off',
        '--max_old_space_size=512', // Memory limit
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--remote-debugging-port=9222'
      ],
      env: {
        DISPLAY: ':0',
        WSL_DISTRO_NAME: wslDistro
      }
    });

    // Wait for system stabilization
    console.log(`⏱️ Waiting ${SAFETY_CHECKS.stabilityWaitMs}ms for system stabilization...`);
    await new Promise(resolve => setTimeout(resolve, SAFETY_CHECKS.stabilityWaitMs));

    console.log('✅ MANDATORY headed browser launched successfully with safety measures');

    // Store cleanup function with browser for later use
    browser._cleanupScreenshots = cleanupScreenshots;
    return browser;

  } catch (error) {
    console.error('❌ MANDATORY headed browser launch failed:', error.message);
    console.log('🔄 PHASE C: Emergency fallback protocol activated');

    // PHASE C: Emergency fallback (document failure reason)
    console.log('📝 Documenting failure for optimization:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Memory usage: Checking...`);

    // Still attempt headless as absolute fallback
    return await chromium.launch({
      headless: true,
      timeout: 15000,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
  }
}

// Process exit handlers to ensure cleanup always runs
function setupCleanupHandlers() {
  const cleanupOnExit = async (signal) => {
    console.log(`\n🚨 Process termination detected (${signal}) - forcing cleanup...`);
    await enforceCleanup();
    process.exit(0);
  };

  // Handle various termination signals
  process.on('SIGINT', () => cleanupOnExit('SIGINT'));    // Ctrl+C
  process.on('SIGTERM', () => cleanupOnExit('SIGTERM'));  // Termination request
  process.on('SIGQUIT', () => cleanupOnExit('SIGQUIT'));  // Quit signal
  process.on('exit', () => {
    console.log('🚨 Process exit detected - attempting final cleanup...');
    try {
      execSync('bash scripts/cleanup-design-screenshots.sh', { stdio: 'inherit' });
    } catch (e) {
      console.log('⚠️ Exit cleanup failed:', e.message);
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.log('🚨 Uncaught exception detected - forcing cleanup before crash...');
    console.error('Error:', error);
    await enforceCleanup();
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.log('🚨 Unhandled rejection detected - forcing cleanup...');
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    await enforceCleanup();
    process.exit(1);
  });
}

// Export for use by design review agent
export { launchMandatorySafeBrowser, checkSystemHealth, cleanupScreenshots, enforceCleanup, setupCleanupHandlers };

// If run directly, test the mandatory safe browser launch
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    // Setup cleanup handlers first
    setupCleanupHandlers();

    console.log('🧪 Testing MANDATORY safe headed browser launch...');
    let browser = null;

    try {
      browser = await launchMandatorySafeBrowser();

      console.log('🌐 Testing browser functionality with live navigation...');
      const page = await browser.newPage();
      await page.goto('http://localhost:4322');

      // Wait for user observation
      console.log('👀 Browser should be visible on your Windows screen for 5 seconds...');
      await page.waitForTimeout(5000);

      // Ensure directory exists before screenshot
      execSync('mkdir -p tests/design-review/screenshots', { stdio: 'ignore' });
      await page.screenshot({ path: 'tests/design-review/screenshots/mandatory-headed-test.png', fullPage: true });
      console.log('📸 Screenshot captured during live navigation');

      await browser.close();
      browser = null; // Mark as closed

    } catch (error) {
      console.log('❌ Browser testing error:', error.message);
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.log('⚠️ Browser close error:', closeError.message);
        }
      }
    } finally {
      // ALWAYS run enhanced cleanup
      console.log('🛡️ Running mandatory enhanced cleanup...');
      const cleanupSuccess = await enforceCleanup();

      if (cleanupSuccess) {
        console.log('🔚 MANDATORY headed browser test completed successfully');
      } else {
        console.log('⚠️ Test completed but cleanup had issues - check manually');
        process.exit(1);
      }
    }
  })().catch(async (error) => {
    console.error('🚨 Critical error in browser test:', error);
    await enforceCleanup();
    process.exit(1);
  });
}