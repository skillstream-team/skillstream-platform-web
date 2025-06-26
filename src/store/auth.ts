import { create } from 'zustand';
import { apiService } from '../services/api';
import { User, AuthUser } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'MANAGER') => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

const mockUser: User = {
  id: '1',
  email: 'admin@watchtower.com',
  name: 'Admin User',
  role: 'ADMIN',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  // Actions
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await apiService.login({ email, password });
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

  register: async (name: string, email: string, password: string, role: 'MANAGER') => {
    set({ isLoading: true, error: null });
    try {
      await apiService.register({ name, email, password, role });
      set({ isLoading: false, error: null });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Registration failed',
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
})); 