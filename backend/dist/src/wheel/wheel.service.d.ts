import { PrismaService } from '../prisma';
import { EventsGateway } from '../events';
import { WheelStatusResponseDto, SpinResultDto } from './dto';
export declare class WheelService {
    private prisma;
    private eventsGateway;
    private readonly wheelSegments;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
    getStatus(userId: string): Promise<WheelStatusResponseDto>;
    spin(userId: string): Promise<SpinResultDto>;
    getHistory(userId: string, limit?: number): Promise<{
        id: string;
        rewardType: import("@prisma/client").$Enums.WheelRewardType | null;
        rewardValue: string | null;
        year: number;
        spunAt: Date | null;
        weekNumber: number;
    }[]>;
    private getCurrentWeekInfo;
    private getNextMondayDate;
    private determineReward;
    private applyReward;
}
