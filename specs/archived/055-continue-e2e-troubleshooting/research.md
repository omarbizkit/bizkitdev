# Research: E2E Test Troubleshooting Solutions

**Feature**: 055-continue-e2e-troubleshooting
**Date**: 2025-09-16

## Research Questions Identified

Based on the technical context and current E2E test failures, the following areas require research:

1. **Port Configuration Alignment Strategies**
2. **Playwright Browser Environment Standardization**
3. **CI/CD Test Lifecycle Management Best Practices**
4. **Selector Strategy Optimization**
5. **GitHub Actions E2E Testing Patterns**

## Research Findings

### 1. Port Configuration Alignment

**Decision**: Use port 4321 consistently across all environments with explicit configuration validation

**Rationale**:
- Current mismatch between development server (varies) and test expectations (4321)
- Astro default dev server port is 4321, but configuration inconsistencies exist
- Playwright webServer configuration must match actual server port

**Alternatives Considered**:
- Dynamic port detection: Rejected due to complexity and CI unreliability
- Fixed port 3000: Rejected to maintain Astro conventions
- Environment-specific ports: Rejected due to maintenance overhead

**Implementation Approach**:
- Audit all configuration files for port references
- Ensure playwright.config.ts webServer uses port 4321
- Validate package.json dev script starts server on 4321
- Add port validation to test setup

### 2. Playwright Browser Environment Standardization

**Decision**: Standardize browser path and installation across all environments using PLAYWRIGHT_BROWSERS_PATH

**Rationale**:
- Previous efforts used `/tmp/playwright-browsers` path standardization
- Different browser installation locations cause CI vs local inconsistencies
- GitHub Actions needs explicit browser installation control

**Alternatives Considered**:
- Default Playwright browser locations: Rejected due to CI permission issues
- System-wide browser installation: Rejected due to security constraints
- Container-based browsers: Rejected due to complexity for this fix

**Implementation Approach**:
- Set PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-browsers in all environments
- Update GitHub Actions to use consistent browser installation
- Verify browser installation step in CI workflow
- Add browser environment validation to test setup

### 3. CI/CD Test Lifecycle Management

**Decision**: Implement explicit server health checks and graceful lifecycle management

**Rationale**:
- Current server startup/shutdown is unreliable in CI
- Race conditions between server start and test execution
- No verification that server is ready before tests begin

**Alternatives Considered**:
- Fixed delays: Rejected due to unreliability and wasted time
- External service health checks: Rejected due to unnecessary complexity
- Process monitoring: Rejected due to CI environment limitations

**Implementation Approach**:
- Implement `/api/health` endpoint health checking with retries
- Add explicit server ready verification before test execution
- Improve server cleanup in CI environment
- Add timeout and retry mechanisms for server operations

### 4. Selector Strategy Optimization

**Decision**: Audit and fix all test selectors to match actual DOM structure with fallback strategies

**Rationale**:
- Current `data-testid="hero-subscribe-form"` selector may not exist
- Subscription form exists on multiple pages with different selectors
- Test selectors should be resilient and specific

**Alternatives Considered**:
- CSS selectors: Rejected due to brittleness with styling changes
- XPath selectors: Rejected due to complexity and maintenance
- Text-based selectors: Rejected due to i18n considerations

**Implementation Approach**:
- Audit all existing `data-testid` attributes in codebase
- Verify test selectors match actual DOM elements
- Implement fallback selector strategies where appropriate
- Add selector validation to test setup

### 5. GitHub Actions E2E Testing Patterns

**Decision**: Follow GitHub Actions best practices for E2E testing with explicit environment setup

**Rationale**:
- Current workflow may have implicit dependencies or race conditions
- Need explicit control over test environment setup sequence
- Proper artifact collection for debugging failed tests

**Alternatives Considered**:
- Matrix testing with parallel execution: Deferred to avoid complexity
- Docker-based testing: Rejected due to setup overhead
- External testing services: Rejected due to cost and complexity

**Implementation Approach**:
- Review and optimize GitHub Actions workflow steps
- Add explicit environment validation steps
- Improve test artifact collection for debugging
- Add comprehensive logging for troubleshooting

## Technical Dependencies Validated

### Core Technologies
- **Playwright 1.40+**: Confirmed compatible with current test patterns
- **Astro 4.x**: Development server configuration well-documented
- **GitHub Actions**: Standard Node.js environment sufficient
- **Node.js 18+**: Required for ES modules and modern JavaScript features

### Configuration Files
- `playwright.config.ts`: Primary configuration requiring alignment
- `package.json`: Scripts and dependencies need validation
- `.github/workflows/ci.yml`: Workflow step optimization needed
- `astro.config.mjs`: Server configuration validation required

### Environment Variables
- `PUBLIC_SUPABASE_URL`: Mock values for CI testing
- `PUBLIC_SUPABASE_ANON_KEY`: Mock values for CI testing
- `PLAYWRIGHT_BROWSERS_PATH`: Browser installation path standardization
- `TEST_BASE_URL`: Explicit base URL for tests

## Risk Mitigation Strategies

### Configuration Conflicts
- **Risk**: Multiple configuration changes causing new conflicts
- **Mitigation**: Incremental changes with validation at each step
- **Validation**: Run local tests after each configuration change

### CI Environment Differences
- **Risk**: Local fixes not working in CI environment
- **Mitigation**: Test in CI-like environment using Docker or containers
- **Validation**: Validate each change in GitHub Actions

### Test Flakiness
- **Risk**: Some tests may remain unstable due to timing issues
- **Mitigation**: Implement proper wait strategies and element validation
- **Validation**: Multiple test runs to verify stability

### Performance Regression
- **Risk**: Configuration changes slowing down test execution
- **Mitigation**: Maintain existing timeout optimizations
- **Validation**: Monitor test execution times throughout changes

## Next Phase Preparation

All research questions have been resolved with specific implementation approaches identified. The technical context is now fully clarified and ready for Phase 1 design work.

**Key Outcomes**:
- Port 4321 standardization strategy defined
- Browser environment standardization approach confirmed
- Server lifecycle management improvements identified
- Selector strategy optimization plan established
- GitHub Actions workflow improvements outlined

**No Remaining Unknowns**: All NEEDS CLARIFICATION items have been resolved through research.