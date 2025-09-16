#!/bin/bash

# Validation Environment Setup Script
# Sets up mock Supabase and browser environment for E2E testing

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Setting up E2E validation environment...${NC}"

# Export validation environment variables
export PUBLIC_SUPABASE_URL="https://mock.supabase.co"
export PUBLIC_SUPABASE_ANON_KEY="mock-anon-key-safe-for-ci"
export PLAYWRIGHT_BROWSERS_PATH="/tmp/playwright-browsers"
export TEST_BASE_URL="http://localhost:4321"
export NODE_ENV="test"

echo -e "${GREEN}✅ Environment variables configured:${NC}"
echo "  PUBLIC_SUPABASE_URL: $PUBLIC_SUPABASE_URL"
echo "  PUBLIC_SUPABASE_ANON_KEY: ${PUBLIC_SUPABASE_ANON_KEY:0:20}..."
echo "  PLAYWRIGHT_BROWSERS_PATH: $PLAYWRIGHT_BROWSERS_PATH"
echo "  TEST_BASE_URL: $TEST_BASE_URL"
echo "  NODE_ENV: $NODE_ENV"

# Create browser path directory if it doesn't exist
if [ ! -d "$PLAYWRIGHT_BROWSERS_PATH" ]; then
    echo -e "\n${BLUE}📁 Creating browser directory: $PLAYWRIGHT_BROWSERS_PATH${NC}"
    mkdir -p "$PLAYWRIGHT_BROWSERS_PATH"
    echo -e "${GREEN}✅ Browser directory created${NC}"
else
    echo -e "\n${GREEN}✅ Browser directory already exists${NC}"
fi

# Verify .env.test file exists and is properly formatted
echo -e "\n${BLUE}📋 Validating .env.test file...${NC}"
if [ -f ".env.test" ]; then
    echo -e "${GREEN}✅ .env.test file exists${NC}"

    # Check if required variables are in .env.test
    required_vars=("PUBLIC_SUPABASE_URL" "PUBLIC_SUPABASE_ANON_KEY" "TEST_BASE_URL")
    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" .env.test; then
            echo -e "  ✅ $var configured in .env.test"
        else
            echo -e "  ${YELLOW}⚠️ $var missing from .env.test${NC}"
        fi
    done
else
    echo -e "${YELLOW}⚠️ .env.test file not found - creating basic version${NC}"
    cat > .env.test << EOF
NODE_ENV=test
TEST_BASE_URL=http://localhost:4321
PUBLIC_SUPABASE_URL=https://mock.supabase.co
PUBLIC_SUPABASE_ANON_KEY=mock-anon-key-safe-for-ci
SUPABASE_SERVICE_ROLE_KEY=mock-service-role-key-safe-for-ci
PUBLIC_SITE_URL=http://localhost:4321
BROWSER_NAME=chromium
HEADLESS=true
EOF
    echo -e "${GREEN}✅ Created .env.test with mock configuration${NC}"
fi

# Test browser installation
echo -e "\n${BLUE}🌐 Testing browser environment...${NC}"
if command -v npx >/dev/null 2>&1; then
    # Install browsers in the specified path
    echo "Installing browsers to: $PLAYWRIGHT_BROWSERS_PATH"
    PLAYWRIGHT_BROWSERS_PATH="$PLAYWRIGHT_BROWSERS_PATH" npx playwright install chromium

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Browser installation successful${NC}"
    else
        echo -e "${YELLOW}⚠️ Browser installation had issues but continuing${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ npx not available - skipping browser installation${NC}"
fi

# Test environment loading (simulate what tests do)
echo -e "\n${BLUE}🧪 Testing environment loading...${NC}"
if [ -f ".env.test" ]; then
    # Source the .env.test file to validate it can be loaded
    set -a  # automatically export all variables
    source .env.test
    set +a  # disable automatic export

    echo -e "${GREEN}✅ Environment file loaded successfully${NC}"
    echo "  Loaded PUBLIC_SUPABASE_URL: ${PUBLIC_SUPABASE_URL:0:30}..."
    echo "  Loaded TEST_BASE_URL: $TEST_BASE_URL"
else
    echo -e "${YELLOW}⚠️ Could not test environment loading${NC}"
fi

# Create a validation summary
echo -e "\n${BLUE}📊 Validation Environment Summary:${NC}"
echo "================================="
echo -e "${GREEN}✅ Mock Supabase configuration ready${NC}"
echo -e "${GREEN}✅ Browser environment configured${NC}"
echo -e "${GREEN}✅ Test environment variables set${NC}"
echo -e "${GREEN}✅ Ready for E2E test validation${NC}"

echo -e "\n${BLUE}🚀 Environment setup complete!${NC}"
echo -e "You can now run E2E tests with: npm run test:e2e"