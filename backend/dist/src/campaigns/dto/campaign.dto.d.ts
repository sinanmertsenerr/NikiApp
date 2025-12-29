import { CampaignType, RewardType, CampaignTargetType } from '@prisma/client';
export declare class CreateCampaignDto {
    type: CampaignType;
    targetType?: CampaignTargetType;
    title: string;
    titleTr: string;
    description?: string;
    descriptionTr?: string;
    rewardType: RewardType;
    rewardValue?: number;
    requiredPoints?: number;
    imageUrl?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
}
export declare class UpdateCampaignDto {
    type?: CampaignType;
    targetType?: CampaignTargetType;
    title?: string;
    titleTr?: string;
    description?: string;
    descriptionTr?: string;
    rewardType?: RewardType;
    rewardValue?: number;
    requiredPoints?: number;
    imageUrl?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
}
export declare class AssignCampaignDto {
    userId: string;
    campaignId: string;
}
export declare class AssignCampaignBulkDto {
    campaignId: string;
    userIds?: string[];
    groupIds?: string[];
}
export declare class RedeemCampaignDto {
    userCampaignId: string;
}
export declare class RedeemCampaignByQrDto {
    qrCode: string;
}
export declare class GetCampaignsQueryDto {
    page?: number;
    limit?: number;
    type?: CampaignType;
    targetType?: CampaignTargetType;
    isActive?: boolean;
}
