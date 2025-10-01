// tests/contract/auth-signin.test.ts
// Minimal contract test for sign-in endpoint

import { describe, it, expect } from 'vitest'
import { makeAuthRequest, parseJsonResponse } from './utils/auth-test-helpers'

describe('POST /api/auth/signin', () => {
  it('should return OAuth URL', async () => {
    const response = await makeAuthRequest('/api/auth/signin', 'POST', {
      redirectTo: '/dashboard'
    })

    expect(response.status).toBe(200)
    const data = await parseJsonResponse(response)
    expect(data.url).toBeDefined()
    expect(data.provider).toBe('google')
  })
})
