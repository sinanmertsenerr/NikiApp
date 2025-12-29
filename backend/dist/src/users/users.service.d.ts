import { PrismaService } from '../prisma';
import { EventsGateway } from '../events';
import { UpdateProfileDto, UpdateSettingsDto, GetUsersQueryDto, UpdateUserStatusDto } from './dto';
export declare class UsersService {
    private readonly prisma;
    private readonly eventsGateway;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
    getProfile(userId: string): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        firstName: string;
        lastName: string;
        bio: string | null;
        phone: string | null;
        avatarUrl: string | null;
        language: import("@prisma/client").$Enums.Language;
        theme: import("@prisma/client").$Enums.Theme;
        selectedBrand: import("@prisma/client").$Enums.Brand;
        emailVerified: boolean;
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        firstName: string;
        lastName: string;
        bio: string | null;
        phone: string | null;
        avatarUrl: string | null;
        language: import("@prisma/client").$Enums.Language;
        theme: import("@prisma/client").$Enums.Theme;
        selectedBrand: import("@prisma/client").$Enums.Brand;
        emailVerified: boolean;
    }>;
    updateAvatar(userId: string, avatarUrl: string): Promise<{
        id: string;
        avatarUrl: string | null;
    }>;
    deleteAvatar(userId: string): Promise<{
        id: string;
        avatarUrl: string | null;
    }>;
    updateSettings(userId: string, dto: UpdateSettingsDto): Promise<{
        id: string;
        language: import("@prisma/client").$Enums.Language;
        theme: import("@prisma/client").$Enums.Theme;
        selectedBrand: import("@prisma/client").$Enums.Brand;
    }>;
    getStats(userId: string): Promise<{
        totalPoints: number;
        availablePoints: number;
        redeemedPoints: number;
        nikiCredits: string;
        badgeCount: number;
        orderCount: number;
        activeCampaigns: number;
        wheelSpinsUsed: number;
    }>;
    getBadges(userId: string): Promise<{
        id: string;
        name: string;
        nameTr: string;
        description: string | null;
        descriptionTr: string | null;
        iconUrl: string | null;
        earnedAt: Date;
    }[]>;
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
    getUserById(userId: string, requesterId: string): Promise<{
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
    updateUserStatus(userId: string, dto: UpdateUserStatusDto, adminId: string): Promise<{
        id: string;
        isActive: boolean;
        email: string;
        firstName: string;
        lastName: string;
        role: import("@prisma/client").$Enums.UserRole;
    }>;
    savePushToken(userId: string, token: string): Promise<{
        success: boolean;
        message: string;
    }>;
    removePushToken(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    toggleIeuWalletStatus(userId: string, isActive: boolean, adminId: string): Promise<{
        success: boolean;
        ieuWalletActive: boolean;
    }>;
    toggleNegativeBalance(userId: string, walletType: 'IEU' | 'NIKI', allowNegative: boolean, negativeLimit?: number): Promise<{
        success: boolean;
        walletType: "IEU" | "NIKI";
        allowNegative: boolean;
        negativeLimit: number;
    }>;
}
