import { chromium } from 'playwright';

(async () => {
  console.log('🔍 Cross-Platform Headed Browser Test Starting...');

  // Environment setup for WSL, CI, and other environments
  const browserPath = process.env.PLAYWRIGHT_BROWSERS_PATH || '/tmp/playwright-browsers';
  console.log(`🔧 Browser environment: PLAYWRIGHT_BROWSERS_PATH=${browserPath}`);

  console.log('📍 Environment check:');
  console.log(`   - DISPLAY: ${process.env.DISPLAY || 'not set'}`);
  console.log(`   - WSL_DISTRO_NAME: ${process.env.WSL_DISTRO_NAME || 'not set'}`);
  console.log(`   - PLAYWRIGHT_BROWSERS_PATH: ${browserPath}`);

  try {
    // Cross-platform headed mode with environment-specific configurations
    const isWSL = !!process.env.WSL_DISTRO_NAME;
    const launchOptions = {
      headless: false,
      slowMo: 1000, // 1 second delays for visibility
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--remote-debugging-port=9222'
      ]
    };

    if (isWSL) {
      // WSL-specific configuration
      launchOptions.env = { DISPLAY: ':0' };
      console.log('🖥️ Detected WSL environment - using X11 display forwarding');
    } else {
      console.log('🔧 Using native desktop environment');
    }

    const browser = await chromium.launch(launchOptions);
    
    console.log('✅ Browser launched successfully!');
    
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    console.log('🌐 Navigating to homepage...');
    await page.goto('http://localhost:4321', { waitUntil: 'networkidle' });
    
    console.log('📸 Taking screenshot...');
    await page.screenshot({
      path: '../screenshots/wsl-headed-test.png',
      fullPage: true 
    });
    
    console.log('⏱️  Waiting 5 seconds for visual inspection...');
    await page.waitForTimeout(5000);
    
    // Test some interactions
    console.log('🔗 Testing navigation...');
    const projectsLink = page.locator('a[href="#projects"]').first();
    if (await projectsLink.isVisible()) {
      await projectsLink.click();
      await page.waitForTimeout(2000);
    }
    
    // Test project cards
    console.log('🎯 Testing project interactions...');
    const projectCards = page.locator('article[role="article"]');
    const cardCount = await projectCards.count();
    console.log(`   Found ${cardCount} project cards`);
    
    if (cardCount > 0) {
      await projectCards.first().hover();
      await page.waitForTimeout(1000);
    }
    
    console.log('✅ Test complete! Browser should be visible on your Windows screen.');
    console.log('💡 If browser didn\'t appear, check WSLg setup or X11 forwarding.');
    
    // Keep browser open for 10 more seconds
    console.log('⏱️  Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    
    await browser.close();
    console.log('🔚 Browser closed.');
    
  } catch (error) {
    console.error('❌ Error launching headed browser:', error.message);
    console.log('💡 Troubleshooting tips:');
    console.log('   1. Ensure WSLg is enabled (Windows 11 with latest WSL)');
    console.log('   2. Try: export DISPLAY=:0');
    console.log('   3. Install X11 server if needed');
    console.log('   4. Check: wsl --update');
  }
})();