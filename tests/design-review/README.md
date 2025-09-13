# Design Review Testing Directory

This directory contains artifacts and temporary files generated during design review testing sessions.

## Structure

```
tests/design-review/
├── screenshots/     # Screenshots captured during headed browser testing
├── scripts/         # Temporary test scripts generated during design review sessions
└── README.md       # This documentation file
```

## Usage

### Artifact Management

**Screenshots**: Automatically created in `screenshots/` during design review sessions and cleaned up after testing.

**Temporary Scripts**: Test scripts generated during design review are stored in `scripts/` directory.

**Cleanup Script**: `scripts/cleanup-design-screenshots.sh`
- Removes all screenshots from `screenshots/` directory
- Moves temporary test scripts from root to `scripts/` directory
- Safety cleanup of any artifacts accidentally placed in root directory
- Provides comprehensive cleanup summary with file counts

**Safe Browser Script**: `scripts/safe-headed-browser.js`
- Creates screenshots in `screenshots/` directory during testing
- Automatically cleans up all artifacts after testing session completes
- Uses proper directory structure to avoid cluttering project root

### Automated Cleanup

The design review system automatically:
1. Creates `tests/design-review/screenshots/` and `tests/design-review/scripts/` directories as needed
2. Saves all test screenshots to `screenshots/` directory
3. Stores temporary test scripts in `scripts/` directory
4. Cleans up all artifacts after testing session completes
5. Provides fallback cleanup for any artifacts accidentally placed in root directory

### Git Ignore

Design review artifacts are properly excluded from version control:
- `tests/design-review/screenshots/` - Entire screenshot directory
- `/*test*.png`, `/*headed*.png`, etc. - Pattern-based exclusions for root directory
- `/*test*.js`, `/*headed*.js`, `/*ui-*.js` - Temporary test script exclusions for root directory

## Best Practices

- ✅ Screenshots saved to `tests/design-review/screenshots/`
- ✅ Temporary scripts saved to `tests/design-review/scripts/`
- ✅ Automatic cleanup after testing sessions
- ✅ Proper .gitignore configuration
- ✅ Safety fallbacks for root directory cleanup
- ❌ Never commit test artifacts to version control
- ❌ Never place test artifacts in project root directory

## Maintenance

This directory and its contents are managed automatically by the design review system. Manual intervention should not be necessary under normal circumstances.