import type { APIRoute } from 'astro';
import type { SessionResponse, ErrorResponse } from '../../../types/api';
import { supabase } from '../../../lib/supabase';

// Enable server-side rendering for API routes
export const prerender = false;

/**
 * GET /api/auth/session
 * Returns current user session information
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // Extract session token from cookies
    const cookieHeader = request.headers.get('cookie');
    let sessionToken: string | null = null;

    if (cookieHeader) {
      // Parse cookies to find Supabase session token
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      // Look for Supabase access token (common cookie names)
      sessionToken = cookies['sb-access-token'] || 
                    cookies['supabase-auth-token'] || 
                    cookies['sb-auth-token'] ||
                    null;
    }

    // If no session token, return unauthenticated
    if (!sessionToken) {
      return new Response(
        JSON.stringify({
          authenticated: false,
          user: null
        } as SessionResponse),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'private, no-cache',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true'
          }
        }
      );
    }

    // Validate session token with Supabase
    try {
      // Create a temporary client with the session token
      const { data: { user }, error: authError } = await supabase.auth.getUser(sessionToken);

      if (authError || !user) {
        // Invalid or expired token
        return new Response(
          JSON.stringify({
            authenticated: false,
            user: null
          } as SessionResponse),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'private, no-cache',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Credentials': 'true'
            }
          }
        );
      }

      // Valid session - return user info
      return new Response(
        JSON.stringify({
          authenticated: true,
          user: {
            id: user.id,
            email: user.email || '',
            provider: user.app_metadata?.provider || 'email'
          }
        } as SessionResponse),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'private, no-cache',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true'
          }
        }
      );

    } catch (authValidationError) {
      console.error('Session validation error:', authValidationError);
      
      // Treat validation errors as unauthenticated
      return new Response(
        JSON.stringify({
          authenticated: false,
          user: null
        } as SessionResponse),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'private, no-cache',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true'
          }
        }
      );
    }

  } catch (error) {
    console.error('Error in /api/auth/session:', error);
    
    return new Response(
      JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Unable to check session status'
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
      'Access-Control-Allow-Headers': 'Content-Type, Cookie, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
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
        'Allow': 'GET, OPTIONS',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
};

export const PUT = POST;
export const DELETE = POST;
export const PATCH = POST;