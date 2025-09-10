Bizkit.dev Portfolio Website Specification

Overview



Bizkit.dev is a modern, neon-futuristic portfolio hub to showcase Omar’s projects (apps, prototypes, games). Each project will be accessible via its own subdomain and will also have a dedicated project detail page generated from JSON data. The landing page will highlight Omar’s professional identity as a Data and AI enthusiast, provide a Contact Me section (email address only), and encourage visitors to subscribe for updates.



The site will be built on the NeoDev Astro template as a starting point, adopting its dark sci-fi UI style. Project metadata will be maintained in a JSON file for easy updates and additions.



SEO best practices will be integrated to ensure visibility, and a consistent common element (branding/footer/header) will be applied across the landing page and subdomains.



User Stories

Visitors / Casual Users



As a visitor, I want to quickly scan a grid of projects so I can discover interesting apps and demos.



As a visitor, I want clear status indicators (Idea, In Development, Live) so I know which projects I can try immediately.



As a visitor, I want to click into a project card to view more details before launching it.



As a visitor, I want a visually appealing sci-fi design so the site feels modern and engaging.



As a visitor, I want to subscribe with my email so I can receive updates when new projects are added.



As a visitor, I want the site to load quickly and look good on mobile, so I can browse easily on any device.



Potential Clients



As a client, I want to read an About Me blurb that summarizes Omar’s expertise (“Data and AI enthusiast”).



As a client, I want a Contact Me section that shows Omar’s direct email address so I can reach out.



As a client, I want to see which tech stack was used for each project so I can assess relevant skills.



As a client, I want confidence in professionalism via consistent design and SEO optimization.



Site Owner (Omar)



As the site owner, I want to store project information in a JSON file so I can easily update or add projects regularly.



As the site owner, I want the design to have a consistent header/footer/branding across all subdomains to reinforce identity.



As the site owner, I want SEO optimization (titles, metadata, alt text, sitemaps) so my site is discoverable by search engines.



As the site owner, I want authentication available but always optional, so casual users aren’t blocked.



Functional Requirements

Landing Page



Hero Section: Bold neon aesthetic, site title (bizkit.dev), and tagline (Data and AI Enthusiast).



Projects Section: Grid of project cards (name, short description, status badge, tech stack icons).



Project Detail Navigation: Clicking a project card opens a static project detail page generated from JSON data. From there, users can launch the subdomain app.



About Me Section: Short blurb “Data and AI Enthusiast.”



Contact Me Section: Displays direct email: omar.bizkit@hotmail.com

.



Subscribe Section: Mailing list form (email input + subscribe button). Connects to Supabase (subscribers table).



Footer: Common footer with consistent branding, GitHub link, contact email, and subscribe link.



Project Detail Pages (Static)



Generated at build time from JSON.



Each page includes:



Project name and banner/screenshot.



Full description.



Status badge (Idea / In Development / Live).



Tech stack icons.



Links: “Launch App” (subdomain) and “View Code” (GitHub).



No dynamic fetch; all content is built from JSON (SSG).



JSON Project File



Defines for each project:



id



name



description\_short



description\_long



status (enum: idea | development | live)



tech\_stack (array of strings, mapped to icons)



subdomain\_url



github\_url



screenshot\_url (optional)



Both landing page and detail pages consume this JSON.



SEO Optimization



Each page has unique meta titles and descriptions.



OpenGraph/Twitter cards for sharing.



Sitemap.xml and robots.txt auto-generated.



Semantic HTML structure (proper headings, alt text on images).



Consistency



Shared header with bizkit.dev logo + navigation (Home, Projects, About, Contact).



Shared footer with subscribe, contact email, GitHub link.



Subdomain apps include a small link back to bizkit.dev.



Authentication



Supabase integration with Google OAuth + username/password.



Always optional: users can browse and subscribe without logging in.



If logged in, session is shared across subdomains using cookies at .bizkit.dev.



Acceptance Criteria



Projects Grid: Displays projects from JSON with correct details.



Project Detail Page: Accessible via card click. Generated statically and shows correct content.



JSON-driven Updates: Updating JSON updates both grid and detail pages after rebuild.



About Me Section: Displays “Data and AI Enthusiast.”



Contact Section: Displays omar.bizkit@hotmail.com

.



Subscribe Section: Stores email in Supabase and shows confirmation.



SEO: Passes Lighthouse SEO checks; has meta, OG tags, sitemap.



Consistency: Identical header/footer across pages and subdomains.



Design: Dark sci-fi neon theme (purple/blue/pink), responsive across devices.



Authentication: Available but optional; site fully usable without login.

