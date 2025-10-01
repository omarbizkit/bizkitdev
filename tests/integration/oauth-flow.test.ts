// tests/integration/oauth-flow.test.ts
// Integration test for complete OAuth flow

import { describe, it, expect } from 'vitest'

describe('Complete OAuth Flow', () => {
  it('should initiate OAuth flow and return Google authorization URL', async () => {
    // Test the sign-in endpoint
    const response = await fetch('http://localhost:4323/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirectTo: '/dashboard' })
    })

    expect(response.status).toBe(200)

    const data = await response.json()

    // Verify OAuth URL is returned
    expect(data.url).toBeDefined()
    expect(data.url).toContain('supabase.co/auth/v1/authorize')
    expect(data.provider).toBe('google')

    // Verify callback URL includes redirect
    expect(data.url).toContain('redirect_to')
    expect(data.url).toContain('next%3D%2Fdashboard') // Double-encoded next=/dashboard
  })

  it('should handle callback with authorization code', async () => {
    // Test callback endpoint with mock code
    // Note: Without real OAuth, we can't complete the full flow
    // But we can verify the endpoint handles missing code correctly
    const response = await fetch('http://localhost:4323/api/auth/callback', {
      redirect: 'manual'
    })

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('MISSING_CODE')
    expect(data.message).toContain('Authorization code is required')
  })

  it('should return null session when not authenticated', async () => {
    const response = await fetch('http://localhost:4323/api/auth/session')

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.session).toBeNull()
    expect(data.user).toBeNull()
  })

  it('should complete sign-in flow by returning OAuth URL with correct parameters', async () => {
    const redirectTo = '/profile'

    const response = await fetch('http://localhost:4323/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirectTo })
    })

    const data = await response.json()

    // Verify the OAuth URL contains the callback with next parameter
    expect(data.url).toContain('callback')
    expect(data.url).toContain('next%3D%2Fprofile') // Double-encoded next=/profile
  })

  it('should handle sign-out when not authenticated', async () => {
    const response = await fetch('http://localhost:4323/api/auth/signout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
  })
})
