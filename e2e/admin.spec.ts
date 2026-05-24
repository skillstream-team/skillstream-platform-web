import { expect, test } from '@playwright/test';

const ADMIN   = { email: 'admin@skillstream.demo',   password: 'SkillStreamDemo123!' };
const TEACHER = { email: 'teacher@skillstream.demo', password: 'SkillStreamDemo123!' };

async function loginAs(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.evaluate(() => localStorage.clear());
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Admin hub', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.password);
  });

  test('admin can navigate to /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
  });

  test('admin overview tab renders', async ({ page }) => {
    await page.goto('/admin');
    // Overview is default tab — look for any stat or heading
    await expect(page.locator('h2, h3').first()).toBeVisible();
  });

  test('billing tab shows plan tiers', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: 'Billing' }).click();
    await expect(page.getByText(/creator/i).first()).toBeVisible();
    await expect(page.getByText(/studio/i).first()).toBeVisible();
  });

  test('platform currency section is visible on billing tab', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: 'Billing' }).click();
    await expect(page.getByText('Platform currency')).toBeVisible();
  });

  test('currency select contains common currency codes', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: 'Billing' }).click();
    // The currency <select> is inside the platform currency card
    const currencySection = page.locator('section, div').filter({ hasText: 'Platform currency' }).first();
    const select = currencySection.locator('select').first();
    await expect(select).toBeVisible();
    const options = await select.locator('option').allTextContents();
    expect(options.some((o) => o.includes('USD'))).toBe(true);
    expect(options.some((o) => o.includes('EUR'))).toBe(true);
    expect(options.some((o) => o.includes('GBP'))).toBe(true);
  });
});

test.describe('Role protection', () => {
  test('teacher cannot access /admin — redirected away', async ({ page }) => {
    await loginAs(page, TEACHER.email, TEACHER.password);
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/\/admin$/);
  });
});
