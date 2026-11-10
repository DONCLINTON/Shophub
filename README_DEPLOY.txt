SHOPHUB — CLEAN PRODUCT URL + WHATSAPP FIXES (TEST BUILD)

PURPOSE
This code is for ShopHub UG at https://shhop.netlify.app/. The SEO Edge Function is configured for the production domain. If you deploy to a temporary test domain first, change the `SITE` constant at the top of `netlify/edge-functions/seo.ts` to that test domain, then restore it to `https://shhop.netlify.app` before production.

DEPLOY
1. Extract this ZIP.
2. Upload the CONTENTS of this folder to the connected Netlify/GitHub repository (index.html, netlify.toml and the netlify/ folder must all be at the repository root).
3. Wait for the deploy to finish. Confirm the deploy log shows the `seo` Edge Function deployed successfully. If an old version still appears, hard-refresh or clear the site's cached data/service worker.
4. After production deployment, open `https://shhop.netlify.app/sitemap.xml`. It should list the homepage, `/jobs`, and the current product/job detail URLs. If it only lists the homepage and jobs page, inspect the Netlify Edge Function log for Supabase/RLS errors.

EXPECTED PRODUCT URL
  https://shhop.netlify.app/product/14/product-title
Product title slugs are generated from the Supabase listing title; the ID keeps each URL unique.

SEO AND PHONE REPAIRS IN THIS BUILD
- Adds a Netlify Edge Function that generates a live sitemap from Supabase products and jobs.
- Adds route-specific server-side canonical URLs, page titles, descriptions and Product/JobPosting structured data.
- Normalizes Ugandan phone numbers to E.164 for storage/display (e.g. +256744343456); WhatsApp links use the required digits-only format.
- Increments the service-worker cache version so returning visitors fetch the updated app shell.

WHAT THIS BUILD FIXES
- Makes the product title a visible, real link to its descriptive product route.
- Uses one clean URL format for product opening, share and copy-link.
- Removes the conflict where the old modal URL behavior could override the clean route.
- Keeps direct visits to clean product URLs working through Netlify rewrites.
- Makes canonical URLs point to the production ShopHub domain (not the temporary test domain).
- Opens the job-application WhatsApp tab synchronously before waiting for the Supabase insert, reducing popup blocking.
- Handles missing WhatsApp numbers without opening a broken wa.me link. Seller-entered numbers are not silently replaced or rewritten to a different number.
- Bumps the service-worker cache version to reduce stale-code problems.

TEST CHECKLIST
1. Open a product and check the address bar.
2. Tap the product title link, then use Share and Copy Link. Each should use /product/ID/product-title.
3. Copy a product URL into a new tab and confirm the same product opens.
4. Test WhatsApp on a listing with a known, correctly entered number.
5. Test Apply on a job with a known employer WhatsApp number.
6. Confirm jobs, product images, filters, and seller contact still work.

NOTES
- Existing Supabase listing IDs, tables, and seller contact values are preserved.
- A seller may have entered an incorrect phone number; this build does not guess or substitute a number. Correct the listing data at its source if confirmed wrong.
- The sitemap is now generated dynamically by a Netlify Edge Function from Supabase listings and jobs.
- Never add a Supabase service-role key to frontend files.

SEARCH CONSOLE AFTER DEPLOY
1. Test the homepage, one product URL and one job URL with URL Inspection.
2. Confirm the user-declared canonical and Google-visible canonical point to the exact intended product/job URL.
3. Submit `https://shhop.netlify.app/sitemap.xml` in Search Console.
4. Request indexing for a small sample of important product/job URLs. Google decides when/if to index; deployment does not guarantee indexing.
