import { RewardType, RaffleStatus } from '@prisma/client';
export declare class CreateRaffleDto {
    title: string;
    titleTr: string;
    description?: string;
    descriptionTr?: string;
    rewardType: RewardType;
    rewardValue?: string;
    startDate: string;
    endDate: string;
    winnerCount?: number;
}
export declare class UpdateRaffleDto {
    title?: string;
    titleTr?: string;
    description?: string;
    descriptionTr?: string;
    rewardType?: RewardType;
    rewardValue?: string;
    startDate?: string;
    endDate?: string;
    winnerCount?: number;
    status?: RaffleStatus;
}
export declare class GetRafflesQueryDto {
    page?: number;
    limit?: number;
    status?: RaffleStatus;
}
export declare class DrawRaffleDto {
    winnerCount?: number;
}
