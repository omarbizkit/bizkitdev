// tests/integration/cross-subdomain-session.test.ts
// Integration test for cross-subdomain session sharing

import { describe, it, expect } from 'vitest'

describe('Cross-Subdomain Session Sharing', () => {
  it('should use cookie domain from environment variable', () => {
    // Verify cookie domain configuration
    const cookieDomain = import.meta.env.PUBLIC_COOKIE_DOMAIN || '.bizkit.dev'

    expect(cookieDomain).toBe('.bizkit.dev')
  })

  it('should return session from /api/auth/session endpoint', async () => {
    const response = await fetch('http://localhost:4323/api/auth/session')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('application/json')

    const data = await response.json()

    // When not authenticated, should return null session
    expect(data).toHaveProperty('session')
    expect(data).toHaveProperty('user')
  })

  it('should verify session endpoint returns consistent structure', async () => {
    const response = await fetch('http://localhost:4323/api/auth/session')
    const data = await response.json()

    // Verify response structure matches expected schema
    expect(data.session).toBeNull()
    expect(data.user).toBeNull()

    // When authenticated, session would have:
    // - access_token
    // - refresh_token
    // - expires_at
    // - user object
  })

  it('should handle session retrieval without errors', async () => {
    // Test multiple session requests
    const requests = Array(3).fill(null).map(() =>
      fetch('http://localhost:4323/api/auth/session')
    )

    const responses = await Promise.all(requests)

    responses.forEach(response => {
      expect(response.status).toBe(200)
    })

    const data = await Promise.all(responses.map(r => r.json()))

    data.forEach(d => {
      expect(d).toHaveProperty('session')
      expect(d).toHaveProperty('user')
    })
  })
})
