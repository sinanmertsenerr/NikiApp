import api from './api';

export interface Group {
    id: string;
    name: string;
    description?: string;
    memberCount: number;
    createdAt: string;
    updatedAt?: string;
}

export interface GroupMember {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
    isActive: boolean;
    addedAt: string;
}

export interface GroupDetail extends Omit<Group, 'memberCount'> {
    isActive: boolean;
    members: GroupMember[];
}

// Admin API
export const groupService = {
    // Get all groups (admin)
    getAll: async (): Promise<Group[]> => {
        const response = await api.get('/admin/groups');
        return response.data;
    },

    // Get group details with members (admin)
    getById: async (id: string): Promise<GroupDetail> => {
        const response = await api.get(`/admin/groups/${id}`);
        return response.data;
    },

    // Create group (admin)
    create: async (data: { name: string; description?: string }): Promise<Group> => {
        const response = await api.post('/admin/groups', data);
        return response.data;
    },

    // Update group (admin)
    update: async (id: string, data: { name?: string; description?: string }): Promise<Group> => {
        const response = await api.patch(`/admin/groups/${id}`, data);
        return response.data;
    },

    // Delete group (admin)
    delete: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete(`/admin/groups/${id}`);
        return response.data;
    },

    // Add single member (admin)
    addMember: async (groupId: string, userId: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.post(`/admin/groups/${groupId}/members`, { userId });
        return response.data;
    },

    // Add multiple members (admin)
    addMembers: async (groupId: string, userIds: string[]): Promise<{ success: boolean; message: string; addedCount: number }> => {
        const response = await api.post(`/admin/groups/${groupId}/members/bulk`, { userIds });
        return response.data;
    },

    // Remove member (admin)
    removeMember: async (groupId: string, userId: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete(`/admin/groups/${groupId}/members/${userId}`);
        return response.data;
    },

    // Get my groups (user)
    getMyGroups: async (): Promise<Group[]> => {
        const response = await api.get('/groups/my');
        return response.data;
    },
};
