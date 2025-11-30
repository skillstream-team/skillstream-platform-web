import { create } from 'zustand';
import { User } from '../types';
import { apiService, setAuthToken, setRefreshToken, handleOAuthCallback } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'STUDENT' | 'TEACHER') => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'linkedin') => Promise<void>;
  handleOAuthLogin: (provider: 'google' | 'linkedin', code: string, state?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (userData: Partial<User>) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: (() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? (JSON.parse(storedUser) as User) : null;
  })(),
  token: (() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setAuthToken(storedToken);
    }
    return storedToken;
  })(),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  // Actions
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.login({ email, password });
      const { user, token } = response;
      setAuthToken(token);
      // Check if response includes refresh token
      if ((response as any).refreshToken) {
        setRefreshToken((response as any).refreshToken);
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Login failed',
      });
      throw error;
    }
  },

  register: async (name: string, email: string, password: string, role: 'STUDENT' | 'TEACHER') => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.register({ name, email, password, role });
      const { user, token } = response;
      setAuthToken(token);
      // Check if response includes refresh token
      if ((response as any).refreshToken) {
        setRefreshToken((response as any).refreshToken);
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Registration failed',
      });
      throw error;
    }
  },

  loginWithOAuth: async (provider: 'google' | 'linkedin') => {
    set({ isLoading: true, error: null });
    try {
      // Import OAuth initiation functions
      const { initiateGoogleLogin, initiateLinkedInLogin } = await import('../services/api');
      if (provider === 'google') {
        initiateGoogleLogin();
      } else if (provider === 'linkedin') {
        initiateLinkedInLogin();
      } else {
        throw new Error('Unsupported OAuth provider');
      }
      // Note: This will redirect to OAuth provider, so the function won't return normally
      // The loading state will remain until the callback completes
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'OAuth login failed',
      });
      throw error;
    }
  },

  handleOAuthLogin: async (provider: 'google' | 'linkedin', code: string, state?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token, refreshToken: refresh } = await handleOAuthCallback(provider, code, state);
      setAuthToken(token);
      if (refresh) {
        setRefreshToken(refresh);
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'OAuth login failed',
      });
      throw error;
    }
  },

  logout: () => {
    setAuthToken(null);
    setRefreshToken(null);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  updateUser: (userData: Partial<User>) => {
    const currentState = get();
    if (currentState.user) {
      set({ user: { ...currentState.user, ...userData } });
    }
  },
})); 
