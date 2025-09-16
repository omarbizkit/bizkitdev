# Tasks: Continue E2E Test Troubleshooting

**Input**: Design documents from `/specs/055-continue-e2e-troubleshooting/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

Based on the implementation plan, this feature focuses on systematic configuration fixes for E2E test reliability. The tasks follow TDD principles by validating current failures before implementing fixes.

**Tech Stack**: Node.js 18+, TypeScript 5.x, Playwright, Astro, GitHub Actions
**Structure**: Web application (Astro frontend with API endpoints)
**Target**: Fix configuration mismatches causing E2E test failures in CI/CD

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Environment Validation

- [ ] T001 Validate current E2E test failure state (verify tests currently fail in CI)
- [ ] T002 [P] Create configuration audit script in `scripts/audit-e2e-config.sh`
- [ ] T003 [P] Set up validation environment with mock Supabase variables

## Phase 3.2: Configuration Audit (Parallel Discovery) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These audits MUST identify actual configuration mismatches before fixes**

- [ ] T004 [P] Audit port configurations in `playwright.config.ts`, `package.json`, `astro.config.mjs`
- [ ] T005 [P] Audit test selectors in `tests/e2e/` vs DOM elements in `src/components/`, `src/pages/`
- [ ] T006 [P] Audit browser environment configuration in `.github/workflows/ci.yml`
- [ ] T007 [P] Audit server health endpoint implementation in `src/pages/api/health.ts`

## Phase 3.3: Validation Implementation (Contract Tests)

**CRITICAL: These validation tests MUST FAIL initially before configuration fixes**

- [ ] T008 [P] Create port alignment validation test in `tests/contract/config-port-alignment.spec.ts`
- [ ] T009 [P] Create selector existence validation test in `tests/contract/config-selector-validation.spec.ts`
- [ ] T010 [P] Create browser environment validation test in `tests/contract/config-browser-environment.spec.ts`
- [ ] T011 [P] Create server health check validation test in `tests/contract/config-health-check.spec.ts`

## Phase 3.4: Configuration Fixes (ONLY after validation tests are failing)

- [ ] T012 Fix port configuration alignment - ensure all files use port 4321
  - Update `playwright.config.ts` webServer.url to use port 4321
  - Update `package.json` dev script to use `--port 4321`
  - Verify `astro.config.mjs` server configuration
- [ ] T013 Fix test selector mismatches in DOM elements
  - Add missing `data-testid="hero-subscribe-form"` to homepage subscription form
  - Add missing `data-testid="subscribe-form"` to subscribe page form
  - Update other test selectors to match actual DOM structure
- [ ] T014 Fix browser environment configuration in GitHub Actions
  - Set `PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-browsers` in CI workflow
  - Update browser installation step to use consistent path
  - Add browser environment validation step
- [ ] T015 Fix server health endpoint implementation
  - Ensure `/api/health` endpoint returns proper JSON response
  - Add port number to health response
  - Implement proper error handling for unhealthy states

## Phase 3.5: Server Lifecycle Management

- [ ] T016 Improve server startup/shutdown lifecycle in CI environment
  - Add explicit server ready verification before test execution
  - Implement retry mechanisms for server health checks
  - Improve server cleanup processes
- [ ] T017 Update GitHub Actions workflow for reliable E2E testing
  - Add explicit environment validation steps
  - Improve test artifact collection for debugging
  - Add comprehensive logging for troubleshooting

## Phase 3.6: Integration Validation

- [ ] T018 [P] Validate local environment configuration using quickstart scenarios
- [ ] T019 [P] Validate CI environment simulation with mock Supabase
- [ ] T020 [P] Validate cross-browser compatibility configurations
- [ ] T021 Run complete E2E test suite to verify all fixes work together

## Phase 3.7: Polish & Documentation

- [ ] T022 [P] Create troubleshooting documentation in `docs/e2e-troubleshooting.md`
- [ ] T023 [P] Update GitHub Actions workflow documentation
- [ ] T024 [P] Create configuration validation checklist script
- [ ] T025 Run quickstart validation scenarios to confirm all fixes

## Dependencies

- **Audit Phase (T004-T007)** before validation tests (T008-T011)
- **Validation tests (T008-T011)** before configuration fixes (T012-T015)
- **Configuration fixes (T012-T015)** before server lifecycle (T016-T017)
- **All core fixes** before integration validation (T018-T021)
- **Everything** before polish and documentation (T022-T025)

**Critical Dependencies**:
- T012 (port config) blocks T008, T021
- T013 (selectors) blocks T009, T021
- T014 (browser env) blocks T010, T021
- T015 (health endpoint) blocks T011, T021
- T016-T017 (server lifecycle) blocks T021

## Parallel Execution Examples

### Phase 3.2: Configuration Audit (All Parallel)
```bash
# Launch T004-T007 together - independent file audits:
Task: "Audit port configurations in playwright.config.ts, package.json, astro.config.mjs"
Task: "Audit test selectors in tests/e2e/ vs DOM elements in src/components/, src/pages/"
Task: "Audit browser environment configuration in .github/workflows/ci.yml"
Task: "Audit server health endpoint implementation in src/pages/api/health.ts"
```

### Phase 3.3: Validation Tests (All Parallel)
```bash
# Launch T008-T011 together - independent test files:
Task: "Create port alignment validation test in tests/contract/config-port-alignment.spec.ts"
Task: "Create selector existence validation test in tests/contract/config-selector-validation.spec.ts"
Task: "Create browser environment validation test in tests/contract/config-browser-environment.spec.ts"
Task: "Create server health check validation test in tests/contract/config-health-check.spec.ts"
```

### Phase 3.6: Integration Validation (Partial Parallel)
```bash
# Launch T018-T020 together - independent validation scenarios:
Task: "Validate local environment configuration using quickstart scenarios"
Task: "Validate CI environment simulation with mock Supabase"
Task: "Validate cross-browser compatibility configurations"
```

## Configuration Files Affected

### Primary Configuration Files
- `playwright.config.ts` - Port alignment, browser environment
- `package.json` - Dev script port configuration
- `astro.config.mjs` - Server configuration validation
- `.github/workflows/ci.yml` - CI environment and browser setup

### Test Files Created/Modified
- `tests/contract/config-port-alignment.spec.ts` (new)
- `tests/contract/config-selector-validation.spec.ts` (new)
- `tests/contract/config-browser-environment.spec.ts` (new)
- `tests/contract/config-health-check.spec.ts` (new)

### DOM Elements Modified
- Homepage subscription form - add `data-testid="hero-subscribe-form"`
- Subscribe page form - add `data-testid="subscribe-form"`
- Other components as needed for test selector alignment

## Success Criteria Validation

After completing all tasks:

- [ ] ✅ All configuration files use port 4321 consistently
- [ ] ✅ Health endpoint `/api/health` responds with HTTP 200 and proper JSON
- [ ] ✅ All test selectors exist in corresponding DOM elements
- [ ] ✅ E2E tests pass locally with standard configuration
- [ ] ✅ E2E tests pass with CI-like environment variables
- [ ] ✅ Browser installation works in specified paths (`/tmp/playwright-browsers`)
- [ ] ✅ GitHub Actions "Run E2E tests" step completes successfully
- [ ] ✅ No configuration conflicts or errors reported
- [ ] ✅ Test execution time remains under 5 minutes
- [ ] ✅ 95%+ CI success rate achieved

## Notes

- **TDD Approach**: All validation tests must fail initially, then pass after fixes
- **Configuration Focus**: No new features, only fixing existing test infrastructure
- **Incremental Validation**: Test each fix independently before combining
- **CI Compatibility**: All fixes must work in both local and GitHub Actions environments
- **Performance Preservation**: Maintain existing timeout optimizations
- **Error Clarity**: Improve error messages for future troubleshooting

## Task Generation Rules Applied

1. **From Research Findings**: 5 key areas → audit tasks → validation tasks → fix tasks
2. **From Data Model**: Configuration entities → validation tests for each entity
3. **From Contracts**: Health endpoint → contract test + implementation fix
4. **From Quickstart**: Validation scenarios → integration validation tasks

**Ordering Strategy**: Audit → Validate → Fix → Integrate → Polish (TDD compliance)
**Parallel Strategy**: Independent files marked [P], dependent fixes sequential