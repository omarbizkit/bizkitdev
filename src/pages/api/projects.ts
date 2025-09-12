import type { APIRoute } from 'astro';
import type { ProjectsResponse, ProjectStatus, ProjectsQueryParams, Project } from '../../types/api';
import projectsDataJson from '../../content/projects.json';

// Enable server-side rendering for API routes
export const prerender = false;

/**
 * GET /api/projects
 * Returns a list of projects with optional filtering
 * Supports query parameters: status, featured, limit, offset
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const params: ProjectsQueryParams = {
      status: url.searchParams.get('status') as ProjectStatus || undefined,
      featured: url.searchParams.get('featured') ? 
        url.searchParams.get('featured') === 'true' : undefined,
      limit: url.searchParams.get('limit') ? 
        parseInt(url.searchParams.get('limit')!) : undefined,
      offset: url.searchParams.get('offset') ? 
        parseInt(url.searchParams.get('offset')!) : undefined,
    };

    // Start with all projects
    const projectsData = projectsDataJson as { projects: Project[] };
    let filteredProjects = [...projectsData.projects];

    // Apply status filter
    if (params.status) {
      if (!['idea', 'development', 'live', 'archived'].includes(params.status)) {
        return new Response(
          JSON.stringify({
            error: 'INVALID_STATUS',
            message: 'Status must be one of: idea, development, live, archived'
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          }
        );
      }
      filteredProjects = filteredProjects.filter(project => project.status === params.status);
    }

    // Apply featured filter
    if (params.featured !== undefined) {
      filteredProjects = filteredProjects.filter(project => project.featured === params.featured);
    }

    // Sort projects (featured first, then by creation date descending)
    filteredProjects.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
    });

    // Apply pagination
    const totalProjects = filteredProjects.length;
    if (params.offset && params.offset > 0) {
      filteredProjects = filteredProjects.slice(params.offset);
    }
    if (params.limit && params.limit > 0) {
      filteredProjects = filteredProjects.slice(0, params.limit);
    }

    // Prepare response
    const response: ProjectsResponse = {
      projects: filteredProjects,
      total: totalProjects
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=600', // Cache for 5 minutes (client), 10 minutes (CDN)
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );

  } catch (error) {
    console.error('Error in /api/projects:', error);
    
    return new Response(
      JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'An internal server error occurred'
      }),
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
      'Access-Control-Allow-Headers': 'Content-Type',
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
    }),
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