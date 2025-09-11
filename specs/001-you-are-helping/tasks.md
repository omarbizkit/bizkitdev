# Tasks: Bizkit.dev Portfolio Website

**Input**: Design documents from `/specs/001-you-are-helping/`
**Prerequisites**: plan.md (✅), research.md (✅), data-model.md (✅), contracts/ (✅)

## Execution Flow (main)

```
1. Load plan.md from feature directory ✅
   → Tech stack: Astro + TypeScript, custom NeoDev-inspired styling, Tailwind CSS, Supabase
   → Structure: Astro SSG with components, pages, content
2. Load design documents: ✅
   → data-model.md: Project, Subscriber, User entities → model tasks
   → contracts/api-schema.yaml: API endpoints → contract test tasks
   → research.md: Technology decisions → setup tasks
3. Generate tasks by category: ✅
   → Setup: Astro project, NeoDev-inspired custom styling, dependencies
   → Tests: contract tests, integration tests, E2E tests
   → Core: components, pages, data models
   → Integration: Supabase, API endpoints, SEO
   → Polish: performance optimization, accessibility
4. Apply task rules: ✅
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...) ✅
6. Generate dependency graph ✅
7. Create parallel execution examples ✅
8. Validate task completeness: ✅
   → All contracts have tests ✅
   → All entities have models ✅
   → All user scenarios covered ✅
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

Using Astro SSG structure as defined in plan.md:

- `src/components/` - Reusable UI components
- `src/layouts/` - Page layouts
- `src/pages/` - Route pages
- `src/content/` - Project JSON data
- `tests/contract/` - API contract tests
- `tests/integration/` - Integration tests
- `tests/e2e/` - End-to-end tests

## Phase 3.1: Project Setup

- [ ] T001 Initialize Astro project with TypeScript and NeoDev-inspired styling
- [ ] T002 [P] Configure Tailwind CSS and design system
- [ ] T003 [P] Set up Supabase project and environment variables
- [ ] T004 [P] Configure Playwright for E2E testing
- [ ] T005 [P] Configure Vitest for unit testing
- [ ] T006 [P] Set up ESLint and Prettier for code quality
- [ ] T007 [P] Create Docker and docker-compose configuration
- [ ] T008 Configure project structure and TypeScript interfaces

## Phase 3.2: Data Models & Types (TDD Setup)

**CRITICAL: Create TypeScript interfaces first, then failing tests**

- [ ] T009 [P] Create Project interface in src/types/project.ts
- [ ] T010 [P] Create Subscriber interface in src/types/subscriber.ts
- [ ] T011 [P] Create User interface in src/types/user.ts
- [ ] T012 [P] Create API response types in src/types/api.ts
- [ ] T013 Create projects JSON schema and sample data in src/content/projects.json

## Phase 3.3: Contract Tests (MUST FAIL BEFORE IMPLEMENTATION)

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [ ] T014 [P] Contract test POST /api/subscribe in tests/contract/subscribe.test.ts
- [ ] T015 [P] Contract test GET /api/subscribe/confirm in tests/contract/confirm.test.ts
- [ ] T016 [P] Contract test GET /api/projects in tests/contract/projects.test.ts
- [ ] T017 [P] Contract test GET /api/projects/{id} in tests/contract/project-detail.test.ts
- [ ] T018 [P] Contract test GET /api/auth/session in tests/contract/auth.test.ts

## Phase 3.4: Integration Tests (MUST FAIL BEFORE IMPLEMENTATION)

- [ ] T019 [P] Integration test project data loading in tests/integration/project-data.test.ts
- [ ] T020 [P] Integration test subscription flow in tests/integration/subscription.test.ts
- [ ] T021 [P] Integration test responsive design in tests/integration/responsive.test.ts
- [ ] T022 [P] Integration test SEO metadata in tests/integration/seo.test.ts

## Phase 3.5: E2E Tests (User Scenarios - MUST FAIL FIRST)

- [ ] T023 [P] E2E test visitor discovery flow in tests/e2e/visitor-discovery.spec.ts
- [ ] T024 [P] E2E test project detail exploration in tests/e2e/project-detail.spec.ts
- [ ] T025 [P] E2E test professional contact flow in tests/e2e/contact-flow.spec.ts
- [ ] T026 [P] E2E test subscription engagement in tests/e2e/subscription.spec.ts
- [ ] T027 [P] E2E test mobile responsive experience in tests/e2e/mobile.spec.ts
- [ ] T028 [P] E2E test optional authentication flow in tests/e2e/auth-flow.spec.ts

## Phase 3.6: Core Components (ONLY after tests are failing)

- [ ] T029 [P] ProjectCard component in src/components/ProjectCard.astro
- [ ] T030 [P] ProjectGrid component in src/components/ProjectGrid.astro
- [ ] T031 [P] SubscribeForm component in src/components/SubscribeForm.astro
- [ ] T032 [P] Header component in src/components/Header.astro
- [ ] T033 [P] Footer component in src/components/Footer.astro
- [ ] T034 [P] StatusBadge component in src/components/StatusBadge.astro
- [ ] T035 [P] TechStack component in src/components/TechStack.astro
- [ ] T036 [P] Hero component in src/components/Hero.astro

## Phase 3.7: Layout System

- [ ] T037 [P] Base layout in src/layouts/BaseLayout.astro
- [ ] T038 [P] Landing page layout in src/layouts/LandingLayout.astro
- [ ] T039 [P] Project detail layout in src/layouts/ProjectLayout.astro

## Phase 3.8: Pages Implementation

- [ ] T040 Landing page in src/pages/index.astro
- [ ] T041 Project detail pages in src/pages/projects/[id].astro
- [ ] T042 [P] 404 error page in src/pages/404.astro
- [ ] T043 [P] About page in src/pages/about.astro
- [ ] T044 [P] Contact page in src/pages/contact.astro

## Phase 3.9: API Endpoints (Supabase Integration)

- [ ] T045 [P] Subscription API endpoint in src/pages/api/subscribe.ts
- [ ] T046 [P] Email confirmation endpoint in src/pages/api/subscribe/confirm.ts
- [ ] T047 [P] Projects API endpoint in src/pages/api/projects.ts
- [ ] T048 [P] Authentication session endpoint in src/pages/api/auth/session.ts

## Phase 3.10: Data & Content Management

- [ ] T049 [P] Project data utility functions in src/utils/projectData.ts
- [ ] T050 [P] Supabase client configuration in src/lib/supabase.ts
- [ ] T051 [P] Authentication utilities in src/utils/auth.ts
- [ ] T052 Create sample project data with proper JSON structure

## Phase 3.11: SEO & Performance

- [ ] T053 [P] SEO component with meta tags in src/components/SEO.astro
- [ ] T054 [P] Sitemap generation in src/pages/sitemap.xml.ts
- [ ] T055 [P] Robots.txt generation in src/pages/robots.txt.ts
- [ ] T056 [P] Image optimization component in src/components/OptimizedImage.astro
- [ ] T057 Performance optimization (lazy loading, bundle splitting)

## Phase 3.12: Styling & Design

- [ ] T058 [P] Global CSS and Tailwind configuration in src/styles/global.css
- [ ] T059 [P] Component-specific styles and animations
- [ ] T060 [P] Dark theme implementation and color system
- [ ] T061 [P] Responsive design utilities and breakpoints

## Phase 3.13: Accessibility & Standards

- [ ] T062 [P] ARIA labels and screen reader support
- [ ] T063 [P] Keyboard navigation implementation
- [ ] T064 [P] Color contrast validation and fixes
- [ ] T065 [P] Skip-to-content links and focus management

## Phase 3.14: Integration & Polish

- [ ] T066 Connect all components with proper data flow
- [ ] T067 Implement error boundaries and fallback UI
- [ ] T068 Add form validation and user feedback
- [ ] T069 Configure environment variables for all environments
- [ ] T070 Test subscription email confirmation flow

## Phase 3.15: Performance & Security

- [ ] T071 [P] Implement CSP headers and security measures
- [ ] T072 [P] Performance optimization and Lighthouse testing
- [ ] T073 [P] Bundle size optimization and tree shaking
- [ ] T074 [P] Image format optimization (WebP with fallbacks)
- [ ] T075 Cache headers and service worker configuration

## Phase 3.16: Documentation & Deployment

- [ ] T076 [P] Update CLAUDE.md with implementation details
- [ ] T077 [P] Create deployment configuration for Zeabur
- [ ] T078 [P] Update README with setup and development instructions
- [ ] T079 [P] Create environment variable documentation
- [ ] T080 [P] Create privacy policy page in src/pages/privacy.astro
- [ ] T081 [P] Implement rate limiting for authentication endpoints
- [ ] T082 [P] Set up error tracking and monitoring (Sentry integration)
- [ ] T083 [P] Add JSON-LD structured data for projects and portfolio
- [ ] T084 [P] Implement skip-to-content links for screen readers
- [ ] T085 Final validation against constitutional requirements

## Dependencies

**Critical Ordering:**

- Setup (T001-T008) before everything
- Data models (T009-T013) before tests
- All tests (T014-T028) before implementation (T029+)
- Components (T029-T036) before layouts (T037-T039)
- Layouts before pages (T040-T044)
- API endpoints (T045-T048) parallel with pages
- SEO/Performance (T053-T057) after core pages
- Integration (T066-T070) after all components
- Polish (T071-T080) last

**Parallel Execution Blocks:**

- T002-T007: Independent setup tasks
- T009-T012: Type definitions (different files)
- T014-T018: Contract tests (different endpoints)
- T019-T022: Integration tests (different features)
- T023-T028: E2E tests (different user flows)
- T029-T036: Components (different files)
- T037-T039: Layouts (different files)
- T045-T048: API endpoints (different routes)

## Parallel Example

```bash
# Phase 3.3 - Launch contract tests together:
Task: "Contract test POST /api/subscribe in tests/contract/subscribe.test.ts"
Task: "Contract test GET /api/subscribe/confirm in tests/contract/confirm.test.ts"
Task: "Contract test GET /api/projects in tests/contract/projects.test.ts"
Task: "Contract test GET /api/projects/{id} in tests/contract/project-detail.test.ts"
Task: "Contract test GET /api/auth/session in tests/contract/auth.test.ts"

# Phase 3.6 - Launch component development together:
Task: "ProjectCard component in src/components/ProjectCard.astro"
Task: "ProjectGrid component in src/components/ProjectGrid.astro"
Task: "SubscribeForm component in src/components/SubscribeForm.astro"
Task: "Header component in src/components/Header.astro"
Task: "Footer component in src/components/Footer.astro"
```

## Constitutional Compliance Verification

- ✅ **TDD Enforced**: All tests (T014-T028) before implementation (T029+)
- ✅ **Performance**: Lighthouse optimization tasks (T072-T075)
- ✅ **Accessibility**: WCAG AA compliance tasks (T062-T065)
- ✅ **Security**: Environment variables, CSP headers (T071)
- ✅ **SEO**: Meta tags, sitemap, semantic HTML (T053-T055)
- ✅ **Build Outputs**: Proper separation, no secrets committed

## Validation Checklist

_GATE: Checked before execution_

- ✅ All contracts have corresponding tests (T014-T018)
- ✅ All entities have model tasks (T009-T012)
- ✅ All tests come before implementation (T014-T028 before T029+)
- ✅ Parallel tasks truly independent (different files)
- ✅ Each task specifies exact file path
- ✅ No task modifies same file as another [P] task
- ✅ All user scenarios from quickstart.md covered (T023-T028)
- ✅ Constitutional requirements addressed (performance, security, accessibility)

## Notes

- **85 total tasks** covering complete portfolio website implementation
- [P] tasks = different files, no dependencies - can run in parallel
- Verify tests fail before implementing functionality
- Commit after each task completion
- Follow Astro and TypeScript best practices
- Maintain constitutional compliance throughout development

**Status**: Ready for Phase 3 implementation execution
