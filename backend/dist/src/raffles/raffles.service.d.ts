import { PrismaService } from '../prisma';
import { NotificationService } from '../notification';
import { CreateRaffleDto, UpdateRaffleDto, GetRafflesQueryDto, DrawRaffleDto } from './dto';
export declare class RafflesService {
    private readonly prisma;
    private readonly notificationService;
    constructor(prisma: PrismaService, notificationService: NotificationService);
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
    getRaffleById(id: string): Promise<{
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
    getRaffleParticipants(raffleId: string): Promise<{
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
    drawRaffle(raffleId: string, dto?: DrawRaffleDto): Promise<{
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
    getUserRaffles(userId: string): Promise<{
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
    updateRaffleStatuses(): Promise<void>;
}
