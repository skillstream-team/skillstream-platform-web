import '@testing-library/jest-dom';

// Silence the "Supabase config is missing" warning in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Supabase config is missing')) return;
    originalWarn(...args);
  };
});
afterAll(() => {
  console.warn = originalWarn;
});
