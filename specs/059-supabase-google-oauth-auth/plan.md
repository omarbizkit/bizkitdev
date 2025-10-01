# Implementation Plan: Supabase Google OAuth Authentication

**Branch**: `059-supabase-google-oauth-auth` | **Date**: 2025-09-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/home/omarb/dev/projects/bizkitdev/specs/059-supabase-google-oauth-auth/spec.md`

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

Implement Google OAuth authentication via Supabase Auth with cross-subdomain session sharing across the bizkit.dev ecosystem. Users will authenticate once on bizkit.dev and maintain their session automatically on all subdomains (e.g., ai-trading.bizkit.dev) through shared cookie domain configuration. The implementation uses Supabase's built-in auth system with `.bizkit.dev` cookie domain to enable seamless SSO across the portfolio.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x
**Primary Dependencies**: Astro 4.x, @supabase/supabase-js, @supabase/ssr
**Storage**: Supabase PostgreSQL (auth.users, public.user_profiles)
**Testing**: Vitest (unit), Playwright (E2E), contract tests for OAuth flows
**Target Platform**: Web (Linux server via Zeabur, SSR + Client-side)
**Project Type**: web (frontend Astro + backend Supabase)
**Performance Goals**: <3s OAuth flow, <100ms auth check overhead, auto token refresh
**Constraints**: HTTPS required, cookie domain `.bizkit.dev`, HTTPOnly/Secure cookies
**Scale/Scope**: Portfolio scale (~100-1000 users), 2 domains (bizkit.dev, ai-trading.bizkit.dev)

**Research Context**: Feasibility research completed on 2025-09-30. Confirmed Supabase supports cross-subdomain session sharing via cookie domain configuration. Key implementation pattern from Michele Ong blog and Supabase GitHub discussions #5742 and #473.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Simplicity**:

- Projects: 1 (main Astro app with auth integration)
- Using framework directly? YES (Supabase SDK directly, no auth wrappers)
- Single data model? YES (User profile extends Supabase auth.users)
- Avoiding patterns? YES (no Repository, using Supabase client directly)

**Architecture**:

- EVERY feature as library? PARTIAL (auth utilities in src/lib/auth/, UI components in src/components/auth/)
- Libraries listed:
  - `src/lib/auth/supabase-client.ts`: Supabase client with cookie config
  - `src/lib/auth/session.ts`: Session helpers for SSR
  - `src/components/auth/`: Auth UI components (SignInButton, UserProfile, SignOutButton)
- CLI per library: N/A (web app, not CLI)
- Library docs: llms.txt format planned? YES (update CLAUDE.md with auth patterns)

**Testing (NON-NEGOTIABLE)**:

- RED-GREEN-Refactor cycle enforced? YES
- Git commits show tests before implementation? YES (contract tests → integration → E2E → implementation)
- Order: Contract→Integration→E2E→Unit strictly followed? YES
- Real dependencies used? YES (actual Supabase project, real OAuth flow in E2E)
- Integration tests for: OAuth callback flow, session creation, cross-domain session verification
- FORBIDDEN: Implementation before test, skipping RED phase ✓

**Observability**:

- Structured logging included? YES (auth events, OAuth errors, session creation)
- Frontend logs → backend? YES (via Supabase Edge Functions if needed)
- Error context sufficient? YES (user ID, OAuth provider, redirect URL in errors)

**Versioning**:

- Version number assigned? Portfolio v1.5.0 (minor: new auth feature)
- BUILD increments on every change? YES
- Breaking changes handled? NO breaking changes (purely additive feature)

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

**Structure Decision**: Option 1 (Single project) - Existing Astro monorepo structure with auth added to src/lib/ and src/components/

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

1. **Setup Tasks** (Infrastructure):
   - Install @supabase/ssr package
   - Create database migration (user_profiles table, triggers, RLS)
   - Configure environment variables
   - Set up Google OAuth credentials

2. **Contract Test Tasks** (From contracts/auth-api-contracts.yaml):
   - Contract test: POST /api/auth/signin [P]
   - Contract test: GET /api/auth/callback [P]
   - Contract test: POST /api/auth/signout [P]
   - Contract test: GET /api/auth/session [P]
   - Contract test: GET /api/auth/user [P]

3. **Data Model Tasks** (From data-model.md):
   - Create TypeScript types (src/types/auth.ts) [P]
   - Create database migration file [P]
   - Run migration on Supabase project

4. **Library Implementation Tasks** (TDD order):
   - Implement Supabase client with cookie config (src/lib/auth/supabase-client.ts)
   - Implement session helpers (src/lib/auth/session.ts)
   - Implement user profile utilities (src/lib/auth/user-profile.ts)

5. **API Route Tasks** (Make contract tests pass):
   - Implement POST /api/auth/signin
   - Implement GET /api/auth/callback
   - Implement POST /api/auth/signout
   - Implement GET /api/auth/session
   - Implement GET /api/auth/user

6. **Middleware Tasks**:
   - Create auth middleware (src/middleware/auth.ts)
   - Add session check to middleware
   - Add protected route logic

7. **UI Component Tasks**:
   - Create SignInButton component [P]
   - Create UserProfile component [P]
   - Create SignOutButton component [P]
   - Add components to Header

8. **Integration Test Tasks** (From quickstart.md):
   - Integration test: Complete OAuth flow
   - Integration test: Cross-subdomain session sharing
   - Integration test: Sign out across subdomains
   - Integration test: Session persistence

9. **E2E Test Tasks**:
   - E2E test: Sign in on bizkit.dev → navigate to ai-trading → verify auth
   - E2E test: Sign out on subdomain → verify signed out on main domain
   - E2E test: Session persists across browser restart

10. **Documentation Tasks**:
    - Update CLAUDE.md with auth patterns
    - Add setup instructions to README
    - Document environment variables

**Ordering Strategy**:
- TDD strictly enforced: All tests before implementation
- Sequence: Setup → Contract Tests → Data Model → Implementation → Integration → E2E
- Mark [P] for parallel execution (independent tests, components)
- Dependencies: Database migration before API routes, auth lib before middleware

**Estimated Output**: 35-40 numbered, ordered tasks in tasks.md

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

- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All NEEDS CLARIFICATION resolved ✅
- [x] Complexity deviations documented: NONE ✅

**Artifacts Generated**:

- [x] spec.md (Feature specification)
- [x] research.md (7 research questions answered)
- [x] data-model.md (Database schema, TypeScript types, migrations)
- [x] contracts/auth-api-contracts.yaml (OpenAPI 3.0 contracts)
- [x] quickstart.md (7 test scenarios with acceptance criteria)
- [x] plan.md (This file - implementation plan)

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
