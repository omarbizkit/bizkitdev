#!/bin/bash
# Cleanup script for design review screenshots
# Used by design-review agent after comprehensive testing

echo "🧹 Cleaning up design review screenshots..."

# Remove test-related screenshots from root directory
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

# Count remaining PNG files to verify cleanup
remaining=$(find . -maxdepth 1 -name "*.png" -type f | wc -l)

if [ "$remaining" -eq 0 ]; then
  echo "✅ All test screenshots cleaned up successfully"
else
  echo "ℹ️ Found $remaining PNG files remaining (likely project assets)"
fi

echo "🔚 Screenshot cleanup completed"