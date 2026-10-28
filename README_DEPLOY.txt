SHOPHUB — CLEAN PRODUCT URL + WHATSAPP FIXES (TEST BUILD)

PURPOSE
This code is for ShopHub at https://shhop.netlify.app/. Deploy it first to your test site, https://sitetestv3.netlify.app/, to verify before production.

DEPLOY
1. Extract this ZIP.
2. Upload the CONTENTS of this folder to the Netlify site sitetestv3.netlify.app (index.html must be at the deployment root).
3. Wait for the deploy to finish. If an old version still appears, hard-refresh or clear the site's cached data/service worker.

EXPECTED PRODUCT URL
  https://sitetestv3.netlify.app/product/14/product-title
On the final production deploy, the same route will use https://shhop.netlify.app/product/14/product-title. Product title slugs are generated from the Supabase listing title; the ID keeps each URL unique.

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
- Sitemap currently includes the homepage and jobs landing page; dynamic inclusion of every product/job URL is a separate SEO task.
- Never add a Supabase service-role key to frontend files.
