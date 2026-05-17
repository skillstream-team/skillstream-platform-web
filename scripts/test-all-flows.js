const { chromium } = require('/Users/stephenterera/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const BASE_URL = 'http://localhost:3000';
const REGISTERED_EMAIL = `flowtest.${Date.now()}@mailinator.com`;
const REGISTERED_PASSWORD = 'TestPassword123!';

let browser, context, page;
let passed = 0, failed = 0;

function log(msg) { console.log(msg); }
function ok(label) { console.log(`  ✓ ${label}`); passed++; }
function fail(label, reason) { console.log(`  ✗ ${label}: ${reason}`); failed++; }

async function clearAndGo(url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
}

async function waitForUrl(pattern, timeout = 20000) {
  await page.waitForURL(u => u.toString().includes(pattern), { timeout });
}

// ─── FLOW 1: Register new student ───────────────────────────────────────────
async function testRegister() {
  log('\n═══ FLOW 1: Register new student ═══');
  await clearAndGo(`${BASE_URL}/register`);
  await page.waitForSelector('input[placeholder="Your full name"]', { timeout: 10000 });

  await page.fill('input[placeholder="Your full name"]', 'Flow Test User');
  await page.fill('input[placeholder="you@example.com"]', REGISTERED_EMAIL);
  await page.fill('input[placeholder="Create a password"]', REGISTERED_PASSWORD);
  await page.fill('input[placeholder="Confirm your password"]', REGISTERED_PASSWORD);
  await page.check('input[type="checkbox"]');
  await page.click('button:has-text("Create account")');

  try {
    await waitForUrl('/dashboard');
    ok('Redirected to dashboard after registration');
    const name = await page.textContent('body').catch(() => '');
    if (name.includes('Flow Test User')) ok('User name shown on dashboard');
    else fail('User name on dashboard', 'name not found in page');
  } catch {
    const err = await page.$eval('[class*="error"], [class*="Error"]', e => e.textContent).catch(() => 'no error element');
    fail('Registration redirect', err);
  }
}

// ─── FLOW 2: Sign out ────────────────────────────────────────────────────────
async function testSignOut() {
  log('\n═══ FLOW 2: Sign out ═══');
  try {
    await page.click('button:has-text("Sign out")');
    await waitForUrl('/login');
    ok('Signed out and redirected to login');
  } catch (e) {
    fail('Sign out', e.message);
  }
}

// ─── FLOW 3: Login with registered account ───────────────────────────────────
async function testLogin() {
  log('\n═══ FLOW 3: Login with registered account ═══');
  await clearAndGo(`${BASE_URL}/login`);
  const currentUrl = page.url();
  log('  URL after goto: ' + currentUrl);
  const snippet = (await page.innerText('body').catch(() => '')).split('\n').filter(l => l.trim()).slice(0, 5).join(' | ');
  log('  Page content: ' + snippet);
  await page.waitForSelector('input[placeholder="you@example.com"]', { timeout: 15000 });

  await page.fill('input[placeholder="you@example.com"]', REGISTERED_EMAIL);
  await page.fill('input[type="password"]', REGISTERED_PASSWORD);
  await page.click('button:has-text("Sign in")');

  try {
    await waitForUrl('/dashboard');
    ok('Login successful, redirected to dashboard');
  } catch {
    const err = await page.$eval('[class*="error"]', e => e.textContent).catch(() => 'timeout');
    fail('Login redirect', err);
  }
}

// ─── FLOW 4: Demo teacher login ──────────────────────────────────────────────
async function testDemoTeacher() {
  log('\n═══ FLOW 4: Demo teacher login ═══');
  await clearAndGo(`${BASE_URL}/login`);
  await page.waitForSelector('input[placeholder="you@example.com"]', { timeout: 15000 });

  await page.fill('input[placeholder="you@example.com"]', 'teacher@skillstream.demo');
  await page.fill('input[type="password"]', 'SkillStreamDemo123!');
  await page.click('button:has-text("Sign in")');

  try {
    await waitForUrl('/dashboard');
    ok('Demo teacher login successful');
    const body = await page.innerText('body');
    if (body.includes('Demo Teacher') || body.includes('teacher')) ok('Teacher UI visible');
  } catch (e) {
    fail('Demo teacher login', e.message);
  }
}

// ─── FLOW 5: Demo student login ──────────────────────────────────────────────
async function testDemoStudent() {
  log('\n═══ FLOW 5: Demo student login ═══');
  await clearAndGo(`${BASE_URL}/login`);
  await page.waitForSelector('input[placeholder="you@example.com"]', { timeout: 15000 });

  await page.fill('input[placeholder="you@example.com"]', 'student@skillstream.demo');
  await page.fill('input[type="password"]', 'SkillStreamDemo123!');
  await page.click('button:has-text("Sign in")');

  try {
    await waitForUrl('/dashboard');
    ok('Demo student login successful');
  } catch (e) {
    fail('Demo student login', e.message);
  }
}

// ─── FLOW 6: Demo admin login ────────────────────────────────────────────────
async function testDemoAdmin() {
  log('\n═══ FLOW 6: Demo admin login ═══');
  await clearAndGo(`${BASE_URL}/login`);
  await page.waitForSelector('input[placeholder="you@example.com"]', { timeout: 15000 });

  await page.fill('input[placeholder="you@example.com"]', 'admin@skillstream.demo');
  await page.fill('input[type="password"]', 'SkillStreamDemo123!');
  await page.click('button:has-text("Sign in")');

  try {
    await waitForUrl('/dashboard');
    ok('Demo admin login successful');
  } catch (e) {
    fail('Demo admin login', e.message);
  }
}

// ─── FLOW 7: Protected route redirect ───────────────────────────────────────
async function testProtectedRoute() {
  log('\n═══ FLOW 7: Protected route redirect (unauthenticated) ═══');
  await clearAndGo(`${BASE_URL}/login`);
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  const url = page.url();
  if (url.includes('/login') || url.includes('/learn')) {
    ok('Unauthenticated user redirected from /dashboard');
  } else {
    fail('Protected route guard', `still on ${url}`);
  }
}

// ─── FLOW 8: Wrong password shows error ─────────────────────────────────────
async function testWrongPassword() {
  log('\n═══ FLOW 8: Wrong password error ═══');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('input[placeholder="you@example.com"]', { timeout: 15000 });

  await page.fill('input[placeholder="you@example.com"]', REGISTERED_EMAIL);
  await page.fill('input[type="password"]', 'WrongPassword999!');
  await page.click('button:has-text("Sign in")');
  await page.waitForTimeout(4000);

  const url = page.url();
  if (url.includes('/login')) {
    ok('Stayed on login with wrong password');
    const body = await page.innerText('body');
    if (body.toLowerCase().includes('invalid') || body.toLowerCase().includes('incorrect') || body.toLowerCase().includes('password')) {
      ok('Error message shown');
    } else {
      fail('Error message', 'no error text found');
    }
  } else {
    fail('Wrong password guard', `redirected to ${url}`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext();
  page = await context.newPage();

  page.on('pageerror', e => console.log('  [PAGE ERROR]', e.message));

  try {
    await testRegister();
    await testSignOut();
    await testLogin();
    await testSignOut();
    await testDemoTeacher();
    await testSignOut();
    await testDemoStudent();
    await testSignOut();
    await testDemoAdmin();
    await testSignOut();
    await testProtectedRoute();
    await testWrongPassword();
  } finally {
    await browser.close();
    log(`\n═══════════════════════════════`);
    log(`Results: ${passed} passed, ${failed} failed`);
    log(`═══════════════════════════════`);
    if (failed > 0) process.exit(1);
  }
}

main();
