# ShopHub

ShopHub is a static HTML/CSS/JavaScript website hosted on Netlify and connected to Supabase.

## Supabase configuration

The browser-side Supabase URL and **publishable/anon key** are already configured in `index.html`:

- Project URL: `https://lulijpkeslesdeyemada.supabase.co`
- Key type: Supabase `anon` (public client) key

A browser-based static website cannot keep a key secret from visitors. This anon key is designed for client-side use, but the Supabase database and Storage must be protected by correct Row Level Security (RLS) policies and Storage policies. **Never put a `service_role` key or any secret key in `index.html`, GitHub, or any browser code.**

## Deploy through GitHub to Netlify

1. Create a repository on GitHub, for example `shophub`.
2. Upload the contents of this project to the repository root. `index.html` must be in the root, not inside another nested folder.
3. In Netlify, open **Add new site → Import an existing project**.
4. Choose **GitHub**, authorize Netlify if asked, and select the `shophub` repository.
5. For this static site, leave the build command empty and set the publish directory to `.` (the repository root).
6. Click **Deploy site**. Netlify will automatically redeploy when you push future commits to the connected branch.
7. If you are connecting the production site, confirm the correct Netlify site and custom domain before deploying.

The existing `_redirects` file supports direct visits to clean product URLs such as `/product/14/solar-security-light`.

## Before going live

- Test browsing listings, product links, image uploads, WhatsApp links, jobs, and applications.
- Check Supabase **Authentication / Policies** and Storage policies. Only allow actions that your public website actually needs.
- Do not store sensitive seller/customer information in public tables or expose it in public queries.
- This repository contains the website's public anon key in `index.html`, as the current static frontend expects. It must not contain a service-role key.

## Notes

This project uses a static site setup; no Node build step is required for the current version. `sitemap.xml` is static and does not automatically refresh with new products/jobs.
