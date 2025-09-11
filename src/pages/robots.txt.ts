import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site?.href || 'https://bizkit.dev';
  
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl.replace(/\/$/, '')}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Block sensitive areas
Disallow: /api/
Disallow: /.env
Disallow: /node_modules/
Disallow: /dist/
Disallow: /src/

# Allow specific API endpoints for public access
Allow: /api/projects
Allow: /api/projects/*

# Common bot rules
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Slurp
Allow: /
Crawl-delay: 2

# Block aggressive crawlers
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
};