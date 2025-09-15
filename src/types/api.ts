/**
 * API Types for Bizkit.dev Portfolio Website
 * Based on OpenAPI specification in /specs/001-you-are-helping/contracts/api-schema.yaml
 */

// Project Status Enum
export type ProjectStatus = 'idea' | 'development' | 'live' | 'archived';

// Core Project Interface
export interface Project {
  id: string;                    // Pattern: ^[a-z0-9-]+$
  name: string;                  // Max length: 100
  description_short: string;     // Max length: 150
  description_long: string;      // Markdown supported
  status: ProjectStatus;
  tech_stack: string[];          // Min items: 1
  subdomain_url: string;         // URI format
  github_url: string;            // Pattern: ^https://github\.com/
  screenshot_url?: string | null; // Optional, URI format
  created_date: string;          // Date format: YYYY-MM-DD
  featured: boolean;
}

// Projects API Response
export interface ProjectsResponse {
  projects: Project[];
  total: number;                 // Min: 0
}

// Subscription Request
export interface SubscribeRequest {
  email: string;                 // Email format, max length: 254
}

// Check Subscription Request
export interface CheckSubscriptionRequest {
  email: string;                 // Email format, max length: 254
}

// Subscription Response
export interface SubscribeResponse {
  success: boolean;
  message: string;
  subscriber_id?: string;        // UUID format if present
}

// Session Response
export interface SessionResponse {
  authenticated: boolean;
  user?: {
    id: string;                  // UUID format
    email: string;               // Email format
    provider: 'google' | 'email';
  } | null;
}

// Generic Error Response
export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, any> | null;
}

// Type guards for runtime validation
export function isProjectStatus(value: string): value is ProjectStatus {
  return ['idea', 'development', 'live', 'archived'].includes(value);
}

export function isProject(obj: any): obj is Project {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    /^[a-z0-9-]+$/.test(obj.id) &&
    typeof obj.name === 'string' &&
    obj.name.length <= 100 &&
    typeof obj.description_short === 'string' &&
    obj.description_short.length <= 150 &&
    typeof obj.description_long === 'string' &&
    isProjectStatus(obj.status) &&
    Array.isArray(obj.tech_stack) &&
    obj.tech_stack.length > 0 &&
    obj.tech_stack.every((tech: any) => typeof tech === 'string') &&
    typeof obj.subdomain_url === 'string' &&
    /^https?:\/\/.+/.test(obj.subdomain_url) &&
    typeof obj.github_url === 'string' &&
    /^https:\/\/github\.com\//.test(obj.github_url) &&
    (obj.screenshot_url === null || obj.screenshot_url === undefined || 
     (typeof obj.screenshot_url === 'string' && /^https?:\/\/.+/.test(obj.screenshot_url))) &&
    typeof obj.created_date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(obj.created_date) &&
    typeof obj.featured === 'boolean'
  );
}

export function isProjectsResponse(obj: any): obj is ProjectsResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.projects) &&
    obj.projects.every(isProject) &&
    typeof obj.total === 'number' &&
    obj.total >= 0
  );
}

export function isSubscribeRequest(obj: any): obj is SubscribeRequest {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.email === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email) &&
    obj.email.length <= 254
  );
}

export function isSubscribeResponse(obj: any): obj is SubscribeResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.success === 'boolean' &&
    typeof obj.message === 'string' &&
    (obj.subscriber_id === undefined || 
     (typeof obj.subscriber_id === 'string' && 
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(obj.subscriber_id)))
  );
}

export function isSessionResponse(obj: any): obj is SessionResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.authenticated === 'boolean' &&
    (obj.user === null || obj.user === undefined ||
     (typeof obj.user === 'object' &&
      typeof obj.user.id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(obj.user.id) &&
      typeof obj.user.email === 'string' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.user.email) &&
      ['google', 'email'].includes(obj.user.provider)))
  );
}

export function isErrorResponse(obj: any): obj is ErrorResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.error === 'string' &&
    typeof obj.message === 'string' &&
    (obj.details === undefined || obj.details === null || typeof obj.details === 'object')
  );
}

// Utility types for API responses
export type ApiResponse<T> = T | ErrorResponse;

// Query parameters for projects endpoint
export interface ProjectsQueryParams {
  status?: ProjectStatus;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

// HTTP status codes for API responses
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];