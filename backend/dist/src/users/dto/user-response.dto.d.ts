import { Language, Theme, Brand, UserRole } from '@prisma/client';
export declare class UserProfileResponseDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    bio?: string;
    phone?: string;
    avatarUrl?: string;
    language: Language;
    theme: Theme;
    selectedBrand: Brand;
    emailVerified: boolean;
    createdAt: Date;
}
export declare class UserStatsResponseDto {
    totalPoints: number;
    availablePoints: number;
    redeemedPoints: number;
    nikiCredits: string;
    badgeCount: number;
    orderCount: number;
    activeCampaigns: number;
    wheelSpinsUsed: number;
}
export declare class UserBadgeResponseDto {
    id: string;
    name: string;
    nameTr: string;
    description?: string;
    descriptionTr?: string;
    iconUrl?: string;
    earnedAt: Date;
}
export declare class AdminUserListItemDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role: UserRole;
    isActive: boolean;
    emailVerified: boolean;
    createdAt: Date;
    lastLoginAt?: Date;
}
export declare class AdminUserDetailDto extends AdminUserListItemDto {
    bio?: string;
    phone?: string;
    language: Language;
    theme: Theme;
    selectedBrand: Brand;
    stats: UserStatsResponseDto;
    badges: UserBadgeResponseDto[];
}
export declare class PaginatedUsersResponseDto {
    users: AdminUserListItemDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
