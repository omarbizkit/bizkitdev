#!/bin/bash

# Test orchestration script that starts dev server before running contract tests
# This ensures tests have a running server to connect to

set -e  # Exit on any error

echo "🧪 Starting test orchestration..."

# Use test environment variables
export NODE_ENV=test
# Filter out comments and empty lines from .env.test
set -a  # automatically export all variables
source .env.test
set +a

# Start development server in background with test environment
echo "🚀 Starting development server in test mode..."
npm run dev &
DEV_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
timeout=30
while ! curl -s -f ${TEST_BASE_URL} > /dev/null; do
  sleep 1
  timeout=$((timeout - 1))
  if [ $timeout -eq 0 ]; then
    echo "❌ Server failed to start within 30 seconds"
    kill $DEV_PID 2>/dev/null || true
    exit 1
  fi
done

echo "✅ Server is ready!"

# Run the requested tests
case "$1" in
  "contract")
    echo "🔍 Running contract tests..."
    npm run test:contract
    ;;
  "integration")
    echo "🔍 Running integration tests..."
    npm run test:integration
    ;;
  "all")
    echo "🔍 Running all tests..."
    npm run test:all
    ;;
  *)
    echo "🔍 Running contract tests (default)..."
    npm run test:contract
    ;;
esac

# Capture test result
TEST_RESULT=$?

# Cleanup: stop the development server
echo "🧹 Cleaning up..."
kill $DEV_PID 2>/dev/null || true

# Exit with test result
if [ $TEST_RESULT -eq 0 ]; then
  echo "✅ All tests passed!"
else
  echo "❌ Some tests failed"
fi

exit $TEST_RESULT