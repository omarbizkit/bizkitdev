# Data Model: E2E Test Configuration Entities

**Feature**: 055-continue-e2e-troubleshooting
**Date**: 2025-09-16

## Overview

This feature focuses on configuration fixes rather than data entities. However, we model the key configuration objects that need alignment and validation.

## Configuration Entities

### 1. ServerConfiguration

**Purpose**: Represents development server configuration across environments

**Fields**:
- `port`: number (required) - Server port number
- `host`: string (default: "localhost") - Server hostname
- `baseUrl`: string (derived) - Full base URL for tests
- `healthEndpoint`: string (default: "/api/health") - Health check endpoint
- `environment`: "development" | "ci" | "test" - Environment type

**Validation Rules**:
- Port must be consistent across all configurations (4321)
- BaseUrl must match server port and host
- HealthEndpoint must respond with 200 status

**State Transitions**:
- Stopped → Starting → Ready → Stopping → Stopped
- Ready state required before test execution

### 2. PlaywrightConfiguration

**Purpose**: Represents Playwright testing framework configuration

**Fields**:
- `webServer`: WebServerConfig - Server configuration for tests
- `baseURL`: string - Base URL for test navigation
- `use`: BrowserConfig - Browser and viewport settings
- `projects`: ProjectConfig[] - Browser project configurations
- `timeout`: number - Global test timeout

**Validation Rules**:
- webServer.url must match ServerConfiguration.baseUrl
- baseURL must match webServer.url
- Browser projects must have valid browser installations

**Relationships**:
- Depends on ServerConfiguration for webServer settings
- Contains multiple BrowserProject configurations

### 3. BrowserProject

**Purpose**: Represents individual browser test project configuration

**Fields**:
- `name`: string - Browser project name
- `use`: BrowserConfig - Browser-specific settings
- `testDir`: string - Test directory path
- `dependencies`: string[] - Dependency project names

**Validation Rules**:
- Browser name must be valid Playwright browser
- Test directory must exist and contain test files
- Dependencies must reference existing projects

### 4. TestSelector

**Purpose**: Represents DOM element selectors used in tests

**Fields**:
- `testId`: string - data-testid attribute value
- `fallbackSelector`: string (optional) - CSS fallback selector
- `page`: string - Page where selector is used
- `description`: string - Human-readable description

**Validation Rules**:
- testId must exist in corresponding DOM elements
- fallbackSelector must be valid CSS selector
- Page must be valid application route

**Examples**:
- `{ testId: "hero-subscribe-form", page: "/", description: "Homepage newsletter subscription form" }`
- `{ testId: "subscribe-form", page: "/subscribe", description: "Subscribe page main form" }`

### 5. EnvironmentConfiguration

**Purpose**: Represents environment variables and settings for testing

**Fields**:
- `name`: string - Environment name
- `variables`: Record<string, string> - Environment variables
- `browserPath`: string - Playwright browser installation path
- `mockServices`: MockServiceConfig[] - Mock service configurations

**Validation Rules**:
- Required variables must be present and non-empty
- Browser path must exist and contain valid browser installations
- Mock services must be properly configured for testing

## Configuration Relationships

```
EnvironmentConfiguration
├── ServerConfiguration
├── PlaywrightConfiguration
│   ├── WebServerConfig (references ServerConfiguration)
│   └── BrowserProject[]
└── TestSelector[]
```

## Validation Schema

### Port Alignment Validation
```typescript
interface PortAlignmentValidation {
  serverPort: number;
  playwrightWebServerPort: number;
  testBaseUrlPort: number;
  isAligned: boolean;
  conflicts: string[];
}
```

### Selector Existence Validation
```typescript
interface SelectorValidation {
  selector: TestSelector;
  exists: boolean;
  pageUrl: string;
  alternatives: string[];
}
```

### Browser Environment Validation
```typescript
interface BrowserEnvironmentValidation {
  browserPath: string;
  browsersInstalled: string[];
  pathExists: boolean;
  isConsistent: boolean;
}
```

## State Management

### Configuration States
- **Invalid**: Configuration has validation errors
- **Valid**: Configuration passes all validation checks
- **Applied**: Configuration is active in environment
- **Tested**: Configuration has been validated through test execution

### State Transitions
```
Invalid → Valid (after fixing validation errors)
Valid → Applied (after environment setup)
Applied → Tested (after successful test execution)
Tested → Invalid (if new validation errors detected)
```

## Mock Data Requirements

For CI testing, the following mock configurations are required:

### Mock Supabase Configuration
```typescript
{
  PUBLIC_SUPABASE_URL: "https://mock.supabase.co",
  PUBLIC_SUPABASE_ANON_KEY: "mock-anon-key-safe-for-ci"
}
```

### Mock Browser Environment
```typescript
{
  PLAYWRIGHT_BROWSERS_PATH: "/tmp/playwright-browsers",
  DISPLAY: ":0" // For WSL headed testing
}
```

## Validation Constraints

### Cross-Environment Consistency
- All environments must use identical port configurations
- Browser installation paths must be consistent within environment type
- Test selectors must work across all target pages

### Performance Constraints
- Configuration validation must complete within 10 seconds
- Server health checks must respond within 5 seconds
- Browser installations must not exceed CI timeout limits

### Security Constraints
- Mock credentials must never match production values
- Test configurations must not expose sensitive information
- Browser processes must be properly sandboxed in CI

## Error Handling

### Configuration Errors
- Port conflicts: Clear error message with expected vs actual ports
- Missing selectors: List missing selectors with suggested alternatives
- Browser environment: Installation status and path validation errors

### Runtime Errors
- Server startup failures: Detailed logging with retry mechanisms
- Test timeouts: Clear indication of which step timed out
- Browser crashes: Automatic cleanup and error reporting

This data model provides the foundation for systematic configuration validation and alignment across all environments.