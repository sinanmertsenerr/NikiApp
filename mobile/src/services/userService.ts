import api from './api';

// Types
export interface UserStats {
    totalOrders: number;
    totalCoffees: number;
    totalPointsEarned: number;
    totalPointsRedeemed: number;
    totalCreditsSpent: number;
    freeCoffeesEarned: number;
    memberSince: string;
}

export interface UserBadge {
    id: string;
    name: string;
    nameTr: string;
    description: string;
    descriptionTr: string;
    iconUrl?: string;
    earnedAt: string;
}

export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatarUrl?: string;
    language: 'tr' | 'en';
    theme: 'light' | 'dark' | 'system';
    emailVerified: boolean;
    isActive: boolean;
    createdAt: string;
}

export interface AdminUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatarUrl?: string;
    role: 'customer' | 'admin' | 'super_admin';
    emailVerified: boolean;
    isActive: boolean;
    createdAt: string;
    wallet?: {
        id: string;
        balance: string;  // Backend returns string
        qrCode: string;
    };
    // New dual wallet support
    wallets?: {
        ieu?: {
            id: string;
            balance: string;
            qrCode: string;
        };
        niki?: {
            id: string;
            balance: string;
            qrCode: string;
        };
    };
    loyaltyPoints?: {
        totalPoints: number;
        availablePoints: number;
    };
    stats?: {
        totalPoints: number;
        availablePoints: number;
        redeemedPoints: number;
        ieuCredits: string;
        nikiCredits: string;
        badgeCount: number;
        orderCount: number;
        activeCampaigns: number;
        wheelSpinsUsed: number;
    };
}

export interface PaginatedUsers {
    users: AdminUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ==================== CUSTOMER ENDPOINTS ====================

export const getProfile = async (): Promise<UserProfile> => {
    const response = await api.get('/users/me');
    return response.data?.data || response.data;
};

export const updateProfile = async (data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    language: 'tr' | 'en';
    theme: 'light' | 'dark' | 'system';
}>): Promise<UserProfile> => {
    const response = await api.patch('/users/me', data);
    // Backend returns the user object directly without a 'data' wrapper
    return response.data?.data || response.data;
};

export const getStats = async (): Promise<UserStats> => {
    const response = await api.get('/users/me/stats');
    return response.data.data;
};

export const getBadges = async (): Promise<UserBadge[]> => {
    const response = await api.get('/users/me/badges');
    return response.data.data;
};

// ==================== ADMIN ENDPOINTS ====================

export const adminGetUsers = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
}): Promise<PaginatedUsers> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.search) searchParams.append('search', params.search);
    if (params?.isActive !== undefined) searchParams.append('isActive', String(params.isActive));

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await api.get(`/admin/users${queryString}`);
    return response.data;
};

export const adminGetUser = async (id: string): Promise<AdminUser> => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
};

export const adminUpdateUser = async (id: string, data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    isActive: boolean;
}>): Promise<AdminUser> => {
    // Backend expects /status for status updates
    // Note: If updating other fields is needed, backend needs a separate endpoint
    const response = await api.patch(`/admin/users/${id}/status`, data);
    return response.data;
};

export const adminToggleIeuWallet = async (
    userId: string,
    isActive: boolean
): Promise<{ success: boolean; ieuWalletActive: boolean }> => {
    const response = await api.patch(`/admin/users/${userId}/ieu-wallet-status`, { isActive });
    return response.data;
};

export const adminToggleNegativeBalance = async (
    userId: string,
    walletType: 'IEU' | 'NIKI',
    allowNegative: boolean,
    negativeLimit: number = 0
): Promise<{ success: boolean; walletType: string; allowNegative: boolean; negativeLimit: number }> => {
    const response = await api.patch(`/admin/users/${userId}/negative-balance`, {
        walletType,
        allowNegative,
        negativeLimit,
    });
    return response.data;
};

export const userService = {
    // Customer
    getProfile,
    updateProfile,
    getStats,
    getBadges,
    // Admin
    adminGetUsers,
    adminGetUser,
    adminUpdateUser,
    adminToggleIeuWallet,
    adminToggleNegativeBalance,
};
