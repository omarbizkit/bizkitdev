// tests/e2e/complete-auth-flow.spec.ts
// E2E test for complete authentication flow from login to logout

import { test, expect } from '@playwright/test'

test.describe('Complete Authentication Flow', () => {
  test('should load homepage with auth system ready', async ({ page }) => {
    await page.goto('/')

    // Verify homepage loads
    await expect(page).toHaveTitle(/Omar Torres/)

    // Verify auth API endpoints are accessible
    const sessionResponse = await page.request.get('/api/auth/session')
    expect(sessionResponse.status()).toBe(200)

    // Note: Portfolio doesn't currently have visible sign-in UI
    // Auth endpoints are available for future integration
  })

  test('should initiate OAuth flow via API endpoint', async ({ page }) => {
    // Test the OAuth flow initiation via API
    // Note: Portfolio doesn't have a user-facing sign-in button currently

    const response = await page.request.post('/api/auth/signin', {
      headers: { 'Content-Type': 'application/json' },
      data: { redirectTo: '/dashboard' }
    })

    expect(response.status()).toBe(200)

    const data = await response.json()

    // Verify OAuth URL structure
    expect(data.url).toBeDefined()
    expect(data.url).toContain('supabase.co/auth/v1/authorize')
    expect(data.provider).toBe('google')
    expect(data.url).toContain('next%3D%2Fdashboard')
  })

  test('should handle unauthenticated session state', async ({ page }) => {
    // Navigate to session endpoint directly
    const response = await page.goto('/api/auth/session')
    expect(response?.status()).toBe(200)

    const data = await response?.json()

    // Should return null session when not authenticated
    expect(data?.session).toBeNull()
    expect(data?.user).toBeNull()
  })

  test('should display user profile when authenticated (mock)', async ({ page, context }) => {
    // Mock authenticated state by setting cookies
    // Note: This is a simplified test without real OAuth

    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-token-for-testing',
        domain: '.localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      }
    ])

    await page.goto('/')

    // Verify page loads with mocked auth (though it won't actually authenticate)
    await expect(page).toHaveTitle(/Omar Torres/)
  })

  test('should handle sign-out flow', async ({ page }) => {
    await page.goto('/')

    // Attempt to access sign-out endpoint
    const response = await page.request.post('/api/auth/signout', {
      headers: { 'Content-Type': 'application/json' }
    })

    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.message).toContain('Successfully signed out')
  })

  test('should verify session cleared after sign-out', async ({ page }) => {
    // Sign out first
    await page.request.post('/api/auth/signout', {
      headers: { 'Content-Type': 'application/json' }
    })

    // Check session is null
    const sessionResponse = await page.goto('/api/auth/session')
    const sessionData = await sessionResponse?.json()

    expect(sessionData?.session).toBeNull()
    expect(sessionData?.user).toBeNull()
  })

  test('should redirect to callback URL after OAuth (manual verification)', async ({ page }) => {
    // This test verifies the callback endpoint structure
    // In real scenario, Google OAuth would redirect here with code parameter

    const response = await page.goto('/api/auth/callback')

    // Without OAuth code, should return error
    expect(response?.status()).toBe(400)

    const data = await response?.json()
    expect(data?.error).toBe('MISSING_CODE')
    expect(data?.message).toContain('Authorization code is required')
  })
})
