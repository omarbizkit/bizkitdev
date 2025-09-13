import { chromium } from 'playwright';

(async () => {
  // Support headed mode via environment variable or command line arg
  const headedMode = process.env.HEADED_MODE === 'true' || process.argv.includes('--headed');
  console.log(`🔍 Browser mode: ${headedMode ? 'HEADED (visible)' : 'HEADLESS'}`);
  
  const browser = await chromium.launch({ 
    headless: !headedMode,
    slowMo: headedMode ? 500 : 0 // Add delay in headed mode for visibility
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('🔍 Starting comprehensive design review...');
  
  // Navigate to homepage
  console.log('📍 Navigating to homepage...');
  await page.goto('http://localhost:4321');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of desktop viewport
  console.log('📸 Capturing desktop screenshot (1440x900)...');
  await page.screenshot({
    path: '../screenshots/homepage-desktop.png',
    fullPage: true
  });

  // Check for console errors
  const messages = [];
  page.on('console', msg => messages.push(msg.text()));
  
  console.log('🔍 Checking project showcase section...');
  
  // Verify project showcase is visible
  const projectsSection = await page.locator('#projects').isVisible();
  console.log(`✅ Projects section visible: ${projectsSection}`);
  
  // Check project cards
  const projectCards = await page.locator('article[role="article"]').count();
  console.log(`📊 Project cards found: ${projectCards}`);
  
  // Test search functionality
  console.log('🔍 Testing search functionality...');
  const searchInput = page.locator('#project-search');
  if (await searchInput.isVisible()) {
    await searchInput.fill('AI');
    await page.waitForTimeout(500);
    const visibleCards = await page.locator('.project-item:visible').count();
    console.log(`🔍 Search results for "AI": ${visibleCards} cards visible`);
  }
  
  // Test filter buttons
  console.log('🎯 Testing filter functionality...');
  const filterButtons = await page.locator('.filter-btn').count();
  console.log(`🎛️ Filter buttons found: ${filterButtons}`);
  
  // Test responsive design - tablet
  console.log('📱 Testing tablet viewport (768x1024)...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: '../screenshots/homepage-tablet.png',
    fullPage: true
  });
  
  // Test responsive design - mobile
  console.log('📱 Testing mobile viewport (375x667)...');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: '../screenshots/homepage-mobile.png',
    fullPage: true
  });
  
  // Reset to desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  
  // Test project detail navigation
  console.log('🔗 Testing project detail navigation...');
  const firstProjectLink = page.locator('a[href^="/projects/"]').first();
  if (await firstProjectLink.isVisible()) {
    const href = await firstProjectLink.getAttribute('href');
    console.log(`🔗 Navigating to: ${href}`);
    await firstProjectLink.click();
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: '../screenshots/project-detail-desktop.png',
      fullPage: true
    });
    
    console.log('📱 Testing project detail on mobile...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: '../screenshots/project-detail-mobile.png',
      fullPage: true
    });
  }
  
  console.log('📝 Console messages captured:', messages.length);
  if (messages.length > 0) {
    console.log('Console output:', messages.slice(0, 5));
  }
  
  console.log('✅ Design review complete! Screenshots saved.');
  
  await browser.close();
})();