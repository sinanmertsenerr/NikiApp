import { WalletService } from './wallet.service';
import { TopUpDto, PaymentDto, RefundDto, AdminTransactionsQueryDto } from './dto';
export declare class AdminWalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    scanQrCode(qrCode: string): Promise<{
        id: string;
        balance: string;
        qrCode: string;
        walletType: import("@prisma/client").$Enums.WalletType;
        discountRate: number;
        createdAt: Date;
        updatedAt: Date;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
            phone: string | null;
        };
        loyaltyPoints: {
            totalPoints: number;
            availablePoints: number;
        };
        activeCampaignsCount: number;
    }>;
    topUp(dto: TopUpDto, admin: any): Promise<{
        success: boolean;
        message: string;
        transaction: {
            id: any;
            type: any;
            amount: any;
            originalAmount: any;
            discountApplied: any;
            discountPercentage: any;
            isFullPayment: any;
            balanceBefore: any;
            balanceAfter: any;
            description: any;
            createdAt: any;
        };
        newBalance: string;
    }>;
    processPayment(dto: PaymentDto, admin: any): Promise<{
        success: boolean;
        message: string;
        transaction: {
            id: any;
            type: any;
            amount: any;
            originalAmount: any;
            discountApplied: any;
            discountPercentage: any;
            isFullPayment: any;
            balanceBefore: any;
            balanceAfter: any;
            description: any;
            createdAt: any;
        };
        originalAmount: string;
        chargedAmount: string;
        discountSaved: string;
        newBalance: string;
    }>;
    processRefund(dto: RefundDto, admin: any): Promise<{
        success: boolean;
        message: string;
        transaction: {
            id: any;
            type: any;
            amount: any;
            originalAmount: any;
            discountApplied: any;
            discountPercentage: any;
            isFullPayment: any;
            balanceBefore: any;
            balanceAfter: any;
            description: any;
            createdAt: any;
        };
        refundedAmount: string;
        newBalance: string;
    }>;
    getAllTransactions(query: AdminTransactionsQueryDto): Promise<{
        transactions: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            admin: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
            id: any;
            type: any;
            amount: any;
            originalAmount: any;
            discountApplied: any;
            discountPercentage: any;
            isFullPayment: any;
            balanceBefore: any;
            balanceAfter: any;
            description: any;
            createdAt: any;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getDashboardStats(startDate?: string, endDate?: string): Promise<{
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
    }>;
}
