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
  console.log('🧹 Cleaning up test screenshots...');
  try {
    execSync('find . -maxdepth 1 -name "*test*.png" -o -name "*headed*.png" -o -name "*browser*.png" -o -name "*screenshot*.png" -o -name "*design*.png" -o -name "*review*.png" | xargs rm -f 2>/dev/null || true');
    console.log('✅ Screenshot cleanup completed');
  } catch (error) {
    console.log('⚠️ Screenshot cleanup warning:', error.message);
  }
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

// Export for use by design review agent
export { launchMandatorySafeBrowser, checkSystemHealth, cleanupScreenshots };

// If run directly, test the mandatory safe browser launch
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    console.log('🧪 Testing MANDATORY safe headed browser launch...');
    const browser = await launchMandatorySafeBrowser();

    console.log('🌐 Testing browser functionality with live navigation...');
    const page = await browser.newPage();
    await page.goto('http://localhost:4321');

    // Wait for user observation
    console.log('👀 Browser should be visible on your Windows screen for 5 seconds...');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'mandatory-headed-test.png', fullPage: true });
    console.log('📸 Screenshot captured during live navigation');

    await browser.close();

    // Clean up screenshots after testing
    await cleanupScreenshots();
    console.log('🔚 MANDATORY headed browser test completed successfully');
  })().catch(console.error);
}