// Wallet API - Dashboard Stats & Transactions
import apiClient from './client';
import type { WalletStats, Transaction, PaginatedResponse, WalletType } from '../types';

export interface TransactionsQuery {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
    walletType?: WalletType;
    search?: string;
}

export interface WalletStatsQuery {
    startDate?: string;
    endDate?: string;
}

export const walletApi = {
    // Get dashboard stats (totals, breakdowns)
    getDashboardStats: async (query?: WalletStatsQuery): Promise<WalletStats> => {
        const params = new URLSearchParams();
        if (query?.startDate) params.append('startDate', query.startDate);
        if (query?.endDate) params.append('endDate', query.endDate);

        const { data } = await apiClient.get(`/admin/wallet/stats?${params.toString()}`);
        // Handle wrapped response if exists
        return (data as any).data || data;
    },

    // Get all transactions (paginated)
    getTransactions: async (query?: TransactionsQuery): Promise<PaginatedResponse<Transaction>> => {
        const params = new URLSearchParams();
        if (query?.page) params.append('page', query.page.toString());
        if (query?.limit) params.append('limit', query.limit.toString());
        if (query?.startDate) params.append('startDate', query.startDate);
        if (query?.endDate) params.append('endDate', query.endDate);
        if (query?.type) params.append('type', query.type);
        if (query?.walletType) params.append('walletType', query.walletType);
        if (query?.search) params.append('search', query.search);

        const { data } = await apiClient.get(`/admin/wallet/transactions?${params.toString()}`);
        return (data as any).data || data;
    },

    // Get wallet stats by type (IEU vs NIKI)
    getWalletStatsByType: async (walletType: WalletType): Promise<WalletStats> => {
        const { data } = await apiClient.get(`/admin/wallet/stats?walletType=${walletType}`);
        return (data as any).data || data;
    },
};

export default walletApi;
