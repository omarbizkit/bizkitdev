// tests/integration/session-persistence.test.ts
// Integration test for session persistence

import { describe, it, expect } from 'vitest'

describe('Session Persistence', () => {
  it('should maintain session endpoint availability', async () => {
    // Test that session endpoint is consistently available
    const response = await fetch('http://localhost:4323/api/auth/session')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('application/json')
  })

  it('should handle user profile endpoint when not authenticated', async () => {
    const response = await fetch('http://localhost:4323/api/auth/user')

    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data.error).toBe('UNAUTHORIZED')
    expect(data.message).toContain('Not authenticated')
  })


  it('should handle repeated session checks without degradation', async () => {
    // Test session endpoint performance with multiple requests
    const iterations = 5
    const responses = []

    for (let i = 0; i < iterations; i++) {
      const response = await fetch('http://localhost:4323/api/auth/session')
      responses.push(response)
    }

    // All requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200)
    })

    const data = await Promise.all(responses.map(r => r.json()))

    // All should return consistent null session when not authenticated
    data.forEach(d => {
      expect(d.session).toBeNull()
      expect(d.user).toBeNull()
    })
  })

  it('should return consistent response format across session checks', async () => {
    const response1 = await fetch('http://localhost:4323/api/auth/session')
    const response2 = await fetch('http://localhost:4323/api/auth/session')

    const data1 = await response1.json()
    const data2 = await response2.json()

    // Responses should have identical structure
    expect(Object.keys(data1).sort()).toEqual(Object.keys(data2).sort())
    expect(data1).toEqual(data2)
  })

})
