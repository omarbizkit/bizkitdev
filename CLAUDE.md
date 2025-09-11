# bizkitdev Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-01-27

## Active Technologies

- Astro framework with TypeScript (001-you-are-helping)
- NeoDev template for dark neon sci-fi theme (001-you-are-helping)
- Tailwind CSS for styling (001-you-are-helping)
- Supabase for authentication and data storage (001-you-are-helping)
- Playwright for E2E testing, Vitest for unit tests (001-you-are-helping)

## Project Structure

```
src/
├── components/           # Reusable UI components
├── layouts/             # Page layouts
├── pages/               # Route pages
├── content/             # Project JSON data
└── styles/              # Global styles (minimal)

tests/
├── contract/            # API contract tests
├── integration/         # Integration tests
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

- 001-you-are-helping: Added Astro portfolio website with NeoDev theme
- 001-you-are-helping: Configured Supabase authentication and subscribers
- 001-you-are-helping: Established testing strategy with Playwright and Vitest

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
