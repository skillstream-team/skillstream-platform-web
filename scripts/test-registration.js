const { chromium } = require('/Users/stephenterera/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = `testuser.${Date.now()}@mailinator.com`;
const TEST_PASSWORD = 'TestPassword123!';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const supabaseReqs = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('response', async res => {
    if (res.url().includes('supabase')) {
      const path = res.url().split('?')[0].replace('https://ebxztvjtjwnymfoasdta.supabase.co', '');
      let body = '';
      try { body = await res.text(); } catch {}
      supabaseReqs.push({ status: res.status(), path, body: body.slice(0, 300) });
    }
  });

  try {
    // --- Clear storage ---
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });

    await page.waitForSelector('input[placeholder="Your full name"]', { timeout: 10000 });
    console.log('Register page ready\nEmail:', TEST_EMAIL);

    // --- Fill form ---
    await page.fill('input[placeholder="Your full name"]', 'Test User');
    await page.fill('input[placeholder="you@example.com"]', TEST_EMAIL);
    await page.fill('input[placeholder="Create a password"]', TEST_PASSWORD);
    await page.fill('input[placeholder="Confirm your password"]', TEST_PASSWORD);
    await page.check('input[type="checkbox"]');

    // Check button state
    const btnDisabled = await page.$eval('button:has-text("Create account")', b => b.disabled);
    console.log('Button disabled?', btnDisabled);

    // --- Submit ---
    await page.click('button:has-text("Create account")');
    console.log('Form submitted, waiting...');

    // Wait up to 20s for any outcome
    await page.waitForTimeout(20000);

    console.log('\nFinal URL:', page.url());

    // Check visible text on page
    const bodyText = await page.innerText('body').catch(() => '');
    const relevantText = bodyText.split('\n').filter(l => l.trim()).slice(0, 20).join('\n');
    console.log('\nPage content (first 20 lines):\n', relevantText);

    console.log('\n--- Supabase requests ---');
    supabaseReqs.forEach(r => console.log(`[${r.status}] ${r.path}\n  ${r.body}`));

    console.log('\n--- Browser errors ---');
    errors.forEach(e => console.log(' ', e));

  } catch (err) {
    console.error('\n[SCRIPT ERROR]', err.message);
    console.log('URL:', page.url());
    console.log('\n--- Supabase requests ---');
    supabaseReqs.forEach(r => console.log(`[${r.status}] ${r.path}\n  ${r.body}`));
    console.log('\n--- Browser errors ---');
    errors.forEach(e => console.log(' ', e));
  } finally {
    await browser.close();
  }
}

run();
