#!/bin/bash

# Production Deployment Script for Omar Torres Portfolio
# Usage: ./scripts/deploy.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="bizkitdev-portfolio"
DOCKER_IMAGE="$PROJECT_NAME:latest"
CONTAINER_NAME="$PROJECT_NAME-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required commands exist
check_dependencies() {
    log_info "Checking dependencies..."
    
    for cmd in docker docker-compose node npm; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is not installed or not in PATH"
            exit 1
        fi
    done
    
    log_success "All dependencies are available"
}

# Load environment variables
load_environment() {
    log_info "Loading environment variables for $ENVIRONMENT..."
    
    ENV_FILE=".env.$ENVIRONMENT"
    
    if [[ -f "$ENV_FILE" ]]; then
        export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
        log_success "Environment variables loaded from $ENV_FILE"
    else
        log_warning "Environment file $ENV_FILE not found, using default values"
    fi
    
    # Validate required environment variables
    REQUIRED_VARS=("PUBLIC_SUPABASE_URL" "PUBLIC_SUPABASE_ANON_KEY")
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [[ -z "${!var}" ]]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
}

# Run tests before deployment
run_tests() {
    log_info "Running tests..."
    
    # Run unit tests
    npm run test || {
        log_error "Unit tests failed"
        exit 1
    }
    
    # Run type checking
    npm run type-check || {
        log_error "Type checking failed"
        exit 1
    }
    
    log_success "All tests passed"
}

# Build the application
build_application() {
    log_info "Building application..."
    
    # Clean previous builds
    rm -rf dist/
    
    # Install dependencies
    npm ci --production=false
    
    # Build the application
    npm run build || {
        log_error "Build failed"
        exit 1
    }
    
    log_success "Application built successfully"
}

# Build Docker image
build_docker_image() {
    log_info "Building Docker image..."
    
    docker build \
        --build-arg PUBLIC_SUPABASE_URL="$PUBLIC_SUPABASE_URL" \
        --build-arg PUBLIC_SUPABASE_ANON_KEY="$PUBLIC_SUPABASE_ANON_KEY" \
        --build-arg PUBLIC_SITE_URL="$PUBLIC_SITE_URL" \
        -t "$DOCKER_IMAGE" \
        . || {
        log_error "Docker build failed"
        exit 1
    }
    
    log_success "Docker image built successfully"
}

# Deploy with Docker Compose
deploy_application() {
    log_info "Deploying application..."
    
    # Stop existing containers
    docker-compose down || true
    
    # Remove old containers and images
    docker container prune -f
    docker image prune -f
    
    # Start the application
    docker-compose up -d || {
        log_error "Deployment failed"
        exit 1
    }
    
    log_success "Application deployed successfully"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    local max_attempts=30
    local attempt=1
    local port=${PORT:-3000}
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f http://localhost:$port/ > /dev/null 2>&1; then
            log_success "Application is healthy and responding"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts: Waiting for application to start..."
        sleep 5
        ((attempt++))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    
    # Show logs for debugging
    log_info "Application logs:"
    docker-compose logs --tail=50 app
    
    return 1
}

# Cleanup old resources
cleanup() {
    log_info "Cleaning up old resources..."
    
    # Remove unused Docker resources
    docker system prune -f
    
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    log_info "Starting deployment process for $ENVIRONMENT environment..."
    
    # Check dependencies
    check_dependencies
    
    # Load environment
    load_environment
    
    # Run tests (skip in production if needed)
    if [[ "$ENVIRONMENT" != "production" ]]; then
        run_tests
    fi
    
    # Build application
    build_application
    
    # Build Docker image
    build_docker_image
    
    # Deploy application
    deploy_application
    
    # Perform health check
    health_check || {
        log_error "Deployment failed health check"
        exit 1
    }
    
    # Cleanup
    cleanup
    
    log_success "Deployment completed successfully!"
    log_info "Application is running at http://localhost:${PORT:-3000}"
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"