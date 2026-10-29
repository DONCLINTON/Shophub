import fs from 'node:fs/promises';

const SITE = 'https://shhop.netlify.app';
const html = await fs.readFile(new URL('../index.html', import.meta.url), 'utf8');
const urlMatch = html.match(/const\s+SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = html.match(/const\s+SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
if (!urlMatch || !keyMatch) throw new Error('Could not find SUPABASE_URL and SUPABASE_ANON_KEY in index.html');
const supabaseUrl = urlMatch[1].replace(/\/$/, '');
const anonKey = keyMatch[1];

function slug(value) {
  return String(value || 'listing').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 75) || 'listing';
}
function xmlEscape(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
async function fetchAll(table, select) {
  const rows = [];
  for (let start = 0; ; start += 1000) {
    const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
    url.searchParams.set('select', select);
    url.searchParams.set('order', 'id.asc');
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
function add(path, priority = '0.7', changefreq = 'weekly') {
  urls.set(`${SITE}${path}`, { priority, changefreq });
}
add('/', '1.0', 'daily');
add('/jobs', '0.8', 'daily');

const listings = await fetchAll('listings', 'id,title');
for (const item of listings) {
  if (item.id == null) continue;
  add(`/product/${encodeURIComponent(item.id)}/${slug(item.title)}`, '0.8', 'daily');
}
if (listings.length === 0) {
  throw new Error('Supabase returned zero listings. Refusing to overwrite sitemap.xml; check public SELECT/RLS access and the listings table.');
}
console.log(`Added ${listings.length} product URLs.`);

// Jobs are optional: include them when the public jobs table/schema is available.
try {
  const jobs = await fetchAll('jobs', 'id,title');
  for (const job of jobs) {
    if (job.id == null) continue;
    add(`/jobs/${encodeURIComponent(job.id)}/${slug(job.title)}`, '0.7', 'weekly');
  }
  console.log(`Added ${jobs.length} job URLs.`);
} catch (error) {
  console.warn(`Skipping individual job URLs: ${error.message}`);
}

const body = [...urls.entries()].map(([loc, meta]) => `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    <changefreq>${meta.changefreq}</changefreq>\n    <priority>${meta.priority}</priority>\n  </url>`).join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
await fs.writeFile(new URL('../sitemap.xml', import.meta.url), sitemap, 'utf8');
console.log(`Wrote sitemap.xml with ${urls.size} unique URLs.`);
