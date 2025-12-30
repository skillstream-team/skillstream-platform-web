# Testing Setup Guide

This guide will help you set up automated testing for SkillStream.

## Quick Start

### 1. Install Testing Dependencies

```bash
# Install unit testing dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui

# Install E2E testing dependencies
npm install --save-dev @playwright/test

# Install Playwright browsers
npx playwright install
```

### 2. Verify Setup

```bash
# Run unit tests
npm test

# Run E2E tests (make sure dev server is running)
npm run test:e2e
```

## Project Structure

```
skillstream-web/
├── src/
│   ├── test/
│   │   └── setup.ts          # Test configuration
│   └── api/
│       └── auth-utils.test.tsx  # Example unit test
├── e2e/
│   ├── helpers/
│   │   └── auth.ts           # E2E test helpers
│   ├── admin/
│   │   └── user-management.spec.ts
│   └── student/
│       └── course-enrollment.spec.ts
├── vitest.config.ts          # Vitest configuration
├── playwright.config.ts       # Playwright configuration
└── TESTING_GUIDE.md          # Comprehensive testing guide
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth-utils.test.tsx
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/admin/user-management.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test('admin can view users', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/users');
  await expect(page.locator('h1')).toContainText('Users');
});
```

## Test Accounts

Create these test accounts in your backend:

- **Admin**: `admin@test.com` / `password123`
- **Teacher**: `teacher@test.com` / `password123`
- **Student**: `student@test.com` / `password123`

## Next Steps

1. **Start with Manual Testing**: Use `QUICK_TEST_CHECKLIST.md` to manually test all features
2. **Add Unit Tests**: Test utility functions and components
3. **Add E2E Tests**: Test critical user flows
4. **Set up CI/CD**: Run tests automatically on commits

## Troubleshooting

### Tests fail with "Cannot find module"
- Make sure all dependencies are installed: `npm install`
- Check that file paths are correct

### E2E tests fail with "Navigation timeout"
- Make sure your dev server is running: `npm run dev`
- Check that the baseURL in `playwright.config.ts` matches your dev server URL

### Tests are slow
- Run tests in parallel (default)
- Use `--workers=1` to run sequentially if needed

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Full Testing Guide](./TESTING_GUIDE.md)

