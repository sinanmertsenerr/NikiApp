// API Types - NikiTheCat Dashboard

// ==================== ENUMS ====================

export type WalletType = 'IEU' | 'NIKI';
export type TransactionType = 'topup' | 'payment' | 'refund' | 'reward';
export type CampaignStatus = 'active' | 'used' | 'expired';
export type CampaignType = 'auto' | 'manual';
export type RaffleStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type UserRole = 'customer' | 'admin' | 'super_admin';

// ==================== USER ====================

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    phoneVerified: boolean;
    avatarUrl?: string;
    role: UserRole;
    isActive: boolean;
    emailVerified: boolean;
    lastLoginAt?: string;
    createdAt: string;
    wallets?: Wallet[];
    loyaltyPoints?: LoyaltyPoints;
}

export interface LoyaltyPoints {
    totalPoints: number;
    redeemedPoints: number;
}

// ==================== WALLET ====================

export interface Wallet {
    id: string;
    userId: string;
    walletType: WalletType;
    balance: string;
    qrCode: string;
    isActive: boolean;
    allowNegative: boolean;
    negativeLimit: string;
}

export interface Transaction {
    id: string;
    walletId: string;
    type: TransactionType;
    amount: string;
    originalAmount?: string;
    discountApplied: string;
    discountPercentage: string;
    balanceBefore: string;
    balanceAfter: string;
    adminId?: string;
    description?: string;
    createdAt: string;
    wallet?: {
        walletType: WalletType;
        user?: {
            firstName: string;
            lastName: string;
            email: string;
        };
    };
    admin?: {
        firstName: string;
        lastName: string;
    };
}

// ==================== WALLET STATS ====================

export interface WalletStats {
    totalCreditsInCirculation: string;
    totalTopUps: string;
    totalPayments: string;
    totalRefunds: string;
    totalDiscountsGiven: string;
    walletsCount: number;
    transactionsCount: number;
    transactionBreakdown: {
        topup: number;
        payment: number;
        refund: number;
        reward: number;
    };
}

// ==================== CAMPAIGNS ====================

export interface Campaign {
    id: string;
    type: CampaignType;
    title: string;
    titleTr: string;
    description?: string;
    descriptionTr?: string;
    rewardType: string;
    rewardValue?: string;
    requiredPoints: number;
    imageUrl?: string;
    startDate?: string;
    endDate?: string;
    isActive: boolean;
    createdAt: string;
    _count?: {
        userCampaigns: number;
    };
}

export interface CampaignStats {
    totalCampaigns: number;
    totalActive: number;
    totalAssigned: number;
    totalUsed: number;
    totalExpired: number;
    usageRate: number;
    byType: {
        auto: { count: number; assigned: number; used: number };
        manual: { count: number; assigned: number; used: number };
    };
}

// ==================== DASHBOARD OVERVIEW ====================

export interface DashboardOverview {
    users: {
        totalUsers: number;
        verifiedUsers: number;
        activeUsers: number;
        newUsersInPeriod: number;
    };
    campaigns: CampaignStats;
    points: {
        totalPointsEarned: number;
        totalPointsRedeemed: number;
        totalPointsAvailable: number;
        usersWithPoints: number;
        averagePointsPerUser: number;
    };
    wheel: {
        totalSpins: number;
        winningSpins: number;
        winRate: number;
        rewardBreakdown: {
            points: number;
            discount: number;
            free_coffee: number;
            badge: number;
            nothing: number;
        };
    };
    period: {
        startDate: string | null;
        endDate: string | null;
    };
    generatedAt: string;
}

// ==================== RAFFLES ====================

export interface Raffle {
    id: string;
    title: string;
    titleTr: string;
    description?: string;
    descriptionTr?: string;
    rewardType: string;
    rewardValue?: string;
    startDate: string;
    endDate: string;
    winnerCount: number;
    status: RaffleStatus;
    drawnAt?: string;
    createdAt: string;
    _count?: {
        participants: number;
    };
}

// ==================== API RESPONSES ====================

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ApiError {
    message: string;
    statusCode: number;
    error?: string;
}

// ==================== AUTH ====================

export interface LoginCredentials {
    identifier: string; // email or phone
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
