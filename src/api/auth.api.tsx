// src/api/auth.api.ts

import { apiClient } from './apiClient';
import { AuthResponse } from './types';
import { getErrorMessage } from './utils';

export const AuthAPI = {
    login: async (email: string, password: string) => {
        try {
            const response = await apiClient.instance.post<AuthResponse>(
                '/users/auth/login',
                { email, password }
            );
            const data = response.data;
            apiClient.setToken(data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    register: async (payload: {
        username: string;
        email: string;
        password: string;
        role: 'STUDENT' | 'TEACHER';
        firstName?: string;
        lastName?: string;
        referralCode?: string;
    }) => {
        try {
            const response = await apiClient.instance.post<AuthResponse>(
                '/users/auth/register',
                payload
            );
            const data = response.data;
            apiClient.setToken(data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    refreshToken: async (refreshToken: string) => {
        try {
            const response = await apiClient.instance.post<AuthResponse>(
                '/users/auth/refresh-token',
                { token: refreshToken }
            );
            const data = response.data;
            apiClient.setToken(data.token);
            return data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    forgotPassword: async (email: string) => {
        try {
            const response = await apiClient.instance.post<{ message: string }>(
                '/users/auth/forgot-password',
                { email }
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },

    resetPassword: async (token: string, newPassword: string) => {
        try {
            const response = await apiClient.instance.post<{ message: string }>(
                '/users/auth/reset-password',
                { token, newPassword }
            );
            return response.data;
        } catch (error: any) {
            throw new Error(getErrorMessage(error));
        }
    },
};
