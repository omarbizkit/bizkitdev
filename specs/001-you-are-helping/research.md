# Research Phase: Bizkit.dev Portfolio Website

**Date**: 2025-01-27  
**Feature**: 001-you-are-helping

## Technology Decisions

### Framework Choice: Astro

**Decision**: Use Astro framework with custom NeoDev-inspired styling  
**Rationale**:

- SSG-first approach aligns with performance requirements (90+ Lighthouse scores)
- Built-in component islands for interactive elements (subscription form)
- Excellent TypeScript support and developer experience
- Custom implementation of NeoDev's dark neon sci-fi aesthetic without premium template costs
- Full control over cyberpunk design elements (neon-cyan/purple color scheme, cyber-grid layouts)
- Zero-JS by default with opt-in hydration for optimal performance
- Superior accessibility and customization compared to premium templates

**Alternatives Considered**:

- Next.js: More complex, heavier JavaScript bundle
- Nuxt.js: Vue-based, team prefers React-like syntax
- Gatsby: GraphQL overhead unnecessary for simple JSON consumption

### Styling: Tailwind CSS

**Decision**: Use Tailwind CSS for all styling  
**Rationale**:

- Utility-first approach enables rapid development
- Built-in responsive design classes
- Excellent dark mode support
- Integrates seamlessly with Astro
- Consistent with NeoDev-inspired custom design system

**Alternatives Considered**:

- CSS Modules: More verbose, slower development
- Styled Components: Runtime overhead, SSG incompatible
- SCSS: Requires build configuration, less maintainable

### Backend Services: Supabase

**Decision**: Use Supabase for authentication and data storage  
**Rationale**:

- Provides PostgreSQL database with real-time subscriptions
- Built-in authentication with Google OAuth and email/password
- REST API auto-generated from schema
- Type-safe client libraries for TypeScript
- Handles CORS, security, and scaling automatically

**Alternatives Considered**:

- Firebase: Good but vendor lock-in concerns, less SQL-friendly
- Custom Node.js API: Unnecessary complexity for simple requirements
- Serverless functions: Overkill for basic CRUD operations

### Project Data: JSON Files

**Decision**: Store project metadata in JSON files consumed at build time  
**Rationale**:

- Enables true static site generation
- Version controlled with source code
- Type-safe consumption with TypeScript interfaces
- Easy to edit and maintain
- No runtime database queries for project data

**Alternatives Considered**:

- CMS (Strapi, Contentful): Adds complexity, runtime dependencies
- Database storage: Requires server-side rendering, impacts performance
- Markdown with frontmatter: Less structured, harder to query

### Testing Strategy

**Decision**: Playwright for E2E, Vitest for unit tests, Lighthouse CI for performance  
**Rationale**:

- Playwright provides reliable cross-browser testing
- Vitest integrates natively with Astro and Vite
- Lighthouse CI automates performance monitoring
- Covers all testing requirements from constitution

**Alternatives Considered**:

- Cypress: Slower execution, less reliable in CI
- Jest: Not optimized for Vite/Astro ecosystem
- Manual testing: Not scalable, error-prone

### Deployment: Zeabur

**Decision**: Deploy to Zeabur for production hosting  
**Rationale**:

- Supports static site deployment
- Git integration for automatic deployments
- Global CDN for performance
- Environment variable management
- Aligns with constitution deployment strategy

**Alternatives Considered**:

- Vercel: Good option but Zeabur specified in constitution
- Netlify: Similar to Zeabur but less integrated with project workflow
- Self-hosted: Unnecessary complexity for static site

## Integration Patterns

### Authentication Flow

**Pattern**: Optional authentication with session sharing  
**Implementation**:

- Supabase auth with cookies set for `.bizkit.dev` domain
- Session state shared across main site and subdomains
- Graceful degradation when not authenticated
- Google OAuth and email/password options

### Data Loading

**Pattern**: Build-time static generation with runtime subscriptions  
**Implementation**:

- Project data loaded from JSON at build time
- Subscriber data managed through Supabase at runtime
- Type-safe interfaces for all data structures
- Error boundaries for failed data operations

### Component Architecture

**Pattern**: Island architecture with selective hydration  
**Implementation**:

- Static components for landing page, project details
- Interactive islands for subscription form, auth components
- Shared layout components across pages
- Consistent styling with Tailwind classes

### SEO Optimization

**Pattern**: Complete static generation with meta tag injection  
**Implementation**:

- Astro's built-in SEO components
- Dynamic meta tags per page based on content
- Automatic sitemap generation
- OpenGraph and Twitter card support

## Performance Considerations

### Bundle Size Optimization

- Tree-shaking unused Tailwind classes
- Component-level code splitting
- Optimized image formats (WebP with fallbacks)
- Minimal JavaScript payloads

### Loading Strategy

- Above-fold content prioritized
- Lazy loading for images below fold
- Preloading critical resources
- Service worker for offline capabilities

### Caching Strategy

- Static assets cached indefinitely
- API responses cached appropriately
- CDN edge caching for global performance
- Browser caching headers configured

## Security & Privacy

### Data Protection

- Minimal user data collection (email only for subscribers)
- No sensitive data in client-side bundles
- Environment variables for API keys
- HTTPS enforcement everywhere

### Content Security

- CSP headers configured
- Input sanitization for user-generated content
- XSS prevention through framework defaults
- Rate limiting on subscription endpoints

## Development Workflow

### Local Development

- Vite dev server for hot reloading
- Environment variable management with `.env.local`
- Real Supabase instance for testing
- Automated TypeScript checking

### Testing Pipeline

- Contract tests for API schemas
- Integration tests for user flows
- E2E tests for critical paths
- Performance regression testing

### Deployment Pipeline

- Git-based deployments to Zeabur
- Environment-specific configurations
- Automated build optimization
- Preview deployments for branches

---

**Status**: All technology decisions finalized, no NEEDS CLARIFICATION remaining
