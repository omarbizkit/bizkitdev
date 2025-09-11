import type { MiddlewareHandler } from 'astro';

/**
 * Security middleware for adding headers and implementing CSP
 */
export const onRequest: MiddlewareHandler = async (context, next) => {
  // Process the request
  const response = await next();

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googleapis.com *.gstatic.com", // Allow Google Fonts
    "style-src 'self' 'unsafe-inline' *.googleapis.com *.gstatic.com", // Allow Google Fonts
    "font-src 'self' *.googleapis.com *.gstatic.com data:",
    "img-src 'self' data: blob: *.unsplash.com *.githubusercontent.com", // Allow Unsplash and GitHub images
    "connect-src 'self' *.supabase.co", // Allow Supabase connections
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // HSTS (HTTP Strict Transport Security) for production
  if (context.url.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Rate limiting headers (basic implementation) - only for non-prerendered routes
  let clientIP: string | undefined;
  try {
    clientIP = context.clientAddress;
  } catch {
    // clientAddress is not available for prerendered routes
    clientIP = undefined;
  }
  
  const userAgent = context.request.headers.get('user-agent') || '';
  
  // Simple bot detection
  const isBot = /bot|crawler|spider|crawling/i.test(userAgent);
  if (isBot) {
    response.headers.set('X-Robots-Tag', 'index, follow');
  }

  // CORS headers for API routes
  if (context.url.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  // Cache control for different types of content
  if (context.url.pathname.endsWith('.js') || context.url.pathname.endsWith('.css')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year for static assets
  } else if (context.url.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  } else {
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=7200'); // 1 hour client, 2 hours CDN
  }

  // Performance headers
  response.headers.set('Server-Timing', `total;dur=${Date.now()}`);

  return response;
};