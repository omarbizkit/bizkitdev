import type { APIRoute } from 'astro';
import type { Project, ErrorResponse } from '../../../types/api';
import projectsData from '../../../content/projects.json';

// Enable server-side rendering for dynamic routes
export const prerender = false;

/**
 * GET /api/projects/{id}
 * Returns detailed information for a specific project
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const projectId = params.id;

    // Validate project ID format
    if (!projectId || typeof projectId !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'INVALID_PROJECT_ID',
          message: 'Project ID is required'
        } as ErrorResponse),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
    }

    // Validate project ID pattern (lowercase alphanumeric with hyphens)
    if (!/^[a-z0-9-]+$/.test(projectId)) {
      return new Response(
        JSON.stringify({
          error: 'INVALID_PROJECT_ID_FORMAT',
          message: 'Project ID must contain only lowercase letters, numbers, and hyphens'
        } as ErrorResponse),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
    }

    // Find the project
    const project = projectsData.projects.find(p => p.id === projectId);

    if (!project) {
      return new Response(
        JSON.stringify({
          error: 'PROJECT_NOT_FOUND',
          message: `Project with ID '${projectId}' was not found`
        } as ErrorResponse),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60' // Short cache for 404s
          }
        }
      );
    }

    // Return the project data
    return new Response(
      JSON.stringify(project as Project),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=600, s-maxage=1200', // Cache for 10 minutes (client), 20 minutes (CDN)
          'ETag': `"${projectId}-${project.created_date}"`, // Simple ETag based on ID and creation date
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );

  } catch (error) {
    console.error('Error in /api/projects/[id]:', error);
    
    return new Response(
      JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'An internal server error occurred'
      } as ErrorResponse),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
};

// Handle OPTIONS for CORS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, If-None-Match',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  });
};

// Reject non-GET methods
export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only GET method is allowed for this endpoint'
    } as ErrorResponse),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'GET, OPTIONS'
      }
    }
  );
};

export const PUT = POST;
export const DELETE = POST;
export const PATCH = POST;