import { CampaignStatus } from '@prisma/client';
export declare class CampaignStatsQueryDto {
    startDate?: string;
    endDate?: string;
}
export declare class CampaignUsersQueryDto {
    page?: number;
    limit?: number;
    status?: CampaignStatus;
    assignedAfter?: string;
    assignedBefore?: string;
}
export declare class DashboardStatsQueryDto {
    startDate?: string;
    endDate?: string;
}
export declare class CampaignStatsResponseDto {
    campaignId: string;
    title: string;
    titleTr: string;
    totalAssigned: number;
    totalRedeemed: number;
    activeCount: number;
    expiredCount: number;
    usageRate: number;
}
export declare class CampaignUserItemDto {
    id: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    status: CampaignStatus;
    assignedAt: Date;
    redeemedAt?: Date;
    redeemedBy?: string;
    redeemedByName?: string;
}
export declare class PaginatedCampaignUsersDto {
    users: CampaignUserItemDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class DashboardCampaignSummaryDto {
    totalCampaigns: number;
    activeCampaigns: number;
    totalAssignments: number;
    totalRedemptions: number;
    overallUsageRate: number;
    campaignBreakdown: CampaignStatsResponseDto[];
}
export declare class DashboardPointsSummaryDto {
    totalPointsEarned: number;
    totalPointsRedeemed: number;
    totalPointsAvailable: number;
    usersWithPoints: number;
    averagePointsPerUser: number;
}
export declare class DashboardWheelSummaryDto {
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
}
export declare class DashboardUsersSummaryDto {
    totalUsers: number;
    verifiedUsers: number;
    activeUsers: number;
    newUsersInPeriod: number;
}
export declare class DashboardOverviewDto {
    users: DashboardUsersSummaryDto;
    campaigns: DashboardCampaignSummaryDto;
    points: DashboardPointsSummaryDto;
    wheel: DashboardWheelSummaryDto;
    period: {
        startDate: string | null;
        endDate: string | null;
    };
    generatedAt: Date;
}
