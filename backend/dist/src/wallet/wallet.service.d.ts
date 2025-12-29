import { PrismaService } from '../prisma';
import { EventsGateway } from '../events';
import { TopUpDto, PaymentDto, RefundDto, GetTransactionsQueryDto, AdminTransactionsQueryDto } from './dto';
export declare class WalletService {
    private readonly prisma;
    private readonly eventsGateway;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
    getMyWallet(userId: string): Promise<{
        ieuWallet: {
            id: string;
            balance: string;
            qrCode: string;
            walletType: import("@prisma/client").$Enums.WalletType;
            discountRate: number;
            isActive: any;
        } | null;
        nikiWallet: {
            id: string;
            balance: string;
            qrCode: string;
            walletType: import("@prisma/client").$Enums.WalletType;
            discountRate: number;
            isActive: boolean;
        } | null;
        nikiCredits: string;
        qrCode: string;
    }>;
    getMyTransactions(userId: string, query: GetTransactionsQueryDto): Promise<{
        transactions: {
            walletType: any;
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
    topUp(dto: TopUpDto, adminId: string): Promise<{
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
    processPayment(dto: PaymentDto, adminId: string): Promise<{
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
    processRefund(dto: RefundDto, adminId: string): Promise<{
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
    private createWalletsForUser;
    private generateQrCode;
    private getTransactions;
    private getTransactionsForWallets;
    private formatTransaction;
    addReward(userId: string, amount: number, description: string): Promise<{
        success: boolean;
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
}
