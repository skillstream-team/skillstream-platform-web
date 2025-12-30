import { User, UserRole } from './types';

/**
 * Get the current user from localStorage
 */
export const getCurrentUser = (): User | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr) as User;
    } catch {
        return null;
    }
};

/**
 * Get the current user's role
 */
export const getCurrentUserRole = (): UserRole | null => {
    const user = getCurrentUser();
    return user?.role || null;
};

/**
 * Check if the current user has a specific role
 */
export const hasRole = (role: UserRole): boolean => {
    const userRole = getCurrentUserRole();
    return userRole === role;
};

/**
 * Check if the current user has any of the specified roles
 */
export const hasAnyRole = (...roles: UserRole[]): boolean => {
    const userRole = getCurrentUserRole();
    return userRole ? roles.includes(userRole) : false;
};

/**
 * Check if the current user is authenticated
 */
export const isAuthenticated = (): boolean => {
    return getCurrentUser() !== null;
};

/**
 * Check if the current user is a teacher
 */
export const isTeacher = (): boolean => {
    return hasRole('TEACHER');
};

/**
 * Check if the current user is a student
 */
export const isStudent = (): boolean => {
    return hasRole('STUDENT');
};

/**
 * Check if the current user is an admin
 */
export const isAdmin = (): boolean => {
    return hasRole('ADMIN');
};

