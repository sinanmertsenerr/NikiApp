import { WheelRewardType } from '@prisma/client';
export declare class SpinResultDto {
    rewardType: WheelRewardType;
    rewardValue: string;
    message: string;
    spunAt: Date;
}
