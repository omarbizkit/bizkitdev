// tests/contract/utils/auth-test-helpers.ts
// Test utilities for auth contract tests

import type { SessionResponse, SignInResponse, AuthErrorResponse } from '../../../src/types/auth'

/**
 * Base URL for API requests (use env var or default)
 */
export const getBaseUrl = (): string => {
  return process.env.TEST_BASE_URL || 'http://localhost:4321'
}

/**
 * Make authenticated API request
 */
export async function makeAuthRequest(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  cookies?: string
): Promise<Response> {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}${endpoint}`

  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }

  if (cookies) {
    headers['Cookie'] = cookies
  }

  const options: RequestInit = {
    method,
    headers,
    redirect: 'manual' // Don't follow redirects automatically
  }

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body)
  }

  return fetch(url, options)
}

/**
 * Assert response has authentication cookies
 */
export function assertSessionCookies(response: Response): void {
  const setCookie = response.headers.get('Set-Cookie')

  if (!setCookie) {
    throw new Error('Expected Set-Cookie header but none found')
  }

  // Check for Supabase auth cookies
  const hasAuthCookie = setCookie.includes('sb-') ||
                        setCookie.includes('auth-token') ||
                        setCookie.toLowerCase().includes('supabase')

  if (!hasAuthCookie) {
    throw new Error(`Expected auth cookie in Set-Cookie header, got: ${setCookie}`)
  }
}

/**
 * Assert cookies are cleared (expired)
 */
export function assertCookiesCleared(response: Response): void {
  const setCookie = response.headers.get('Set-Cookie')

  if (!setCookie) {
    // No Set-Cookie header might mean cookies weren't set in the first place
    // This is acceptable for sign-out
    return
  }

  // Check for Max-Age=0 or Expires in the past
  const isExpired = setCookie.includes('Max-Age=0') ||
                    setCookie.includes('Expires=Thu, 01 Jan 1970')

  if (!isExpired) {
    throw new Error(`Expected cookies to be expired, got: ${setCookie}`)
  }
}

/**
 * Generate mock OAuth authorization code
 */
export function mockOAuthCode(): string {
  return `mock_code_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

/**
 * Generate mock session cookies string
 */
export function mockSessionCookies(accessToken: string = 'mock_access_token'): string {
  return `sb-access-token=${accessToken}; sb-refresh-token=mock_refresh_token`
}

/**
 * Parse JSON response with error handling
 */
export async function parseJsonResponse<T = any>(response: Response): Promise<T> {
  const text = await response.text()

  if (!text) {
    throw new Error('Empty response body')
  }

  try {
    return JSON.parse(text) as T
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${text}`)
  }
}

/**
 * Assert response is successful (2xx)
 */
export function assertSuccessResponse(response: Response): void {
  if (!response.ok) {
    throw new Error(`Expected successful response, got ${response.status}: ${response.statusText}`)
  }
}

/**
 * Assert response has specific status code
 */
export function assertStatusCode(response: Response, expectedStatus: number): void {
  if (response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${response.status}`)
  }
}

/**
 * Assert response is redirect (3xx)
 */
export function assertRedirect(response: Response, expectedLocation?: string): void {
  if (response.status < 300 || response.status >= 400) {
    throw new Error(`Expected redirect response, got ${response.status}`)
  }

  if (expectedLocation) {
    const location = response.headers.get('Location')
    if (location !== expectedLocation) {
      throw new Error(`Expected redirect to ${expectedLocation}, got ${location}`)
    }
  }
}

/**
 * Assert response is an error response
 */
export function assertErrorResponse(response: Response): void {
  if (response.ok) {
    throw new Error(`Expected error response, got ${response.status}`)
  }
}

/**
 * Extract error message from response
 */
export async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data = await parseJsonResponse<AuthErrorResponse>(response)
    return data.message || data.error || 'Unknown error'
  } catch {
    return `HTTP ${response.status}: ${response.statusText}`
  }
}

/**
 * Wait for a condition with timeout
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`)
}

/**
 * Create test user data
 */
export function createTestUser(overrides: Partial<{
  id: string
  email: string
  full_name: string
  avatar_url: string
  provider: string
}> = {}) {
  return {
    id: overrides.id || `test-user-${Date.now()}`,
    email: overrides.email || `test-${Date.now()}@example.com`,
    full_name: overrides.full_name || 'Test User',
    avatar_url: overrides.avatar_url || 'https://example.com/avatar.jpg',
    provider: overrides.provider || 'google',
    email_confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  }
}
