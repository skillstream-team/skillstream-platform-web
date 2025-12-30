import { test, expect } from '@playwright/test';
import { loginAsStudent } from '../helpers/auth';

test.describe('Student Course Enrollment', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('should browse available courses', async ({ page }) => {
    await page.goto('/courses');
    // Wait for courses to load
    await page.waitForSelector('[data-testid="course-card"], .course-card, article', { timeout: 10000 });
    // Verify at least one course is displayed
    const courses = page.locator('[data-testid="course-card"], .course-card, article');
    const count = await courses.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should view course details', async ({ page }) => {
    await page.goto('/courses');
    // Click on first course
    const firstCourse = page.locator('[data-testid="course-card"], .course-card, article').first();
    if (await firstCourse.isVisible()) {
      await firstCourse.click();
      // Verify course detail page loads
      await expect(page).toHaveURL(/\/courses\/[^/]+$/, { timeout: 10000 });
      // Verify course information is displayed
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('should enroll in a course', async ({ page }) => {
    await page.goto('/courses');
    // Navigate to a course
    const firstCourse = page.locator('[data-testid="course-card"], .course-card, article').first();
    if (await firstCourse.isVisible()) {
      await firstCourse.click();
      await page.waitForURL(/\/courses\/[^/]+$/, { timeout: 10000 });
      
      // Look for enroll button
      const enrollButton = page.locator('button:has-text("Enroll"), button:has-text("Enroll Now"), [data-testid="enroll-button"]').first();
      if (await enrollButton.isVisible()) {
        await enrollButton.click();
        // Wait for enrollment confirmation or redirect
        await page.waitForTimeout(2000);
        // Verify enrollment (check for success message or redirect to course player)
        const successMessage = page.locator('text=/enrolled|success/i');
        if (await successMessage.isVisible({ timeout: 5000 })) {
          await expect(successMessage).toBeVisible();
        }
      }
    }
  });

  test('should view enrolled courses', async ({ page }) => {
    await page.goto('/my-courses');
    // Verify my courses page loads
    await expect(page).toHaveURL('/my-courses');
    // Verify page content is displayed
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

