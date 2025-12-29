import { WheelService } from './wheel.service';
export declare class WheelController {
    private readonly wheelService;
    constructor(wheelService: WheelService);
    getStatus(userId: string): Promise<{
        success: boolean;
        data: import("./dto").WheelStatusResponseDto;
    }>;
    spin(userId: string): Promise<{
        success: boolean;
        data: import("./dto").SpinResultDto;
    }>;
    getHistory(userId: string, limit?: number): Promise<{
        success: boolean;
        data: {
            spins: {
                id: string;
                rewardType: import("@prisma/client").$Enums.WheelRewardType | null;
                rewardValue: string | null;
                year: number;
                spunAt: Date | null;
                weekNumber: number;
            }[];
        };
    }>;
}
