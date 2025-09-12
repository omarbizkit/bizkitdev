# Docker Setup Guide for bizkitdev Portfolio

## 🐳 Quick Start

The project is now fully configured for Docker/Podman deployment with secure mock credentials for testing.

### Prerequisites
- Docker or Podman installed
- Git repository cloned locally

### 🚀 One-Line Docker Test
```bash
npm run docker:test
```

This command will:
1. Build the Docker image with mock Supabase credentials
2. Start the container
3. Test the health endpoint
4. Clean up automatically

## 📋 Available Docker Commands

```bash
# Build the image with mock credentials (safe for testing)
npm run docker:build

# Run the container
npm run docker:run

# Start with Docker Compose (production-like)
npm run docker:prod

# Start with development profile (includes PostgreSQL)
npm run docker:dev

# Stop all services
npm run docker:stop

# View logs
npm run docker:logs

# Quick test with automatic cleanup
npm run docker:test
```

## 🔧 Environment Configuration

### Automatic Mock Credentials
The project is configured with **safe mock credentials** that work out of the box:
- `PUBLIC_SUPABASE_URL=https://mock.supabase.co`
- `PUBLIC_SUPABASE_ANON_KEY=mock-anon-key`
- All secrets are safe for public repositories

### Environment Files
- `.env.docker` - Docker-specific configuration (included)
- `.env.local` - Your local development overrides (you create this)
- `.env.example` - Template with instructions

## 🌐 Port Configuration
- **Development**: `http://localhost:4321` (Astro dev server)
- **Docker**: `http://localhost:3000` (Production build)
- **Health Check**: `http://localhost:3000/`

## 🔐 Security Best Practices

### For Public Repositories (Safe)
✅ Use the provided mock credentials - they're safe for public repos
✅ No real database connection required for testing
✅ All secrets are clearly marked as "mock" or "dev"

### For Production Deployment
1. Create `.env.local` with real Supabase credentials:
```bash
cp .env.example .env.local
# Edit .env.local with your actual Supabase project values
```

2. Use environment-specific commands:
```bash
# Production build with real credentials
docker-compose --env-file .env.local up -d
```

## 🏗️ Build Process Verification

The Docker build includes:
1. ✅ Multi-stage build for optimization
2. ✅ Security hardening with non-root user
3. ✅ Health checks configured
4. ✅ Proper port configuration (3000)
5. ✅ Environment variables properly injected
6. ✅ Mock Supabase integration for testing

## 🧪 Testing the Setup

### Manual Testing
```bash
# Build and run
npm run docker:build
npm run docker:run

# In another terminal, test the endpoints
curl http://localhost:3000/                    # Homepage
curl http://localhost:3000/api/projects        # API endpoint
curl http://localhost:3000/api/auth/session    # Auth endpoint
```

### Automated Testing
```bash
# Run the full test suite (includes Docker verification)
npm run docker:test
```

## 🎯 Production Deployment

For production deployment:
1. Set up real Supabase project
2. Create `.env.local` with production credentials
3. Use production Docker commands:

```bash
# Production build
docker build --build-arg PUBLIC_SUPABASE_URL=https://your-project.supabase.co \\
             --build-arg PUBLIC_SUPABASE_ANON_KEY=your-real-key \\
             -t bizkitdev-production .

# Or use docker-compose with production env
docker-compose --env-file .env.production up -d
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Stop any existing containers
npm run docker:stop
# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Build Failures
```bash
# Clean rebuild
docker system prune -f
npm run docker:build
```

### Health Check Failures
```bash
# Check logs
npm run docker:logs
# Verify port configuration in docker-compose.yml
```

## 🎉 Success Criteria

After setup, you should be able to:
- ✅ Build Docker image without errors
- ✅ Access homepage at http://localhost:3000
- ✅ Health checks pass
- ✅ API endpoints respond correctly
- ✅ Mock Supabase integration works
- ✅ Production-ready deployment ready

The project maintains its **PRODUCTION READY** status with comprehensive Docker support!