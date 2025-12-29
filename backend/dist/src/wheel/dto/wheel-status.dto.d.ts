import { WheelRewardType } from '@prisma/client';
export declare class LastSpinDto {
    rewardType: WheelRewardType;
    rewardValue: string;
    spunAt: Date;
}
export declare class WheelStatusResponseDto {
    canSpin: boolean;
    spinRights: number;
    weekNumber: number;
    year: number;
    lastSpin?: LastSpinDto;
    nextSpinAvailable?: Date;
}
