import { UsersService } from './users.service';
import { UpdateProfileDto, UpdateSettingsDto } from './dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: any): Promise<{
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
    updateProfile(user: any, dto: UpdateProfileDto): Promise<{
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
    updateAvatar(user: any, avatarUrl: string): Promise<{
        id: string;
        avatarUrl: string | null;
    }>;
    deleteAvatar(user: any): Promise<{
        id: string;
        avatarUrl: string | null;
    }>;
    updateSettings(user: any, dto: UpdateSettingsDto): Promise<{
        id: string;
        language: import("@prisma/client").$Enums.Language;
        theme: import("@prisma/client").$Enums.Theme;
        selectedBrand: import("@prisma/client").$Enums.Brand;
    }>;
    getStats(user: any): Promise<{
        totalPoints: number;
        availablePoints: number;
        redeemedPoints: number;
        nikiCredits: string;
        badgeCount: number;
        orderCount: number;
        activeCampaigns: number;
        wheelSpinsUsed: number;
    }>;
    getBadges(user: any): Promise<{
        id: string;
        name: string;
        nameTr: string;
        description: string | null;
        descriptionTr: string | null;
        iconUrl: string | null;
        earnedAt: Date;
    }[]>;
    savePushToken(user: any, token: string): Promise<{
        success: boolean;
        message: string;
    }>;
    removePushToken(user: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
