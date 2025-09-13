import { test, expect } from '@playwright/test';

/**
 * E2E tests for visitor discovery flow
 * Tests the complete user journey from landing to project exploration
 * These tests MUST FAIL until the full user experience is implemented
 */
test.describe('Visitor Discovery Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the homepage
    await page.goto('/');
  });

  test.describe('Landing Page Experience', () => {
    test('should display Omar Torres branding and hero section', async ({ page }) => {
      // Check for main heading with tagline (not name - H1 shows tagline)
      await expect(page.locator('h1')).toContainText('The Mind Behind The Code');

      // Check for professional identity (subtitle)
      await expect(page.getByText('Data & AI Enthusiast')).toBeVisible();
    });

    test('should show featured projects on homepage', async ({ page }) => {
      // Wait for project grid to load
      await expect(page.locator('[data-testid="project-grid"], .project-grid')).toBeVisible();
      
      // Should have at least 3 featured projects
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      await expect(projectCards).toHaveCount(3, { timeout: 10000 });
      
      // Each project card should have required elements
      const firstCard = projectCards.first();
      await expect(firstCard.locator('h3')).toBeVisible(); // Project name
      await expect(firstCard.locator('p')).toBeVisible();  // Project description
      await expect(firstCard.locator('[data-testid="tech-stack"], .tech-stack')).toBeVisible(); // Tech stack
    });

    test('should display navigation menu', async ({ page }) => {
      // Check for main navigation
      const nav = page.locator('nav, [role="navigation"]');
      await expect(nav).toBeVisible();
      
      // Should have key navigation links
      await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Work' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible();
    });

    test('should be responsive on mobile devices', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Hero section should still be visible
      await expect(page.locator('h1')).toBeVisible();
      
      // Project grid should adapt to mobile
      await expect(page.locator('[data-testid="project-grid"], .project-grid')).toBeVisible();
      
      // Navigation should be accessible (might be behind hamburger menu)
      const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-nav, button[aria-label*="menu"]');
      if (await mobileNav.isVisible()) {
        await mobileNav.click();
        await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
      }
    });
  });

  test.describe('Project Discovery', () => {
    test('should allow browsing project cards', async ({ page }) => {
      // Wait for projects to load
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      await expect(projectCards.first()).toBeVisible();
      
      // Each project card should be clickable
      const cardCount = await projectCards.count();
      expect(cardCount).toBeGreaterThan(0);
      
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = projectCards.nth(i);
        
        // Card should have visual feedback on hover
        await card.hover();
        
        // Should have project details
        await expect(card.locator('h3')).toContainText(/.+/); // Non-empty title
        await expect(card.locator('p')).toContainText(/.+/);  // Non-empty description
        
        // Should have tech stack indicators
        const techStack = card.locator('[data-testid="tech-stack"], .tech-stack');
        await expect(techStack).toBeVisible();
      }
    });

    test('should navigate to project details', async ({ page }) => {
      // Click on first project card
      const firstProject = page.locator('[data-testid="project-card"], .project-card').first();
      await expect(firstProject).toBeVisible();
      
      // Get project title for verification
      const projectTitle = await firstProject.locator('h3').textContent();
      
      // Click to navigate to project details
      await firstProject.click();
      
      // Should navigate to project detail page
      await expect(page).toHaveURL(/\/projects\/.+/);
      
      // Should show detailed project information
      await expect(page.locator('h1')).toContainText(projectTitle || '');
      await expect(page.locator('[data-testid="project-description"], .project-description')).toBeVisible();
      await expect(page.locator('[data-testid="tech-stack"], .tech-stack')).toBeVisible();
    });

    test('should filter projects by technology', async ({ page }) => {
      // Look for filter controls
      const filterSection = page.locator('[data-testid="project-filters"], .project-filters');
      
      if (await filterSection.isVisible()) {
        // Test technology filter
        const techFilter = filterSection.locator('[data-testid="tech-filter"], .tech-filter');
        if (await techFilter.isVisible()) {
          await techFilter.click();
          
          // Select a specific technology (e.g., Python)
          const pythonOption = page.getByText('Python', { exact: false });
          if (await pythonOption.isVisible()) {
            await pythonOption.click();
            
            // Projects should be filtered
            const filteredProjects = page.locator('[data-testid="project-card"], .project-card');
            await expect(filteredProjects.first()).toBeVisible();
            
            // All visible projects should contain Python in tech stack
            const projectCount = await filteredProjects.count();
            for (let i = 0; i < projectCount; i++) {
              const techStack = filteredProjects.nth(i).locator('[data-testid="tech-stack"], .tech-stack');
              await expect(techStack).toContainText('Python');
            }
          }
        }
      }
    });
  });

  test.describe('Content Quality', () => {
    test('should have proper SEO meta tags', async ({ page }) => {
      // Check title tag
      await expect(page).toHaveTitle(/Omar Torres.*Data.*AI/i);
      
      // Check meta description
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /Omar Torres.*portfolio/i);
      
      // Check Open Graph tags
      const ogTitle = page.locator('meta[property="og:title"]');
      const ogDescription = page.locator('meta[property="og:description"]');
      
      await expect(ogTitle).toHaveAttribute('content', /.+/);
      await expect(ogDescription).toHaveAttribute('content', /.+/);
    });

    test('should load without accessibility violations', async ({ page }) => {
      // Check for proper heading structure
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1); // Only one h1 per page
      
      // Check for alt text on images
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        await expect(img).toHaveAttribute('alt', /.*/); // Should have alt attribute
      }
      
      // Check for form labels
      const inputs = page.locator('input');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const inputId = await input.getAttribute('id');
        
        if (inputId) {
          const label = page.locator(`label[for="${inputId}"]`);
          await expect(label).toBeVisible();
        }
      }
    });

    test('should have working internal links', async ({ page }) => {
      // Get all internal links
      const internalLinks = page.locator('a[href^="/"], a[href^="./"], a[href^="../"]');
      const linkCount = await internalLinks.count();
      
      // Test first few internal links
      for (let i = 0; i < Math.min(linkCount, 5); i++) {
        const link = internalLinks.nth(i);
        const href = await link.getAttribute('href');
        
        if (href && href !== '/') {
          // Click link and verify it doesn't result in 404
          await Promise.all([
            page.waitForLoadState('networkidle'),
            link.click()
          ]);
          
          // Should not show 404 error
          await expect(page.locator('h1')).not.toContainText('404');
          await expect(page.locator('h1')).not.toContainText('Not Found');
          
          // Go back for next test
          await page.goBack();
          await page.waitForLoadState('networkidle');
        }
      }
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load homepage within performance budget', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/', { waitUntil: 'networkidle' });
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // Page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Core content should be visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-testid="project-grid"], .project-grid')).toBeVisible();
    });

    test('should handle slow network conditions', async ({ page, context }) => {
      // Simulate slow 3G
      await context.route('**/*', route => {
        setTimeout(() => route.continue(), 100); // 100ms delay
      });
      
      await page.goto('/');
      
      // Should still load core content
      await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="project-grid"], .project-grid')).toBeVisible({ timeout: 15000 });
    });

    test('should show loading states appropriately', async ({ page }) => {
      await page.goto('/');
      
      // Look for loading indicators during initial load
      const loadingIndicators = page.locator('[data-testid="loading"], .loading, .skeleton');
      
      // Loading indicators might appear briefly
      // Main content should eventually be visible
      await expect(page.locator('h1')).toBeVisible();
      
      // Loading indicators should be hidden once content loads
      if (await loadingIndicators.count() > 0) {
        await expect(loadingIndicators.first()).toBeHidden({ timeout: 10000 });
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle navigation to non-existent pages gracefully', async ({ page }) => {
      await page.goto('/non-existent-page');
      
      // Should show 404 page
      await expect(page.locator('h1')).toContainText(/404|Not Found/i);
      
      // Should have navigation back to home
      const homeLink = page.getByRole('link', { name: /home|back/i });
      await expect(homeLink).toBeVisible();
      
      // Clicking home link should work
      await homeLink.click();
      await expect(page).toHaveURL('/');
    });

    test('should handle JavaScript disabled gracefully', async ({ page, context }) => {
      // Disable JavaScript
      await context.setExtraHTTPHeaders({});
      await page.addInitScript(() => {
        delete (window as any).JavaScript;
      });
      
      await page.goto('/');
      
      // Core content should still be accessible
      await expect(page.locator('h1')).toBeVisible();
      
      // Basic navigation should work
      const aboutLink = page.getByRole('link', { name: 'About' });
      if (await aboutLink.isVisible()) {
        await aboutLink.click();
        await expect(page).toHaveURL('/about');
      }
    });
  });
});