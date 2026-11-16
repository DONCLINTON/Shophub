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


SHOPHUB MARKETPLACE UPGRADE — DEPLOYMENT ORDER
================================================

This package preserves the existing ShopHub project and adds:
- Full-photo product display (contain rather than crop).
- Seller / business name and optional subcategory fields.
- Expanded category and subcategory choices.
- Supabase-backed buyer requests with public WhatsApp contact.
- A standalone rental page at /brokerage/ for rooms, self-contained units,
  full houses and apartments.
- Brokerage listings use public.house_rentals, with landlord/agent type, monthly rent, contact details,
  optional descriptions, landmarks and optional photos.
- Brokerage page sitemap entry and a clean Netlify redirect.
- Service worker cache version update.

IMPORTANT: Do not deploy the frontend until the SQL migration succeeds.

1. BACK UP the current live GitHub repository and Supabase database.
2. Open Supabase Dashboard -> SQL Editor for the project already used by ShopHub.
3. Run the complete file: supabase_upgrade.sql
   The SQL is additive: it adds two columns to public.listings, creates
   buyer_requests, the legacy property_listings table, and the active
   house_rentals table used by brokerage.html, plus the rental-photos bucket
   and narrowly scoped public policies. It does not drop existing records.
4. Confirm the SQL completed successfully.
5. Deploy ALL files in this package to a separate Netlify test site or preview
   branch first. Keep the current production main branch untouched.
6. Test:
   - Existing products and jobs still load.
   - New product can be posted with seller/business name and subcategory.
   - Product images display fully without cropping.
   - Buyer request can be posted and appears in the public request list.
   - Rental listing publishes with required details and with no photos.
   - Rental listing also publishes with photos.
   - WhatsApp contact links use the supplied phone number.
   - /brokerage/ opens the rental page and its Back to Marketplace link works.
   - /sitemap.xml and /robots.txt load as files.
   - PWA install and offline shell still work.
7. Only after the test site passes should you replace production files.

SUPABASE NOTES
--------------
- Use the same Supabase project already configured in index.html.
- Never put a Supabase service-role key in frontend files.
- Buyer requests, legacy property listings and active house rentals are public marketplace records.
  Their contact names and phone numbers are visible to site visitors by design.
- The public insert policies allow anonymous posting, matching the current
  public marketplace model. They do not provide spam prevention or identity
  verification.
- Public update/delete policies are intentionally not added.
- The existing item-photos bucket and current listings/jobs tables are retained.
- Existing listings may show "ShopHub Seller" until sellers add a seller_name.
  New listing submissions require a seller/business name.
- If an upload fails, check that the existing item-photos bucket is public and
  permits uploads under the existing ShopHub policies. The upgrade SQL does
  not alter that bucket.

SEO / NETLIFY
-------------
- /brokerage/ is rewritten to brokerage.html before the existing SPA catch-all.
- The old netlify.toml pointed at a missing "seo" Edge Function. Those broken
  declarations have been removed. The real sitemap.xml and existing scheduled
  GitHub sitemap generator remain in place.
- The sitemap generator adds /brokerage/ while continuing to fetch product and
  job URLs from Supabase.
PHOTO VIEWER UPDATE (v2): Product photos in listing details can now be tapped to open a full-screen viewer. Supports pinch-to-zoom on touchscreens, swipe left/right between photos, on-screen previous/next and zoom controls, mouse-wheel/double-click zoom, and keyboard ArrowLeft/ArrowRight, +/-, and Escape.
