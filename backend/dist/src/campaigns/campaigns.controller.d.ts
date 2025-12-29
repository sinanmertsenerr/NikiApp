import { CampaignsService } from './campaigns.service';
export declare class CampaignsController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
    getMyCampaigns(user: any): Promise<{
        campaigns: {
            id: string;
            qrCode: string;
            status: import("@prisma/client").$Enums.CampaignStatus;
            assignedAt: Date;
            redeemedAt: Date | null;
            expiresAt: Date | null;
            campaign: {
                id: string;
                type: import("@prisma/client").$Enums.CampaignType;
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
            };
        }[];
        total: number;
    }>;
    getMyActiveCampaigns(user: any): Promise<{
        campaigns: {
            id: string;
            status: import("@prisma/client").$Enums.CampaignStatus;
            assignedAt: Date;
            expiresAt: Date | null;
            campaign: {
                id: string;
                type: import("@prisma/client").$Enums.CampaignType;
                title: string;
                titleTr: string;
                description: string | null;
                descriptionTr: string | null;
                rewardType: import("@prisma/client").$Enums.RewardType;
                rewardValue: string | undefined;
                requiredPoints: number;
                imageUrl: string | null;
                isActive: boolean;
                createdAt: Date;
            };
        }[];
        total: number;
    }>;
    getAvailableCampaigns(user: any): Promise<{
        campaigns: {
            id: string;
            type: import("@prisma/client").$Enums.CampaignType;
            title: string;
            titleTr: string;
            description: string | null;
            descriptionTr: string | null;
            rewardType: import("@prisma/client").$Enums.RewardType;
            rewardValue: string | undefined;
            requiredPoints: number;
            imageUrl: string | null;
            isActive: boolean;
            createdAt: Date;
        }[];
        availablePoints: number;
    }>;
    claimCampaign(user: any, campaignId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.CampaignStatus;
        assignedAt: Date;
        campaign: {
            id: string;
            title: string;
            titleTr: string;
            rewardType: import("@prisma/client").$Enums.RewardType;
            rewardValue: string | undefined;
        };
        pointsSpent: number;
    }>;
}
