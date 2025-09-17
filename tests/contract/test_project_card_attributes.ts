import { test, expect } from '@playwright/test';

/**
 * Contract Test: ProjectCard data-testid attribute
 *
 * This test validates that ProjectCard component includes the required
 * data-testid="project-card" attribute for E2E test identification.
 *
 * Success criteria:
 * - ProjectCard component must have data-testid="project-card"
 * - Attribute must be present on the root article element
 * - Multiple project cards should all have the same test ID
 */

test.describe('ProjectCard Component Contract - Test ID Attribute', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have data-testid="project-card" attribute on ProjectCard components', async ({ page }) => {
    // Contract validation: ProjectCard must have required test ID
    const projectCards = page.locator('[data-testid="project-card"]');

    // Verify at least one project card exists with the test ID
    await expect(projectCards).toHaveCount({ min: 1 });

    // Verify the test ID is on the correct element type (article)
    const firstCard = projectCards.first();
    await expect(firstCard).toBeVisible();

    // Contract requirement: Must be on article element
    const articleElement = page.locator('article[data-testid="project-card"]');
    await expect(articleElement).toHaveCount({ min: 1 });
  });

  test('should have consistent data-testid across all project cards', async ({ page }) => {
    // Wait for project grid to load
    await page.waitForSelector('[data-testid="project-grid"]', { timeout: 10000 });

    // Get all project cards within the grid
    const projectGrid = page.locator('[data-testid="project-grid"]');
    const allCards = projectGrid.locator('article');

    // Verify all cards have the required test ID
    const cardCount = await allCards.count();
    console.log(`Found ${cardCount} project cards in grid`);

    if (cardCount > 0) {
      // Check each card has the data-testid attribute
      for (let i = 0; i < cardCount; i++) {
        const card = allCards.nth(i);
        const testId = await card.getAttribute('data-testid');

        // Contract validation: Each card must have test ID
        expect(testId).toBe('project-card');
      }
    } else {
      // Contract violation: No project cards found
      throw new Error('Contract violation: No project cards found in grid - data loading issue');
    }
  });

  test('should maintain accessibility attributes alongside test ID', async ({ page }) => {
    const projectCard = page.locator('[data-testid="project-card"]').first();

    // Contract requirement: Accessibility must be preserved
    await expect(projectCard).toHaveAttribute('role', 'article');
    await expect(projectCard).toHaveAttribute('aria-labelledby');

    // Verify aria-labelledby references a valid element
    const ariaLabelledBy = await projectCard.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const referencedElement = page.locator(`#${ariaLabelledBy}`);
      await expect(referencedElement).toBeVisible();
    }
  });

  test('should fail if data-testid is missing (TDD validation)', async ({ page }) => {
    // This test is designed to FAIL until the fix is implemented
    // It validates our contract requirements

    const projectCards = page.locator('[data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount === 0) {
      // Expected failure - this confirms we need to add the test ID
      console.log('✅ TDD Validation: data-testid missing as expected - implementation needed');
      expect(cardCount).toBeGreaterThan(0); // This will fail until fixed
    } else {
      console.log('✅ Implementation complete: data-testid found');
      expect(cardCount).toBeGreaterThan(0);
    }
  });
});

test.describe('ProjectCard Component Contract - DOM Structure', () => {
  test('should have proper article element structure', async ({ page }) => {
    await page.goto('/');

    const projectCard = page.locator('[data-testid="project-card"]').first();

    // Contract requirement: Must be article element
    expect(await projectCard.evaluate(el => el.tagName.toLowerCase())).toBe('article');

    // Contract requirement: Must have project title with ID
    const titleElement = projectCard.locator('h3[id^="project-title-"]');
    await expect(titleElement).toBeVisible();

    // Contract requirement: Must have project description
    const descriptionElement = projectCard.locator('p');
    await expect(descriptionElement).toBeVisible();
  });

  test('should have proper click behavior for interactive elements', async ({ page }) => {
    await page.goto('/');

    const projectCard = page.locator('[data-testid="project-card"]').first();

    // Contract requirement: Should have clickable "View Details" button or Coming Soon
    const viewButton = projectCard.locator('a[href^="/projects/"], span:has-text("Coming Soon")');
    await expect(viewButton).toBeVisible();

    // If it's a clickable link, verify navigation
    const linkElement = projectCard.locator('a[href^="/projects/"]');
    const linkCount = await linkElement.count();

    if (linkCount > 0) {
      // Contract: Clickable projects should navigate properly
      const href = await linkElement.getAttribute('href');
      expect(href).toMatch(/^\/projects\/[\w-]+$/);
    }
  });
});