// Dashboard API - Overview & Campaigns
import apiClient from './client';
import type { DashboardOverview, Campaign, PaginatedResponse, DashboardQuery, CampaignsQuery } from '../types';

// Backend response wrapper
interface ApiResponse<T> {
    success?: boolean;
    data?: T;
    [key: string]: any;
}

export const dashboardApi = {
    // Get full dashboard overview (users, campaigns, points, wheel stats)
    // Endpoint: GET /admin/campaigns/dashboard/overview
    getOverview: async (query?: DashboardQuery): Promise<DashboardOverview> => {
        const params = new URLSearchParams();
        if (query?.startDate) params.append('startDate', query.startDate);
        if (query?.endDate) params.append('endDate', query.endDate);

        const { data } = await apiClient.get<DashboardOverview | ApiResponse<DashboardOverview>>(
            `/admin/campaigns/dashboard/overview?${params.toString()}`
        );
        // Handle both wrapped and unwrapped responses
        return (data as any).data || data;
    },

    // Get campaigns list
    getCampaigns: async (query?: CampaignsQuery): Promise<PaginatedResponse<Campaign>> => {
        const params = new URLSearchParams();
        if (query?.page) params.append('page', query.page.toString());
        if (query?.limit) params.append('limit', query.limit.toString());
        if (query?.type) params.append('type', query.type);
        if (query?.isActive !== undefined) params.append('isActive', query.isActive.toString());

        const { data } = await apiClient.get<PaginatedResponse<Campaign>>(`/admin/campaigns?${params.toString()}`);
        return data;
    },

    // Get campaign stats overview
    getCampaignStatsOverview: async (): Promise<any> => {
        const { data } = await apiClient.get('/admin/campaigns/stats/overview');
        return data;
    },

    // Get single campaign stats
    getCampaignStats: async (campaignId: string): Promise<any> => {
        const { data } = await apiClient.get(`/admin/campaigns/stats/${campaignId}`);
        return data;
    },
};

export default dashboardApi;
