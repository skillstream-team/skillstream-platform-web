import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getCurrentUser, 
  getCurrentUserRole, 
  hasRole, 
  hasAnyRole, 
  isAuthenticated,
  isStudent,
  isTeacher,
  isAdmin
} from './auth-utils';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.localStorage = localStorageMock as any;

describe('auth-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return null when no user in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(getCurrentUser()).toBeNull();
    });

    it('should return user object when user exists in localStorage', () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'STUDENT'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));
      expect(getCurrentUser()).toEqual(mockUser);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      expect(getCurrentUser()).toBeNull();
    });
  });

  describe('getCurrentUserRole', () => {
    it('should return role when user exists', () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'TEACHER'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));
      expect(getCurrentUserRole()).toBe('TEACHER');
    });

    it('should return null when no user', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(getCurrentUserRole()).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the role', () => {
      const mockUser = {
        id: '123',
        username: 'admin',
        email: 'admin@example.com',
        role: 'ADMIN'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));
      expect(hasRole('ADMIN')).toBe(true);
    });

    it('should return false when user does not have the role', () => {
      const mockUser = {
        id: '123',
        username: 'student',
        email: 'student@example.com',
        role: 'STUDENT'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));
      expect(hasRole('ADMIN')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has one of the roles', () => {
      const mockUser = {
        id: '123',
        username: 'teacher',
        email: 'teacher@example.com',
        role: 'TEACHER'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));
      expect(hasAnyRole('ADMIN', 'TEACHER')).toBe(true);
    });

    it('should return false when user has none of the roles', () => {
      const mockUser = {
        id: '123',
        username: 'student',
        email: 'student@example.com',
        role: 'STUDENT'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));
      expect(hasAnyRole('ADMIN', 'TEACHER')).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user exists', () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'STUDENT'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));
      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when no user', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('isStudent', () => {
    it('should return true for student role', () => {
      const mockUser = {
        id: '123',
        username: 'student',
        email: 'student@example.com',
        role: 'STUDENT'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));
      expect(isStudent()).toBe(true);
    });

    it('should return false for non-student role', () => {
      const mockUser = {
        id: '123',
        username: 'teacher',
        email: 'teacher@example.com',
        role: 'TEACHER'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));
      expect(isStudent()).toBe(false);
    });
  });

  describe('isTeacher', () => {
    it('should return true for teacher role', () => {
      const mockUser = {
        id: '123',
        username: 'teacher',
        email: 'teacher@example.com',
        role: 'TEACHER'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));
      expect(isTeacher()).toBe(true);
    });

    it('should return false for non-teacher role', () => {
      const mockUser = {
        id: '123',
        username: 'student',
        email: 'student@example.com',
        role: 'STUDENT'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));
      expect(isTeacher()).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin role', () => {
      const mockUser = {
        id: '123',
        username: 'admin',
        email: 'admin@example.com',
        role: 'ADMIN'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));
      expect(isAdmin()).toBe(true);
    });

    it('should return false for non-admin role', () => {
      const mockUser = {
        id: '123',
        username: 'student',
        email: 'student@example.com',
        role: 'STUDENT'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));
      expect(isAdmin()).toBe(false);
    });
  });
});

