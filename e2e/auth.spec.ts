import { expect, test } from '@playwright/test';

const TEACHER = { email: 'teacher@skillstream.demo', password: 'SkillStreamDemo123!' };
const STUDENT = { email: 'student@skillstream.demo', password: 'SkillStreamDemo123!' };
const ADMIN   = { email: 'admin@skillstream.demo',   password: 'SkillStreamDemo123!' };

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
  });

  test('landing page loads and has a title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SkillStream/i);
  });

  test('unauthenticated user is redirected from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('teacher demo login lands on dashboard', async ({ page }) => {
    await login(page, TEACHER.email, TEACHER.password);
    await expect(page).toHaveURL(/\/dashboard/);
    // Layout sidebar shows user name
    await expect(page.getByText('Demo Teacher')).toBeVisible();
  });

  test('student demo login lands on dashboard', async ({ page }) => {
    await login(page, STUDENT.email, STUDENT.password);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Demo Student')).toBeVisible();
  });

  test('admin demo login lands on dashboard', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Demo Admin')).toBeVisible();
  });

  test('wrong password stays on login page', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(TEACHER.email);
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Wrong credentials must never redirect to dashboard regardless of Supabase config
    await expect(page).toHaveURL(/\/login/);
  });

  test('logout clears session and redirects to login', async ({ page }) => {
    await login(page, TEACHER.email, TEACHER.password);
    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
