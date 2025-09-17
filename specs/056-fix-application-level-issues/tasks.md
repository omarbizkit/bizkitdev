# Tasks: Fix Critical Application-Level Issues

**Input**: Design documents from `/specs/056-fix-application-level-issues/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.9, Astro 5.13.7, Playwright testing
   → Structure: Existing Astro web application (single project)
2. Load design documents:
   → data-model.md: Component interface enhancements
   → contracts/: Component contracts for testing
   → research.md: Implementation strategy decisions
3. Generate tasks by category:
   → Tests: Component contract validation
   → Core: Component fixes and enhancements
   → Integration: E2E test validation
   → Polish: Performance and accessibility validation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Dependencies: Tests → Implementation → Validation
7. Parallel execution: Independent component fixes
8. Validate completeness: All 8 failing tests addressed
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (current structure)
- All paths relative to `/home/omarb/dev/projects/bizkitdev/`

## Phase 3.1: Setup and Validation

- [ ] T001 Verify development environment and test baseline
- [ ] T002 [P] Run E2E tests to confirm 8 failing tests (baseline)
- [ ] T003 [P] Analyze current component structure and test requirements

## Phase 3.2: Critical Project Card Fixes (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These contract validations MUST confirm failures before ANY implementation**

- [ ] T004 [P] Contract test: ProjectCard data-testid attribute in tests/contract/test_project_card_attributes.ts
- [ ] T005 [P] Contract test: Project data loading validation in tests/contract/test_project_data_loading.ts
- [ ] T006 [P] Contract test: Project grid rendering minimum count in tests/contract/test_project_grid_rendering.ts

## Phase 3.3: Component Implementation (ONLY after tests are failing)

### Critical Issues (Priority 1)
- [ ] T007 [P] Add data-testid="project-card" to src/components/ProjectCard.astro
- [ ] T008 [P] Add ARIA attributes (role="article", aria-labelledby) to src/components/ProjectCard.astro
- [ ] T009 Verify project data loading in src/components/ProjectGrid.astro
- [ ] T010 Ensure minimum 3 project cards render on homepage

### Content Structure (Priority 2)
- [ ] T011 [P] Verify H1 element in src/pages/index.astro
- [ ] T012 [P] Add/verify H1 element in src/pages/about.astro
- [ ] T013 [P] Add/verify H1 element in src/pages/subscribe.astro

### SEO Enhancement (Priority 2)
- [ ] T014 Add Open Graph meta tags to src/components/MainHead.astro
- [ ] T015 Add structured data (JSON-LD) to src/components/MainHead.astro
- [ ] T016 Enhance meta descriptions for all pages in src/components/MainHead.astro

## Phase 3.4: Integration and Testing

- [ ] T017 [P] Run E2E test: "should show featured projects on homepage"
- [ ] T018 [P] Run E2E test: "should allow browsing project cards"
- [ ] T019 [P] Run E2E test: "should load without accessibility violations"
- [ ] T020 [P] Run E2E test: "should have proper SEO meta tags"
- [ ] T021 [P] Run E2E test: "should load homepage within performance budget"
- [ ] T022 [P] Run E2E test: "should have working internal links"
- [ ] T023 Validate all 8 previously failing tests now pass

## Phase 3.5: Polish and Validation

- [ ] T024 [P] Performance validation: Homepage load time < 3 seconds
- [ ] T025 [P] Accessibility validation: WCAG AA compliance check
- [ ] T026 [P] SEO validation: Meta tag completeness verification
- [ ] T027 [P] Cross-browser validation: Test in multiple browsers
- [ ] T028 Run complete E2E test suite and verify improvement from 46 to 54+ passing tests
- [ ] T029 [P] Code quality: Run TypeScript check and lint
- [ ] T030 Execute quickstart.md validation steps

## Dependencies

- **Setup** (T001-T003) before tests (T004-T006)
- **Contract tests** (T004-T006) before implementation (T007-T016)
- **Component fixes** (T007-T016) before integration testing (T017-T023)
- **Core implementation** (T007-T023) before polish (T024-T030)

### File-level Dependencies:
- T007, T008 both modify `src/components/ProjectCard.astro` (sequential)
- T014, T015, T016 all modify `src/components/MainHead.astro` (sequential)
- T011, T012, T013 modify different page files (parallel)

## Parallel Example

```bash
# Launch contract tests together (T004-T006):
Task: "Contract test: ProjectCard data-testid attribute in tests/contract/test_project_card_attributes.ts"
Task: "Contract test: Project data loading validation in tests/contract/test_project_data_loading.ts"
Task: "Contract test: Project grid rendering minimum count in tests/contract/test_project_grid_rendering.ts"

# Launch page H1 verification together (T011-T013):
Task: "Verify H1 element in src/pages/index.astro"
Task: "Add/verify H1 element in src/pages/about.astro"
Task: "Add/verify H1 element in src/pages/subscribe.astro"

# Launch E2E validation tests together (T017-T022):
Task: "Run E2E test: should show featured projects on homepage"
Task: "Run E2E test: should allow browsing project cards"
Task: "Run E2E test: should load without accessibility violations"
Task: "Run E2E test: should have proper SEO meta tags"
Task: "Run E2E test: should load homepage within performance budget"
Task: "Run E2E test: should have working internal links"
```

## Issue to Task Mapping

### Issue 1: Project Card Test IDs Missing
- **Tasks**: T004, T007, T008, T017
- **Files**: `src/components/ProjectCard.astro`
- **Tests**: "should show featured projects on homepage"

### Issue 2: Project Data Loading Problems
- **Tasks**: T005, T009, T010, T018
- **Files**: `src/components/ProjectGrid.astro`, data verification
- **Tests**: "should allow browsing project cards"

### Issue 3: Missing H1 Elements
- **Tasks**: T011, T012, T013, T019
- **Files**: `src/pages/*.astro`
- **Tests**: "should load without accessibility violations"

### Issue 4: SEO Meta Tags Missing
- **Tasks**: T014, T015, T016, T020
- **Files**: `src/components/MainHead.astro`
- **Tests**: "should have proper SEO meta tags"

### Issue 5: Accessibility Issues
- **Tasks**: T008, T019, T025
- **Files**: Various components with ARIA attributes
- **Tests**: Accessibility compliance validation

### Issue 6: Performance Budget
- **Tasks**: T021, T024
- **Files**: Performance optimization validation
- **Tests**: "should load homepage within performance budget"

### Issue 7: Internal Links
- **Tasks**: T022
- **Files**: Navigation and link validation
- **Tests**: "should have working internal links"

### Issue 8: Test Logic Issues
- **Tasks**: T023, T028
- **Files**: Test expectation corrections
- **Tests**: Overall test suite improvement

## Notes

- [P] tasks target different files with no dependencies
- All contract tests must fail before implementation begins
- Each component fix targets specific failing E2E tests
- Commit after each task completion
- Total expected improvement: 46 → 54+ passing E2E tests

## Task Generation Rules Applied

1. **From Component Contracts**:
   - ProjectCard contract → T004, T007, T008
   - MainHead contract → T014, T015, T016
   - PageContentStructure contract → T011, T012, T013

2. **From E2E Test Requirements**:
   - Each failing test → validation task (T017-T022)
   - Overall improvement → comprehensive validation (T023, T028)

3. **From Implementation Strategy**:
   - Critical issues first (T007-T010)
   - Content structure second (T011-T013)
   - SEO enhancement third (T014-T016)

4. **Ordering Logic**:
   - Setup → Contract Tests → Implementation → Validation → Polish
   - Dependencies respected within each phase
   - Parallel execution for independent files

## Validation Checklist

_GATE: Checked before execution_

- [x] All component contracts have corresponding tests (T004-T006)
- [x] All critical issues have implementation tasks (T007-T016)
- [x] All tests come before implementation (T004-T006 → T007-T016)
- [x] Parallel tasks target different files (verified)
- [x] Each task specifies exact file path (verified)
- [x] No [P] task conflicts with same file modifications (verified)
- [x] All 8 failing E2E tests have corresponding fix tasks (mapped above)

## Success Criteria

**Upon completion, expect:**
- E2E test results: 54+ passing tests (improvement from 46)
- Project cards: 3+ visible with proper test IDs
- SEO: Complete meta tag coverage on all pages
- Accessibility: WCAG AA compliance maintained
- Performance: Homepage loads < 3 seconds
- Functionality: All user journeys work correctly

**Total estimated tasks**: 30 tasks across 5 phases
**Critical path**: Contract tests → Component fixes → E2E validation
**Parallel opportunities**: 15 tasks can run in parallel across different files