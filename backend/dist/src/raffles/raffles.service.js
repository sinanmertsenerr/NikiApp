"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RafflesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
const notification_1 = require("../notification");
let RafflesService = class RafflesService {
    prisma;
    notificationService;
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
    }
    async getRaffles(query) {
        const { page = 1, limit = 20, status } = query;
        const skip = (page - 1) * limit;
        const where = {};
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
    async getRaffleById(id) {
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
            throw new common_1.NotFoundException('Raffle not found');
        }
        return {
            ...raffle,
            participantCount: raffle._count.participants,
            _count: undefined,
        };
    }
    async createRaffle(dto) {
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        if (endDate <= startDate) {
            throw new common_1.BadRequestException('End date must be after start date');
        }
        const now = new Date();
        let status = 'pending';
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
    async updateRaffle(id, dto) {
        const existing = await this.prisma.raffle.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Raffle not found');
        }
        if (existing.status === 'completed') {
            throw new common_1.BadRequestException('Cannot update a completed raffle');
        }
        const data = {};
        if (dto.title !== undefined)
            data.title = dto.title;
        if (dto.titleTr !== undefined)
            data.titleTr = dto.titleTr;
        if (dto.description !== undefined)
            data.description = dto.description;
        if (dto.descriptionTr !== undefined)
            data.descriptionTr = dto.descriptionTr;
        if (dto.rewardType !== undefined)
            data.rewardType = dto.rewardType;
        if (dto.rewardValue !== undefined)
            data.rewardValue = dto.rewardValue;
        if (dto.startDate !== undefined)
            data.startDate = new Date(dto.startDate);
        if (dto.endDate !== undefined)
            data.endDate = new Date(dto.endDate);
        if (dto.winnerCount !== undefined)
            data.winnerCount = dto.winnerCount;
        if (dto.status !== undefined)
            data.status = dto.status;
        const raffle = await this.prisma.raffle.update({
            where: { id },
            data,
        });
        return raffle;
    }
    async deleteRaffle(id) {
        const existing = await this.prisma.raffle.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Raffle not found');
        }
        await this.prisma.raffle.delete({
            where: { id },
        });
        return { message: 'Raffle deleted successfully' };
    }
    async getRaffleParticipants(raffleId) {
        const raffle = await this.prisma.raffle.findUnique({
            where: { id: raffleId },
        });
        if (!raffle) {
            throw new common_1.NotFoundException('Raffle not found');
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
    async drawRaffle(raffleId, dto) {
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
            throw new common_1.NotFoundException('Raffle not found');
        }
        if (raffle.status === 'completed') {
            throw new common_1.BadRequestException('Raffle has already been drawn');
        }
        if (raffle.participants.length === 0) {
            throw new common_1.BadRequestException('No participants to draw from');
        }
        const winnerCount = dto?.winnerCount || raffle.winnerCount;
        const actualWinnerCount = Math.min(winnerCount, raffle.participants.length);
        const shuffled = [...raffle.participants].sort(() => Math.random() - 0.5);
        const winners = shuffled.slice(0, actualWinnerCount);
        const parsedRewardValue = raffle.rewardValue ? parseFloat(raffle.rewardValue) : null;
        const campaign = await this.prisma.campaign.create({
            data: {
                type: 'manual',
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
        for (const winner of winners) {
            const userCampaign = await this.prisma.userCampaign.create({
                data: {
                    userId: winner.userId,
                    campaignId: campaign.id,
                    status: 'active',
                },
            });
            await this.prisma.raffleParticipant.update({
                where: { id: winner.id },
                data: {
                    isWinner: true,
                    userCampaignId: userCampaign.id,
                },
            });
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
        await this.prisma.raffle.update({
            where: { id: raffleId },
            data: {
                status: 'completed',
                drawnAt: new Date(),
            },
        });
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
    async getUserRaffles(userId) {
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
    async joinRaffle(userId, raffleId) {
        const raffle = await this.prisma.raffle.findUnique({
            where: { id: raffleId },
        });
        if (!raffle) {
            throw new common_1.NotFoundException('Raffle not found');
        }
        const now = new Date();
        if (raffle.status !== 'active' || now < raffle.startDate || now >= raffle.endDate) {
            throw new common_1.BadRequestException('Raffle is not active');
        }
        const existing = await this.prisma.raffleParticipant.findUnique({
            where: {
                raffleId_userId: {
                    raffleId,
                    userId,
                },
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Already joined this raffle');
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
    async updateRaffleStatuses() {
        const now = new Date();
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
    }
};
exports.RafflesService = RafflesService;
exports.RafflesService = RafflesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        notification_1.NotificationService])
], RafflesService);
//# sourceMappingURL=raffles.service.js.map