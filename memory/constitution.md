# Bizkit.dev Portfolio Constitution

## Core Principles

### I. Technology & Frameworks

- Use Astro with the NeoDev template as the base framework
- Use Tailwind CSS for all styling and responsive design
- Use Supabase for authentication (Google OAuth and email/password) and the subscribers table
- All project metadata must be stored in a JSON file and consumed statically (SSG)
- Use environment variables for all configuration (API keys, URLs, etc.)
- Implement proper error boundaries and fallback UI for failed components
- Use Astro's Image component for automatic image optimization

### II. Design & UI

- Maintain a dark, neon sci-fi theme with purple/blue/pink highlights
- Ensure responsive design for desktop, tablet, and mobile viewports
- Include consistent header/footer branding across landing page, detail pages, and subdomains
- Implement smooth transitions and animations using CSS/Tailwind (avoid JavaScript for animations)
- Ensure minimum touch target size of 44x44px for mobile accessibility
- Use system fonts or web-safe fonts to minimize load times
- Implement dark mode as the default and only theme

### III. Content & Pages

- Every project must have a static detail page generated from JSON, with links to its subdomain and GitHub repo
- Include an About Me section with the blurb: "Data and AI enthusiast"
- Include a Contact Me section that displays only the email: omarbizkit@hotmail.com
- Implement a 404 error page with consistent branding and helpful navigation
- Add a projects filter/search functionality on the main page
- Include project metadata: id, name, description_short, description_long, status (idea/development/live), tech_stack, subdomain_url, github_url, screenshot_url (optional)
- Support markdown content for project descriptions with proper sanitization
- Landing page must include: Hero section with bold neon aesthetic and tagline, Projects grid showing cards with status badges and tech stack icons
- Project detail pages must include: Project banner/screenshot, full description, status badge, tech stack icons, "Launch App" and "View Code" links
- Subscribe section with email input connecting to Supabase subscribers table
- Footer must include: subscribe link, contact email, GitHub link
- Header must include navigation: Home, Projects, About, Contact

### IV. SEO & Accessibility

- Every page must have unique title, meta description, OpenGraph tags, and semantic HTML structure
- Ensure all images have descriptive alt text
- Generate sitemap.xml and robots.txt automatically
- Implement proper heading hierarchy (h1 → h2 → h3, etc.)
- Ensure keyboard navigation works for all interactive elements
- Add skip-to-content links for screen reader users
- Include JSON-LD structured data for projects and portfolio
- Implement proper ARIA labels where necessary
- Ensure color contrast ratios meet WCAG AA standards
- Add lang attribute to HTML element

### V. Security & Privacy

- Authentication is always optional; the site must remain usable without logging in
- Never commit secrets (Supabase keys, API tokens, etc.) to the repository
- The file `Bizkit.devProjectSpecification.md` must remain private and ignored by Git
- Implement Content Security Policy (CSP) headers
- Use HTTPS everywhere, including for external resources
- Sanitize all user inputs and markdown content
- Implement rate limiting for authentication endpoints
- Store minimal user data (only email and OAuth provider ID)
- Add privacy policy page explaining data usage
- If logged in, session must be shared across subdomains using cookies at .bizkit.dev
- Subdomain apps must include a small link back to bizkit.dev main site

## Development Standards

### Code Quality

- Write clean, modular code with clear separation of concerns
- Prefer static site generation over client-side fetching for project data
- Keep performance in mind: optimize assets and pass Lighthouse performance and SEO checks
- Follow Astro best practices for component organization
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Implement proper error handling and logging

### Project Structure

- All project data must be stored in JSON files for static consumption
- Maintain clear separation between content, components, and utilities
- Use TypeScript for type safety where applicable
- Follow this directory structure:
  - `/src/components` - Reusable UI components
  - `/src/layouts` - Page layouts
  - `/src/pages` - Route pages
  - `/src/content` - Project JSON data
  - `/src/styles` - Global styles (minimal, prefer Tailwind)
  - `/public` - Static assets
- Include deployment configuration files:
  - `Dockerfile` - Multi-stage build for production
  - `docker-compose.yml` - Local Podman/Docker testing
  - `.dockerignore` - Exclude unnecessary files from container
  - `zeabur.json` - Zeabur-specific configuration (if needed)
  - `vite.config.js` - Local development configuration

### Performance Requirements

- Achieve Lighthouse scores of 90+ for Performance, Accessibility, Best Practices, and SEO
- Implement lazy loading for images below the fold
- Minimize JavaScript bundle size (prefer Astro's zero-JS approach)
- Use appropriate image formats (WebP with fallbacks)
- Implement proper caching headers
- Total page weight should not exceed 1MB for initial load

### Deployment & Infrastructure

- **Quick Testing**: Use Vite for rapid local development with hot module replacement (HMR)
- **Robust Testing**: Use Podman for containerized testing to validate production-like environment locally
- **Production**: Deploy to Zeabur for production hosting
- Include Dockerfile and docker-compose.yml for container deployment and testing
- Set up automatic deployments from main branch via Zeabur's Git integration
- Implement preview deployments for pull requests when supported
- Use proper environment variable management:
  - `.env.local` for Vite quick testing
  - Container environment files for Podman testing
  - Zeabur environment variables for production
- Set up monitoring and error tracking (e.g., Sentry)
- Configure proper redirects for www and non-www domains
- Ensure build output is compatible with Zeabur's static site hosting
- Include zeabur.json configuration file if needed for custom settings

### Testing & Maintenance

- **Testing Workflow**:
  1. Quick iterations: Use Vite dev server for immediate feedback during development
  2. Pre-deployment validation: Use Podman to test full containerized build locally
  3. Final verification: Test on Zeabur staging/preview before production release
- Write integration tests for critical user flows (authentication, project navigation)
- Test responsive design on actual devices, not just browser dev tools
- Regularly update dependencies for security patches
- Test site with slow network conditions
- Verify all external links periodically
- Backup project JSON data regularly
- Document any custom configurations or deployment steps
- Always validate container builds with Podman before pushing to production
- Verify environment variables work correctly in each environment (Vite, Podman, Zeabur)

### Build & Deployment Configuration

- Use Node.js LTS version for consistency across all environments
- **Development Scripts**:
  - `npm run dev` or `pnpm dev` - Quick testing with Vite
  - `npm run build` or `pnpm build` - Production build
  - `npm run preview` or `pnpm preview` - Preview production build locally
  - `podman-compose up` - Robust local testing in containers
- Output directory: `dist/` (Astro default)
- Static site configuration optimized for Zeabur deployment
- Environment variables prefix: `PUBLIC_` for client-side, no prefix for server-side
- Ensure all assets use relative paths for subdomain compatibility
- Configure proper base URL for production deployment
- Multi-stage Dockerfile to minimize final image size
- Use Alpine Linux for production containers when possible
- Include README with clear instructions for all three testing/deployment tiers

### Git Workflow (Solo Development)

- Use feature branches for new features and major changes
- Direct commits to main branch allowed for minor fixes and updates
- Self-review and merge own pull requests without external approval
- Use descriptive commit messages following conventional commits format (feat:, fix:, docs:, etc.)
- Tag releases with semantic versioning (v1.0.0)
- Keep main branch deployable at all times
- Use .gitignore to exclude: node_modules/, .env files, build outputs, Bizkit.devProjectSpecification.md
- Commit frequently with atomic changes
- Push to remote at least once per development session

## Governance

This constitution supersedes all other practices and must be followed for all specs, plans, and tasks related to the bizkit.dev portfolio project. All development work must verify compliance with these constraints. Any amendments require documentation and approval.

**Version**: 1.3.0 | **Ratified**: 2025-01-27 | **Last Amended**: 2025-01-27
