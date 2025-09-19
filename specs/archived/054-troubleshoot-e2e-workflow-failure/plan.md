# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

## Execution Flow (/plan command scope)

```
1. ✓ Load feature spec from Input path
   → Feature spec loaded successfully at /specs/054-troubleshoot-e2e-workflow-failure/spec.md
2. ✓ Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Web application troubleshooting - no project created, existing infrastructure
   → Technical context resolved with specific Playwright/GitHub Actions focus
3. ✓ Evaluate Constitution Check section below
   → PASS: Troubleshooting scope aligns with constitution requirements
   → Update Progress Tracking: Initial Constitution Check
4. ✓ Execute Phase 0 → research.md
   → Created research.md with systematic failure analysis framework
5. ✓ Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file
6. ✓ Re-evaluate Constitution Check section
   → PASS: No additional violations discovered in design phase
   → Update Progress Tracking: Post-Design Constitution Check
7. ✓ Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
   → Phase 2 strategy documented for 18-22 ordered tasks across 5 categories
8. ⏸ Stop - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

**E2E Workflow Failure Investigation Framework** - Systematic approach to identify, reproduce, and fix CI/CD E2E test failures in GitHub Actions with Playwright integration.

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: JavaScript/TypeScript (Node.js via Astro framework)
**Primary Dependencies**: Playwright (E2E testing), GitHub CLI (log retrieval), Astro (web framework)
**Storage**: N/A (log analysis and configuration troubleshooting)
**Testing**: Playwright for E2E test execution and analysis in CI/CD
**Target Platform**: GitHub Actions CI/CD environment (Linux runners)
**Project Type**: web application (existing Astro project with E2E testing infrastructure)
**Performance Goals**: E2E test suite completion within 5-30 second timeout periods (workflow optimization goal from project context)
**Constraints**: Port configuration aligned (4321), webServer setup, environment variables, mock credentials for CI
**Scale/Scope**: Single troubleshooting project - analyze ~20-40 test scenarios within existing E2E suite

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Simplicity**:

- Projects: 1 (single troubleshooting project)
- Using framework directly? Yes (Playwright directly for test execution)
- Single data model? N/A (no new data models for troubleshooting)
- Avoiding patterns? Yes (direct analysis approach without complex patterns)

**Architecture**:

- EVERY feature as library? Not applicable (troubleshooting infrastructure existing codebase)
- Libraries listed: N/A (no new libraries created)
- CLI per library: N/A (no new libraries)
- Library docs: N/A (no new libraries)

**Testing (NON-NEGOTIABLE)**:

- RED-GREEN-Refactor cycle enforced? Not applicable (fixing existing tests, not implementing new features)
- Git commits show tests before implementation? Not applicable (debugging existing tests)
- Order: Contract→Integration→E2E→Unit strictly followed? Partially applicable (focusing on existing E2E order)
- Real dependencies used? Yes (existing CI/CD environment, real Playwright execution)
- Integration tests for: new libraries, contract changes, shared schemas? Not applicable (no new schemas)
- FORBIDDEN: Implementation before test, skipping RED phase: Not applicable (reproducible debugging)

**Observability**:

- Structured logging included? Yes (existing CLUE and workflow logs)
- Frontend logs → backend? Not applicable (E2E workflow focus)
- Error context sufficient? To be determined during log analysis (Phase 0)

**Versioning**:

- Version number assigned? N/A (bug fix, no version bump)
- BUILD increments on every change? Not applicable (troubleshooting)
- Breaking changes handled? Not applicable (infrastructure fixes)

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

**Structure Decision**: Option 1 - Single project (troubleshooting existing web application infrastructure, no new structure needed)

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

**Input Sources**: data-model.md, contracts/\*, quickstart.md
**Base Template**: `/templates/tasks-template.md`
**Priority Order**: Investigation → Reproduction → Analysis → Fix → Prevention

**Task Categories & Generation Rules**:

1. **Investigation Tasks [High Priority]**
   - For each LogRetrievalContract endpoint → "Implement log analysis tool" task
   - From quickstart.md prerequisites → "Setup investigation environment" task
   - For failed workflow analysis → "Retrieve workflow run #53 logs" task

2. **Reproduction Tasks [Medium Priority]**
   - For each LocalTestExecutionContract endpoint → "Implement local test runner" task [P]
   - From TestExecution entities → "Create reproduction scripts" task
   - For environment comparison → "Setup local test environment" task

3. **Analysis Tasks [Medium Priority]**
   - For each ConfigurationComparisonContract → "Implement config analyzer" task [P]
   - From FailurePattern entities → "Create failure pattern detector" task
   - Environment analysis → "Compare local vs CI environment" task

4. **Fix Implementation Tasks [Medium Priority]**
   - For each identified failure pattern → "Implement {pattern} fix" task
   - Port configuration → "Fix port allocation issues" task
   - Mock credentials → "Resolve environment variable issues" task

5. **Prevention Tasks [Low Priority]**
   - Documentation tasks → "Update troubleshooting guides" task
   - Monitoring → "Add workflow health checks" task
   - Automation → "Implement preventive monitoring" task

**Ordering Strategy**:

**Sequential Dependencies**:
- Investigation tasks must complete before reproduction attempts
- Analysis tasks require successful reproduction
- Fix tasks depend on completed analysis
- Prevention tasks follow successful fixes

**Parallel Execution Marked [P]**:
- Independent setup and analysis tasks
- Multiple contract implementations
- Configuration validation tasks
- Documentation updates

**Estimated Output**: 18-22 numbered tasks in tasks.md

**Key Integration Points**:
- GitHub CLI integration for log retrieval
- Playwright API for local test execution
- Environment validation scripts
- Automated failure pattern matching
- Preventive monitoring hooks

**Testing Strategy**:
- Contract tests for each analysis tool
- Integration tests for complete investigation flow
- E2E tests for workflow rerun validation
- Monitoring tests for preventive mechanisms

**Success Criteria Validation**:
- All acceptance criteria mapped to completion checks
- Local reproduction confirmed before CI re-runs
- Root cause documented before fix implementation
- Prevention mechanisms validated before merge

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
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [ ] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
