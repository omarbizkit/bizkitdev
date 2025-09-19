# T067-T070: Contract Tests Implementation

**Feature**: 057-advanced-analytics-monitoring
**Phase**: 5.1 - Contract Tests (TDD)
**Status**: Ready for parallel execution
**Expected Result**: All tests should FAIL initially (RED phase)

## Execution Strategy

These 4 tasks can run **completely in parallel** since they create different test files with no dependencies.

```bash
# Launch all contract tests simultaneously
Task: "Create contract test: Analytics events API in tests/contract/test_analytics_events_api.ts"
Task: "Create contract test: Error tracking API in tests/contract/test_error_tracking_api.ts"
Task: "Create contract test: Consent management API in tests/contract/test_consent_management_api.ts"
Task: "Create contract test: Dashboard data API in tests/contract/test_dashboard_api.ts"
```

---

## T067 [P]: Analytics Events API Contract Test

**File**: `tests/contract/test_analytics_events_api.ts`
**Endpoints**: `/api/analytics/events`, `/api/analytics/events/batch`
**Expected**: FAIL (endpoints don't exist yet)

### Implementation Requirements

```typescript
import { test, expect } from '@playwright/test';

describe('Analytics Events API Contract Tests', () => {
  const baseURL = 'http://localhost:4321';

  // Test T067.1: POST /api/analytics/events - Valid single event
  test('should accept valid analytics event with 201 response', async ({ request }) => {
    const validEvent = {
      category: 'page_view',
      action: 'view',
      label: 'homepage',
      page: {
        path: '/',
        title: 'Omar Torres | Data & AI Enthusiast',
        url: 'https://bizkit.dev/'
      },
      consentLevel: 'analytics'
    };

    const response = await request.post(`${baseURL}/api/analytics/events`, {
      data: validEvent
    });

    expect(response.status()).toBe(201);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.message).toBeDefined();
    expect(responseBody.timestamp).toBeDefined();
  });

  // Test T067.2: POST /api/analytics/events - Project interaction event
  test('should accept project interaction event', async ({ request }) => {
    const projectEvent = {
      category: 'project_click',
      action: 'click',
      label: 'ai-trading-system',
      value: 1,
      page: {
        path: '/',
        title: 'Omar Torres | Data & AI Enthusiast',
        url: 'https://bizkit.dev/'
      },
      consentLevel: 'analytics'
    };

    const response = await request.post(`${baseURL}/api/analytics/events`, {
      data: projectEvent
    });

    expect(response.status()).toBe(201);
  });

  // Test T067.3: POST /api/analytics/events - Invalid data (400)
  test('should reject invalid analytics event with 400', async ({ request }) => {
    const invalidEvent = {
      // Missing required fields: category, action, page, consentLevel
      label: 'test'
    };

    const response = await request.post(`${baseURL}/api/analytics/events`, {
      data: invalidEvent
    });

    expect(response.status()).toBe(400);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toBeDefined();
  });

  // Test T067.4: POST /api/analytics/events - Insufficient consent (403)
  test('should reject event with insufficient consent', async ({ request }) => {
    const eventWithoutConsent = {
      category: 'page_view',
      action: 'view',
      page: {
        path: '/test',
        title: 'Test Page',
        url: 'https://bizkit.dev/test'
      },
      consentLevel: 'none' // Insufficient consent for analytics
    };

    const response = await request.post(`${baseURL}/api/analytics/events`, {
      data: eventWithoutConsent
    });

    expect(response.status()).toBe(403);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toContain('consent');
  });

  // Test T067.5: POST /api/analytics/events/batch - Valid batch events
  test('should accept batch analytics events', async ({ request }) => {
    const batchEvents = {
      events: [
        {
          category: 'page_view',
          action: 'view',
          label: 'homepage',
          page: {
            path: '/',
            title: 'Omar Torres | Data & AI Enthusiast',
            url: 'https://bizkit.dev/'
          },
          consentLevel: 'analytics'
        },
        {
          category: 'project_click',
          action: 'click',
          label: 'ai-system',
          page: {
            path: '/',
            title: 'Omar Torres | Data & AI Enthusiast',
            url: 'https://bizkit.dev/'
          },
          consentLevel: 'analytics'
        }
      ]
    };

    const response = await request.post(`${baseURL}/api/analytics/events/batch`, {
      data: batchEvents
    });

    expect(response.status()).toBe(201);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.processed).toBe(2);
    expect(responseBody.failed).toBe(0);
  });

  // Test T067.6: POST /api/analytics/events/batch - Max items validation
  test('should reject batch with >100 events', async ({ request }) => {
    const tooManyEvents = {
      events: Array(101).fill({
        category: 'page_view',
        action: 'view',
        page: {
          path: '/test',
          title: 'Test',
          url: 'https://bizkit.dev/test'
        },
        consentLevel: 'analytics'
      })
    };

    const response = await request.post(`${baseURL}/api/analytics/events/batch`, {
      data: tooManyEvents
    });

    expect(response.status()).toBe(400);
  });
});
```

---

## T068 [P]: Error Tracking API Contract Test

**File**: `tests/contract/test_error_tracking_api.ts`
**Endpoint**: `/api/analytics/errors`
**Expected**: FAIL (endpoint doesn't exist yet)

### Implementation Requirements

```typescript
import { test, expect } from '@playwright/test';

describe('Error Tracking API Contract Tests', () => {
  const baseURL = 'http://localhost:4321';

  // Test T068.1: POST /api/analytics/errors - Valid JavaScript error
  test('should accept valid JavaScript error event', async ({ request }) => {
    const errorEvent = {
      type: 'javascript_error',
      severity: 'medium',
      message: 'Cannot read property \'click\' of null',
      stack: 'TypeError: Cannot read property \'click\' of null\\n    at HTMLButtonElement.<anonymous> (main.js:42:5)',
      filename: 'main.js',
      lineNumber: 42,
      columnNumber: 5,
      page: {
        path: '/',
        title: 'Omar Torres | Data & AI Enthusiast',
        url: 'https://bizkit.dev/'
      }
    };

    const response = await request.post(`${baseURL}/api/analytics/errors`, {
      data: errorEvent
    });

    expect(response.status()).toBe(201);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.message).toBeDefined();
  });

  // Test T068.2: POST /api/analytics/errors - Network error
  test('should accept network error event', async ({ request }) => {
    const networkError = {
      type: 'network_error',
      severity: 'high',
      message: 'Failed to fetch /api/subscribe',
      page: {
        path: '/subscribe',
        title: 'Newsletter Signup',
        url: 'https://bizkit.dev/subscribe'
      }
    };

    const response = await request.post(`${baseURL}/api/analytics/errors`, {
      data: networkError
    });

    expect(response.status()).toBe(201);
  });

  // Test T068.3: POST /api/analytics/errors - Critical error
  test('should accept critical error with high priority', async ({ request }) => {
    const criticalError = {
      type: 'promise_rejection',
      severity: 'critical',
      message: 'Unhandled promise rejection in analytics module',
      page: {
        path: '/projects/ai-trading',
        title: 'AI Trading System',
        url: 'https://bizkit.dev/projects/ai-trading'
      },
      customData: {
        component: 'AnalyticsProvider',
        userId: 'anonymous'
      }
    };

    const response = await request.post(`${baseURL}/api/analytics/errors`, {
      data: criticalError
    });

    expect(response.status()).toBe(201);
  });

  // Test T068.4: POST /api/analytics/errors - Invalid error data
  test('should reject invalid error event with 400', async ({ request }) => {
    const invalidError = {
      // Missing required fields: type, severity, message, page
      lineNumber: 42
    };

    const response = await request.post(`${baseURL}/api/analytics/errors`, {
      data: invalidError
    });

    expect(response.status()).toBe(400);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toBeDefined();
  });
});
```

---

## T069 [P]: Consent Management API Contract Test

**File**: `tests/contract/test_consent_management_api.ts`
**Endpoints**: `/api/analytics/consent` (POST, GET)
**Expected**: FAIL (endpoints don't exist yet)

### Implementation Requirements

```typescript
import { test, expect } from '@playwright/test';

describe('Consent Management API Contract Tests', () => {
  const baseURL = 'http://localhost:4321';

  // Test T069.1: POST /api/analytics/consent - Update consent
  test('should accept consent update and return consent ID', async ({ request }) => {
    const consentUpdate = {
      level: 'analytics',
      granularConsent: {
        essential: true,
        functional: true,
        analytics: true,
        performance: true,
        marketing: false,
        personalization: false,
        thirdParty: false
      },
      method: 'banner_accept'
    };

    const response = await request.post(`${baseURL}/api/analytics/consent`, {
      data: consentUpdate
    });

    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.consentId).toBeDefined();
    expect(responseBody.message).toBeDefined();
    expect(responseBody.effectiveDate).toBeDefined();
  });

  // Test T069.2: POST /api/analytics/consent - Full consent
  test('should accept full consent with marketing enabled', async ({ request }) => {
    const fullConsent = {
      level: 'full',
      granularConsent: {
        essential: true,
        functional: true,
        analytics: true,
        performance: true,
        marketing: true,
        personalization: true,
        thirdParty: true
      },
      method: 'settings_update'
    };

    const response = await request.post(`${baseURL}/api/analytics/consent`, {
      data: fullConsent
    });

    expect(response.status()).toBe(200);
  });

  // Test T069.3: POST /api/analytics/consent - Reject all consent
  test('should accept consent withdrawal', async ({ request }) => {
    const rejectConsent = {
      level: 'essential',
      granularConsent: {
        essential: true,
        functional: false,
        analytics: false,
        performance: false,
        marketing: false,
        personalization: false,
        thirdParty: false
      },
      method: 'banner_reject'
    };

    const response = await request.post(`${baseURL}/api/analytics/consent`, {
      data: rejectConsent
    });

    expect(response.status()).toBe(200);
  });

  // Test T069.4: GET /api/analytics/consent/{id} - Retrieve consent
  test('should retrieve consent data by ID', async ({ request }) => {
    // First create consent
    const consentUpdate = {
      level: 'analytics',
      granularConsent: {
        essential: true,
        functional: true,
        analytics: true,
        performance: true,
        marketing: false,
        personalization: false,
        thirdParty: false
      },
      method: 'banner_accept'
    };

    const createResponse = await request.post(`${baseURL}/api/analytics/consent`, {
      data: consentUpdate
    });

    const createBody = await createResponse.json();
    const consentId = createBody.consentId;

    // Then retrieve it
    const getResponse = await request.get(`${baseURL}/api/analytics/consent/${consentId}`);

    expect(getResponse.status()).toBe(200);

    const getBody = await getResponse.json();
    expect(getBody.consentId).toBe(consentId);
    expect(getBody.level).toBe('analytics');
    expect(getBody.granularConsent).toBeDefined();
  });

  // Test T069.5: GET /api/analytics/consent/{id} - Not found
  test('should return 404 for non-existent consent ID', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/analytics/consent/non-existent-id`);

    expect(response.status()).toBe(404);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toContain('not found');
  });

  // Test T069.6: POST /api/analytics/consent - Invalid consent data
  test('should reject invalid consent data', async ({ request }) => {
    const invalidConsent = {
      level: 'invalid_level',
      // Missing granularConsent and method
    };

    const response = await request.post(`${baseURL}/api/analytics/consent`, {
      data: invalidConsent
    });

    expect(response.status()).toBe(400);
  });
});
```

---

## T070 [P]: Dashboard API Contract Test

**File**: `tests/contract/test_dashboard_api.ts`
**Endpoint**: `/api/analytics/dashboard`
**Expected**: FAIL (endpoint doesn't exist yet)

### Implementation Requirements

```typescript
import { test, expect } from '@playwright/test';

describe('Dashboard API Contract Tests', () => {
  const baseURL = 'http://localhost:4321';

  // Test T070.1: GET /api/analytics/dashboard - Default period (week)
  test('should return dashboard data for default period', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/analytics/dashboard`, {
      headers: {
        'Authorization': 'Bearer test-admin-token' // Mock admin token
      }
    });

    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody.summary).toBeDefined();
    expect(responseBody.summary.totalPageViews).toBeGreaterThanOrEqual(0);
    expect(responseBody.summary.uniqueVisitors).toBeGreaterThanOrEqual(0);
    expect(responseBody.summary.averageSessionDuration).toBeGreaterThanOrEqual(0);
    expect(responseBody.summary.bounceRate).toBeGreaterThanOrEqual(0);

    expect(responseBody.topPages).toBeDefined();
    expect(Array.isArray(responseBody.topPages)).toBe(true);

    expect(responseBody.topProjects).toBeDefined();
    expect(Array.isArray(responseBody.topProjects)).toBe(true);

    expect(responseBody.performanceMetrics).toBeDefined();
    expect(responseBody.errorSummary).toBeDefined();
  });

  // Test T070.2: GET /api/analytics/dashboard - Specific period
  test('should return dashboard data for month period', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/analytics/dashboard?period=month`, {
      headers: {
        'Authorization': 'Bearer test-admin-token'
      }
    });

    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody.summary).toBeDefined();
  });

  // Test T070.3: GET /api/analytics/dashboard - Custom date range
  test('should return dashboard data for custom date range', async ({ request }) => {
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';

    const response = await request.get(
      `${baseURL}/api/analytics/dashboard?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          'Authorization': 'Bearer test-admin-token'
        }
      }
    );

    expect(response.status()).toBe(200);
  });

  // Test T070.4: GET /api/analytics/dashboard - Unauthorized access
  test('should reject request without authorization', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/analytics/dashboard`);

    expect(response.status()).toBe(401);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toContain('Unauthorized');
  });

  // Test T070.5: GET /api/analytics/dashboard - Invalid token
  test('should reject request with invalid token', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/analytics/dashboard`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

    expect(response.status()).toBe(403);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toContain('permissions');
  });

  // Test T070.6: GET /api/analytics/dashboard - Performance metrics structure
  test('should return properly structured performance metrics', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/analytics/dashboard`, {
      headers: {
        'Authorization': 'Bearer test-admin-token'
      }
    });

    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    const perfMetrics = responseBody.performanceMetrics;

    expect(perfMetrics.averageLCP).toBeGreaterThanOrEqual(0);
    expect(perfMetrics.averageFID).toBeGreaterThanOrEqual(0);
    expect(perfMetrics.averageCLS).toBeGreaterThanOrEqual(0);
  });

  // Test T070.7: GET /api/analytics/dashboard - Error summary structure
  test('should return properly structured error summary', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/analytics/dashboard`, {
      headers: {
        'Authorization': 'Bearer test-admin-token'
      }
    });

    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    const errorSummary = responseBody.errorSummary;

    expect(errorSummary.totalErrors).toBeGreaterThanOrEqual(0);
    expect(errorSummary.errorRate).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(errorSummary.topErrors)).toBe(true);
  });
});
```

---

## File Directory Structure

```
tests/contract/
├── test_analytics_events_api.ts     # T067 - Events API contracts
├── test_error_tracking_api.ts       # T068 - Error tracking contracts
├── test_consent_management_api.ts   # T069 - Consent API contracts
└── test_dashboard_api.ts            # T070 - Dashboard API contracts
```

## Success Criteria

**All tests MUST fail initially** with error messages like:
- `404 Not Found` for missing endpoints
- `Connection refused` for non-existent API routes
- `Module not found` for missing endpoint files

This proves the TDD approach is working correctly.

## Parallel Execution

All 4 tasks can run simultaneously:

```bash
# Execute in parallel - all should fail initially
npm run test:contract -- --grep "Analytics Events API Contract"
npm run test:contract -- --grep "Error Tracking API Contract"
npm run test:contract -- --grep "Consent Management API Contract"
npm run test:contract -- --grep "Dashboard API Contract"
```

After T067-T070 complete (and fail), proceed to T071-T075 for API implementation.
