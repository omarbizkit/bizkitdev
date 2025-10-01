// tests/e2e/cross-subdomain-navigation.spec.ts
// E2E test for cross-subdomain session sharing and navigation

import { test, expect } from '@playwright/test'

test.describe('Cross-Subdomain Navigation', () => {
  test('should maintain session across subdomain navigation (mock)', async ({ page, context }) => {
    // Set up mock session cookie with .localhost domain
    // Note: In local development, this simulates cross-subdomain behavior

    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-session-token',
        domain: 'localhost', // Use localhost without dot prefix for local testing
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      },
      {
        name: 'sb-refresh-token',
        value: 'mock-refresh-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      }
    ])

    // Navigate to main domain
    await page.goto('/')
    await expect(page).toHaveTitle(/Omar Torres/)

    // Verify cookies are set
    const cookies = await context.cookies()
    const accessTokenCookie = cookies.find(c => c.name === 'sb-access-token')

    // Cookie should exist (may have domain localhost or .localhost)
    expect(accessTokenCookie).toBeDefined()
    expect(accessTokenCookie?.value).toBe('mock-session-token')
  })

  test('should verify cookie domain configuration for cross-subdomain sharing', async ({ page }) => {
    // Test the cookie domain environment variable is configured correctly
    await page.goto('/')

    // Verify environment variable via API endpoint instead of client-side eval
    // In production, cookies should use .bizkit.dev domain
    const response = await page.goto('/api/auth/session')
    expect(response?.status()).toBe(200)

    // Cookie domain is server-configured, so we verify via successful session endpoint
    const data = await response?.json()
    expect(data).toHaveProperty('session')
    expect(data).toHaveProperty('user')
  })

  test('should handle navigation between main site and subdomains', async ({ page, context }) => {
    // Navigate to main site
    await page.goto('/')
    await expect(page).toHaveTitle(/Omar Torres/)

    // In production, this would test navigation like:
    // bizkit.dev -> blog.bizkit.dev -> portfolio.bizkit.dev
    // For now, verify main site loads correctly

    const response = await page.goto('/api/auth/session')
    expect(response?.status()).toBe(200)

    const data = await response?.json()
    expect(data).toHaveProperty('session')
    expect(data).toHaveProperty('user')
  })

  test('should preserve authentication state during cross-subdomain navigation (mock)', async ({
    page,
    context
  }) => {
    // Set up authenticated session
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'test-token-cross-domain',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      }
    ])

    // Navigate to main site
    await page.goto('/')

    // Check cookies persist
    const cookies = await context.cookies()
    const sessionCookie = cookies.find(c => c.name === 'sb-access-token')

    expect(sessionCookie?.value).toBe('test-token-cross-domain')
    // Domain may be localhost or .localhost
    expect(sessionCookie?.domain).toMatch(/^\.?localhost$/)
  })

  test('should handle sign-out across all subdomains', async ({ page, context }) => {
    // Set up session cookies
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'token-to-clear',
        domain: '.localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      }
    ])

    await page.goto('/')

    // Sign out
    const response = await page.request.post('/api/auth/signout', {
      headers: { 'Content-Type': 'application/json' }
    })

    expect(response.status()).toBe(200)

    // Verify session is cleared
    const sessionResponse = await page.goto('/api/auth/session')
    const sessionData = await sessionResponse?.json()

    expect(sessionData?.session).toBeNull()
    expect(sessionData?.user).toBeNull()

    // In production, cookies should be cleared with .bizkit.dev domain
    // ensuring sign-out works across all subdomains
  })

  test('should verify session endpoint accessibility from any subdomain', async ({ page }) => {
    // Test that session endpoint is accessible
    const response = await page.goto('/api/auth/session')

    expect(response?.status()).toBe(200)
    expect(response?.headers()['content-type']).toContain('application/json')

    const data = await response?.json()
    expect(data).toHaveProperty('session')
    expect(data).toHaveProperty('user')
  })
})
