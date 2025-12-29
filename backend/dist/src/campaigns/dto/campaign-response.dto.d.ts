import { CampaignType, RewardType, CampaignStatus } from '@prisma/client';
export declare class CampaignResponseDto {
    id: string;
    type: CampaignType;
    title: string;
    titleTr: string;
    description?: string;
    descriptionTr?: string;
    rewardType: RewardType;
    rewardValue?: string;
    requiredPoints: number;
    imageUrl?: string;
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    createdAt: Date;
}
export declare class UserCampaignResponseDto {
    id: string;
    status: CampaignStatus;
    assignedAt: Date;
    redeemedAt?: Date;
    campaign: CampaignResponseDto;
}
export declare class PaginatedCampaignsResponseDto {
    campaigns: CampaignResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class UserCampaignListResponseDto {
    campaigns: UserCampaignResponseDto[];
    total: number;
}
export declare class CampaignRedeemResultDto {
    success: boolean;
    message: string;
    rewardType: RewardType;
    rewardValue?: string;
}
