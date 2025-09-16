#!/bin/bash

# E2E Configuration Audit Script
# Systematically identifies configuration mismatches causing test failures

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 E2E Configuration Audit Starting...${NC}"
echo "==========================================="

# Function to check if port is in use
check_port_in_use() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        echo -e "${RED}❌ Port $port is currently in use${NC}"
        lsof -i :$port
        return 1
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
        return 0
    fi
}

# Function to audit port configurations
audit_port_configurations() {
    echo -e "\n${BLUE}📋 PHASE 1: Port Configuration Audit${NC}"
    echo "-----------------------------------"

    # Check for port 4321 references
    echo -e "\n🔍 Checking for port 4321 references..."

    # Playwright config
    if [ -f "playwright.config.ts" ]; then
        echo -e "\n📁 playwright.config.ts:"
        grep -n "4321\|port\|url.*localhost" playwright.config.ts || echo -e "${YELLOW}⚠️ No port references found${NC}"
    else
        echo -e "${RED}❌ playwright.config.ts not found${NC}"
    fi

    # Package.json scripts
    if [ -f "package.json" ]; then
        echo -e "\n📁 package.json:"
        grep -n "4321\|--port\|dev.*astro" package.json || echo -e "${YELLOW}⚠️ No port references found${NC}"
    else
        echo -e "${RED}❌ package.json not found${NC}"
    fi

    # Astro config
    if [ -f "astro.config.mjs" ]; then
        echo -e "\n📁 astro.config.mjs:"
        grep -n "4321\|port\|server" astro.config.mjs || echo -e "${YELLOW}⚠️ No port references found${NC}"
    else
        echo -e "${RED}❌ astro.config.mjs not found${NC}"
    fi

    # Check current port usage
    echo -e "\n🌐 Current port 4321 status:"
    check_port_in_use 4321 || true

    # Extract actual ports being used
    echo -e "\n🔍 Port configuration analysis:"

    # Check playwright config for webServer port
    if [ -f "playwright.config.ts" ]; then
        PLAYWRIGHT_PORT=$(grep -o "localhost:[0-9]\+" playwright.config.ts | head -1 | cut -d: -f2 || echo "not found")
        echo "  Playwright webServer port: $PLAYWRIGHT_PORT"
    fi

    # Check package.json dev script
    if [ -f "package.json" ]; then
        DEV_SCRIPT=$(grep -o "astro dev.*--port [0-9]\+" package.json | head -1 || echo "not found")
        echo "  Package.json dev script: $DEV_SCRIPT"
    fi
}

# Function to audit test selectors
audit_test_selectors() {
    echo -e "\n${BLUE}📋 PHASE 2: Test Selector Audit${NC}"
    echo "--------------------------------"

    # Find all data-testid selectors in tests
    echo -e "\n🔍 Test selectors in E2E tests:"
    if [ -d "tests/e2e" ]; then
        grep -r "data-testid" tests/e2e/ | grep -o 'data-testid="[^"]*"' | sort | uniq -c | while read count selector; do
            echo "  $selector (used $count times)"
        done
    else
        echo -e "${RED}❌ tests/e2e directory not found${NC}"
    fi

    # Find all data-testid attributes in source code
    echo -e "\n🔍 Available selectors in source code:"
    if [ -d "src" ]; then
        find src -name "*.astro" -o -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs grep -h "data-testid" | grep -o 'data-testid="[^"]*"' | sort | uniq -c | while read count selector; do
            echo "  $selector (defined $count times)"
        done
    else
        echo -e "${RED}❌ src directory not found${NC}"
    fi

    # Check for specific problematic selectors
    echo -e "\n🎯 Checking specific problematic selectors:"

    # hero-subscribe-form
    echo -e "\n  Checking 'hero-subscribe-form':"
    if grep -r "hero-subscribe-form" src/ >/dev/null 2>&1; then
        echo -e "    ${GREEN}✅ Found in source code${NC}"
        grep -r "hero-subscribe-form" src/ | head -3
    else
        echo -e "    ${RED}❌ Not found in source code${NC}"
    fi

    if grep -r "hero-subscribe-form" tests/e2e/ >/dev/null 2>&1; then
        echo -e "    ${YELLOW}⚠️ Used in tests${NC}"
        grep -r "hero-subscribe-form" tests/e2e/ | head -3
    fi

    # subscribe-form
    echo -e "\n  Checking 'subscribe-form':"
    if grep -r "subscribe-form" src/ >/dev/null 2>&1; then
        echo -e "    ${GREEN}✅ Found in source code${NC}"
        grep -r "subscribe-form" src/ | head -3
    else
        echo -e "    ${RED}❌ Not found in source code${NC}"
    fi
}

# Function to audit browser environment
audit_browser_environment() {
    echo -e "\n${BLUE}📋 PHASE 3: Browser Environment Audit${NC}"
    echo "------------------------------------"

    # Check PLAYWRIGHT_BROWSERS_PATH
    echo -e "\n🌐 Browser environment variables:"
    echo "  PLAYWRIGHT_BROWSERS_PATH: ${PLAYWRIGHT_BROWSERS_PATH:-not set}"

    # Check if browsers are installed
    echo -e "\n🔍 Playwright browser installation:"
    if command -v npx >/dev/null 2>&1; then
        npx playwright install --dry-run 2>/dev/null || echo -e "${YELLOW}⚠️ Browser installation check failed${NC}"
    else
        echo -e "${RED}❌ npx not available${NC}"
    fi

    # Check GitHub Actions workflow
    if [ -f ".github/workflows/ci.yml" ]; then
        echo -e "\n📁 GitHub Actions CI workflow:"
        echo "  Browser installation steps:"
        grep -n "playwright.*install\|PLAYWRIGHT_BROWSERS_PATH" .github/workflows/ci.yml || echo -e "${YELLOW}⚠️ No browser setup found${NC}"
    else
        echo -e "${RED}❌ .github/workflows/ci.yml not found${NC}"
    fi
}

# Function to audit server health endpoint
audit_health_endpoint() {
    echo -e "\n${BLUE}📋 PHASE 4: Server Health Endpoint Audit${NC}"
    echo "----------------------------------------"

    # Check if health endpoint exists
    if [ -f "src/pages/api/health.ts" ]; then
        echo -e "\n${GREEN}✅ Health endpoint found: src/pages/api/health.ts${NC}"
        echo "Content preview:"
        head -20 src/pages/api/health.ts | cat -n
    else
        echo -e "\n${RED}❌ Health endpoint not found: src/pages/api/health.ts${NC}"

        # Check for alternative locations
        find src -name "*health*" -type f 2>/dev/null | while read file; do
            echo -e "${YELLOW}⚠️ Found alternative: $file${NC}"
        done
    fi

    # Test health endpoint if server is running
    echo -e "\n🌐 Testing health endpoint:"
    if curl -s http://localhost:4321/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Health endpoint responds${NC}"
        curl -s http://localhost:4321/api/health | head -5
    else
        echo -e "${RED}❌ Health endpoint not responding (server may not be running)${NC}"
    fi
}

# Function to audit environment variables
audit_environment_variables() {
    echo -e "\n${BLUE}📋 PHASE 5: Environment Variables Audit${NC}"
    echo "----------------------------------------"

    # Check for .env files
    echo -e "\n📁 Environment files:"
    for env_file in .env .env.local .env.test .env.production; do
        if [ -f "$env_file" ]; then
            echo -e "  ${GREEN}✅ $env_file exists${NC}"
            # Show variable names only (not values for security)
            grep "^[A-Z]" "$env_file" | cut -d= -f1 | while read var; do
                echo "    - $var"
            done
        else
            echo -e "  ${YELLOW}⚠️ $env_file not found${NC}"
        fi
    done

    # Check current environment variables
    echo -e "\n🌐 Current Supabase environment variables:"
    echo "  PUBLIC_SUPABASE_URL: ${PUBLIC_SUPABASE_URL:-not set}"
    echo "  PUBLIC_SUPABASE_ANON_KEY: ${PUBLIC_SUPABASE_ANON_KEY:-not set}"

    # Check test environment setup
    if [ -f "tests/e2e/global-setup.ts" ]; then
        echo -e "\n📁 Test environment setup:"
        grep -n "env\|PUBLIC_SUPABASE" tests/e2e/global-setup.ts | head -10 || echo -e "${YELLOW}⚠️ No environment setup found${NC}"
    fi
}

# Function to generate summary and recommendations
generate_summary() {
    echo -e "\n${BLUE}📊 AUDIT SUMMARY & RECOMMENDATIONS${NC}"
    echo "===================================="

    echo -e "\n🎯 Key Issues Identified:"

    # Port configuration issues
    if ! grep -q "4321" playwright.config.ts package.json astro.config.mjs 2>/dev/null; then
        echo -e "  ${RED}❌ Port configuration inconsistencies detected${NC}"
        echo -e "    → Recommendation: Standardize all configs to use port 4321"
    fi

    # Selector issues
    if ! grep -r "hero-subscribe-form" src/ >/dev/null 2>&1; then
        echo -e "  ${RED}❌ Missing hero-subscribe-form selector in source code${NC}"
        echo -e "    → Recommendation: Add data-testid='hero-subscribe-form' to subscription form"
    fi

    # Health endpoint
    if [ ! -f "src/pages/api/health.ts" ]; then
        echo -e "  ${RED}❌ Missing health endpoint${NC}"
        echo -e "    → Recommendation: Create src/pages/api/health.ts"
    fi

    # Browser environment
    if [ -z "$PLAYWRIGHT_BROWSERS_PATH" ]; then
        echo -e "  ${YELLOW}⚠️ PLAYWRIGHT_BROWSERS_PATH not set${NC}"
        echo -e "    → Recommendation: Set PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-browsers"
    fi

    echo -e "\n🚀 Next Steps:"
    echo -e "  1. Execute T004-T007: Configuration audit tasks based on findings"
    echo -e "  2. Create validation tests for each identified issue"
    echo -e "  3. Implement systematic fixes in dependency order"

    echo -e "\n📁 Audit complete. Results saved to: audit-results.log"
}

# Main execution
main() {
    # Redirect all output to both console and log file
    exec > >(tee audit-results.log)
    exec 2>&1

    audit_port_configurations
    audit_test_selectors
    audit_browser_environment
    audit_health_endpoint
    audit_environment_variables
    generate_summary

    echo -e "\n${GREEN}✅ Configuration audit completed successfully!${NC}"
    echo -e "📄 Full results saved to: audit-results.log"
}

# Run the audit
main "$@"