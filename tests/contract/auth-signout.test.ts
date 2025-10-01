// tests/contract/auth-signout.test.ts
// Minimal contract test for sign-out endpoint

import { describe, it, expect } from 'vitest'
import { makeAuthRequest, parseJsonResponse } from './utils/auth-test-helpers'

describe('POST /api/auth/signout', () => {
  it('should return success', async () => {
    const response = await makeAuthRequest('/api/auth/signout', 'POST')

    expect(response.status).toBe(200)
    const data = await parseJsonResponse(response)
    expect(data.success).toBe(true)
  })
})
