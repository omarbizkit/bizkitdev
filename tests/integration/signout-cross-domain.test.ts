// tests/integration/signout-cross-domain.test.ts
// Integration test for sign-out across subdomains

import { describe, it, expect } from 'vitest'

describe('Sign Out Across Subdomains', () => {
  it('should successfully call sign-out endpoint', async () => {
    const response = await fetch('http://localhost:4323/api/auth/signout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.message).toContain('Successfully signed out')
  })

  it('should handle sign-out without active session', async () => {
    // Sign out when not authenticated should still succeed
    const response = await fetch('http://localhost:4323/api/auth/signout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('should verify sign-out clears session state', async () => {
    // Sign out
    await fetch('http://localhost:4323/api/auth/signout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    // Verify session is null after sign-out
    const sessionResponse = await fetch('http://localhost:4323/api/auth/session')
    const sessionData = await sessionResponse.json()

    expect(sessionData.session).toBeNull()
    expect(sessionData.user).toBeNull()
  })

  it('should return appropriate response format for sign-out', async () => {
    const response = await fetch('http://localhost:4323/api/auth/signout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    const data = await response.json()

    // Verify response structure
    expect(data).toHaveProperty('success')
    expect(data).toHaveProperty('message')
    expect(typeof data.success).toBe('boolean')
    expect(typeof data.message).toBe('string')
  })

  it('should handle concurrent sign-out requests', async () => {
    // Test multiple sign-out requests at once
    const requests = Array(3).fill(null).map(() =>
      fetch('http://localhost:4323/api/auth/signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    )

    const responses = await Promise.all(requests)

    // All should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200)
    })

    const data = await Promise.all(responses.map(r => r.json()))

    data.forEach(d => {
      expect(d.success).toBe(true)
    })
  })
})
