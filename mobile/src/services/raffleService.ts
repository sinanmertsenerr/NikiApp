import api from './api';

// Types
export type RaffleStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type RewardType = 'free_coffee' | 'discount_percent' | 'discount_fixed' | 'bonus_points';

export interface Raffle {
    id: string;
    title: string;
    titleTr: string;
    description?: string;
    descriptionTr?: string;
    rewardType: RewardType;
    rewardValue?: string;
    startDate: string;
    endDate: string;
    winnerCount: number;
    status: RaffleStatus;
    drawnAt?: string;
    participantCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface RaffleParticipant {
    id: string;
    raffleId: string;
    userId: string;
    isWinner: boolean;
    joinedAt: string;
    userCampaignId?: string;
    usedAt?: string;
    user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
    };
}

export interface PaginatedRaffles {
    raffles: Raffle[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface UserRaffleParticipation {
    id: string;
    raffle: Raffle;
    isWinner: boolean;
    joinedAt: string;
    userCampaignId?: string;
    usedAt?: string;
}

// ==================== CUSTOMER ENDPOINTS ====================

export const getActiveRaffles = async (): Promise<Raffle[]> => {
    const response = await api.get('/raffles/active');
    return response.data;
};

export const getMyRaffles = async (): Promise<UserRaffleParticipation[]> => {
    const response = await api.get('/raffles/my');
    return response.data;
};

export const joinRaffle = async (raffleId: string): Promise<{
    message: string;
    participant: RaffleParticipant;
}> => {
    const response = await api.post(`/raffles/${raffleId}/join`);
    return response.data;
};

// ==================== ADMIN ENDPOINTS ====================

export const adminGetRaffles = async (params?: {
    page?: number;
    limit?: number;
    status?: RaffleStatus;
}): Promise<PaginatedRaffles> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.status) searchParams.append('status', params.status);

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await api.get(`/admin/raffles${queryString}`);
    return response.data;
};

export const adminGetRaffle = async (id: string): Promise<Raffle & { participants: RaffleParticipant[] }> => {
    const response = await api.get(`/admin/raffles/${id}`);
    return response.data;
};

export const createRaffle = async (data: {
    title: string;
    titleTr: string;
    description?: string;
    descriptionTr?: string;
    rewardType: RewardType;
    rewardValue?: string;
    startDate: string;
    endDate: string;
    winnerCount?: number;
}): Promise<Raffle> => {
    const response = await api.post('/admin/raffles', data);
    return response.data;
};

export const updateRaffle = async (id: string, data: Partial<{
    title: string;
    titleTr: string;
    description?: string;
    descriptionTr?: string;
    rewardType: RewardType;
    rewardValue?: string;
    startDate: string;
    endDate: string;
    winnerCount?: number;
    status?: RaffleStatus;
}>): Promise<Raffle> => {
    const response = await api.patch(`/admin/raffles/${id}`, data);
    return response.data;
};

export const deleteRaffle = async (id: string): Promise<void> => {
    await api.delete(`/admin/raffles/${id}`);
};

export const getRaffleParticipants = async (raffleId: string): Promise<{
    participants: RaffleParticipant[];
    total: number;
    winnerCount: number;
}> => {
    const response = await api.get(`/admin/raffles/${raffleId}/participants`);
    return response.data;
};

export const drawRaffle = async (raffleId: string, winnerCount?: number): Promise<{
    message: string;
    winners: RaffleParticipant[];
    participants: RaffleParticipant[];
}> => {
    const response = await api.post(`/admin/raffles/${raffleId}/draw`, { winnerCount });
    return response.data;
};

export const raffleService = {
    // Customer
    getActiveRaffles,
    getMyRaffles,
    joinRaffle,
    // Admin
    adminGetRaffles,
    adminGetRaffle,
    createRaffle,
    updateRaffle,
    deleteRaffle,
    getRaffleParticipants,
    drawRaffle,
};
