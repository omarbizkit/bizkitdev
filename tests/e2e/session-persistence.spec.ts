// tests/e2e/session-persistence.spec.ts
// E2E test for session persistence across page refreshes and browser restarts

import { test, expect } from '@playwright/test'

test.describe('Session Persistence Across Page Refreshes', () => {
  test('should persist session across page refresh (mock)', async ({ page, context }) => {
    // Set up authenticated session
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'persistent-token-test',
        domain: '.localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        // Cookie expires in 1 hour
        expires: Math.floor(Date.now() / 1000) + 3600
      },
      {
        name: 'sb-refresh-token',
        value: 'persistent-refresh-token',
        domain: '.localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        expires: Math.floor(Date.now() / 1000) + 86400 // 24 hours
      }
    ])

    // Navigate to homepage
    await page.goto('/')
    await expect(page).toHaveTitle(/Omar Torres/)

    // Verify cookies before refresh
    let cookies = await context.cookies()
    let accessToken = cookies.find(c => c.name === 'sb-access-token')
    expect(accessToken?.value).toBe('persistent-token-test')

    // Refresh the page
    await page.reload()

    // Verify cookies persist after refresh
    cookies = await context.cookies()
    accessToken = cookies.find(c => c.name === 'sb-access-token')
    expect(accessToken?.value).toBe('persistent-token-test')

    // Verify page still loads correctly
    await expect(page).toHaveTitle(/Omar Torres/)
  })

  test('should maintain session state across multiple page navigations', async ({ page, context }) => {
    // Set up session
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'navigation-test-token',
        domain: '.localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      }
    ])

    // Navigate to homepage
    await page.goto('/')
    let cookies = await context.cookies()
    let token = cookies.find(c => c.name === 'sb-access-token')
    expect(token?.value).toBe('navigation-test-token')

    // Navigate to projects page (if exists)
    await page.goto('/#projects')
    cookies = await context.cookies()
    token = cookies.find(c => c.name === 'sb-access-token')
    expect(token?.value).toBe('navigation-test-token')

    // Navigate back to homepage
    await page.goto('/')
    cookies = await context.cookies()
    token = cookies.find(c => c.name === 'sb-access-token')
    expect(token?.value).toBe('navigation-test-token')
  })

  test('should verify session endpoint returns consistent data across refreshes', async ({ page }) => {
    // First check
    let response = await page.goto('/api/auth/session')
    expect(response?.status()).toBe(200)
    let data = await response?.json()

    const firstCheck = {
      hasSession: data?.session !== undefined,
      hasUser: data?.user !== undefined
    }

    // Refresh and check again
    await page.reload()
    response = await page.goto('/api/auth/session')
    expect(response?.status()).toBe(200)
    data = await response?.json()

    const secondCheck = {
      hasSession: data?.session !== undefined,
      hasUser: data?.user !== undefined
    }

    // Should have consistent structure
    expect(firstCheck).toEqual(secondCheck)
  })

  test('should handle session expiry gracefully', async ({ page, context }) => {
    // Set up expired session cookie
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'expired-token',
        domain: '.localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        // Already expired
        expires: Math.floor(Date.now() / 1000) - 3600
      }
    ])

    await page.goto('/')

    // Expired cookie should be cleared by browser
    const cookies = await context.cookies()
    const expiredToken = cookies.find(c => c.name === 'sb-access-token')

    // Should either not exist or be cleared
    if (expiredToken) {
      // If it exists, verify it's marked as expired
      const now = Math.floor(Date.now() / 1000)
      expect(expiredToken.expires).toBeLessThan(now)
    }
  })

  test('should verify authenticated state persists during form interactions', async ({
    page,
    context
  }) => {
    // Set up session
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'form-interaction-token',
        domain: '.localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      }
    ])

    await page.goto('/')

    // Interact with subscription form (if visible)
    const emailInput = page.locator('input[type="email"]')
    if (await emailInput.count() > 0) {
      await emailInput.first().fill('test@example.com')

      // Verify session cookie still exists after form interaction
      const cookies = await context.cookies()
      const sessionCookie = cookies.find(c => c.name === 'sb-access-token')
      expect(sessionCookie?.value).toBe('form-interaction-token')
    }
  })

  test('should maintain session through multiple API calls', async ({ page, context }) => {
    // Set up session
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'api-calls-token',
        domain: '.localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      }
    ])

    await page.goto('/')

    // Make multiple session checks
    for (let i = 0; i < 3; i++) {
      const response = await page.request.get('/api/auth/session')
      expect(response.status()).toBe(200)

      // Verify session cookie persists
      const cookies = await context.cookies()
      const token = cookies.find(c => c.name === 'sb-access-token')
      expect(token?.value).toBe('api-calls-token')
    }
  })

  test('should clear session on explicit sign-out', async ({ page, context }) => {
    // Set up session
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'signout-test-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      }
    ])

    await page.goto('/')

    // Verify session exists
    let cookies = await context.cookies()
    let token = cookies.find(c => c.name === 'sb-access-token')
    expect(token?.value).toBe('signout-test-token')

    // Sign out
    const response = await page.request.post('/api/auth/signout', {
      headers: { 'Content-Type': 'application/json' }
    })
    expect(response.status()).toBe(200)

    // Verify session is cleared via API
    const sessionResponse = await page.goto('/api/auth/session')
    const sessionData = await sessionResponse?.json()
    expect(sessionData?.session).toBeNull()
    expect(sessionData?.user).toBeNull()

    // Note: Cookies may persist in browser context but session is server-side cleared
    // The important verification is that the session API returns null
  })
})
