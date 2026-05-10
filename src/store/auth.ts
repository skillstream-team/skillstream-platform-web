import { create } from 'zustand';
import { User } from '../types';
import { hasSupabaseConfig, supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  notice: string | null;
}

interface AuthActions {
  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: 'STUDENT' | 'TEACHER',
    options?: { teacherInviteCode?: string }
  ) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  preparePasswordRecovery: (url: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  handleOAuthLogin: (provider: 'google' | 'apple', code: string, state?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  clearNotice: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  role: 'teacher' | 'student' | 'admin';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

const mapRole = (value: ProfileRow['role']): User['role'] => {
  if (value === 'teacher') return 'TEACHER';
  if (value === 'admin') return 'ADMIN';
  return 'STUDENT';
};

const formatError = (error: unknown, fallback = 'Authentication failed'): string => {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
};

const normalizeAuthError = (error: unknown): string => {
  const message = formatError(error);
  const lower = message.toLowerCase();
  if (lower.includes('email not confirmed') || lower.includes('email not verified')) {
    return 'Confirm your email before signing in.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password.';
  }
  if (
    lower.includes('teacher invite is invalid or expired')
    || lower.includes('database error saving new user')
  ) {
    return 'Teacher invite code is invalid or expired. Request a valid code from admin.';
  }
  return message;
};

const ensureSupabaseConfig = () => {
  if (!hasSupabaseConfig) {
    throw new Error('Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
  }
};

const toAuthUser = (profile: ProfileRow): User => ({
  id: profile.id,
  email: profile.email,
  name: profile.full_name || profile.email.split('@')[0],
  role: mapRole(profile.role),
  avatar: profile.avatar_url || undefined,
  createdAt: profile.created_at,
  updatedAt: profile.updated_at,
});

const loadProfile = async (userId: string): Promise<ProfileRow> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('Could not load your profile.');
  }
  return data as ProfileRow;
};

const ensureProfile = async (input: { userId: string; email: string; fullName?: string; role?: 'student' | 'teacher' | 'admin' }): Promise<ProfileRow> => {
  try {
    return await loadProfile(input.userId);
  } catch {
    const { error } = await supabase.from('profiles').upsert({
      id: input.userId,
      email: input.email,
      full_name: input.fullName || input.email.split('@')[0],
      role: input.role || 'student',
    });
    if (error) {
      throw new Error('Could not initialize your profile.');
    }
    return loadProfile(input.userId);
  }
};

let authListenerBound = false;
let expectedSignOut = false;
const ENABLE_DEMO_ACCOUNTS = (process.env.REACT_APP_ENABLE_DEMO_ACCOUNTS || 'true').toLowerCase() !== 'false';
const DEMO_PASSWORD = 'SkillStreamDemo123!';
const DEMO_STORAGE_KEY = 'skillstream_demo_auth_v1';

const DEMO_USERS: Record<string, User> = {
  'teacher@skillstream.demo': {
    id: 'demo-teacher',
    email: 'teacher@skillstream.demo',
    name: 'Demo Teacher',
    role: 'TEACHER',
    createdAt: '2026-01-01T09:00:00.000Z',
    updatedAt: '2026-01-01T09:00:00.000Z',
  },
  'student@skillstream.demo': {
    id: 'demo-student',
    email: 'student@skillstream.demo',
    name: 'Demo Student',
    role: 'STUDENT',
    createdAt: '2026-01-01T09:00:00.000Z',
    updatedAt: '2026-01-01T09:00:00.000Z',
  },
  'admin@skillstream.demo': {
    id: 'demo-admin',
    email: 'admin@skillstream.demo',
    name: 'Demo Admin',
    role: 'ADMIN',
    createdAt: '2026-01-01T09:00:00.000Z',
    updatedAt: '2026-01-01T09:00:00.000Z',
  },
};

const getStoredDemoUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (!parsed?.email || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
};

const persistDemoUser = (user: User) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(user));
};

const clearStoredDemoUser = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DEMO_STORAGE_KEY);
};

const validatePassword = (password: string): string | null => {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number.';
  return null;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  notice: null,

  initAuth: async () => {
    if (ENABLE_DEMO_ACCOUNTS) {
      const demoUser = getStoredDemoUser();
      if (demoUser) {
        set({
          user: demoUser,
          token: 'demo-session',
          isAuthenticated: true,
          isLoading: false,
          error: null,
          notice: null,
        });
        return;
      }
    }

    if (!hasSupabaseConfig) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Supabase is not configured.',
        notice: null,
      });
      return;
    }
    set({ isLoading: true, error: null });

    if (!authListenerBound) {
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (_event === 'SIGNED_OUT' && !expectedSignOut) {
          set({ notice: 'Session expired. Sign in again to continue.' });
        }

        if (!session?.user) {
          const carryNotice = !expectedSignOut ? get().notice : null;
          expectedSignOut = false;
          set({ user: null, token: null, isAuthenticated: false, isLoading: false, notice: carryNotice });
          return;
        }
        try {
          const profile = await ensureProfile({
            userId: session.user.id,
            email: session.user.email || '',
            fullName: (session.user.user_metadata?.full_name as string | undefined) || undefined,
            role: (session.user.user_metadata?.role as 'student' | 'teacher' | 'admin' | undefined) || undefined,
          });
          set({
            user: toAuthUser(profile),
            token: session.access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            notice: null,
          });
          expectedSignOut = false;
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: formatError(error, 'Signed in, but profile loading failed.'),
            notice: null,
          });
        }
      });
      authListenerBound = true;
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      set({ isLoading: false, error: formatError(error) });
      return;
    }
    if (!data.session?.user) {
      set({ isLoading: false, user: null, token: null, isAuthenticated: false, notice: null });
      return;
    }

    try {
      const profile = await ensureProfile({
        userId: data.session.user.id,
        email: data.session.user.email || '',
        fullName: (data.session.user.user_metadata?.full_name as string | undefined) || undefined,
        role: (data.session.user.user_metadata?.role as 'student' | 'teacher' | 'admin' | undefined) || undefined,
      });
      set({
        user: toAuthUser(profile),
        token: data.session.access_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        notice: null,
      });
    } catch (profileError) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: normalizeAuthError(profileError),
        notice: null,
      });
    }
  },

  login: async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    if (ENABLE_DEMO_ACCOUNTS && normalizedPassword === DEMO_PASSWORD && DEMO_USERS[normalizedEmail]) {
      const demoUser = DEMO_USERS[normalizedEmail];
      persistDemoUser(demoUser);
      set({
        user: demoUser,
        token: 'demo-session',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        notice: null,
      });
      return;
    }

    ensureSupabaseConfig();
    set({ isLoading: true, error: null, notice: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      if (error) throw error;
      if (!data.user || !data.session) {
        throw new Error('Sign-in incomplete. Please check your email verification status.');
      }
      const profile = await ensureProfile({
        userId: data.user.id,
        email: data.user.email || email.trim(),
        fullName: (data.user.user_metadata?.full_name as string | undefined) || (data.user.email || email.trim()).split('@')[0],
        role: (data.user.user_metadata?.role as 'student' | 'teacher' | 'admin' | undefined) || undefined,
      });
      set({
        user: toAuthUser(profile),
        token: data.session.access_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        notice: null,
      });
    } catch (error) {
      set({ isLoading: false, error: normalizeAuthError(error), notice: null });
      throw error;
    }
  },

  register: async (name: string, email: string, password: string, role: 'STUDENT' | 'TEACHER', options?: { teacherInviteCode?: string }) => {
    ensureSupabaseConfig();
    set({ isLoading: true, error: null, notice: null });
    try {
      const passwordError = validatePassword(password.trim());
      if (passwordError) throw new Error(passwordError);
      const inviteCode = options?.teacherInviteCode?.trim() || '';

      if (role === 'TEACHER') {
        if (!inviteCode) {
          throw new Error('Teacher invite code is required.');
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            full_name: name.trim(),
            role: role.toLowerCase(),
            teacher_invite_code: role === 'TEACHER' ? inviteCode : undefined,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw error;

      if (!data.user) {
        throw new Error('Account could not be created.');
      }

      if (!data.session) {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          notice: 'Account created. Check your email to confirm before signing in.',
        });
        return;
      }

      const profile = await ensureProfile({
        userId: data.user.id,
        email: data.user.email || email.trim(),
        fullName: name.trim(),
        role: role.toLowerCase() as 'student' | 'teacher',
      });
      set({
        user: toAuthUser(profile),
        token: data.session.access_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        notice: null,
      });
    } catch (error) {
      set({ isLoading: false, error: normalizeAuthError(error), notice: null });
      throw error;
    }
  },

  resendConfirmation: async (email: string) => {
    ensureSupabaseConfig();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) throw error;
    set({ notice: 'Confirmation email sent. Check your inbox.' });
  },

  requestPasswordReset: async (email: string) => {
    ensureSupabaseConfig();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  preparePasswordRecovery: async (url: string) => {
    ensureSupabaseConfig();
    const parsed = new URL(url);
    const code = parsed.searchParams.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      throw new Error('Recovery session is missing or expired. Request a new reset link.');
    }
  },

  resetPassword: async (password: string) => {
    ensureSupabaseConfig();
    const passwordError = validatePassword(password.trim());
    if (passwordError) throw new Error(passwordError);
    const { error } = await supabase.auth.updateUser({ password: password.trim() });
    if (error) throw error;
  },

  loginWithOAuth: async (provider: 'google' | 'apple') => {
    ensureSupabaseConfig();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  },

  handleOAuthLogin: async (_provider: 'google' | 'apple', _code: string, _state?: string) => {
    // Supabase client auto-processes OAuth redirect sessions.
    await get().initAuth();
  },

  logout: () => {
    expectedSignOut = true;
    clearStoredDemoUser();
    void supabase.auth.signOut();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      notice: null,
    });
  },

  clearError: () => set({ error: null }),
  clearNotice: () => set({ notice: null }),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  updateUser: async (userData: Partial<User>) => {
    const current = get().user;
    if (!current) return;

    const updatedName = typeof userData.name === 'string' ? userData.name.trim() : null;
    const updatedAvatar = typeof userData.avatar === 'string' ? userData.avatar : null;
    if (!updatedName && !updatedAvatar) return;

    const isDemo = Boolean(current.id.startsWith('demo-') || current.email.endsWith('@skillstream.demo'));
    if (isDemo) {
      const next: User = {
        ...current,
        ...(updatedName ? { name: updatedName } : {}),
        ...(updatedAvatar ? { avatar: updatedAvatar } : {}),
      };
      persistDemoUser(next);
      set({ user: next, error: null });
      return;
    }

    ensureSupabaseConfig();

    const payload: Record<string, unknown> = {};
    if (updatedName) payload.full_name = updatedName;
    if (updatedAvatar) payload.avatar_url = updatedAvatar;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', current.id);

    if (error) {
      const message = formatError(error, 'Could not update profile.');
      set({ error: message });
      throw new Error(message);
    }

    const refreshed = await loadProfile(current.id);
    set({
      user: toAuthUser(refreshed),
      error: null,
    });
  },
}));
