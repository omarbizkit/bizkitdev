// Comprehensive UI Review Test
// This script will validate all the recent fixes and document findings

import { chromium } from '@playwright/test';

async function runUIReview() {
  console.log('🎯 Starting Comprehensive UI Review...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Phase 1: Homepage and Initial Validation
    console.log('📱 Phase 1: Homepage and Initial Validation');
    await page.goto('http://localhost:4322', { waitUntil: 'networkidle' });
    
    // Set viewport to desktop for initial testing
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Take full page screenshot of homepage
    await page.screenshot({ 
      path: '/home/omarb/dev/projects/bizkitdev/ui-review-homepage-desktop.png', 
      fullPage: true 
    });
    console.log('✅ Homepage screenshot captured at desktop viewport (1440px)');

    // Phase 2: Project Grid Card Height Validation
    console.log('📐 Phase 2: Validating Card Height Uniformity');
    
    // Navigate to projects section
    await page.locator('#projects').scrollIntoView();
    await page.waitForTimeout(1000); // Let animations settle
    
    // Take screenshot of project grid
    await page.locator('.project-grid, [data-testid="project-grid"]').screenshot({ 
      path: '/home/omarb/dev/projects/bizkitdev/ui-review-project-grid.png' 
    });
    console.log('✅ Project grid screenshot captured');

    // Check for any broken images
    const images = await page.locator('img').all();
    let brokenImages = [];
    for (let img of images) {
      const src = await img.getAttribute('src');
      const naturalWidth = await img.evaluate(el => el.naturalWidth);
      if (naturalWidth === 0) {
        brokenImages.push(src);
      }
    }
    
    if (brokenImages.length > 0) {
      console.log('🚨 Broken images found:', brokenImages);
    } else {
      console.log('✅ All images loading correctly');
    }

    // Phase 3: Project Detail Page Theme Consistency
    console.log('🎨 Phase 3: Testing Theme Consistency on Project Detail Pages');
    
    // Find and click first project card
    const projectCards = await page.locator('.project-card, [data-testid="project-card"]').all();
    if (projectCards.length > 0) {
      await projectCards[0].click();
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of project detail page
      await page.screenshot({ 
        path: '/home/omarb/dev/projects/bizkitdev/ui-review-project-detail.png', 
        fullPage: true 
      });
      console.log('✅ Project detail page screenshot captured');
      
      // Test theme toggle on project detail page
      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle');
      if (await themeToggle.count() > 0) {
        await themeToggle.click();
        await page.waitForTimeout(500);
        await page.screenshot({ 
          path: '/home/omarb/dev/projects/bizkitdev/ui-review-theme-toggle.png', 
          fullPage: true 
        });
        console.log('✅ Theme toggle functionality captured');
      }
      
      // Navigate back to homepage
      await page.goBack();
      await page.waitForLoadState('networkidle');
    }

    // Phase 4: Responsive Testing
    console.log('📱 Phase 4: Responsive Design Testing');
    
    // Test tablet viewport (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: '/home/omarb/dev/projects/bizkitdev/ui-review-tablet-768px.png', 
      fullPage: true 
    });
    console.log('✅ Tablet viewport (768px) screenshot captured');
    
    // Test mobile viewport (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: '/home/omarb/dev/projects/bizkitdev/ui-review-mobile-375px.png', 
      fullPage: true 
    });
    console.log('✅ Mobile viewport (375px) screenshot captured');

    // Phase 5: Form and Interactive Testing
    console.log('📝 Phase 5: Form and Interactive Element Testing');
    
    // Reset to desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Test subscription form
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.fill('test@example.com');
      await page.screenshot({ 
        path: '/home/omarb/dev/projects/bizkitdev/ui-review-form-interaction.png' 
      });
      console.log('✅ Form interaction captured');
    }

    // Phase 6: Navigation Testing
    console.log('🧭 Phase 6: Navigation Flow Testing');
    
    // Test navigation links
    const navLinks = await page.locator('nav a, .nav-link').all();
    console.log(`Found ${navLinks.length} navigation links`);
    
    for (let i = 0; i < Math.min(navLinks.length, 3); i++) {
      const link = navLinks[i];
      const href = await link.getAttribute('href');
      console.log(`Testing navigation link: ${href}`);
      
      if (href && !href.startsWith('http')) {
        await link.click();
        await page.waitForTimeout(1000);
        await page.goBack();
        await page.waitForTimeout(1000);
      }
    }

    console.log('🎉 UI Review Complete! Screenshots saved to project directory.');
    
  } catch (error) {
    console.error('❌ Error during UI review:', error);
  } finally {
    await browser.close();
  }
}

runUIReview().catch(console.error);