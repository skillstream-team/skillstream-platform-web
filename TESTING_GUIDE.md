# SkillStream Testing Guide

This guide provides comprehensive testing strategies for all user roles (Admin, Teacher, Student) in the SkillStream platform.

## Table of Contents
1. [Quick Start Testing](#quick-start-testing)
2. [Manual Testing Checklists](#manual-testing-checklists)
3. [Automated Testing Setup](#automated-testing-setup)
4. [E2E Testing Strategy](#e2e-testing-strategy)
5. [API Testing](#api-testing)
6. [Browser Testing Matrix](#browser-testing-matrix)

---

## Quick Start Testing

### Prerequisites
1. **Backend API running** - Ensure your backend server is running and accessible
2. **Test Accounts** - Create test accounts for each role:
   - Admin: `admin@test.com` / `password123`
   - Teacher: `teacher@test.com` / `password123`
   - Student: `student@test.com` / `password123`

### Quick Test Flow
```bash
# 1. Start the development server
npm run dev

# 2. Test in different browsers/incognito windows:
# - Chrome: Regular window (Admin)
# - Chrome: Incognito (Teacher)
# - Firefox: Regular window (Student)
```

---

## Manual Testing Checklists

### 🔴 ADMIN ROLE TESTING

#### Authentication & Access
- [ ] Login with admin credentials
- [ ] Verify redirect to `/admin` dashboard
- [ ] Verify admin sidebar navigation appears
- [ ] Verify all admin routes are accessible
- [ ] Verify non-admin routes redirect properly
- [ ] Logout functionality works

#### Admin Dashboard (`/admin`)
- [ ] Dashboard loads without errors
- [ ] Statistics/metrics display correctly
- [ ] Charts and graphs render properly
- [ ] Recent activity shows correctly
- [ ] Quick actions work

#### User Management (`/admin/users`)
- [ ] User list loads and displays correctly
- [ ] Search functionality works
- [ ] Filter by role works (STUDENT, TEACHER, ADMIN)
- [ ] Create new user
- [ ] Edit user details
- [ ] Delete user (with confirmation)
- [ ] View user profile/details
- [ ] Bulk operations (if implemented)
- [ ] User import/export functionality

#### Course Moderation (`/admin/courses`)
- [ ] View all courses (published and unpublished)
- [ ] Filter courses by status
- [ ] Approve/reject courses
- [ ] Edit course details
- [ ] Delete courses
- [ ] View course analytics
- [ ] Moderate course content

#### Categories (`/admin/categories`)
- [ ] View all categories
- [ ] Create new category
- [ ] Edit category
- [ ] Delete category
- [ ] Reorder categories (if applicable)

#### Tags (`/admin/tags`)
- [ ] View all tags
- [ ] Create new tag
- [ ] Edit tag
- [ ] Delete tag
- [ ] Tag usage statistics

#### Payouts (`/admin/payouts`)
- [ ] View pending payouts
- [ ] View payout history
- [ ] Process payouts
- [ ] Filter by teacher/date
- [ ] Export payout reports

#### Bulk Operations (`/admin/bulk`)
- [ ] Bulk user operations
- [ ] Bulk course operations
- [ ] Bulk enrollment operations
- [ ] Verify confirmation dialogs

#### Broadcasts (`/admin/broadcasts`)
- [ ] Create broadcast message
- [ ] Send to all users
- [ ] Send to specific roles
- [ ] View broadcast history
- [ ] Edit/delete broadcasts

#### Activity Logs (`/admin/logs`)
- [ ] View activity logs
- [ ] Filter by user/action/date
- [ ] Export logs
- [ ] Search functionality

#### User Import/Export (`/admin/user-import`)
- [ ] Import users from CSV/Excel
- [ ] Validate import data
- [ ] Export users to CSV/Excel
- [ ] Handle import errors

#### Coupons (`/admin/coupons`)
- [ ] Create coupon
- [ ] Edit coupon
- [ ] Delete coupon
- [ ] View coupon usage
- [ ] Set expiration dates
- [ ] Set usage limits

#### Reviews (`/admin/reviews`)
- [ ] View all reviews
- [ ] Moderate reviews (approve/reject)
- [ ] Delete inappropriate reviews
- [ ] Filter by course/rating

#### Certificates (`/admin/certificates`)
- [ ] View all certificates
- [ ] Create certificate template
- [ ] Edit certificate template
- [ ] Issue certificates manually
- [ ] Revoke certificates

#### Announcements (`/admin/announcements`)
- [ ] Create announcement
- [ ] Edit announcement
- [ ] Delete announcement
- [ ] Set visibility (all users/specific roles)
- [ ] Schedule announcements

#### Content Reports (`/admin/reports`)
- [ ] View content reports
- [ ] Handle reported content
- [ ] Filter by type/status
- [ ] Take action on reports

#### Analytics (`/admin/analytics`)
- [ ] View platform analytics
- [ ] User growth metrics
- [ ] Course performance metrics
- [ ] Revenue analytics
- [ ] Export reports

#### System Settings (`/admin/settings`)
- [ ] General settings
- [ ] Email settings
- [ ] Payment settings
- [ ] Feature toggles
- [ ] Maintenance mode
- [ ] Save changes

#### Import Courses (`/courses/import`)
- [ ] Import courses from external source
- [ ] Validate imported courses
- [ ] Map course data
- [ ] Handle import errors

---

### 🟡 TEACHER ROLE TESTING

#### Authentication & Access
- [ ] Login with teacher credentials
- [ ] Verify redirect to dashboard
- [ ] Verify teacher sidebar navigation
- [ ] Verify teacher-only routes accessible
- [ ] Verify admin routes redirect properly
- [ ] Logout functionality

#### Dashboard (`/`)
- [ ] Dashboard loads correctly
- [ ] Teaching statistics display
- [ ] Recent students/courses shown
- [ ] Quick actions available

#### Courses (`/courses`)
- [ ] View all my courses
- [ ] Create new course
- [ ] Edit course details
- [ ] Delete course (with confirmation)
- [ ] Publish/unpublish course
- [ ] View course analytics

#### Course Builder (`/courses/:courseId/builder`)
- [ ] Add lessons to course
- [ ] Reorder lessons (drag & drop)
- [ ] Edit lesson details
- [ ] Delete lessons
- [ ] Add quizzes/assignments
- [ ] Set course prerequisites
- [ ] Save course structure

#### Lesson Editor (`/courses/:courseId/lessons/:lessonId/edit`)
- [ ] Create new lesson
- [ ] Edit lesson content
- [ ] Add video content
- [ ] Add attachments
- [ ] Set lesson duration
- [ ] Mark lesson as free/premium
- [ ] Save lesson

#### Students (`/students`)
- [ ] View enrolled students
- [ ] Search students
- [ ] View student profiles
- [ ] View student progress
- [ ] Send message to student

#### Enrollments (`/students/enrollments`)
- [ ] View all enrollments
- [ ] Filter by course/status
- [ ] Approve/reject enrollments
- [ ] View enrollment details

#### Earnings (`/earnings`)
- [ ] View earnings dashboard
- [ ] View payout history
- [ ] Filter by date range
- [ ] View earnings breakdown by course
- [ ] Request payout (if applicable)

#### Messages (`/messages`)
- [ ] View conversations
- [ ] Start new conversation
- [ ] Send messages
- [ ] Receive messages
- [ ] Delete conversations
- [ ] Search conversations

#### Reviews (`/reviews`)
- [ ] View course reviews
- [ ] Respond to reviews
- [ ] Filter by rating
- [ ] View review analytics

#### Settings (`/settings`)
- [ ] Update profile
- [ ] Change password
- [ ] Update payment information
- [ ] Notification preferences
- [ ] Account settings

#### Schedule Lesson (`/lessons/new`)
- [ ] Create new lesson session
- [ ] Set date/time
- [ ] Select students
- [ ] Set lesson type
- [ ] Save lesson

#### Upcoming Lessons (`/lessons/upcoming`)
- [ ] View upcoming lessons
- [ ] Filter by date
- [ ] Cancel lessons
- [ ] Reschedule lessons
- [ ] View lesson details

#### Lessons Calendar (`/lessons/calendar`)
- [ ] View calendar view
- [ ] Navigate months
- [ ] Click on lessons for details
- [ ] Create lesson from calendar

#### Grading Book (`/courses/:courseId/grading`)
- [ ] View student submissions
- [ ] Grade assignments
- [ ] Provide feedback
- [ ] View grading history
- [ ] Export grades

#### Course Activity (`/courses/:courseId/activity`)
- [ ] View student activity
- [ ] View completion rates
- [ ] View engagement metrics
- [ ] Export activity reports

#### Course QA (`/courses/:courseId/qa`)
- [ ] View student questions
- [ ] Answer questions
- [ ] Mark questions as resolved
- [ ] Filter by status

#### Announcements (`/courses/:courseId/announcements`)
- [ ] Create announcement
- [ ] Edit announcement
- [ ] Delete announcement
- [ ] View announcement history

#### Whiteboard Editor (`/courses/:courseId/whiteboard/:whiteboardId`)
- [ ] Create whiteboard
- [ ] Draw on whiteboard
- [ ] Share whiteboard
- [ ] Save whiteboard
- [ ] Export whiteboard

---

### 🟢 STUDENT ROLE TESTING

#### Authentication & Access
- [ ] Register new account
- [ ] Login with student credentials
- [ ] Verify redirect to student dashboard
- [ ] Verify student sidebar navigation
- [ ] Verify student-only routes accessible
- [ ] Verify teacher/admin routes redirect properly
- [ ] Logout functionality

#### Student Dashboard (`/`)
- [ ] Dashboard loads correctly
- [ ] Enrolled courses display
- [ ] Progress overview
- [ ] Upcoming lessons
- [ ] Recommended courses
- [ ] Recent activity

#### My Courses (`/my-courses`)
- [ ] View all enrolled courses
- [ ] Filter by status (enrolled/in-progress/completed)
- [ ] View course progress
- [ ] Continue learning button works
- [ ] Course cards display correctly

#### Browse Courses (`/courses`)
- [ ] View available courses
- [ ] Search courses
- [ ] Filter by category
- [ ] Filter by price (free/paid)
- [ ] Sort courses
- [ ] View course details

#### Course Detail (`/courses/:courseId`)
- [ ] View course information
- [ ] View course curriculum
- [ ] View instructor info
- [ ] View reviews
- [ ] Enroll in course
- [ ] Add to wishlist (if applicable)

#### Course Player (`/courses/:courseId/learn`)
- [ ] Navigate through lessons
- [ ] Play video content
- [ ] Complete lessons
- [ ] Mark lessons as complete
- [ ] Take quizzes
- [ ] Submit assignments
- [ ] Download resources
- [ ] View lesson notes

#### Learning Paths (`/learning-paths`)
- [ ] View available learning paths
- [ ] Enroll in learning path
- [ ] View path progress
- [ ] Navigate path courses
- [ ] Complete learning path

#### My Certificates (`/certificates`)
- [ ] View earned certificates
- [ ] Download certificates
- [ ] Share certificates
- [ ] View certificate details

#### Learning Analytics (`/analytics`)
- [ ] View learning statistics
- [ ] View time spent learning
- [ ] View completion rates
- [ ] View achievement badges
- [ ] View progress charts

#### Study Goals (`/goals`)
- [ ] Create study goal
- [ ] Edit study goal
- [ ] Delete study goal
- [ ] Track goal progress
- [ ] View goal history

#### Upcoming Lessons (`/lessons/upcoming`)
- [ ] View scheduled lessons
- [ ] Join lesson (if applicable)
- [ ] Cancel lesson attendance
- [ ] View lesson details

#### Lessons Calendar (`/lessons/calendar`)
- [ ] View calendar
- [ ] See scheduled lessons
- [ ] Click for lesson details

#### Messages (`/messages`)
- [ ] View conversations
- [ ] Start conversation with teacher
- [ ] Send messages
- [ ] Receive messages
- [ ] Delete conversations

#### Settings (`/settings`)
- [ ] Update profile
- [ ] Change password
- [ ] Update payment method
- [ ] Notification preferences
- [ ] Privacy settings
- [ ] Account deletion

#### Course QA (`/courses/:courseId/qa`)
- [ ] View questions and answers
- [ ] Ask question
- [ ] Upvote helpful answers
- [ ] Mark answer as helpful

---

## Automated Testing Setup

### Recommended Testing Stack

#### 1. Unit & Component Testing
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Why Vitest?**
- Fast, Vite-native
- TypeScript support out of the box
- Compatible with Jest syntax

#### 2. E2E Testing
```bash
npm install --save-dev playwright
# or
npm install --save-dev cypress
```

**Recommendation: Playwright**
- Better cross-browser support
- Faster execution
- Better debugging tools

### Setup Vitest

1. **Install dependencies:**
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

2. **Create `vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

3. **Create `src/test/setup.ts`:**
```typescript
import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

4. **Update `package.json`:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### Setup Playwright

1. **Install Playwright:**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

2. **Create `playwright.config.ts`:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

3. **Create test helpers (`e2e/helpers/auth.ts`):**
```typescript
import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin');
}

export async function loginAsTeacher(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'teacher@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

export async function loginAsStudent(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'student@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}
```

---

## E2E Testing Strategy

### Test Structure
```
e2e/
├── admin/
│   ├── admin-dashboard.spec.ts
│   ├── user-management.spec.ts
│   ├── course-moderation.spec.ts
│   └── ...
├── teacher/
│   ├── course-creation.spec.ts
│   ├── student-management.spec.ts
│   └── ...
├── student/
│   ├── course-enrollment.spec.ts
│   ├── learning-path.spec.ts
│   └── ...
└── shared/
    ├── auth.spec.ts
    ├── messaging.spec.ts
    └── ...
```

### Example E2E Test

**`e2e/admin/user-management.spec.ts`:**
```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Admin User Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should view user list', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('h1')).toContainText('User Management');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should create new user', async ({ page }) => {
    await page.goto('/admin/users');
    await page.click('button:has-text("Add User")');
    await page.fill('input[name="email"]', 'newuser@test.com');
    await page.fill('input[name="username"]', 'newuser');
    await page.selectOption('select[name="role"]', 'STUDENT');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=newuser@test.com')).toBeVisible();
  });

  test('should search users', async ({ page }) => {
    await page.goto('/admin/users');
    await page.fill('input[placeholder*="Search"]', 'test');
    await page.waitForTimeout(500); // Wait for search
    const results = page.locator('tbody tr');
    await expect(results).toHaveCount(await results.count());
  });
});
```

### Running E2E Tests

```bash
# Run all tests
npx playwright test

# Run specific role tests
npx playwright test e2e/admin

# Run in UI mode
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Generate test report
npx playwright show-report
```

---

## API Testing

### Using Postman/Insomnia Collections

Create API test collections for:
1. **Authentication**
   - Login (all roles)
   - Register
   - Refresh token
   - Logout

2. **Admin APIs**
   - User CRUD
   - Course moderation
   - Analytics endpoints

3. **Teacher APIs**
   - Course creation
   - Lesson management
   - Student management

4. **Student APIs**
   - Course enrollment
   - Progress tracking
   - Messaging

### Example API Test Script

```javascript
// Postman Test Script
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has user data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('user');
    pm.expect(jsonData.user).to.have.property('role');
});
```

---

## Browser Testing Matrix

Test on these browsers/devices:

### Desktop
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile
- [ ] iOS Safari
- [ ] Chrome Mobile
- [ ] Responsive design (320px - 1920px)

### Test Scenarios
- [ ] Login/logout on all browsers
- [ ] Navigation works on all browsers
- [ ] Forms submit correctly
- [ ] Modals/dialogs work
- [ ] Responsive layout on mobile

---

## Testing Best Practices

### 1. Test Data Management
- Use separate test database
- Clean up test data after tests
- Use factories for test data creation

### 2. Test Isolation
- Each test should be independent
- Don't rely on test execution order
- Clean state between tests

### 3. Test Coverage Goals
- **Unit Tests**: 70%+ coverage
- **Component Tests**: Critical components
- **E2E Tests**: Critical user flows

### 4. Continuous Testing
- Run tests on every commit (CI/CD)
- Run tests before deployment
- Monitor test execution time

### 5. Test Maintenance
- Update tests when features change
- Remove obsolete tests
- Keep test data realistic

---

## Quick Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npx playwright test

# Run specific test file
npm test -- Messages.test.tsx

# Run tests matching pattern
npm test -- --grep "admin"
```

---

## Troubleshooting

### Common Issues

1. **Tests fail due to API calls**
   - Mock API responses
   - Use MSW (Mock Service Worker)

2. **Tests are slow**
   - Run tests in parallel
   - Use test sharding
   - Optimize test data setup

3. **Flaky tests**
   - Add proper waits
   - Use stable selectors
   - Avoid time-based assertions

---

## Next Steps

1. **Set up test infrastructure** (Vitest + Playwright)
2. **Create test accounts** for each role
3. **Start with critical paths** (auth, payments, course enrollment)
4. **Build test suite incrementally**
5. **Integrate with CI/CD pipeline**

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW (Mock Service Worker)](https://mswjs.io/)

