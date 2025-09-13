#!/bin/bash
# Cleanup script for design review screenshots
# Used by design-review agent after comprehensive testing

echo "🧹 Cleaning up design review artifacts..."

# Remove screenshots from proper directory structure
if [ -d "tests/design-review/screenshots" ]; then
  screenshot_count=$(find tests/design-review/screenshots -name "*.png" 2>/dev/null | wc -l)
  if [ "$screenshot_count" -gt 0 ]; then
    rm -f tests/design-review/screenshots/*.png 2>/dev/null
    echo "✅ Removed $screenshot_count screenshots from tests/design-review/screenshots/"
  else
    echo "ℹ️ No screenshots found in tests/design-review/screenshots/"
  fi
else
  echo "ℹ️ Design review directory doesn't exist yet"
fi

# Clean up temporary test scripts from root directory (should be in tests/design-review/scripts/)
root_scripts=$(find . -maxdepth 1 \( \
  -name "*test*.js" -o \
  -name "*headed*.js" -o \
  -name "*browser*.js" -o \
  -name "*design*.js" -o \
  -name "*review*.js" -o \
  -name "*ui-*.js" -o \
  -name "*wsl*.js" \
\) ! -name "eslint.config.js" ! -name "*.config.js" ! -name "vitest.config.js" ! -name "playwright.config.js" 2>/dev/null | wc -l)

if [ "$root_scripts" -gt 0 ]; then
  echo "🧹 Moving $root_scripts temporary test scripts to proper location..."
  mkdir -p tests/design-review/scripts
  find . -maxdepth 1 \( \
    -name "*test*.js" -o \
    -name "*headed*.js" -o \
    -name "*browser*.js" -o \
    -name "*design*.js" -o \
    -name "*review*.js" -o \
    -name "*ui-*.js" -o \
    -name "*wsl*.js" \
  \) ! -name "eslint.config.js" ! -name "*.config.js" ! -name "vitest.config.js" ! -name "playwright.config.js" \
  -exec mv {} tests/design-review/scripts/ \; 2>/dev/null
  echo "✅ Moved temporary test scripts to tests/design-review/scripts/"
fi

# Safety cleanup: Remove any test-related screenshots from root directory (shouldn't happen)
root_screenshots=$(find . -maxdepth 1 \( \
  -name "*test*.png" -o \
  -name "*headed*.png" -o \
  -name "*browser*.png" -o \
  -name "*screenshot*.png" -o \
  -name "*design*.png" -o \
  -name "*review*.png" -o \
  -name "*viewport*.png" -o \
  -name "*responsive*.png" -o \
  -name "*mobile*.png" -o \
  -name "*desktop*.png" -o \
  -name "*tablet*.png" \
\) 2>/dev/null | wc -l)

if [ "$root_screenshots" -gt 0 ]; then
  find . -maxdepth 1 \( \
    -name "*test*.png" -o \
    -name "*headed*.png" -o \
    -name "*browser*.png" -o \
    -name "*screenshot*.png" -o \
    -name "*design*.png" -o \
    -name "*review*.png" -o \
    -name "*viewport*.png" -o \
    -name "*responsive*.png" -o \
    -name "*mobile*.png" -o \
    -name "*desktop*.png" -o \
    -name "*tablet*.png" \
  \) -delete 2>/dev/null
  echo "⚠️ Cleaned up $root_screenshots screenshots from root directory (should use tests/design-review/screenshots/)"
fi

# Verify cleanup
remaining_root_png=$(find . -maxdepth 1 -name "*.png" -type f | wc -l)
remaining_root_scripts=$(find . -maxdepth 1 \( -name "*test*.js" -o -name "*headed*.js" -o -name "*ui-*.js" \) ! -name "*.config.js" 2>/dev/null | wc -l)
remaining_proper_png=$(find tests/design-review/screenshots -name "*.png" 2>/dev/null | wc -l || echo 0)
proper_scripts=$(find tests/design-review/scripts -name "*.js" 2>/dev/null | wc -l || echo 0)

echo "📊 Cleanup summary:"
echo "   - Root directory: $remaining_root_png PNG files, $remaining_root_scripts temp scripts (should be 0 temp scripts)"
echo "   - Design review directory: $remaining_proper_png screenshots, $proper_scripts temp scripts"

echo "🔚 Design review artifacts cleanup completed"