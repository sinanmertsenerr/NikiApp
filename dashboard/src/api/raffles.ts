// Raffles API
import apiClient from './client';
import type { Raffle, PaginatedResponse } from '../types';

export interface RafflesQuery {
    page?: number;
    limit?: number;
    status?: string;
}

export const rafflesApi = {
    // Get raffles list
    getRaffles: async (query?: RafflesQuery): Promise<PaginatedResponse<Raffle>> => {
        const params = new URLSearchParams();
        if (query?.page) params.append('page', query.page.toString());
        if (query?.limit) params.append('limit', query.limit.toString());
        if (query?.status) params.append('status', query.status);

        const { data } = await apiClient.get(`/admin/raffles?${params.toString()}`);
        return data;
    },

    // Get raffle by ID
    getRaffleById: async (raffleId: string): Promise<Raffle> => {
        const { data } = await apiClient.get(`/admin/raffles/${raffleId}`);
        return data;
    },

    // Get raffle participants
    getRaffleParticipants: async (raffleId: string) => {
        const { data } = await apiClient.get(`/admin/raffles/${raffleId}/participants`);
        return data;
    },
};

export default rafflesApi;
