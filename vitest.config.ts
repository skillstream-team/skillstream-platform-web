import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    env: {
      REACT_APP_ENABLE_DEMO_ACCOUNTS: 'true',
    },
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      // Only files listed here are subject to the 85% threshold.
      // When you write tests for a new module, add it to this list.
      // Files not listed still appear in HTML reports for visibility.
      include: [
        'src/lib/utils.ts',
        'src/lib/signalwireLive.ts',
        'src/components/auth/PasswordStrengthMeter.tsx',
      ],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
      thresholds: {
        lines: 85,
        functions: 85,
        statements: 85,
        branches: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
