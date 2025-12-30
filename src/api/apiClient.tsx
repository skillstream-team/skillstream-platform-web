// src/api/client.ts

import axios, {
    AxiosInstance,
    InternalAxiosRequestConfig,
    AxiosError,
    AxiosResponse,
} from 'axios';

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    'https://skillstream-platform-api.onrender.com/api';

class ApiClient {
    private axiosInstance: AxiosInstance;
    private token: string | null = null;

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        this.axiosInstance.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                const token = this.token || localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            }
        );

        this.axiosInstance.interceptors.response.use(
            (response: AxiosResponse) => response,
            (error: AxiosError) => {
                if (error.response?.status === 401) {
                    const currentPath = window.location.pathname;
                    // Don't redirect if already on login/register pages
                    if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/forgot-password') {
                        const user = localStorage.getItem('user');
                        if (user) {
                            // User exists but token expired/invalid - clear and redirect
                            this.clearAuth();
                            window.location.href = '/login';
                        }
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    setToken(token: string | null) {
        this.token = token;
        token
            ? localStorage.setItem('token', token)
            : localStorage.removeItem('token');
    }

    clearAuth() {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    get instance() {
        return this.axiosInstance;
    }
}

export const apiClient = new ApiClient();