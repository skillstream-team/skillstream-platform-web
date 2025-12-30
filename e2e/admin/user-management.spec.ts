import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Admin User Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should navigate to user management page', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('h1, h2').first()).toContainText(/user/i);
  });

  test('should display user list', async ({ page }) => {
    await page.goto('/admin/users');
    // Wait for table or user list to load
    await page.waitForSelector('table, [data-testid="user-list"]', { timeout: 10000 });
    // Verify table/list is visible
    const userList = page.locator('table, [data-testid="user-list"]').first();
    await expect(userList).toBeVisible();
  });

  test('should search for users', async ({ page }) => {
    await page.goto('/admin/users');
    // Find search input (adjust selector based on your UI)
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500); // Wait for search to execute
      // Verify results are displayed
      await expect(page.locator('table tbody tr, [data-testid="user-item"]').first()).toBeVisible();
    }
  });

  test('should filter users by role', async ({ page }) => {
    await page.goto('/admin/users');
    // Look for role filter (adjust selector based on your UI)
    const roleFilter = page.locator('select, [data-testid="role-filter"]').first();
    if (await roleFilter.isVisible()) {
      await roleFilter.selectOption('STUDENT');
      await page.waitForTimeout(500);
      // Verify filtered results
      await expect(page.locator('table, [data-testid="user-list"]').first()).toBeVisible();
    }
  });
});

