import { create } from 'zustand';
import { User } from '../types';
import apiService from '../services/api';

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
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (userData: Partial<User>) => void;
}

type AuthStore = AuthState & AuthActions;

// Mock user for development
const mockUser: User = {
  id: '1',
  email: 'stephanie@example.com',
  name: 'Stephanie Makwabarara',
  role: 'TEACHER',
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: {
    id: '1',
    email: 'stephanie@example.com',
    name: 'Stephanie Makwabarara',
    role: 'TEACHER',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  token: 'mock-token',
  isAuthenticated: true,
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

  register: async (name: string, email: string, password: string, role: 'STUDENT' | 'TEACHER') => {
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
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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