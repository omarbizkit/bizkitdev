import { test, expect } from '@playwright/test';

/**
 * Contract Test: Project Grid Rendering Minimum Count
 *
 * This test validates that the ProjectGrid component renders the minimum
 * required number of project cards and maintains proper grid structure.
 *
 * Success criteria:
 * - ProjectGrid container must be visible
 * - Minimum 3 project cards must render
 * - Grid must have proper CSS layout classes
 * - Cards must be properly distributed in grid layout
 */

test.describe('Project Grid Rendering Contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Wait for the page to fully load
    await page.waitForLoadState('domcontentloaded');

    // Give additional time for dynamic content
    await page.waitForTimeout(2000);
  });

  test('should render ProjectGrid container with proper structure', async ({ page }) => {
    // Contract requirement: ProjectGrid must be visible
    const projectGrid = page.locator('[data-testid="project-grid"]');
    await expect(projectGrid).toBeVisible({ timeout: 15000 });

    // Contract requirement: Grid must have proper CSS classes for layout
    const gridClasses = await projectGrid.getAttribute('class');
    expect(gridClasses).toContain('grid');

    // Contract requirement: Grid should be a list container
    const gridRole = await projectGrid.getAttribute('role');
    expect(gridRole).toBe('list');

    // Contract requirement: Grid should have accessibility label
    const ariaLabel = await projectGrid.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('should render minimum 3 project cards', async ({ page }) => {
    const projectGrid = page.locator('[data-testid="project-grid"]');
    await expect(projectGrid).toBeVisible({ timeout: 15000 });

    // Contract requirement: Minimum 3 project cards must be rendered
    const projectCards = projectGrid.locator('article, [data-testid="project-card"], .project-item > article');

    // Wait for cards to render
    await expect(projectCards.first()).toBeVisible({ timeout: 10000 });

    const cardCount = await projectCards.count();
    console.log(`Grid rendering validation: Found ${cardCount} project cards`);

    // This is the core contract - must have at least 3 cards
    expect(cardCount).toBeGreaterThanOrEqual(3);
  });

  test('should have responsive grid layout classes', async ({ page }) => {
    const projectGrid = page.locator('[data-testid="project-grid"]');
    await expect(projectGrid).toBeVisible();

    const gridClasses = await projectGrid.getAttribute('class');

    // Contract requirement: Responsive grid classes for different screen sizes
    expect(gridClasses).toMatch(/grid-cols-1/); // Mobile: 1 column
    expect(gridClasses).toMatch(/md:grid-cols-2/); // Tablet: 2 columns
    expect(gridClasses).toMatch(/lg:grid-cols-3/); // Desktop: 3 columns

    // Contract requirement: Proper gap spacing
    expect(gridClasses).toContain('gap-');
  });

  test('should distribute project cards evenly in grid', async ({ page }) => {
    const projectGrid = page.locator('[data-testid="project-grid"]');
    await expect(projectGrid).toBeVisible();

    const projectCards = projectGrid.locator('article, [data-testid="project-card"], .project-item > article');
    const cardCount = await projectCards.count();

    if (cardCount >= 3) {
      // Contract requirement: Cards should be visible and properly positioned
      for (let i = 0; i < Math.min(cardCount, 6); i++) {
        const card = projectCards.nth(i);
        await expect(card).toBeVisible();

        // Verify card is within viewport (at least partially)
        const boundingBox = await card.boundingBox();
        expect(boundingBox).toBeTruthy();
        expect(boundingBox!.width).toBeGreaterThan(0);
        expect(boundingBox!.height).toBeGreaterThan(0);
      }
    } else {
      throw new Error(`Contract violation: Only ${cardCount} cards found, minimum 3 required`);
    }
  });

  test('should maintain grid structure across different viewport sizes', async ({ page }) => {
    const projectGrid = page.locator('[data-testid="project-grid"]');

    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(projectGrid).toBeVisible();

    let cardCount = await projectGrid.locator('article, [data-testid="project-card"]').count();
    expect(cardCount).toBeGreaterThanOrEqual(3);

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(projectGrid).toBeVisible();

    cardCount = await projectGrid.locator('article, [data-testid="project-card"]').count();
    expect(cardCount).toBeGreaterThanOrEqual(3);

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(projectGrid).toBeVisible();

    cardCount = await projectGrid.locator('article, [data-testid="project-card"]').count();
    expect(cardCount).toBeGreaterThanOrEqual(3);
  });

  test('should fail when insufficient project cards render (TDD validation)', async ({ page }) => {
    // This test is designed to fail until the rendering issue is fixed

    const projectGrid = page.locator('[data-testid="project-grid"]');
    await expect(projectGrid).toBeVisible({ timeout: 15000 });

    const projectCards = projectGrid.locator('article, [data-testid="project-card"], .project-item > article');

    // Wait for any cards to potentially render
    try {
      await expect(projectCards.first()).toBeVisible({ timeout: 5000 });
    } catch (error) {
      console.log('No project cards rendered - this indicates a data loading issue');
    }

    const cardCount = await projectCards.count();
    console.log(`TDD Validation: Found ${cardCount} project cards (need ≥3)`);

    if (cardCount < 3) {
      console.log('✅ TDD Validation: Insufficient cards rendered - fix needed');
      console.log('Checking for potential causes:');

      // Check if projects.json data exists
      try {
        const response = await page.request.get('/api/projects');
        if (response.ok()) {
          const projects = await response.json();
          console.log(`- Projects API returned ${projects.length} projects`);
        } else {
          console.log('- Projects API not available');
        }
      } catch (error) {
        console.log('- Unable to check projects API');
      }

      // Check for loading states or error messages
      const loadingIndicator = page.locator('.loading, [data-loading], :text("Loading")');
      const loadingCount = await loadingIndicator.count();
      if (loadingCount > 0) {
        console.log('- Loading indicator found - may be stuck loading');
      }

      const errorMessage = page.locator('.error, [data-error], :text("Error")');
      const errorCount = await errorMessage.count();
      if (errorCount > 0) {
        console.log('- Error message found - check for JavaScript errors');
      }

      // Check if ProjectCard components exist at all
      const anyProjectElements = page.locator('[class*="project"], article');
      const anyProjectCount = await anyProjectElements.count();
      console.log(`- Found ${anyProjectCount} elements with 'project' in class or article tags`);

      // This will fail until the rendering issue is fixed
      expect(cardCount).toBeGreaterThanOrEqual(3);
    } else {
      console.log('✅ Grid rendering working correctly');
      expect(cardCount).toBeGreaterThanOrEqual(3);
    }
  });

  test('should have proper project card container structure', async ({ page }) => {
    const projectGrid = page.locator('[data-testid="project-grid"]');
    await expect(projectGrid).toBeVisible();

    // Contract requirement: Each project should be in a proper container
    const projectContainers = projectGrid.locator('.project-item, [role="listitem"]');
    const containerCount = await projectContainers.count();

    if (containerCount > 0) {
      // Verify containers have proper data attributes
      const firstContainer = projectContainers.first();

      // Contract requirement: Containers should have filtering attributes
      const dataStatus = await firstContainer.getAttribute('data-status');
      const dataName = await firstContainer.getAttribute('data-name');

      // At least one data attribute should be present for filtering
      const hasFilteringData = dataStatus || dataName;
      expect(hasFilteringData).toBeTruthy();
    }

    // Contract requirement: Container count should match card count
    const cardCount = await projectGrid.locator('article, [data-testid="project-card"]').count();

    if (containerCount > 0 && cardCount > 0) {
      expect(containerCount).toBe(cardCount);
    }
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Contract requirement: Grid should handle empty states

    const projectGrid = page.locator('[data-testid="project-grid"]');
    await expect(projectGrid).toBeVisible();

    const cardCount = await projectGrid.locator('article, [data-testid="project-card"]').count();

    if (cardCount === 0) {
      // Check for empty state message
      const noResultsMessage = page.locator('#no-results, .no-results');
      const hasEmptyState = await noResultsMessage.count() > 0;

      if (hasEmptyState) {
        console.log('✅ Empty state handled gracefully');
        await expect(noResultsMessage).toBeVisible();
      } else {
        console.log('⚠️ No empty state message found');
      }

      // Grid should still be visible even when empty
      await expect(projectGrid).toBeVisible();
    }
  });
});