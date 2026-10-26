/* Temporary: proves the auto-refresh system updates screens without reload. */
import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Users/oseas/AppData/Local/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173';

const results = [];
const check = (name, cond, extra = '') => {
  results.push({ name, pass: !!cond, extra });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' :: ' + extra : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Stateful mock server data */
let announcements = [
  { id: 1, title: 'Announcement A', content: 'First item', status: 'published', published_at: '2026-01-01T00:00:00Z' },
];
let annGetCount = 0;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const pageErrors = [];
const consoleErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e.message || e)));
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});

await page.setRequestInterception(true);
page.on('request', (req) => {
  const url = req.url();
  if (!url.includes('/api/')) return req.continue();
  let path = '';
  try {
    path = new URL(url).pathname.replace(/^.*?\/api/, '');
  } catch { /* ignore */ }
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization, Accept',
  };
  if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: cors, body: '' });

  let body = { success: true, data: [] };
  if (path === '/auth/user') {
    body = { success: true, data: { id: 1, name: 'Test Admin', email: 'a@b.c', role: 'admin' } };
  } else if (path === '/admin/announcements') {
    annGetCount += 1;
    body = { success: true, data: announcements };
  } else if (req.method() !== 'GET') {
    body = { success: true, message: 'created' };
  }
  return req.respond({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(body) });
});

await page.evaluateOnNewDocument(() => localStorage.setItem('token', 't'));
await page.goto(BASE + '/admin/announcements', { waitUntil: 'networkidle0' });
await sleep(800);

const bodyText = () => page.evaluate(() => document.body.innerText);
const getCount = () => annGetCount;

/* 1. Initial render */
const t1 = await bodyText();
check('initial list shows Announcement A', t1.includes('Announcement A'));
const baselineGets = getCount();
await page.evaluate(() => { window.__marker = 'no-reload'; });

/* 2. Mutation through the shared client (as any admin action does) while
      another screen's data (announcements) is mounted -> auto reload. */
announcements = [
  ...announcements,
  { id: 2, title: 'Announcement B', content: 'Second item', status: 'published', published_at: '2026-01-02T00:00:00Z' },
];
await page.evaluate(async () => {
  const mod = await import('/src/services/api.js');
  await mod.default.post('/admin/staff', { name: 'New Staff', staff_role: 'staff' });
});
await sleep(900);
const t2 = await bodyText();
check('GET re-issued automatically after mutation', getCount() > baselineGets, `gets ${baselineGets} -> ${getCount()}`);
check('new item appeared WITHOUT reload (Announcement B)', t2.includes('Announcement B'));
check('page instance preserved (no reload)', await page.evaluate(() => window.__marker === 'no-reload'));

/* 3. Keep-alive: navigate away (SPA), mutate, list refreshes while unmounted-but-mounted */
await page.evaluate(() => { window.__nav = 'staff'; });
const annGetsBeforeNav = getCount();
const navOk = await page.evaluate(async () => {
  const a = document.querySelector('a[href="/admin/staff"]');
  if (!a) return false;
  a.click();
  return true;
});
await sleep(900);
check('SPA navigation to /admin/staff', navOk && page.url().includes('/admin/staff'), page.url());

announcements = [...announcements, { id: 3, title: 'Announcement C', content: 'Third', status: 'published', published_at: '2026-01-03T00:00:00Z' }];
await page.evaluate(async () => {
  const mod = await import('/src/services/api.js');
  await mod.default.post('/admin/announcements', { title: 'Announcement C' });
});
await sleep(900);
check(
  'cached announcements screen refetched in background while on another page',
  getCount() > annGetsBeforeNav,
  `gets ${annGetsBeforeNav} -> ${getCount()}`
);

/* navigate back — C must be visible without any reload */
const backOk = await page.evaluate(() => {
  const a = document.querySelector('a[href="/admin/announcements"]');
  if (!a) return false;
  a.click();
  return true;
});
await sleep(900);
const t3 = await bodyText();
check('SPA navigation back to announcements', backOk && page.url().includes('/admin/announcements'));
check('returning screen shows latest data (Announcement C)', t3.includes('Announcement C'));
check('page instance STILL preserved', await page.evaluate(() => window.__marker === 'no-reload'));

/* 4. Tab visibility -> re-sync */
const annGetsBeforeVis = getCount();
announcements = [...announcements, { id: 4, title: 'Announcement D', content: 'Fourth', status: 'published', published_at: '2026-01-04T00:00:00Z' }];
await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
await sleep(900);
const t4 = await bodyText();
check('tab-return event re-syncs data (Announcement D)', t4.includes('Announcement D') && getCount() > annGetsBeforeVis, `gets ${annGetsBeforeVis} -> ${getCount()}`);

/* 5. Errors */
const realConsole = consoleErrors.filter((t) => !/favicon|Failed to load resource|net::ERR_ABORTED|404/i.test(t));
check('no uncaught page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
check('no unexpected console errors', realConsole.length === 0, realConsole.slice(0, 3).join(' | '));

const failed = results.filter((r) => !r.pass);
console.log(`\n===== ${results.length - failed.length}/${results.length} checks passed =====`);
failed.forEach((f) => console.log('  FAIL: ' + f.name + (f.extra ? ' :: ' + f.extra : '')));

await browser.close();
process.exit(failed.length ? 1 : 0);
