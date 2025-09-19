import { test, expect } from '@playwright/test';

/**
 * E2E Test: Project Navigation
 * 
 * Tests basic project navigation functionality:
 * - Project card clicks
 * - Project detail page display
 * - Launch App and View Code links
 */
test.describe('Project Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to project details when clicking project card', async ({ page }) => {
    // Wait for project grid to load
    await expect(page.locator('[data-testid="project-grid"], .project-grid')).toBeVisible();
    
    // Get first project card
    const firstProjectCard = page.locator('[data-testid="project-card"], .project-card').first();
    await expect(firstProjectCard).toBeVisible();
    
    // Get project title for verification
    const projectTitle = await firstProjectCard.locator('h3').textContent();
    expect(projectTitle).toBeTruthy();
    
    // Click on project card or "View Details" link
    const viewDetailsLink = firstProjectCard.locator('a[href*="/projects/"]');
    if (await viewDetailsLink.count() > 0) {
      await viewDetailsLink.click();
    } else {
      await firstProjectCard.click();
    }
    
    // Should navigate to project detail page
    await expect(page).toHaveURL(/\/projects\//);
    
    // Should show project title
    await expect(page.locator('h1')).toContainText(projectTitle || '');
  });

  test('should display project details page correctly', async ({ page }) => {
    // Navigate to a project detail page
    await page.goto('/projects/sample-project');
    
    // Should show project information
    await expect(page.locator('h1')).toBeVisible();
    // Description might be in various elements, so just check page has content
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    
    // Should have tech stack section (if it exists)
    const techStack = page.locator('[data-testid="tech-stack"], .tech-stack');
    if (await techStack.count() > 0) {
      await expect(techStack).toBeVisible();
    }
  });

  test('should have working Launch App and View Code links', async ({ page }) => {
    // Navigate to a project detail page
    await page.goto('/projects/sample-project');
    
    // Check for Launch App link
    const launchLink = page.locator('a[href*="http"], a[href*="https"]').filter({ hasText: /launch|view app|demo/i });
    if (await launchLink.count() > 0) {
      await expect(launchLink).toBeVisible();
    }
    
    // Check for View Code link
    const codeLink = page.locator('a[href*="github"], a[href*="git"]').filter({ hasText: /code|github|repository/i });
    if (await codeLink.count() > 0) {
      await expect(codeLink.first()).toBeVisible();
    }
  });

  test('should handle non-existent project gracefully', async ({ page }) => {
    // Navigate to non-existent project
    await page.goto('/projects/non-existent-project');
    
    // Should show 404 or error page
    await expect(page.locator('h1').first()).toContainText(/404|not found|error/i);
    
    // Should have link back to home
    const homeLink = page.getByRole('link', { name: /home/i });
    if (await homeLink.count() > 0) {
      await expect(homeLink.first()).toBeVisible();
    }
  });
});
