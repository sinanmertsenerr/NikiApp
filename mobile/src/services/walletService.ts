import api from './api';
import { API_ENDPOINTS } from '../constants/api';

// Types
export type WalletType = 'IEU' | 'NIKI';

export interface WalletData {
    id: string;
    balance: string;
    qrCode: string;
    walletType: WalletType;
    discountRate: number;
    isActive?: boolean;
}

export interface Transaction {
    id: string;
    walletId: string;
    type: 'top_up' | 'payment' | 'refund' | 'reward';
    amount: number;
    discountAmount?: number;
    originalAmount?: number;
    description?: string;
    walletType?: WalletType;
    createdAt: string;
}

// New dual wallet response from backend
export interface WalletResponse {
    ieuWallet: WalletData | null;
    nikiWallet: WalletData | null;
    // Legacy fields for backward compatibility
    nikiCredits: string;
    qrCode: string;
}

export interface PaginatedTransactions {
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ==================== CUSTOMER ENDPOINTS ====================

export const getMyWallet = async (): Promise<WalletResponse> => {
    const response = await api.get('/wallet/me');
    return response.data;
};

export const getMyTransactions = async (params?: {
    page?: number;
    limit?: number;
    type?: string;
}): Promise<PaginatedTransactions> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.type) searchParams.append('type', params.type);

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await api.get(`/wallet/me/transactions${queryString}`);
    return response.data;
};

// ==================== ADMIN ENDPOINTS ====================

// Backend scanQrCode returns wallet info for the specific QR scanned
export interface ScannedUserWallet {
    id: string;
    balance: string;
    qrCode: string;
    walletType: WalletType;
    discountRate: number;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
        phone?: string;
    };
    loyaltyPoints: {
        totalPoints: number;
        availablePoints: number;
    };
    activeCampaignsCount: number;
}

// Backend returns string amounts due to Decimal type
export interface PaymentResult {
    success: boolean;
    message: string;
    transaction: Transaction;
    originalAmount: string;
    chargedAmount: string;
    discountSaved: string;
    newBalance: string;
}

// Backend topUp returns only transaction and newBalance
export interface TopUpResult {
    success: boolean;
    message: string;
    transaction: Transaction;
    newBalance: string;
}

export const scanQrCode = async (qrCode: string): Promise<ScannedUserWallet> => {
    const response = await api.get(`/admin/wallet/scan/${encodeURIComponent(qrCode)}`);
    return response.data;
};

export const topUp = async (data: {
    qrCode: string;
    amount: number;
    description?: string;
}): Promise<TopUpResult> => {
    const response = await api.post('/admin/wallet/topup', data);
    return response.data;
};

export const processPayment = async (data: {
    qrCode: string;
    amount: number;
    useDiscount?: boolean;
    description?: string;
}): Promise<PaymentResult> => {
    const response = await api.post('/admin/wallet/payment', data);
    return response.data;
};

export const processRefund = async (data: {
    transactionId: string;
    reason?: string;
}) => {
    const response = await api.post('/admin/wallet/refund', data);
    return response.data;
};

export const walletService = {
    // Customer
    getMyWallet,
    getMyTransactions,
    // Admin
    scanQrCode,
    topUp,
    processPayment,
    processRefund,
};
