import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://shhop.netlify.app';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');
const urlMatch = html.match(/const\s+SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = html.match(/const\s+SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
if (!urlMatch || !keyMatch) throw new Error('Could not find SUPABASE_URL and SUPABASE_ANON_KEY in index.html');
const supabaseUrl = urlMatch[1].replace(/\/$/, '');
const anonKey = keyMatch[1];

function slug(value) {
  return String(value || 'listing').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 75) || 'listing';
}
function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function xmlEscape(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function photoList(value) {
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { value = value ? [value] : []; } }
  return Array.isArray(value) ? value.filter(x => typeof x === 'string' && /^https?:\/\//i.test(x)) : [];
}
async function fetchAll(table, select, filters = {}) {
  const rows = [];
  for (let start = 0; ; start += 1000) {
    const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
    url.searchParams.set('select', select);
    url.searchParams.set('order', 'id.asc');
    for (const [key, value] of Object.entries(filters)) url.searchParams.set(key, value);
    const response = await fetch(url, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, Range: `${start}-${start + 999}`, Prefer: 'count=none' }
    });
    if (!response.ok) throw new Error(`${table} query failed (${response.status}): ${await response.text()}`);
    const page = await response.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

const urls = new Map();
function add(pathname, priority = '0.7', changefreq = 'weekly', image = null) {
  const loc = `${SITE}${pathname}`;
  urls.set(loc, { priority, changefreq, image });
}
add('/', '1.0', 'daily');
add('/jobs', '0.8', 'daily');
add('/brokerage/', '0.9', 'daily');

const listings = await fetchAll('listings', 'id,title');
for (const item of listings) {
  if (item.id == null) continue;
  add(`/product/${encodeURIComponent(item.id)}/${slug(item.title)}`, '0.8', 'daily');
}
if (listings.length === 0) throw new Error('Supabase returned zero listings. Refusing to overwrite sitemap.xml; check public SELECT/RLS access and the listings table.');
console.log(`Added ${listings.length} product URLs.`);

try {
  const jobs = await fetchAll('jobs', 'id,title');
  for (const job of jobs) if (job.id != null) add(`/jobs/${encodeURIComponent(job.id)}/${slug(job.title)}`, '0.7', 'weekly');
  console.log(`Added ${jobs.length} job URLs.`);
} catch (error) { console.warn(`Skipping individual job URLs: ${error.message}`); }

// Publish crawlable, server-delivered HTML detail pages for every active rental.
// The brokerage directory remains the canonical discovery hub for the category.
const rentals = await fetchAll('house_rentals', 'id,house_type,neighbourhood,monthly_rent,advertiser_type,contact_name,phone,image_urls,description,landmarks,status,created_at', { status: 'eq.active' });
const generatedRoot = path.join(ROOT, 'rentals');
await fs.rm(generatedRoot, { recursive: true, force: true });
await fs.mkdir(generatedRoot, { recursive: true });
await fs.writeFile(path.join(generatedRoot, '.gitkeep'), '', 'utf8');
for (const rental of rentals) {
  if (rental.id == null) continue;
  const title = `${rental.house_type || 'Rental'} in ${rental.neighbourhood || 'Uganda'} | ShopHub`;
  const description = `${rental.house_type || 'Rental property'} available in ${rental.neighbourhood || 'Uganda'} for UGX ${Number(rental.monthly_rent || 0).toLocaleString('en-UG')}/month. Contact the advertiser directly on ShopHub.`.slice(0, 300);
  const photos = photoList(rental.image_urls);
  const pathname = `/rentals/${encodeURIComponent(rental.id)}/${slug(`${rental.house_type}-${rental.neighbourhood}`)}/`;
  const canonical = `${SITE}${pathname}`;
  const imageMarkup = photos.map((src, index) => `<img src="${esc(src)}" alt="${esc(rental.house_type)} in ${esc(rental.neighbourhood)} - photo ${index + 1}" loading="${index ? 'lazy' : 'eager'}">`).join('\n');
  const phoneDigits = String(rental.phone || '').replace(/\D/g, '');
  const whatsapp = phoneDigits ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hello, I saw your ${rental.house_type || 'rental'} in ${rental.neighbourhood || ''} on ShopHub. Is it still available?`)}` : '';
  const schema = {
    '@context': 'https://schema.org', '@type': 'WebPage', name: title, description,
    url: canonical, ...(photos[0] ? { primaryImageOfPage: photos[0] } : {}),
    mainEntity: {
      '@type': 'Offer', price: Number(rental.monthly_rent || 0), priceCurrency: 'UGX', availability: 'https://schema.org/InStock',
      itemOffered: { '@type': 'Accommodation', name: `${rental.house_type || 'Rental'} - ${rental.neighbourhood || 'Uganda'}`, description: rental.description || description, address: { '@type': 'PostalAddress', addressLocality: rental.neighbourhood || 'Uganda', addressCountry: 'UG' } }
    }
  };
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">${photos[0] ? `<meta property="og:image" content="${esc(photos[0])}">` : ''}<meta property="og:url" content="${esc(canonical)}"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script><style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:0;background:#f8fafc;color:#0f172a}.wrap{max-width:900px;margin:auto;padding:24px}.brand{font-weight:900;color:#047857;text-decoration:none}.panel{background:white;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;margin-top:20px}.photos{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:6px;background:#e2e8f0}.photos img{width:100%;height:260px;object-fit:contain;background:#f1f5f9}.content{padding:24px}.price{font-size:25px;font-weight:900;color:#047857}.btn{display:inline-block;padding:13px 18px;border-radius:12px;color:white;text-decoration:none;font-weight:800;margin:8px 8px 0 0}.call{background:#2563eb}.wa{background:#16a34a}.back{color:#047857;font-weight:800;text-decoration:none}.muted{color:#64748b;font-size:14px;line-height:1.6}</style></head><body><main class="wrap"><a class="brand" href="/">SHOPHUB UGANDA</a><section class="panel">${photos.length ? `<div class="photos">${imageMarkup}</div>` : ''}<div class="content"><p class="muted">PROPERTY & RENTALS · UGANDA</p><h1>${esc(rental.house_type || 'Rental')} in ${esc(rental.neighbourhood || 'Uganda')}</h1><p class="price">UGX ${Number(rental.monthly_rent || 0).toLocaleString('en-UG')} / month</p><p>${esc(rental.description || 'Contact the advertiser for more information about this property.')}</p>${rental.landmarks ? `<p><b>Nearby landmark:</b> ${esc(rental.landmarks)}</p>` : ''}<p class="muted">Advertised by ${esc(rental.contact_name || rental.advertiser_type || 'ShopHub advertiser')} · ${esc(rental.advertiser_type || 'Advertiser')}</p>${phoneDigits ? `<a class="btn call" href="tel:+${phoneDigits}">Call advertiser</a>` : ''}${whatsapp ? `<a class="btn wa" href="${esc(whatsapp)}" rel="noopener">WhatsApp advertiser</a>` : ''}<p class="muted">Contact the advertiser directly to confirm availability, inspect the property and agree on terms. ShopHub does not process payments.</p><p><a class="back" href="/brokerage/">← Browse all ShopHub rentals</a></p></div></section></main></body></html>`;
  const outDir = path.join(generatedRoot, String(rental.id), slug(`${rental.house_type}-${rental.neighbourhood}`));
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'index.html'), page, 'utf8');
  add(pathname, '0.8', 'daily', photos[0] || null);
}
console.log(`Generated ${rentals.length} crawlable rental detail pages.`);

const body = [...urls.entries()].map(([loc, meta]) => {
  const image = meta.image ? `\n    <image:image><image:loc>${xmlEscape(meta.image)}</image:loc></image:image>` : '';
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    <changefreq>${meta.changefreq}</changefreq>\n    <priority>${meta.priority}</priority>${image}\n  </url>`;
}).join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`;
await fs.writeFile(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
console.log(`Wrote sitemap.xml with ${urls.size} unique URLs.`);
