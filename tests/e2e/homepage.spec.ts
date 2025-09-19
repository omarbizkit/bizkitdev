import { test, expect } from '@playwright/test';

/**
 * E2E Test: Homepage Display
 * 
 * Tests basic homepage functionality:
 * - Hero section display
 * - Project grid visibility
 * - Navigation menu
 * - Basic page structure
 */
test.describe('Homepage Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display hero section with branding', async ({ page }) => {
    // Check for main heading
    const mainHeading = page.locator('h1').filter({ hasText: /The Mind Behind The Code|Omar Torres/i });
    await expect(mainHeading).toBeVisible();
    
    // Check for professional identity
    const professionalIdentity = page.locator('text=Data.*AI.*Enthusiast');
    if (await professionalIdentity.count() > 0) {
      await expect(professionalIdentity).toBeVisible();
    }
  });

  test('should display project grid with projects', async ({ page }) => {
    // Wait for project grid to load
    const projectGrid = page.locator('[data-testid="project-grid"], .project-grid');
    await expect(projectGrid).toBeVisible();
    
    // Should have at least one project card
    const projectCards = page.locator('[data-testid="project-card"], .project-card');
    const cardCount = await projectCards.count();
    expect(cardCount).toBeGreaterThan(0);
    
    // First project card should have basic elements
    if (cardCount > 0) {
      const firstCard = projectCards.first();
      await expect(firstCard).toBeVisible();
      
      // Should have project title
      const projectTitle = firstCard.locator('h3, h2, .project-title');
      if (await projectTitle.count() > 0) {
        await expect(projectTitle).toBeVisible();
      }
    }
  });

  test('should display navigation menu', async ({ page }) => {
    // Check for navigation
    const nav = page.locator('nav, [role="navigation"]');
    if (await nav.count() > 0) {
      await expect(nav).toBeVisible();
      
      // Should have some navigation links
      const navLinks = nav.locator('a');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    }
  });

  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    expect(loadTime).toBeLessThan(5000); // 5 seconds max
  });

  test('should have proper page title', async ({ page }) => {
    // Check page title contains expected content
    const title = await page.title();
    expect(title).toMatch(/Omar Torres|bizkit\.dev|Portfolio/i);
  });

  test('should display contact information', async ({ page }) => {
    // Look for contact email
    const emailPattern = /omarbizkit@hotmail\.com/i;
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(emailPattern);
  });
});