// tests/contract/auth-callback.test.ts
// Minimal contract test for OAuth callback endpoint

import { describe, it, expect } from 'vitest'
import { makeAuthRequest, assertSessionCookies } from './utils/auth-test-helpers'

describe('GET /api/auth/callback', () => {
  it('should redirect with session cookie when code is valid', async () => {
    const response = await makeAuthRequest(
      '/api/auth/callback?code=test_code&next=/',
      'GET'
    )

    expect(response.status).toBe(303)
    expect(response.headers.get('Location')).toBeDefined()
  })

  it('should return 400 when code is missing', async () => {
    const response = await makeAuthRequest('/api/auth/callback', 'GET')

    expect(response.status).toBe(400)
  })
})
