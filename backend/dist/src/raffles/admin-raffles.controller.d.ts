import { RafflesService } from './raffles.service';
import { CreateRaffleDto, UpdateRaffleDto, GetRafflesQueryDto, DrawRaffleDto } from './dto';
export declare class AdminRafflesController {
    private readonly rafflesService;
    constructor(rafflesService: RafflesService);
    getRaffles(query: GetRafflesQueryDto): Promise<{
        raffles: {
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
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getRaffle(id: string): Promise<{
        participantCount: number;
        _count: undefined;
        participants: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            userCampaignId: string | null;
            joinedAt: Date;
            raffleId: string;
            isWinner: boolean;
            usedAt: Date | null;
        })[];
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
    }>;
    createRaffle(dto: CreateRaffleDto): Promise<{
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
    }>;
    updateRaffle(id: string, dto: UpdateRaffleDto): Promise<{
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
    }>;
    deleteRaffle(id: string): Promise<{
        message: string;
    }>;
    getParticipants(id: string): Promise<{
        participants: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            userCampaignId: string | null;
            joinedAt: Date;
            raffleId: string;
            isWinner: boolean;
            usedAt: Date | null;
        })[];
        total: number;
        winnerCount: number;
    }>;
    drawRaffle(id: string, dto: DrawRaffleDto): Promise<{
        message: string;
        winners: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            userCampaignId: string | null;
            joinedAt: Date;
            raffleId: string;
            isWinner: boolean;
            usedAt: Date | null;
        })[];
        participants: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            userCampaignId: string | null;
            joinedAt: Date;
            raffleId: string;
            isWinner: boolean;
            usedAt: Date | null;
        })[];
    }>;
}
