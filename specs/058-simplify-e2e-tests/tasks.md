# Tasks: Simplify E2E Testing

**Input**: Design documents from `/specs/058-simplify-e2e-tests/`
**Prerequisites**: spec.md (required)

## Execution Flow (main)

Based on the simplification plan, this feature focuses on removing over-engineered E2E tests and replacing them with 6 simple, portfolio-appropriate tests.

**Tech Stack**: Node.js 18+, TypeScript 5.x, Playwright (Chromium only)
**Structure**: Portfolio website with simple E2E testing
**Target**: 95% reduction in E2E test complexity and execution time

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 1: Cleanup Over-Engineered Tests

- [ ] T001 [P] Delete analytics-related E2E tests (analytics-tracking.spec.ts, analytics-events-api.spec.ts, performance-monitoring.spec.ts, consent-workflow.spec.ts)
- [ ] T002 [P] Delete configuration and troubleshooting E2E tests (config-*.spec.ts, environment-validation.spec.ts, dependency-version-test.spec.ts)
- [ ] T003 [P] Delete complex workflow and diagnosis tests (workflow-diagnosis.spec.ts, troubleshooting-workflow-validation.spec.ts, test_workflow_failure_simulation.ts)
- [ ] T004 [P] Delete timeout and post-discovery tests (timeout-scenarios.spec.ts, post-discovery-fix.spec.ts)
- [ ] T005 [P] Simplify playwright.config.ts to single browser (Chromium only)

## Phase 2: Create Simple Portfolio Tests

- [ ] T006 [P] Create homepage.spec.ts - Test homepage display and project grid
- [ ] T007 [P] Create project-navigation.spec.ts - Test project card clicks and detail pages
- [ ] T008 [P] Create contact.spec.ts - Test contact information display
- [ ] T009 [P] Create subscription.spec.ts - Test subscription form functionality
- [ ] T010 [P] Create mobile.spec.ts - Test mobile responsive design
- [ ] T011 [P] Create error-handling.spec.ts - Test 404 page and error handling

## Phase 3: Validation and Cleanup

- [ ] T012 [P] Update package.json scripts to reflect simplified testing
- [ ] T013 [P] Update README.md with new simplified testing approach
- [ ] T014 [P] Verify all 6 tests pass consistently
- [ ] T015 [P] Confirm total execution time < 30 seconds
- [ ] T016 [P] Test CI/CD pipeline with simplified tests

## Success Criteria

- ✅ **6 E2E tests** (down from 18+)
- ✅ **< 30 seconds** total execution time
- ✅ **95%+ pass rate** in CI
- ✅ **Simple, maintainable** test code
- ✅ **Portfolio-appropriate** scope only

## Notes

- Each test file should be ~50 lines maximum
- Focus on core portfolio functionality only
- Avoid enterprise patterns (analytics, consent, performance monitoring)
- Use single browser (Chromium) for simplicity
- Keep tests stable and non-flaky
