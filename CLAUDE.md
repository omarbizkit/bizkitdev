# bizkitdev Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-01-27

## Active Technologies

- Astro framework with TypeScript (001-you-are-helping)
- Custom NeoDev-inspired design system with cyberpunk neon aesthetic (001-you-are-helping)
- Tailwind CSS for styling (001-you-are-helping)
- Supabase for authentication and data storage (001-you-are-helping)
- Playwright for E2E testing, Vitest for unit tests (001-you-are-helping)

## Project Owner & Branding

- **Name**: Omar Torres
- **Professional Identity**: Data and AI Enthusiast  
- **Tagline**: "The Mind Behind The Code"
- **Contact**: omarbizkit@hotmail.com
- **Domain**: bizkit.dev

## Project Structure

```
src/
├── components/           # Reusable UI components
├── layouts/             # Page layouts
├── pages/               # Route pages
├── content/             # Project JSON data
└── styles/              # Global styles (minimal)

tests/
├── contract/            # API contract tests (5 files - T014-T018)
├── integration/         # Integration tests (2 files - T019-T022)
├── e2e/                 # End-to-end tests (4 files - T023-T028)
└── unit/                # Unit tests

public/                  # Static assets
specs/                   # Feature specifications and plans
```

## Commands

# Development

npm run dev # Start development server
npm run build # Production build
npm run preview # Preview production build

# Testing

npm run test # Run unit tests
npm run test:e2e # Run E2E tests
npm run test:contract # Run contract tests

# Deployment

podman-compose up # Local container testing

# Production deployed to Zeabur

## Code Style

- TypeScript: Follow strict mode, use interfaces for data models
- Components: Astro components with minimal JavaScript
- Styling: Tailwind utility classes, responsive design patterns
- Testing: TDD approach - tests before implementation
- Data: JSON-driven static generation, Supabase for dynamic data

## Constitutional Requirements

- Test-driven development: RED-GREEN-Refactor cycle enforced
- Performance: 90+ Lighthouse scores, <1MB initial load
- Accessibility: WCAG AA compliance, keyboard navigation
- SEO: Unique meta tags, sitemap generation, semantic HTML
- Security: HTTPS everywhere, CSP headers, input sanitization

## Recent Changes

- 2025-01-27: Complete modern portfolio redesign with Omar Torres branding and cyberpunk neon aesthetic
- 2025-01-27: **CRITICAL TDD Implementation** - Comprehensive test suite (11 files, 200+ scenarios)
- 2025-01-27: Contract tests for all API endpoints (T014-T018) - constitutional compliance achieved
- 2025-01-27: Integration tests for Supabase workflows and data transformations (T019-T022)  
- 2025-01-27: E2E tests for complete user journeys and accessibility (T023-T028)
- 2025-01-27: API type system with runtime validation guards

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
