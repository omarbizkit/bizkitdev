#!/bin/bash

# GitHub Actions Workflow Cleanup Script
# This script cleans up failed workflow runs from your repository

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) is not installed!"
    print_info "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    print_error "You're not logged into GitHub CLI!"
    print_info "Run: gh auth login"
    exit 1
fi

echo "🧹 GitHub Actions Workflow Cleanup Tool"
echo "======================================"

# Get repository info
REPO_INFO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
print_info "Repository: $REPO_INFO"

# Count failed runs
FAILED_COUNT=$(gh run list --status failure --json databaseId --jq '. | length')
print_info "Found $FAILED_COUNT failed workflow runs"

if [ "$FAILED_COUNT" -eq 0 ]; then
    print_status "No failed workflow runs to clean up!"
    exit 0
fi

# Show the failed runs
echo ""
print_info "Failed workflow runs:"
gh run list --status failure --limit 20

echo ""
print_warning "This will delete ALL $FAILED_COUNT failed workflow runs"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Deleting failed workflow runs..."
    
    # Delete failed runs with progress
    COUNTER=0
    gh run list --status failure --json databaseId --jq '.[].databaseId' | while read -r run_id; do
        COUNTER=$((COUNTER + 1))
        echo -n "Deleting run $COUNTER/$FAILED_COUNT (ID: $run_id)..."
        
        if gh run delete "$run_id" --confirm &> /dev/null; then
            echo -e " ${GREEN}✅${NC}"
        else
            echo -e " ${RED}❌${NC}"
        fi
        
        # Small delay to avoid rate limiting
        sleep 0.5
    done
    
    print_status "Cleanup completed!"
    
    # Show final status
    echo ""
    REMAINING_FAILED=$(gh run list --status failure --json databaseId --jq '. | length')
    print_info "Remaining failed runs: $REMAINING_FAILED"
    
else
    print_info "Cleanup cancelled"
    exit 0
fi

echo ""
print_status "✨ Your Actions tab is now clean!"
print_info "Next time you push code, you'll see fresh workflow runs."