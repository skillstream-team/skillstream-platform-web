import { Page } from '@playwright/test';

/**
 * Login as admin user
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin', { timeout: 10000 });
}

/**
 * Login as teacher user
 */
export async function loginAsTeacher(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'teacher@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 10000 });
}

/**
 * Login as student user
 */
export async function loginAsStudent(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'student@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 10000 });
}

/**
 * Logout current user
 */
export async function logout(page: Page) {
  // Click on user menu (adjust selector based on your UI)
  await page.click('[data-testid="user-menu"]');
  await page.click('text=Logout');
  await page.waitForURL('/login', { timeout: 10000 });
}

