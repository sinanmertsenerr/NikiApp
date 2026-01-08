// Users API
import apiClient from './client';
import type { User, PaginatedResponse, UsersQuery } from '../types';

export const usersApi = {
    // Get users list (admin)
    getUsers: async (query?: UsersQuery): Promise<PaginatedResponse<User>> => {
        const params = new URLSearchParams();
        if (query?.page) params.append('page', query.page.toString());
        if (query?.limit) params.append('limit', query.limit.toString());
        if (query?.search) params.append('search', query.search);
        if (query?.role) params.append('role', query.role);
        if (query?.isActive !== undefined) params.append('isActive', query.isActive.toString());
        if (query?.sortBy) params.append('sortBy', query.sortBy);
        if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

        const { data } = await apiClient.get(`/admin/users?${params.toString()}`);
        return (data as any).data || data;
    },

    // Get user by ID with full details
    getUserById: async (userId: string): Promise<User> => {
        const { data } = await apiClient.get(`/admin/users/${userId}`);
        return (data as any).data || data;
    },
};

export default usersApi;
