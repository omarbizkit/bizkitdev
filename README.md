# Bizkit.dev Portfolio

A modern, high-performance portfolio website built with Astro featuring a dark neon sci-fi aesthetic. This project showcases full-stack development capabilities with comprehensive testing, authentication, and deployment infrastructure.

## 🚀 Features

- **Modern Stack**: Built with Astro 5, TypeScript, and Tailwind CSS
- **Dark Neon Theme**: Custom sci-fi aesthetic with neon colors and cyber styling
- **Authentication**: Supabase integration with Google OAuth and email/password
- **Email Subscriptions**: Newsletter signup with confirmation workflow
- **Comprehensive Testing**: Unit tests (Vitest), E2E tests (Playwright)
- **Type Safety**: Full TypeScript implementation with strict mode
- **Code Quality**: ESLint and Prettier for consistent code style
- **Containerized**: Docker and docker-compose for development and production
- **Responsive Design**: Mobile-first approach with accessibility features

## 🛠️ Tech Stack

### Core
- [Astro](https://astro.build/) - Static site generator
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling

### Backend & Database
- [Supabase](https://supabase.com/) - Backend as a Service
- PostgreSQL - Database (via Supabase)
- Row Level Security (RLS) - Data protection

### Development Tools
- [Vitest](https://vitest.dev/) - Unit testing framework
- [Playwright](https://playwright.dev/) - E2E testing
- [ESLint](https://eslint.org/) - Code linting
- [Prettier](https://prettier.io/) - Code formatting

### DevOps
- [Docker](https://www.docker.com/) - Containerization
- GitHub Actions - CI/CD (coming soon)
- Vercel/Netlify - Deployment (coming soon)

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── config/             # Site configuration
├── content/            # Markdown content (projects, blog)
├── layouts/            # Page layouts
├── lib/                # Third-party integrations
├── pages/              # Route pages
├── styles/             # Global styles
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
tests/
├── e2e/                # End-to-end tests
├── integration/        # Integration tests
├── contract/           # Contract tests
└── unit/               # Unit tests
```

## 🧞 Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run all tests in watch mode |
| `npm run test:unit` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:all` | Run all test suites |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |

### Docker Commands

| Command | Action |
|---------|--------|
| `npm run docker:build` | Build Docker image |
| `npm run docker:run` | Run container locally |
| `npm run docker:dev` | Start development environment |
| `npm run docker:prod` | Start production environment |
| `npm run docker:stop` | Stop all containers |

## ⚙️ Setup

### Prerequisites
- Node.js 18+ 
- npm 9+
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/omarbizkit/bizkitdev.git
   cd bizkitdev
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database setup**
   
   Run the SQL schema in your Supabase project:
   ```bash
   # Copy contents of supabase-schema.sql to Supabase SQL editor
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Testing Setup

Ensure Playwright browsers are installed:
```bash
npx playwright install
```

## 🔧 Configuration

### Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase-schema.sql`
3. Configure authentication providers (Google OAuth)
4. Add environment variables to `.env.local`

### Custom Styling
The project uses a custom dark neon sci-fi theme defined in:
- `tailwind.config.mjs` - Color palette and animations
- `src/styles/global.css` - Global styles and components

## 📊 Development Status

### Completed Tasks ✅
- [x] **T001**: Astro project initialization with TypeScript
- [x] **T002**: Tailwind CSS configuration with dark neon theme
- [x] **T003**: Supabase integration and authentication utilities
- [x] **T004**: Playwright E2E testing setup
- [x] **T005**: Vitest unit testing configuration
- [x] **T006**: ESLint and Prettier code quality tools
- [x] **T007**: Docker containerization setup
- [x] **T008**: Project structure and TypeScript interfaces

### Next Phase 🚧
- Component development and styling
- Content management system
- Blog functionality
- Contact forms and email integration
- Performance optimizations
- CI/CD pipeline setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test:all`)
5. Commit changes (`git commit -m 'feat: add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Site**: [bizkit.dev](https://bizkit.dev) (coming soon)
- **GitHub**: [github.com/omarbizkit/bizkitdev](https://github.com/omarbizkit/bizkitdev)
- **Contact**: omar@bizkit.dev

---

Built with ❤️ by [Omar Bizkitdev](https://github.com/omarbizkit)