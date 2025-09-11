# Data Model: Bizkit.dev Portfolio Website

**Date**: 2025-01-27  
**Feature**: 001-you-are-helping

## Entity Definitions

### Project

Represents a portfolio project with all metadata needed for display and navigation.

**Fields**:

- `id: string` - Unique identifier (kebab-case, used in URLs)
- `name: string` - Display name of the project
- `description_short: string` - Brief description for project cards (max 150 chars)
- `description_long: string` - Full description supporting markdown
- `status: ProjectStatus` - Current development status
- `tech_stack: string[]` - Array of technology names (mapped to icons)
- `subdomain_url: string` - Full URL to live application
- `github_url: string` - URL to source code repository
- `screenshot_url?: string` - Optional screenshot/banner image URL
- `created_date: string` - ISO date string for sorting
- `featured: boolean` - Whether to highlight on landing page

**Validation Rules**:

- `id` must be unique across all projects
- `id` must match pattern: `/^[a-z0-9-]+$/`
- `description_short` length ≤ 150 characters
- `status` must be one of: "idea", "development", "live"
- `tech_stack` must contain at least one technology
- `subdomain_url` must be valid URL format
- `github_url` must be valid GitHub repository URL
- `screenshot_url` if present, must be valid image URL

**State Transitions**:

```
idea → development → live
     ↙              ↙
   archived    archived
```

### Subscriber

Represents an email subscriber for project updates.

**Fields**:

- `id: uuid` - Auto-generated unique identifier
- `email: string` - Email address (unique)
- `subscribed_at: timestamp` - When subscription occurred
- `confirmed: boolean` - Whether email has been confirmed
- `active: boolean` - Whether subscription is active

**Validation Rules**:

- `email` must be valid email format
- `email` must be unique in system
- `subscribed_at` defaults to current timestamp
- `confirmed` defaults to false
- `active` defaults to true

**State Transitions**:

```
unconfirmed → confirmed
     ↓           ↓
unsubscribed ← unsubscribed
```

### User (Optional Authentication)

Represents an authenticated user (minimal data collection).

**Fields**:

- `id: uuid` - Auto-generated unique identifier
- `email: string` - Email address (from OAuth or signup)
- `provider: AuthProvider` - Authentication method used
- `provider_id: string` - ID from OAuth provider
- `created_at: timestamp` - Account creation time
- `last_seen: timestamp` - Last activity timestamp

**Validation Rules**:

- `email` must be valid email format
- `provider` must be one of: "google", "email"
- `provider_id` required for OAuth providers
- `created_at` defaults to current timestamp
- `last_seen` updated on each session

**Relationships**:

- One User may have one Subscriber record (linked by email)
- Authentication is always optional

## Type Definitions

```typescript
// Core types
type ProjectStatus = 'idea' | 'development' | 'live' | 'archived'
type AuthProvider = 'google' | 'email'

// Project interface
interface Project {
  id: string
  name: string
  description_short: string
  description_long: string
  status: ProjectStatus
  tech_stack: string[]
  subdomain_url: string
  github_url: string
  screenshot_url?: string
  created_date: string
  featured: boolean
}

// Subscriber interface
interface Subscriber {
  id: string
  email: string
  subscribed_at: string
  confirmed: boolean
  active: boolean
}

// User interface
interface User {
  id: string
  email: string
  provider: AuthProvider
  provider_id?: string
  created_at: string
  last_seen: string
}

// UI display types
interface ProjectCard {
  id: string
  name: string
  description_short: string
  status: ProjectStatus
  tech_stack: string[]
  screenshot_url?: string
}

interface ProjectDetail extends Project {
  // Computed fields
  status_display: string
  tech_icons: TechIcon[]
  launch_enabled: boolean
}

interface TechIcon {
  name: string
  icon_url: string
  color: string
}
```

## Data Storage Strategy

### Static Data (Build Time)

**Location**: `/src/content/projects.json`  
**Access**: Loaded at build time via Astro content collections  
**Updates**: Manual editing, version controlled

```json
{
  "projects": [
    {
      "id": "ai-chat-assistant",
      "name": "AI Chat Assistant",
      "description_short": "Real-time chat interface with AI integration",
      "description_long": "A sophisticated chat application...",
      "status": "live",
      "tech_stack": ["React", "Node.js", "OpenAI", "WebSocket"],
      "subdomain_url": "https://chat.bizkit.dev",
      "github_url": "https://github.com/omarbizkit/ai-chat",
      "screenshot_url": "/images/projects/chat-screenshot.jpg",
      "created_date": "2025-01-15",
      "featured": true
    }
  ]
}
```

### Dynamic Data (Runtime)

**Storage**: Supabase PostgreSQL  
**Tables**: `subscribers`, `auth.users` (managed by Supabase Auth)  
**Access**: Supabase client library

#### Subscribers Table Schema

```sql
CREATE TABLE subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_active ON subscribers(active) WHERE active = true;
```

## Data Access Patterns

### Project Data

- **Static Generation**: Load all projects at build time
- **Filtering**: Client-side filtering by status, tech stack
- **Sorting**: By featured flag, then by created_date (desc)
- **Detail Pages**: Generated statically for each project

### Subscriber Management

- **Create**: Insert new subscriber with confirmation email
- **Confirm**: Update confirmed status via email link
- **Unsubscribe**: Set active to false (soft delete)
- **Admin**: Read-only analytics dashboard

### Authentication (Optional)

- **Login**: Supabase Auth handles OAuth and email flows
- **Session**: Stored in httpOnly cookies for `.bizkit.dev`
- **Profile**: Minimal user data, linked to subscriber if email matches

## Error Handling

### Data Validation

- **Client-side**: TypeScript interfaces ensure type safety
- **Server-side**: Supabase schema constraints prevent invalid data
- **User input**: Form validation with clear error messages

### Fallback Strategies

- **Missing screenshots**: Use placeholder images
- **Failed API calls**: Show error boundaries with retry options
- **Offline state**: Cache static content, graceful degradation

### Data Consistency

- **Project updates**: Require rebuild and deployment
- **Subscriber sync**: Real-time updates via Supabase
- **Cache invalidation**: Automatic on deployment

---

**Status**: Data model complete, ready for contract generation
