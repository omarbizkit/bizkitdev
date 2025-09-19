# Implementation Plan: Continue E2E Test Troubleshooting

**Branch**: `055-continue-e2e-troubleshooting` | **Date**: 2025-09-16 | **Spec**: [055-continue-e2e-troubleshooting/spec.md](./spec.md)
**Input**: Feature specification from `/specs/055-continue-e2e-troubleshooting/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Systemically resolve remaining E2E test failures in CI/CD pipeline through configuration alignment, selector strategy fixes, and server lifecycle stabilization. Building on previous troubleshooting progress to achieve reliable E2E test execution in GitHub Actions environment.

## Technical Context

**Language/Version**: Node.js 18+, TypeScript 5.x
**Primary Dependencies**: Playwright, Astro, Vite, GitHub Actions
**Storage**: Mock Supabase for CI testing, no persistent storage needed
**Testing**: Playwright E2E testing framework with cross-browser support
**Target Platform**: GitHub Actions Ubuntu runner, WSL development environment
**Project Type**: web - frontend Astro application with server-side rendering
**Performance Goals**: E2E test suite completion under 5 minutes, 95%+ CI success rate
**Constraints**: GitHub Actions timeout limits, browser resource limitations in CI
**Scale/Scope**: ~30 E2E test scenarios across 5 browser configurations, CI/CD pipeline reliability

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Simplicity**:

- Projects: 1 (E2E test configuration fixes only)
- Using framework directly? (Yes - Playwright API directly, no test abstractions)
- Single data model? (N/A - configuration fixes only)
- Avoiding patterns? (Yes - direct config fixes, no new patterns)

**Architecture**:

- EVERY feature as library? (N/A - configuration fixes to existing test infrastructure)
- Libraries listed: N/A - using existing Playwright, Astro, GitHub Actions
- CLI per library: N/A - using existing npm scripts
- Library docs: N/A - configuration documentation only

**Testing (NON-NEGOTIABLE)**:

- RED-GREEN-Refactor cycle enforced? (Yes - verify tests fail before fix, then pass after)
- Git commits show tests before implementation? (Yes - will validate current test failures before fixes)
- Order: Contract→Integration→E2E→Unit strictly followed? (Yes - E2E tests exist, fixing configuration only)
- Real dependencies used? (Yes - actual browsers in CI, mock Supabase for testing)
- Integration tests for: new libraries, contract changes, shared schemas? (N/A - no new integrations)
- FORBIDDEN: Implementation before test, skipping RED phase (Compliant - tests currently fail, will fix to pass)

**Observability**:

- Structured logging included? (Yes - Playwright test outputs, GitHub Actions logs)
- Frontend logs → backend? (N/A - test configuration focus)
- Error context sufficient? (Yes - will improve test failure reporting)

**Versioning**:

- Version number assigned? (N/A - configuration fixes, no version impact)
- BUILD increments on every change? (N/A - package.json unchanged)
- Breaking changes handled? (N/A - backward compatible configuration fixes only)

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 (Web application) - Astro frontend with API endpoints and comprehensive test infrastructure

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `/templates/tasks-template.md` as base
- Generate configuration validation and fix tasks from Phase 1 design
- Configuration audit tasks → validation tasks → fix implementation tasks
- Each configuration file → audit task [P]
- Each validation contract → validation test task [P]
- Each quickstart scenario → integration validation task
- Configuration fix implementation tasks to make validations pass

**Specific Task Categories**:

1. **Configuration Audit Tasks [P]**:
   - Audit port configurations across all files
   - Audit test selector existence in DOM
   - Audit browser environment setup
   - Audit GitHub Actions workflow configuration

2. **Validation Implementation Tasks**:
   - Implement server health check validation
   - Implement configuration alignment validation
   - Implement selector existence validation
   - Implement browser environment validation

3. **Fix Implementation Tasks**:
   - Fix port configuration mismatches
   - Fix missing or incorrect test selectors
   - Fix server lifecycle management
   - Fix GitHub Actions workflow steps

4. **Integration Validation Tasks**:
   - Run quickstart validation scenarios
   - Validate local environment configuration
   - Validate CI environment simulation
   - Validate cross-browser compatibility

**Ordering Strategy**:

- TDD order: Validation tests before configuration fixes
- Dependency order: Port config → selectors → server lifecycle → CI workflow
- Mark [P] for parallel execution (independent configuration files)
- Sequential execution for dependent fixes (server config before tests)

**Estimated Output**: 15-20 numbered, ordered tasks in tasks.md focused on configuration fixes

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (N/A - no violations)

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
