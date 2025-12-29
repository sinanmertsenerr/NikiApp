import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { NotificationService } from '../notification';
import { RaffleStatus, RewardType, CampaignType, CampaignStatus } from '@prisma/client';
import {
    CreateRaffleDto,
    UpdateRaffleDto,
    GetRafflesQueryDto,
    DrawRaffleDto,
} from './dto';

@Injectable()
export class RafflesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
    ) { }

    // ==================== Admin Methods ====================

    // Get all raffles (admin)
    async getRaffles(query: GetRafflesQueryDto) {
        const { page = 1, limit = 20, status } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) {
            where.status = status;
        }

        const [raffles, total] = await Promise.all([
            this.prisma.raffle.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { participants: true },
                    },
                },
            }),
            this.prisma.raffle.count({ where }),
        ]);

        return {
            raffles: raffles.map(r => ({
                ...r,
                participantCount: r._count.participants,
                _count: undefined,
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // Get raffle by ID (admin)
    async getRaffleById(id: string) {
        const raffle = await this.prisma.raffle.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { participants: true },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                    orderBy: { joinedAt: 'desc' },
                },
            },
        });

        if (!raffle) {
            throw new NotFoundException('Raffle not found');
        }

        return {
            ...raffle,
            participantCount: raffle._count.participants,
            _count: undefined,
        };
    }

    // Create raffle (admin)
    async createRaffle(dto: CreateRaffleDto) {
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);

        if (endDate <= startDate) {
            throw new BadRequestException('End date must be after start date');
        }

        // Determine initial status based on dates
        const now = new Date();
        let status: RaffleStatus = 'pending';
        if (now >= startDate && now < endDate) {
            status = 'active';
        }

        const raffle = await this.prisma.raffle.create({
            data: {
                title: dto.title,
                titleTr: dto.titleTr,
                description: dto.description,
                descriptionTr: dto.descriptionTr,
                rewardType: dto.rewardType,
                rewardValue: dto.rewardValue,
                startDate,
                endDate,
                winnerCount: dto.winnerCount || 1,
                status,
            },
        });

        return raffle;
    }

    // Update raffle (admin)
    async updateRaffle(id: string, dto: UpdateRaffleDto) {
        const existing = await this.prisma.raffle.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Raffle not found');
        }

        if (existing.status === 'completed') {
            throw new BadRequestException('Cannot update a completed raffle');
        }

        const data: any = {};

        if (dto.title !== undefined) data.title = dto.title;
        if (dto.titleTr !== undefined) data.titleTr = dto.titleTr;
        if (dto.description !== undefined) data.description = dto.description;
        if (dto.descriptionTr !== undefined) data.descriptionTr = dto.descriptionTr;
        if (dto.rewardType !== undefined) data.rewardType = dto.rewardType;
        if (dto.rewardValue !== undefined) data.rewardValue = dto.rewardValue;
        if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
        if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
        if (dto.winnerCount !== undefined) data.winnerCount = dto.winnerCount;
        if (dto.status !== undefined) data.status = dto.status;

        const raffle = await this.prisma.raffle.update({
            where: { id },
            data,
        });

        return raffle;
    }

    // Delete raffle (admin)
    async deleteRaffle(id: string) {
        const existing = await this.prisma.raffle.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Raffle not found');
        }

        await this.prisma.raffle.delete({
            where: { id },
        });

        return { message: 'Raffle deleted successfully' };
    }

    // Get raffle participants (admin)
    async getRaffleParticipants(raffleId: string) {
        const raffle = await this.prisma.raffle.findUnique({
            where: { id: raffleId },
        });

        if (!raffle) {
            throw new NotFoundException('Raffle not found');
        }

        const participants = await this.prisma.raffleParticipant.findMany({
            where: { raffleId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: [
                { isWinner: 'desc' },
                { joinedAt: 'asc' },
            ],
        });

        return {
            participants,
            total: participants.length,
            winnerCount: participants.filter(p => p.isWinner).length,
        };
    }

    // Draw raffle - select winners (admin)
    async drawRaffle(raffleId: string, dto?: DrawRaffleDto) {
        const raffle = await this.prisma.raffle.findUnique({
            where: { id: raffleId },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });

        if (!raffle) {
            throw new NotFoundException('Raffle not found');
        }

        if (raffle.status === 'completed') {
            throw new BadRequestException('Raffle has already been drawn');
        }

        if (raffle.participants.length === 0) {
            throw new BadRequestException('No participants to draw from');
        }

        const winnerCount = dto?.winnerCount || raffle.winnerCount;
        const actualWinnerCount = Math.min(winnerCount, raffle.participants.length);

        // Randomly select winners
        const shuffled = [...raffle.participants].sort(() => Math.random() - 0.5);
        const winners = shuffled.slice(0, actualWinnerCount);

        // Create campaign for winners
        // Note: Campaign.rewardValue expects Decimal, but Raffle.rewardValue is now String (free text)
        // Only pass rewardValue if it's a valid number
        const parsedRewardValue = raffle.rewardValue ? parseFloat(raffle.rewardValue) : null;
        const campaign = await this.prisma.campaign.create({
            data: {
                type: 'manual' as CampaignType,
                title: `Raffle Winner: ${raffle.title}`,
                titleTr: `Çekiliş Kazananı: ${raffle.titleTr}`,
                description: raffle.rewardValue
                    ? `Prize: ${raffle.rewardValue}. ${raffle.description || ''}`
                    : (raffle.description || `You won the ${raffle.title} raffle!`),
                descriptionTr: raffle.rewardValue
                    ? `Ödül: ${raffle.rewardValue}. ${raffle.descriptionTr || ''}`
                    : (raffle.descriptionTr || `${raffle.titleTr} çekilişini kazandınız!`),
                rewardType: raffle.rewardType,
                rewardValue: parsedRewardValue !== null && !isNaN(parsedRewardValue) ? parsedRewardValue : undefined,
                isActive: true,
            },
        });

        // Process each winner
        for (const winner of winners) {
            // Create UserCampaign for winner
            const userCampaign = await this.prisma.userCampaign.create({
                data: {
                    userId: winner.userId,
                    campaignId: campaign.id,
                    status: 'active' as CampaignStatus,
                },
            });

            // Update participant as winner
            await this.prisma.raffleParticipant.update({
                where: { id: winner.id },
                data: {
                    isWinner: true,
                    userCampaignId: userCampaign.id,
                },
            });

            // Send notification to winner
            await this.notificationService.createNotification({
                userId: winner.userId,
                type: 'reward',
                title: '🎉 You won the raffle!',
                titleTr: '🎉 Çekilişi kazandınız!',
                message: `Congratulations! You won the ${raffle.title} raffle!`,
                messageTr: `Tebrikler! ${raffle.titleTr} çekilişini kazandınız!`,
                actionUrl: '/campaigns',
            });
        }

        // Update raffle status
        await this.prisma.raffle.update({
            where: { id: raffleId },
            data: {
                status: 'completed',
                drawnAt: new Date(),
            },
        });

        // Fetch updated participants
        const updatedParticipants = await this.prisma.raffleParticipant.findMany({
            where: { raffleId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: [
                { isWinner: 'desc' },
                { joinedAt: 'asc' },
            ],
        });

        return {
            message: `Drew ${actualWinnerCount} winner(s)`,
            winners: updatedParticipants.filter(p => p.isWinner),
            participants: updatedParticipants,
        };
    }

    // ==================== User Methods ====================

    // Get active raffles (user)
    async getActiveRaffles() {
        const now = new Date();

        const raffles = await this.prisma.raffle.findMany({
            where: {
                status: 'active',
                startDate: { lte: now },
                endDate: { gt: now },
            },
            orderBy: { endDate: 'asc' },
            include: {
                _count: {
                    select: { participants: true },
                },
            },
        });

        return raffles.map(r => ({
            ...r,
            participantCount: r._count.participants,
            _count: undefined,
        }));
    }

    // Get user's raffles (user)
    async getUserRaffles(userId: string) {
        const participations = await this.prisma.raffleParticipant.findMany({
            where: { userId },
            include: {
                raffle: {
                    include: {
                        _count: {
                            select: { participants: true },
                        },
                    },
                },
            },
            orderBy: { joinedAt: 'desc' },
        });

        return participations.map(p => ({
            id: p.id,
            raffle: {
                ...p.raffle,
                participantCount: p.raffle._count.participants,
                _count: undefined,
            },
            isWinner: p.isWinner,
            joinedAt: p.joinedAt,
            userCampaignId: p.userCampaignId,
            usedAt: p.usedAt,
        }));
    }

    // Join raffle (user)
    async joinRaffle(userId: string, raffleId: string) {
        const raffle = await this.prisma.raffle.findUnique({
            where: { id: raffleId },
        });

        if (!raffle) {
            throw new NotFoundException('Raffle not found');
        }

        const now = new Date();

        if (raffle.status !== 'active' || now < raffle.startDate || now >= raffle.endDate) {
            throw new BadRequestException('Raffle is not active');
        }

        // Check if already joined
        const existing = await this.prisma.raffleParticipant.findUnique({
            where: {
                raffleId_userId: {
                    raffleId,
                    userId,
                },
            },
        });

        if (existing) {
            throw new ConflictException('Already joined this raffle');
        }

        const participant = await this.prisma.raffleParticipant.create({
            data: {
                raffleId,
                userId,
            },
        });

        return {
            message: 'Successfully joined the raffle',
            participant,
        };
    }

    // Auto-update raffle statuses (can be called by cron or on demand)
    async updateRaffleStatuses() {
        const now = new Date();

        // Activate pending raffles
        await this.prisma.raffle.updateMany({
            where: {
                status: 'pending',
                startDate: { lte: now },
                endDate: { gt: now },
            },
            data: {
                status: 'active',
            },
        });

        // Note: We don't auto-complete raffles, admin must draw manually
    }
}
