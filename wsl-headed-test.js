import { chromium } from 'playwright';

(async () => {
  console.log('🔍 WSL Headed Browser Test Starting...');
  console.log('📍 Environment check:');
  console.log(`   - DISPLAY: ${process.env.DISPLAY || 'not set'}`);
  console.log(`   - WSL_DISTRO_NAME: ${process.env.WSL_DISTRO_NAME || 'not set'}`);
  
  try {
    // Force headed mode for WSL with specific launch options
    const browser = await chromium.launch({ 
      headless: false,
      slowMo: 1000, // 1 second delays for visibility
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--remote-debugging-port=9222'
      ],
      env: {
        DISPLAY: ':0'
      }
    });
    
    console.log('✅ Browser launched successfully!');
    
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    console.log('🌐 Navigating to homepage...');
    await page.goto('http://localhost:4321', { waitUntil: 'networkidle' });
    
    console.log('📸 Taking screenshot...');
    await page.screenshot({ 
      path: 'wsl-headed-test.png', 
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