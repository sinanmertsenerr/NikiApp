import { TransactionType } from '@prisma/client';
export declare class WalletResponseDto {
    id: string;
    nikiCredits: string;
    qrCode: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class WalletWithUserDto extends WalletResponseDto {
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
export declare class TransactionResponseDto {
    id: string;
    type: TransactionType;
    amount: string;
    originalAmount?: string;
    discountApplied: string;
    discountPercentage: string;
    isFullPayment: boolean;
    balanceBefore: string;
    balanceAfter: string;
    description?: string;
    createdAt: Date;
    admin?: {
        id: string;
        firstName: string;
        lastName: string;
    };
}
export declare class PaginatedTransactionsDto {
    transactions: TransactionResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class TopUpResultDto {
    success: boolean;
    message: string;
    transaction: TransactionResponseDto;
    newBalance: string;
}
export declare class PaymentResultDto {
    success: boolean;
    message: string;
    transaction: TransactionResponseDto;
    originalAmount: string;
    chargedAmount: string;
    discountSaved: string;
    newBalance: string;
}
export declare class RefundResultDto {
    success: boolean;
    message: string;
    transaction: TransactionResponseDto;
    refundedAmount: string;
    newBalance: string;
}
export declare class WalletDashboardStatsDto {
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
