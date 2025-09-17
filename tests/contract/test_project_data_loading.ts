import { test, expect } from '@playwright/test';

/**
 * Contract Test: Project Data Loading Validation
 *
 * This test validates that project data loads correctly from projects.json
 * and that the ProjectGrid component renders the expected number of cards.
 *
 * Success criteria:
 * - Minimum 3 project cards must be rendered
 * - Project data must load from projects.json
 * - ProjectGrid component must be visible
 * - Each project card must display required content
 */

test.describe('Project Data Loading Contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Wait for page to load and projects to render
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load project data and render minimum 3 cards', async ({ page }) => {
    // Contract requirement: ProjectGrid must be visible
    const projectGrid = page.locator('[data-testid="project-grid"]');
    await expect(projectGrid).toBeVisible({ timeout: 10000 });

    // Contract requirement: Minimum 3 project cards
    const projectCards = projectGrid.locator('article, [data-testid="project-card"]');

    const cardCount = await projectCards.count();
    console.log(`Contract validation: Found ${cardCount} project cards`);

    // This should fail until data loading is fixed
    expect(cardCount).toBeGreaterThanOrEqual(3);
  });

  test('should validate project.json data structure integrity', async ({ page }) => {
    // Verify we can access the projects data endpoint
    const response = await page.request.get('/api/projects');

    if (response.ok()) {
      const projects = await response.json();

      // Contract requirement: Must have project data
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);

      // Contract requirement: Each project must have required fields
      for (const project of projects.slice(0, 3)) { // Check first 3
        expect(project).toHaveProperty('id');
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('description_short');
        expect(project).toHaveProperty('tech_stack');
        expect(Array.isArray(project.tech_stack)).toBe(true);
      }
    } else {
      // If API endpoint doesn't exist, check static data loading
      console.log('API endpoint not available, checking static data rendering');

      // The data should still render through static generation
      const projectGrid = page.locator('[data-testid="project-grid"]');
      await expect(projectGrid).toBeVisible();
    }
  });

  test('should render project cards with complete content', async ({ page }) => {
    const projectGrid = page.locator('[data-testid="project-grid"]');
    await expect(projectGrid).toBeVisible();

    // Get the first project card for content validation
    const firstCard = projectGrid.locator('article, [data-testid="project-card"]').first();

    if (await firstCard.isVisible()) {
      // Contract requirement: Each card must have title
      const title = firstCard.locator('h3');
      await expect(title).toBeVisible();

      // Contract requirement: Each card must have description
      const description = firstCard.locator('p');
      await expect(description).toBeVisible();

      // Contract requirement: Each card must have tech stack
      const techStack = firstCard.locator('[data-testid="tech-stack"], .tech-stack, .tech-badge');
      const techCount = await techStack.count();
      expect(techCount).toBeGreaterThan(0);

      // Contract requirement: Each card must have action button
      const actionButton = firstCard.locator('a[href^="/projects/"], span:has-text("Coming Soon")');
      await expect(actionButton).toBeVisible();
    } else {
      throw new Error('Contract violation: Project cards not rendering - data loading failure');
    }
  });

  test('should fail gracefully when no project data (TDD validation)', async ({ page }) => {
    // This test validates our error handling contract

    const projectGrid = page.locator('[data-testid="project-grid"]');
    await expect(projectGrid).toBeVisible();

    const projectCards = projectGrid.locator('article, [data-testid="project-card"]');
    const cardCount = await projectCards.count();

    if (cardCount === 0) {
      // Expected failure state - validates we need to fix data loading
      console.log('✅ TDD Validation: No project cards found - data loading needs fix');

      // Check if there's any error indication
      const noResultsMessage = page.locator('#no-results, .no-results, :text("No projects")');
      const hasNoResultsMessage = await noResultsMessage.count() > 0;

      if (hasNoResultsMessage) {
        console.log('Graceful failure: No results message displayed');
      } else {
        console.log('Missing: No fallback message for empty state');
      }

      // This will fail until data loading is fixed
      expect(cardCount).toBeGreaterThan(0);
    } else {
      console.log(`✅ Data loading working: ${cardCount} cards found`);
      expect(cardCount).toBeGreaterThan(0);
    }
  });

  test('should have proper project grid container structure', async ({ page }) => {
    const projectGrid = page.locator('[data-testid="project-grid"]');

    // Contract requirement: Grid must exist and be visible
    await expect(projectGrid).toBeVisible();

    // Contract requirement: Grid should have proper ARIA attributes
    const gridRole = await projectGrid.getAttribute('role');
    expect(gridRole).toBe('list');

    // Contract requirement: Grid should contain list items
    const listItems = projectGrid.locator('[role="listitem"]');
    const itemCount = await listItems.count();

    if (itemCount > 0) {
      console.log(`✅ Grid structure valid: ${itemCount} list items found`);
      expect(itemCount).toBeGreaterThan(0);
    } else {
      console.log('⚠️ Grid structure issue: No list items found');
      // Check if cards exist without proper roles
      const anyCards = projectGrid.locator('article, .project-card, .project-item');
      const anyCardCount = await anyCards.count();
      expect(anyCardCount).toBeGreaterThan(0);
    }
  });

  test('should validate project data consistency across components', async ({ page }) => {
    const projectGrid = page.locator('[data-testid="project-grid"]');
    await expect(projectGrid).toBeVisible();

    // Get all project items
    const projectItems = projectGrid.locator('.project-item, [role="listitem"]');
    const itemCount = await projectItems.count();

    if (itemCount > 0) {
      // Validate first project item has consistent data attributes
      const firstItem = projectItems.first();

      // Contract requirement: Project items should have data attributes
      const status = await firstItem.getAttribute('data-status');
      const featured = await firstItem.getAttribute('data-featured');
      const tech = await firstItem.getAttribute('data-tech');
      const name = await firstItem.getAttribute('data-name');

      // At least some data attributes should be present
      const hasDataAttributes = status || featured || tech || name;
      expect(hasDataAttributes).toBeTruthy();

      // If tech stack is present, it should be a comma-separated list
      if (tech) {
        expect(tech.length).toBeGreaterThan(0);
        // Should contain at least one technology
        expect(tech.split(',').length).toBeGreaterThan(0);
      }
    } else {
      throw new Error('Contract violation: No project items found for data validation');
    }
  });
});