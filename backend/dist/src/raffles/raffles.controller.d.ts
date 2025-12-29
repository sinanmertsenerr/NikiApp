import { RafflesService } from './raffles.service';
export declare class RafflesController {
    private readonly rafflesService;
    constructor(rafflesService: RafflesService);
    getActiveRaffles(): Promise<{
        participantCount: number;
        _count: undefined;
        id: string;
        title: string;
        titleTr: string;
        description: string | null;
        descriptionTr: string | null;
        rewardType: import("@prisma/client").$Enums.RewardType;
        rewardValue: string | null;
        startDate: Date;
        endDate: Date;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.RaffleStatus;
        winnerCount: number;
        drawnAt: Date | null;
    }[]>;
    getMyRaffles(userId: string): Promise<{
        id: string;
        raffle: {
            participantCount: number;
            _count: undefined;
            id: string;
            title: string;
            titleTr: string;
            description: string | null;
            descriptionTr: string | null;
            rewardType: import("@prisma/client").$Enums.RewardType;
            rewardValue: string | null;
            startDate: Date;
            endDate: Date;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.RaffleStatus;
            winnerCount: number;
            drawnAt: Date | null;
        };
        isWinner: boolean;
        joinedAt: Date;
        userCampaignId: string | null;
        usedAt: Date | null;
    }[]>;
    joinRaffle(userId: string, raffleId: string): Promise<{
        message: string;
        participant: {
            id: string;
            userId: string;
            userCampaignId: string | null;
            joinedAt: Date;
            raffleId: string;
            isWinner: boolean;
            usedAt: Date | null;
        };
    }>;
}
