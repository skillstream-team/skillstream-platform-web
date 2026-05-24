import { expect, test } from '@playwright/test';

const TEACHER = { email: 'teacher@skillstream.demo', password: 'SkillStreamDemo123!' };

test.describe('Teacher hub', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.locator('input[type="email"]').fill(TEACHER.email);
    await page.locator('input[type="password"]').fill(TEACHER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('dashboard shows the workspace heading', async ({ page }) => {
    await expect(page.getByText(/lesson business|workspace/i)).toBeVisible();
  });

  test('can navigate to Classes page', async ({ page }) => {
    await page.goto('/classes');
    await expect(page).toHaveURL(/\/classes/);
    await expect(page.getByRole('heading', { name: /classes/i })).toBeVisible();
  });

  test('can navigate to Students page', async ({ page }) => {
    await page.goto('/students');
    await expect(page).toHaveURL(/\/students/);
  });

  test('can navigate to Schedule page', async ({ page }) => {
    await page.goto('/schedule');
    await expect(page).toHaveURL(/\/schedule/);
  });

  test('can navigate to Messages page', async ({ page }) => {
    await page.goto('/messages');
    await expect(page).toHaveURL(/\/messages/);
  });

  test('Payments page shows plan tiers', async ({ page }) => {
    await page.goto('/payments');
    await expect(page).toHaveURL(/\/payments/);
    await expect(page.getByText(/creator/i).first()).toBeVisible();
    await expect(page.getByText(/studio/i).first()).toBeVisible();
    await expect(page.getByText(/academy/i).first()).toBeVisible();
  });

  test('Payments page has promo code input', async ({ page }) => {
    await page.goto('/payments');
    await expect(page.getByPlaceholder(/promo code/i)).toBeVisible();
  });

  test('Settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings/);
  });

  test('class detail page is reachable', async ({ page }) => {
    await page.goto('/classes');
    // Class cards are <Link to="/class/:id"> — target by href pattern
    await page.locator('a[href*="/class/"]').first().click();
    await expect(page).toHaveURL(/\/class\//);
  });

  test('live session setup panel is visible on lesson live page', async ({ page }) => {
    await page.goto('/classes');
    await page.locator('a[href*="/class/"]').first().click();
    await expect(page).toHaveURL(/\/class\//);
    // Look for a live lesson link if the demo data has one
    const liveBtn = page.locator('a[href*="/live/"]').first();
    if (await liveBtn.count() > 0) {
      await liveBtn.click();
      await expect(page).toHaveURL(/\/live\//);
      await expect(page.getByText(/live session|start lesson|join lesson/i)).toBeVisible();
    }
  });
});
