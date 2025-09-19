# Data Model: Application-Level Issue Fixes

**Branch**: `056-fix-application-level-issues` | **Date**: 2025-09-16

## Entity Overview

This feature focuses on fixing existing application components rather than creating new data models. The entities involved are modifications to existing interfaces and component structures.

## Core Entities

### 1. ProjectCard Component Interface

**Entity**: `ProjectCardComponent`
**Purpose**: Enhanced project card with proper test attributes and accessibility
**Location**: `src/components/ProjectCard.astro`

**Fields**:
```typescript
interface ProjectCardProps {
  project: Project;           // Existing project data structure
  'data-testid': string;      // NEW: Required test identifier
  'aria-labelledby': string;  // NEW: Accessibility label reference
  role: string;               // NEW: ARIA role for semantic meaning
}
```

**Validation Rules**:
- `data-testid` must equal "project-card"
- `aria-labelledby` must reference valid heading ID
- `role` must be "article"
- All existing project data validation preserved

**State Transitions**: N/A (stateless component)

### 2. SEO Meta Tags Entity

**Entity**: `SEOMetaTags`
**Purpose**: Comprehensive meta tag configuration for all pages
**Location**: `src/components/MainHead.astro`

**Fields**:
```typescript
interface SEOMetaTags {
  title: string;              // Existing field - enhanced validation
  description: string;        // Existing field - enhanced validation
  ogTitle: string;           // NEW: Open Graph title
  ogDescription: string;     // NEW: Open Graph description
  ogType: string;            // NEW: Open Graph content type
  ogUrl: string;             // NEW: Canonical URL
  structuredData: JSONLDData; // NEW: Schema.org structured data
}

interface JSONLDData {
  '@context': 'https://schema.org';
  '@type': 'Person' | 'WebSite' | 'Article';
  name: string;
  jobTitle?: string;
  url?: string;
  description?: string;
}
```

**Validation Rules**:
- `title` must be 10-60 characters
- `description` must be 120-160 characters
- `ogTitle` and `ogDescription` required for social sharing
- `structuredData` must be valid JSON-LD format
- All meta tags must be HTML-escaped

### 3. Content Structure Entity

**Entity**: `PageContentStructure`
**Purpose**: Semantic HTML structure validation for all pages
**Location**: Various page components

**Fields**:
```typescript
interface PageContentStructure {
  h1Element: HeadingElement;     // NEW: Required H1 per page
  semanticStructure: boolean;    // NEW: Proper heading hierarchy
  ariaLabels: AccessibilityLabels; // NEW: ARIA label compliance
}

interface HeadingElement {
  text: string;                  // H1 content
  id?: string;                   // Optional ID for linking
  visible: boolean;              // Must be visible (not hidden)
}

interface AccessibilityLabels {
  interactiveElements: ARIALabel[]; // All clickable elements
  formElements: FormAccessibility[]; // Form inputs and labels
  navigationElements: NavAccessibility[]; // Navigation ARIA
}
```

**Validation Rules**:
- Exactly one H1 element per page
- H1 must be visible and contain meaningful text
- All interactive elements must have ARIA labels
- Form elements must have associated labels
- Navigation must be keyboard accessible

## Data Flow Patterns

### 1. Project Data Loading Flow

**Current State**: Projects loaded from `src/content/projects.json`
**Enhancement**: Add validation and error handling

```
projects.json → ProjectGrid.astro → ProjectCard.astro (with test IDs)
```

**Validation Points**:
- JSON structure validation at load time
- Minimum 3 projects required for homepage
- Each project must have required fields for card rendering

### 2. SEO Meta Tags Flow

**Current State**: Basic meta tags in MainHead.astro
**Enhancement**: Comprehensive SEO implementation

```
Page props → MainHead.astro → Enhanced meta tags + structured data
```

**Validation Points**:
- Meta tag completeness check
- Open Graph validation
- Structured data JSON-LD validation

### 3. Accessibility Enhancement Flow

**Current State**: Basic accessibility implementation
**Enhancement**: WCAG AA compliance

```
Component rendering → ARIA attributes → Screen reader compatibility
```

**Validation Points**:
- ARIA label presence validation
- Keyboard navigation testing
- Color contrast verification

## Database Changes

**Impact**: None - this feature only modifies frontend components and static content structure.

**Existing Data Preservation**: All current project data in `projects.json` remains unchanged.

## API Impact

**Impact**: None - this feature focuses on frontend component fixes and does not modify any API endpoints.

**Existing APIs Preserved**: All current API functionality remains unchanged.

## Migration Strategy

**Approach**: In-place component enhancement
**Risk Level**: Low - additive changes only

**Steps**:
1. Add new attributes to existing components
2. Enhance meta tag implementation
3. Validate accessibility improvements
4. Test E2E compliance

**Rollback Plan**: Remove added attributes if issues arise (all changes are additive)

## Performance Considerations

**Impact**: Minimal - adding HTML attributes has negligible performance effect

**Optimizations**:
- Static generation preserved
- No additional JavaScript required
- Meta tags enhance SEO without performance cost
- ARIA attributes improve accessibility without performance impact

## Testing Data Requirements

**Test Data**: Use existing `projects.json` content
**Mock Data**: Not required - existing data sufficient
**Test Scenarios**: E2E tests validate component rendering and accessibility

## Security Considerations

**Impact**: None - HTML attribute additions do not introduce security risks
**Validation**: Standard HTML escaping continues to apply
**No new attack vectors**: Additive HTML enhancements only

## Implementation Dependencies

**Internal Dependencies**:
- Existing ProjectCard.astro component
- Existing MainHead.astro component
- Current projects.json data structure
- Existing test infrastructure

**External Dependencies**:
- Astro framework (no version changes)
- Playwright testing (current version)
- HTML/CSS standards compliance

## Success Metrics

**Data Quality Metrics**:
- 100% project cards have `data-testid="project-card"`
- 100% pages have exactly one H1 element
- 100% interactive elements have ARIA labels
- 100% pages have complete SEO meta tags

**Performance Metrics**:
- Page load times remain under 3 seconds
- No increase in DOM size beyond 5%
- E2E test execution time unchanged

## Conclusion

This data model focuses on enhancing existing components with accessibility, testing, and SEO attributes rather than creating new data structures. All changes are additive and preserve existing functionality while improving compliance and testability.