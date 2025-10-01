// tests/contract/auth-user.test.ts
// Minimal contract test for user endpoint

import { describe, it, expect } from 'vitest'
import { makeAuthRequest, parseJsonResponse } from './utils/auth-test-helpers'

describe('GET /api/auth/user', () => {
  it('should return user data when authenticated', async () => {
    const response = await makeAuthRequest('/api/auth/user', 'GET')

    expect(response.status).toBe(200)
    const data = await parseJsonResponse(response)
    expect(data).toHaveProperty('user')
    expect(data).toHaveProperty('profile')
  })
})
