// tests/contract/auth-session.test.ts
// Minimal contract test for session endpoint

import { describe, it, expect } from 'vitest'
import { makeAuthRequest, parseJsonResponse } from './utils/auth-test-helpers'

describe('GET /api/auth/session', () => {
  it('should return session data', async () => {
    const response = await makeAuthRequest('/api/auth/session', 'GET')

    expect(response.status).toBe(200)
    const data = await parseJsonResponse(response)
    expect(data).toHaveProperty('session')
    expect(data).toHaveProperty('user')
  })
})
