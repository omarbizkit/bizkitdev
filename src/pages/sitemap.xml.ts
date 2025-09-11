import type { APIRoute } from 'astro';
import projectsData from '../content/projects.json';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site?.href || 'https://bizkit.dev';
  
  // Static pages
  const staticPages = [
    '',
    '/about',
    '/work', 
    '/contact'
  ];

  // Dynamic project pages
  const projectPages = projectsData.projects.map(project => `/projects/${project.id}`);

  // All pages
  const allPages = [...staticPages, ...projectPages];

  // Generate sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => {
  const url = `${baseUrl.replace(/\/$/, '')}${page}`;
  const lastmod = new Date().toISOString();
  
  // Set priority based on page type
  let priority = '0.5';
  if (page === '') priority = '1.0'; // Homepage
  else if (page === '/about' || page === '/work') priority = '0.8';
  else if (page.startsWith('/projects/')) priority = '0.7';
  
  // Set change frequency
  let changefreq = 'monthly';
  if (page === '') changefreq = 'weekly'; // Homepage
  else if (page.startsWith('/projects/')) changefreq = 'monthly';
  
  return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
};