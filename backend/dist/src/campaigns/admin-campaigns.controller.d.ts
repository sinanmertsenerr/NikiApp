import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, UpdateCampaignDto, GetCampaignsQueryDto, AssignCampaignDto, AssignCampaignBulkDto, RedeemCampaignDto, RedeemCampaignByQrDto, CampaignStatsQueryDto, CampaignUsersQueryDto, DashboardStatsQueryDto } from './dto';
export declare class AdminCampaignsController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
    getCampaigns(query: GetCampaignsQueryDto): Promise<{
        campaigns: {
            id: string;
            type: import("@prisma/client").$Enums.CampaignType;
            targetType: import("@prisma/client").$Enums.CampaignTargetType;
            title: string;
            titleTr: string;
            description: string | null;
            descriptionTr: string | null;
            rewardType: import("@prisma/client").$Enums.RewardType;
            rewardValue: string | undefined;
            requiredPoints: number;
            imageUrl: string | null;
            startDate: Date | null;
            endDate: Date | null;
            isActive: boolean;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getAllCampaignsStats(query: CampaignStatsQueryDto): Promise<{
        totalCampaigns: number;
        activeCampaigns: number;
        totalAssignments: number;
        totalRedemptions: number;
        overallUsageRate: number;
        campaignBreakdown: {
            campaignId: string;
            title: string;
            titleTr: string;
            totalAssigned: number;
            totalRedeemed: number;
            activeCount: number;
            expiredCount: number;
            usageRate: number;
        }[];
    }>;
    getCampaignStats(id: string, query: CampaignStatsQueryDto): Promise<{
        campaignId: string;
        title: string;
        titleTr: string;
        totalAssigned: number;
        totalRedeemed: number;
        activeCount: number;
        expiredCount: number;
        usageRate: number;
    }>;
    getCampaignUsers(id: string, query: CampaignUsersQueryDto): Promise<{
        users: {
            id: string;
            userId: string;
            email: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
            status: import("@prisma/client").$Enums.CampaignStatus;
            assignedAt: Date;
            redeemedAt: Date | null;
            redeemedBy: string | null;
            redeemedByName: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getCampaignGroups(id: string): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }[]>;
    getDashboardOverview(query: DashboardStatsQueryDto): Promise<{
        users: {
            totalUsers: number;
            verifiedUsers: number;
            activeUsers: number;
            newUsersInPeriod: number;
        };
        campaigns: {
            totalCampaigns: number;
            activeCampaigns: number;
            totalAssignments: number;
            totalRedemptions: number;
            overallUsageRate: number;
            campaignBreakdown: {
                campaignId: string;
                title: string;
                titleTr: string;
                totalAssigned: number;
                totalRedeemed: number;
                activeCount: number;
                expiredCount: number;
                usageRate: number;
            }[];
        };
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
        generatedAt: Date;
    }>;
    getCampaignById(id: string): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.CampaignType;
        targetType: import("@prisma/client").$Enums.CampaignTargetType;
        title: string;
        titleTr: string;
        description: string | null;
        descriptionTr: string | null;
        rewardType: import("@prisma/client").$Enums.RewardType;
        rewardValue: string | undefined;
        requiredPoints: number;
        imageUrl: string | null;
        startDate: Date | null;
        endDate: Date | null;
        isActive: boolean;
        createdAt: Date;
    }>;
    createCampaign(dto: CreateCampaignDto): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.CampaignType;
        targetType: import("@prisma/client").$Enums.CampaignTargetType;
        title: string;
        titleTr: string;
        description: string | null;
        descriptionTr: string | null;
        rewardType: import("@prisma/client").$Enums.RewardType;
        rewardValue: string | undefined;
        requiredPoints: number;
        imageUrl: string | null;
        startDate: Date | null;
        endDate: Date | null;
        isActive: boolean;
        createdAt: Date;
    }>;
    updateCampaign(id: string, dto: UpdateCampaignDto): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.CampaignType;
        targetType: import("@prisma/client").$Enums.CampaignTargetType;
        title: string;
        titleTr: string;
        description: string | null;
        descriptionTr: string | null;
        rewardType: import("@prisma/client").$Enums.RewardType;
        rewardValue: string | undefined;
        requiredPoints: number;
        imageUrl: string | null;
        startDate: Date | null;
        endDate: Date | null;
        isActive: boolean;
        createdAt: Date;
    }>;
    deleteCampaign(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    assignCampaign(dto: AssignCampaignDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.CampaignStatus;
        assignedAt: Date;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        campaign: {
            id: string;
            title: string;
            titleTr: string;
            rewardType: import("@prisma/client").$Enums.RewardType;
        };
    }>;
    assignCampaignBulk(dto: AssignCampaignBulkDto): Promise<{
        success: boolean;
        assignedCount: number;
        skippedCount: number;
        message: string;
    }>;
    redeemCampaign(dto: RedeemCampaignDto, admin: any): Promise<{
        success: boolean;
        message: string;
        rewardType: import("@prisma/client").$Enums.RewardType;
        rewardValue: string | undefined;
    }>;
    redeemCampaignByQr(dto: RedeemCampaignByQrDto, admin: any): Promise<{
        success: boolean;
        message: string;
        user: {
            id: string;
            email: string;
            fullName: string;
        };
        campaign: {
            id: string;
            title: string;
            titleTr: string;
            rewardType: import("@prisma/client").$Enums.RewardType;
            rewardValue: string | undefined;
        };
        redeemedAt: Date | null;
    }>;
}
