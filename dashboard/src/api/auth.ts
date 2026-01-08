// Auth API
import apiClient from './client';
import type { LoginCredentials, User } from '../types';

// Backend response format
interface LoginResponse {
    success: boolean;
    data: {
        user: User;
        tokens: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        };
    };
}

interface ProfileResponse {
    success: boolean;
    data: {
        user: User;
    };
}

export const authApi = {
    login: async (credentials: LoginCredentials) => {
        const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
        // Extract and return in dashboard-friendly format
        return {
            user: data.data.user,
            accessToken: data.data.tokens.accessToken,
            refreshToken: data.data.tokens.refreshToken,
        };
    },

    logout: async (): Promise<void> => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            await apiClient.post('/auth/logout', { refreshToken });
        } catch {
            // Ignore logout errors
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    },

    getProfile: async (): Promise<User> => {
        const { data } = await apiClient.get<ProfileResponse>('/auth/me');
        return data.data.user;
    },

    refreshToken: async (refreshToken: string) => {
        const { data } = await apiClient.post<LoginResponse>('/auth/refresh', { refreshToken });
        return {
            accessToken: data.data.tokens.accessToken,
            refreshToken: data.data.tokens.refreshToken,
        };
    },
};

export default authApi;
