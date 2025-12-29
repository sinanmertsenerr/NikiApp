import { WalletService } from './wallet.service';
import { GetTransactionsQueryDto } from './dto';
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    getMyWallet(user: any): Promise<{
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
    getMyTransactions(user: any, query: GetTransactionsQueryDto): Promise<{
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
}
