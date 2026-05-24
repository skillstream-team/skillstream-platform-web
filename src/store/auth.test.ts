import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth';

const DEMO_PASSWORD = 'SkillStreamDemo123!';
const RESET_STATE = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  notice: null,
};

beforeEach(() => {
  useAuthStore.setState(RESET_STATE);
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Demo login
// ---------------------------------------------------------------------------
describe('demo login', () => {
  it('authenticates demo teacher with correct credentials', async () => {
    await useAuthStore.getState().login('teacher@skillstream.demo', DEMO_PASSWORD);
    const { user, isAuthenticated, token } = useAuthStore.getState();
    expect(isAuthenticated).toBe(true);
    expect(token).toBe('demo-session');
    expect(user?.role).toBe('TEACHER');
    expect(user?.email).toBe('teacher@skillstream.demo');
    expect(user?.id).toBe('demo-teacher');
  });

  it('authenticates demo student with correct credentials', async () => {
    await useAuthStore.getState().login('student@skillstream.demo', DEMO_PASSWORD);
    const { user } = useAuthStore.getState();
    expect(user?.role).toBe('STUDENT');
    expect(user?.id).toBe('demo-student');
  });

  it('authenticates demo admin with correct credentials', async () => {
    await useAuthStore.getState().login('admin@skillstream.demo', DEMO_PASSWORD);
    const { user } = useAuthStore.getState();
    expect(user?.role).toBe('ADMIN');
    expect(user?.id).toBe('demo-admin');
  });

  it('persists demo user to localStorage on login', async () => {
    await useAuthStore.getState().login('teacher@skillstream.demo', DEMO_PASSWORD);
    const raw = localStorage.getItem('skillstream_demo_auth_v1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.email).toBe('teacher@skillstream.demo');
  });

  it('email comparison is case-insensitive', async () => {
    await useAuthStore.getState().login('TEACHER@SKILLSTREAM.DEMO', DEMO_PASSWORD);
    const { isAuthenticated } = useAuthStore.getState();
    expect(isAuthenticated).toBe(true);
  });

  it('rejects demo credentials with wrong password', async () => {
    // Wrong password → falls through to real Supabase path → throws (no config)
    await expect(
      useAuthStore.getState().login('teacher@skillstream.demo', 'wrongpassword'),
    ).rejects.toThrow();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('rejects non-demo email without Supabase config', async () => {
    await expect(
      useAuthStore.getState().login('real@example.com', 'somepassword'),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// initAuth — restores persisted demo session
// ---------------------------------------------------------------------------
describe('initAuth', () => {
  it('restores demo user from localStorage', async () => {
    await useAuthStore.getState().login('student@skillstream.demo', DEMO_PASSWORD);
    // Reset in-memory state but keep localStorage
    useAuthStore.setState(RESET_STATE);

    await useAuthStore.getState().initAuth();
    const { user, isAuthenticated } = useAuthStore.getState();
    expect(isAuthenticated).toBe(true);
    expect(user?.email).toBe('student@skillstream.demo');
  });

  it('sets isLoading to false when no session and no config', async () => {
    await useAuthStore.getState().initAuth();
    const { isLoading } = useAuthStore.getState();
    expect(isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// logout
// ---------------------------------------------------------------------------
describe('logout', () => {
  it('clears user state and localStorage', async () => {
    await useAuthStore.getState().login('teacher@skillstream.demo', DEMO_PASSWORD);
    useAuthStore.getState().logout();

    const { user, isAuthenticated, token } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(isAuthenticated).toBe(false);
    expect(token).toBeNull();
    expect(localStorage.getItem('skillstream_demo_auth_v1')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// clearError / clearNotice
// ---------------------------------------------------------------------------
describe('clearError and clearNotice', () => {
  it('clearError nullifies the error field', () => {
    useAuthStore.setState({ error: 'Something went wrong' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('clearNotice nullifies the notice field', () => {
    useAuthStore.setState({ notice: 'Check your email' });
    useAuthStore.getState().clearNotice();
    expect(useAuthStore.getState().notice).toBeNull();
  });
});
