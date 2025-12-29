import { UsersService } from './users.service';
import { GetUsersQueryDto, UpdateUserStatusDto, ToggleIeuWalletDto, ToggleNegativeBalanceDto } from './dto';
export declare class AdminUsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getUsers(query: GetUsersQueryDto): Promise<{
        users: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            avatarUrl: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            isActive: boolean;
            emailVerified: boolean;
            createdAt: Date;
            lastLoginAt: Date | null;
            wallet: {
                id: string;
                qrCode: string;
                balance: string;
            } | null;
            wallets: {
                ieu: {
                    id: string;
                    qrCode: string;
                    balance: string;
                    isActive: any;
                } | null;
                niki: {
                    id: string;
                    qrCode: string;
                    balance: string;
                    isActive: boolean;
                } | null;
            };
            loyaltyPoints: {
                totalPoints: number;
                availablePoints: number;
            } | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getUserById(id: string, admin: any): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        bio: string | null;
        phone: string | null;
        avatarUrl: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        language: import("@prisma/client").$Enums.Language;
        theme: import("@prisma/client").$Enums.Theme;
        selectedBrand: import("@prisma/client").$Enums.Brand;
        isActive: boolean;
        emailVerified: boolean;
        createdAt: Date;
        lastLoginAt: Date | null;
        wallet: {
            id: string;
            qrCode: string;
            balance: string;
            isActive: any;
        } | null;
        wallets: {
            ieu: {
                id: string;
                qrCode: string;
                balance: string;
                isActive: any;
                allowNegative: any;
                negativeLimit: number;
            } | null;
            niki: {
                id: string;
                qrCode: string;
                balance: string;
                isActive: boolean;
                allowNegative: any;
                negativeLimit: number;
            } | null;
        };
        loyaltyPoints: {
            totalPoints: number;
            availablePoints: number;
        } | null;
        stats: {
            totalPoints: number;
            availablePoints: number;
            redeemedPoints: number;
            ieuCredits: string;
            nikiCredits: string;
            badgeCount: number;
            orderCount: number;
            activeCampaigns: number;
            wheelSpinsUsed: number;
        };
        badges: {
            id: string;
            name: string;
            nameTr: string;
            description: string | null;
            descriptionTr: string | null;
            iconUrl: string | null;
            earnedAt: Date;
        }[];
    }>;
    updateUserStatus(id: string, dto: UpdateUserStatusDto, admin: any): Promise<{
        id: string;
        isActive: boolean;
        email: string;
        firstName: string;
        lastName: string;
        role: import("@prisma/client").$Enums.UserRole;
    }>;
    toggleIeuWalletStatus(id: string, dto: ToggleIeuWalletDto, admin: any): Promise<{
        success: boolean;
        ieuWalletActive: boolean;
    }>;
    toggleNegativeBalance(id: string, dto: ToggleNegativeBalanceDto, admin: any): Promise<{
        success: boolean;
        walletType: "IEU" | "NIKI";
        allowNegative: boolean;
        negativeLimit: number;
    }>;
}
