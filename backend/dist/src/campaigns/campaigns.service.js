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
exports.CampaignsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
const notification_1 = require("../notification");
const events_1 = require("../events");
const client_1 = require("@prisma/client");
let CampaignsService = class CampaignsService {
    prisma;
    notificationService;
    eventsGateway;
    constructor(prisma, notificationService, eventsGateway) {
        this.prisma = prisma;
        this.notificationService = notificationService;
        this.eventsGateway = eventsGateway;
    }
    async getUserCampaigns(userId) {
        const userCampaigns = await this.prisma.userCampaign.findMany({
            where: { userId },
            select: {
                id: true,
                status: true,
                assignedAt: true,
                redeemedAt: true,
                expiresAt: true,
                campaign: {
                    select: {
                        id: true,
                        type: true,
                        title: true,
                        titleTr: true,
                        description: true,
                        descriptionTr: true,
                        rewardType: true,
                        rewardValue: true,
                        requiredPoints: true,
                        imageUrl: true,
                        startDate: true,
                        endDate: true,
                        isActive: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { assignedAt: 'desc' },
        });
        return {
            campaigns: userCampaigns.map((uc) => ({
                id: uc.id,
                qrCode: `CAMPAIGN-${uc.id}`,
                status: uc.status,
                assignedAt: uc.assignedAt,
                redeemedAt: uc.redeemedAt,
                expiresAt: uc.expiresAt,
                campaign: {
                    id: uc.campaign.id,
                    type: uc.campaign.type,
                    title: uc.campaign.title,
                    titleTr: uc.campaign.titleTr,
                    description: uc.campaign.description,
                    descriptionTr: uc.campaign.descriptionTr,
                    rewardType: uc.campaign.rewardType,
                    rewardValue: uc.campaign.rewardValue?.toString(),
                    requiredPoints: uc.campaign.requiredPoints,
                    imageUrl: uc.campaign.imageUrl,
                    startDate: uc.campaign.startDate,
                    endDate: uc.campaign.endDate,
                    isActive: uc.campaign.isActive,
                    createdAt: uc.campaign.createdAt,
                },
            })),
            total: userCampaigns.length,
        };
    }
    async getActiveCampaigns(userId) {
        const now = new Date();
        const userCampaigns = await this.prisma.userCampaign.findMany({
            where: {
                userId,
                status: client_1.CampaignStatus.active,
                campaign: {
                    isActive: true,
                    OR: [
                        { endDate: null },
                        { endDate: { gte: now } },
                    ],
                },
            },
            select: {
                id: true,
                status: true,
                assignedAt: true,
                expiresAt: true,
                campaign: {
                    select: {
                        id: true,
                        type: true,
                        title: true,
                        titleTr: true,
                        description: true,
                        descriptionTr: true,
                        rewardType: true,
                        rewardValue: true,
                        requiredPoints: true,
                        imageUrl: true,
                        isActive: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { assignedAt: 'desc' },
        });
        return {
            campaigns: userCampaigns.map((uc) => ({
                id: uc.id,
                status: uc.status,
                assignedAt: uc.assignedAt,
                expiresAt: uc.expiresAt,
                campaign: {
                    id: uc.campaign.id,
                    type: uc.campaign.type,
                    title: uc.campaign.title,
                    titleTr: uc.campaign.titleTr,
                    description: uc.campaign.description,
                    descriptionTr: uc.campaign.descriptionTr,
                    rewardType: uc.campaign.rewardType,
                    rewardValue: uc.campaign.rewardValue?.toString(),
                    requiredPoints: uc.campaign.requiredPoints,
                    imageUrl: uc.campaign.imageUrl,
                    isActive: uc.campaign.isActive,
                    createdAt: uc.campaign.createdAt,
                },
            })),
            total: userCampaigns.length,
        };
    }
    async getAvailableCampaigns(userId) {
        const [loyaltyPoints, autoCampaigns, userActiveCampaigns] = await Promise.all([
            this.prisma.loyaltyPoints.findUnique({
                where: { userId },
            }),
            this.prisma.campaign.findMany({
                where: {
                    type: client_1.CampaignType.auto,
                    isActive: true,
                },
            }),
            this.prisma.userCampaign.findMany({
                where: {
                    userId,
                    status: client_1.CampaignStatus.active,
                },
                select: { campaignId: true },
            }),
        ]);
        const availablePoints = (loyaltyPoints?.totalPoints ?? 0) - (loyaltyPoints?.redeemedPoints ?? 0);
        const existingCampaignIds = new Set(userActiveCampaigns.map((uc) => uc.campaignId));
        const available = autoCampaigns.filter((c) => c.requiredPoints <= availablePoints && !existingCampaignIds.has(c.id));
        return {
            campaigns: available.map((c) => ({
                id: c.id,
                type: c.type,
                title: c.title,
                titleTr: c.titleTr,
                description: c.description,
                descriptionTr: c.descriptionTr,
                rewardType: c.rewardType,
                rewardValue: c.rewardValue?.toString(),
                requiredPoints: c.requiredPoints,
                imageUrl: c.imageUrl,
                isActive: c.isActive,
                createdAt: c.createdAt,
            })),
            availablePoints,
        };
    }
    async claimCampaign(userId, campaignId) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
        });
        if (!campaign) {
            throw new common_1.NotFoundException('Campaign not found');
        }
        if (campaign.type !== client_1.CampaignType.auto) {
            throw new common_1.BadRequestException('Only auto campaigns can be claimed');
        }
        if (!campaign.isActive) {
            throw new common_1.BadRequestException('Campaign is not active');
        }
        const loyaltyPoints = await this.prisma.loyaltyPoints.findUnique({
            where: { userId },
        });
        const availablePoints = (loyaltyPoints?.totalPoints ?? 0) - (loyaltyPoints?.redeemedPoints ?? 0);
        if (availablePoints < campaign.requiredPoints) {
            throw new common_1.BadRequestException('Not enough points to claim this campaign');
        }
        const existing = await this.prisma.userCampaign.findFirst({
            where: {
                userId,
                campaignId,
                status: client_1.CampaignStatus.active,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('You already have this campaign');
        }
        const [userCampaign] = await this.prisma.$transaction([
            this.prisma.userCampaign.create({
                data: {
                    userId,
                    campaignId,
                    status: client_1.CampaignStatus.active,
                },
                include: { campaign: true },
            }),
            this.prisma.loyaltyPoints.update({
                where: { userId },
                data: {
                    redeemedPoints: { increment: campaign.requiredPoints },
                },
            }),
        ]);
        this.eventsGateway.emitCampaignAssigned(userId, {
            campaignId: campaign.id,
            campaignTitle: campaign.title,
            campaignTitleTr: campaign.titleTr || campaign.title,
        });
        return {
            id: userCampaign.id,
            status: userCampaign.status,
            assignedAt: userCampaign.assignedAt,
            campaign: {
                id: campaign.id,
                title: campaign.title,
                titleTr: campaign.titleTr,
                rewardType: campaign.rewardType,
                rewardValue: campaign.rewardValue?.toString(),
            },
            pointsSpent: campaign.requiredPoints,
        };
    }
    async getCampaigns(query) {
        const { page = 1, limit = 20, type, targetType, isActive } = query;
        const skip = (page - 1) * limit;
        const where = {
            NOT: {
                title: { startsWith: 'Raffle Winner:' },
            },
        };
        if (type) {
            where.type = type;
        }
        else {
            where.type = 'manual';
        }
        if (targetType) {
            where.targetType = targetType;
        }
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        const [campaigns, total] = await Promise.all([
            this.prisma.campaign.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.campaign.count({ where }),
        ]);
        return {
            campaigns: campaigns.map((c) => ({
                id: c.id,
                type: c.type,
                targetType: c.targetType,
                title: c.title,
                titleTr: c.titleTr,
                description: c.description,
                descriptionTr: c.descriptionTr,
                rewardType: c.rewardType,
                rewardValue: c.rewardValue?.toString(),
                requiredPoints: c.requiredPoints,
                imageUrl: c.imageUrl,
                startDate: c.startDate,
                endDate: c.endDate,
                isActive: c.isActive,
                createdAt: c.createdAt,
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getCampaignById(id) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id },
        });
        if (!campaign) {
            throw new common_1.NotFoundException('Campaign not found');
        }
        return {
            id: campaign.id,
            type: campaign.type,
            targetType: campaign.targetType,
            title: campaign.title,
            titleTr: campaign.titleTr,
            description: campaign.description,
            descriptionTr: campaign.descriptionTr,
            rewardType: campaign.rewardType,
            rewardValue: campaign.rewardValue?.toString(),
            requiredPoints: campaign.requiredPoints,
            imageUrl: campaign.imageUrl,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            isActive: campaign.isActive,
            createdAt: campaign.createdAt,
        };
    }
    async createCampaign(dto) {
        const campaign = await this.prisma.campaign.create({
            data: {
                type: dto.type,
                targetType: dto.targetType,
                title: dto.title,
                titleTr: dto.titleTr,
                description: dto.description,
                descriptionTr: dto.descriptionTr,
                rewardType: dto.rewardType,
                rewardValue: dto.rewardValue,
                requiredPoints: dto.requiredPoints ?? 10,
                imageUrl: dto.imageUrl,
                startDate: dto.startDate ? new Date(dto.startDate) : null,
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                isActive: dto.isActive ?? true,
            },
        });
        this.eventsGateway.emitCampaignUpdated({
            campaignId: campaign.id,
            updateType: 'created',
        });
        return {
            id: campaign.id,
            type: campaign.type,
            targetType: campaign.targetType,
            title: campaign.title,
            titleTr: campaign.titleTr,
            description: campaign.description,
            descriptionTr: campaign.descriptionTr,
            rewardType: campaign.rewardType,
            rewardValue: campaign.rewardValue?.toString(),
            requiredPoints: campaign.requiredPoints,
            imageUrl: campaign.imageUrl,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            isActive: campaign.isActive,
            createdAt: campaign.createdAt,
        };
    }
    async updateCampaign(id, dto) {
        const existing = await this.prisma.campaign.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Campaign not found');
        }
        const campaign = await this.prisma.campaign.update({
            where: { id },
            data: {
                type: dto.type,
                targetType: dto.targetType,
                title: dto.title,
                titleTr: dto.titleTr,
                description: dto.description,
                descriptionTr: dto.descriptionTr,
                rewardType: dto.rewardType,
                rewardValue: dto.rewardValue,
                requiredPoints: dto.requiredPoints,
                imageUrl: dto.imageUrl,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                isActive: dto.isActive,
            },
        });
        this.eventsGateway.emitCampaignUpdated({
            campaignId: campaign.id,
            updateType: 'updated',
        });
        return {
            id: campaign.id,
            type: campaign.type,
            targetType: campaign.targetType,
            title: campaign.title,
            titleTr: campaign.titleTr,
            description: campaign.description,
            descriptionTr: campaign.descriptionTr,
            rewardType: campaign.rewardType,
            rewardValue: campaign.rewardValue?.toString(),
            requiredPoints: campaign.requiredPoints,
            imageUrl: campaign.imageUrl,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            isActive: campaign.isActive,
            createdAt: campaign.createdAt,
        };
    }
    async deleteCampaign(id) {
        const existing = await this.prisma.campaign.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Campaign not found');
        }
        await this.prisma.campaign.delete({ where: { id } });
        this.eventsGateway.emitCampaignUpdated({
            campaignId: id,
            updateType: 'deleted',
        });
        return { success: true, message: 'Campaign deleted' };
    }
    async assignCampaignToUser(userId, campaignId) {
        const [user, campaign] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: userId } }),
            this.prisma.campaign.findUnique({ where: { id: campaignId } }),
        ]);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!campaign) {
            throw new common_1.NotFoundException('Campaign not found');
        }
        const userCampaign = await this.prisma.userCampaign.create({
            data: {
                userId,
                campaignId,
                status: client_1.CampaignStatus.active,
            },
            include: { campaign: true, user: true },
        });
        this.notificationService.sendToUser(userId, 'Niki Coffee', `Yeni Kampanya: ${campaign.title}`, { type: 'campaign_assigned', campaignId }).catch((err) => console.error('Failed to send notification:', err));
        this.notificationService.createNotification({
            userId,
            type: 'campaign',
            title: 'New Campaign',
            titleTr: 'Yeni Kampanya',
            message: `You have received a new campaign: ${campaign.title}`,
            messageTr: `Yeni bir kampanya aldınız: ${campaign.titleTr || campaign.title}`,
            actionUrl: '/(tabs)/campaigns',
            metadata: { campaignId: campaign.id },
        }).catch((err) => console.error('Failed to create in-app notification:', err));
        this.eventsGateway.emitCampaignAssigned(userId, {
            campaignId: campaign.id,
            campaignTitle: campaign.title,
            campaignTitleTr: campaign.titleTr || campaign.title,
        });
        this.eventsGateway.emitCampaignUpdated({
            campaignId: campaign.id,
            updateType: 'assigned',
            assignedCount: 1,
        });
        return {
            id: userCampaign.id,
            status: userCampaign.status,
            assignedAt: userCampaign.assignedAt,
            user: {
                id: userCampaign.user.id,
                email: userCampaign.user.email,
                firstName: userCampaign.user.firstName,
                lastName: userCampaign.user.lastName,
            },
            campaign: {
                id: userCampaign.campaign.id,
                title: userCampaign.campaign.title,
                titleTr: userCampaign.campaign.titleTr,
                rewardType: userCampaign.campaign.rewardType,
            },
        };
    }
    async assignCampaignToUsers(campaignId, userIds, groupIds) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
        });
        if (!campaign) {
            throw new common_1.NotFoundException('Campaign not found');
        }
        let targetUserIds = [];
        if (groupIds && groupIds.length > 0) {
            for (const groupId of groupIds) {
                try {
                    await this.prisma.campaignGroup.upsert({
                        where: {
                            campaignId_groupId: {
                                campaignId,
                                groupId
                            }
                        },
                        update: {},
                        create: {
                            campaignId,
                            groupId
                        }
                    });
                }
                catch (error) {
                    console.error(`Failed to link group ${groupId} to campaign ${campaignId}`, error);
                }
            }
            const groupMembers = await this.prisma.groupMember.findMany({
                where: {
                    groupId: { in: groupIds },
                },
                select: { userId: true },
            });
            const groupUserIds = groupMembers.map((gm) => gm.userId);
            targetUserIds = [...new Set(groupUserIds)];
        }
        else if (!userIds || userIds.length === 0) {
            const allUsers = await this.prisma.user.findMany({
                where: {
                    isActive: true,
                    emailVerified: true,
                    role: 'customer',
                },
                select: { id: true },
            });
            targetUserIds = allUsers.map((u) => u.id);
        }
        else {
            const users = await this.prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true },
            });
            targetUserIds = users.map((u) => u.id);
            if (targetUserIds.length !== userIds.length) {
                const missingCount = userIds.length - targetUserIds.length;
                throw new common_1.BadRequestException(`${missingCount} user(s) not found`);
            }
        }
        const existingAssignments = await this.prisma.userCampaign.findMany({
            where: {
                campaignId,
                userId: { in: targetUserIds },
                status: client_1.CampaignStatus.active,
            },
            select: { userId: true },
        });
        const alreadyAssignedIds = new Set(existingAssignments.map((e) => e.userId));
        const newUserIds = targetUserIds.filter((id) => !alreadyAssignedIds.has(id));
        if (newUserIds.length === 0) {
            return {
                success: true,
                assignedCount: 0,
                skippedCount: targetUserIds.length,
                message: 'All users already have this campaign',
            };
        }
        await this.prisma.userCampaign.createMany({
            data: newUserIds.map((userId) => ({
                userId,
                campaignId,
                status: client_1.CampaignStatus.active,
            })),
        });
        this.notificationService.sendToUsers(newUserIds, 'Niki Coffee', `Yeni Kampanya: ${campaign.title}`, { type: 'campaign_assigned', campaignId }).catch((err) => console.error('Failed to send notifications:', err));
        Promise.all(newUserIds.map((userId) => this.notificationService.createNotification({
            userId,
            type: 'campaign',
            title: 'New Campaign',
            titleTr: 'Yeni Kampanya',
            message: `You have received a new campaign: ${campaign.title}`,
            messageTr: `Yeni bir kampanya aldınız: ${campaign.titleTr || campaign.title}`,
            actionUrl: '/(tabs)/campaigns',
            metadata: { campaignId: campaign.id },
        }))).catch((err) => console.error('Failed to create in-app notifications:', err));
        newUserIds.forEach((userId) => {
            this.eventsGateway.emitCampaignAssigned(userId, {
                campaignId: campaign.id,
                campaignTitle: campaign.title,
                campaignTitleTr: campaign.titleTr || campaign.title,
            });
        });
        this.eventsGateway.emitCampaignUpdated({
            campaignId: campaign.id,
            updateType: 'assigned',
            assignedCount: newUserIds.length,
        });
        return {
            success: true,
            assignedCount: newUserIds.length,
            skippedCount: targetUserIds.length - newUserIds.length,
            message: `Campaign assigned to ${newUserIds.length} users`,
        };
    }
    async getCampaignAssignedGroups(campaignId) {
        const campaignGroups = await this.prisma.campaignGroup.findMany({
            where: { campaignId },
            include: {
                group: true
            }
        });
        return campaignGroups.map(cg => cg.group);
    }
    async redeemCampaign(userCampaignId, adminId) {
        const userCampaign = await this.prisma.userCampaign.findUnique({
            where: { id: userCampaignId },
            include: { campaign: true },
        });
        if (!userCampaign) {
            throw new common_1.NotFoundException('User campaign not found');
        }
        if (userCampaign.status !== client_1.CampaignStatus.active) {
            throw new common_1.BadRequestException('Campaign is not active or already redeemed');
        }
        if (userCampaign.campaign.endDate && new Date(userCampaign.campaign.endDate) < new Date()) {
            await this.prisma.userCampaign.update({
                where: { id: userCampaignId },
                data: { status: client_1.CampaignStatus.expired },
            });
            throw new common_1.BadRequestException('Campaign has expired');
        }
        const updated = await this.prisma.userCampaign.update({
            where: { id: userCampaignId },
            data: {
                status: client_1.CampaignStatus.used,
                redeemedAt: new Date(),
                redeemedBy: adminId,
            },
            include: { campaign: true, user: true },
        });
        this.eventsGateway.emitCampaignAssigned(updated.userId, {
            campaignId: updated.campaignId,
            campaignTitle: updated.campaign.title,
            campaignTitleTr: updated.campaign.titleTr || updated.campaign.title,
        });
        this.eventsGateway.emitCampaignUpdated({
            campaignId: updated.campaignId,
            updateType: 'updated',
        });
        return {
            success: true,
            message: 'Campaign redeemed successfully',
            rewardType: updated.campaign.rewardType,
            rewardValue: updated.campaign.rewardValue?.toString(),
        };
    }
    async redeemCampaignByQr(qrCode, adminId) {
        if (!qrCode.startsWith('CAMPAIGN-')) {
            throw new common_1.BadRequestException('Invalid campaign QR code format');
        }
        const userCampaignId = qrCode.replace('CAMPAIGN-', '');
        const userCampaign = await this.prisma.userCampaign.findUnique({
            where: { id: userCampaignId },
            include: {
                campaign: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            },
        });
        if (!userCampaign) {
            throw new common_1.NotFoundException('Campaign not found');
        }
        if (userCampaign.status === client_1.CampaignStatus.used) {
            throw new common_1.BadRequestException('Campaign already used');
        }
        if (userCampaign.status === client_1.CampaignStatus.expired) {
            throw new common_1.BadRequestException('Campaign has expired');
        }
        if (userCampaign.campaign.endDate && new Date(userCampaign.campaign.endDate) < new Date()) {
            await this.prisma.userCampaign.update({
                where: { id: userCampaignId },
                data: { status: client_1.CampaignStatus.expired },
            });
            throw new common_1.BadRequestException('Campaign has expired');
        }
        const updated = await this.prisma.userCampaign.update({
            where: { id: userCampaignId },
            data: {
                status: client_1.CampaignStatus.used,
                redeemedAt: new Date(),
                redeemedBy: adminId,
            },
            include: {
                campaign: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            },
        });
        this.eventsGateway.emitCampaignAssigned(updated.userId, {
            campaignId: updated.campaignId,
            campaignTitle: updated.campaign.title,
            campaignTitleTr: updated.campaign.titleTr || updated.campaign.title,
        });
        this.eventsGateway.emitCampaignUpdated({
            campaignId: updated.campaignId,
            updateType: 'updated',
        });
        return {
            success: true,
            message: 'Campaign redeemed successfully',
            user: {
                id: updated.user.id,
                email: updated.user.email,
                fullName: `${updated.user.firstName} ${updated.user.lastName}`,
            },
            campaign: {
                id: updated.campaign.id,
                title: updated.campaign.title,
                titleTr: updated.campaign.titleTr,
                rewardType: updated.campaign.rewardType,
                rewardValue: updated.campaign.rewardValue?.toString(),
            },
            redeemedAt: updated.redeemedAt,
        };
    }
    async getCampaignStats(campaignId, query) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
        });
        if (!campaign) {
            throw new common_1.NotFoundException('Campaign not found');
        }
        const dateFilter = {};
        if (query.startDate) {
            dateFilter.assignedAt = { gte: new Date(query.startDate) };
        }
        if (query.endDate) {
            dateFilter.assignedAt = {
                ...dateFilter.assignedAt,
                lte: new Date(query.endDate),
            };
        }
        const [totalAssigned, totalRedeemed, activeCount, expiredCount] = await Promise.all([
            this.prisma.userCampaign.count({
                where: { campaignId, ...dateFilter },
            }),
            this.prisma.userCampaign.count({
                where: { campaignId, status: client_1.CampaignStatus.used, ...dateFilter },
            }),
            this.prisma.userCampaign.count({
                where: { campaignId, status: client_1.CampaignStatus.active, ...dateFilter },
            }),
            this.prisma.userCampaign.count({
                where: { campaignId, status: client_1.CampaignStatus.expired, ...dateFilter },
            }),
        ]);
        const usageRate = totalAssigned > 0 ? (totalRedeemed / totalAssigned) * 100 : 0;
        return {
            campaignId: campaign.id,
            title: campaign.title,
            titleTr: campaign.titleTr,
            totalAssigned,
            totalRedeemed,
            activeCount,
            expiredCount,
            usageRate: Math.round(usageRate * 100) / 100,
        };
    }
    async getCampaignUsers(campaignId, query) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
        });
        if (!campaign) {
            throw new common_1.NotFoundException('Campaign not found');
        }
        const { page = 1, limit = 20, status, assignedAfter, assignedBefore } = query;
        const skip = (page - 1) * limit;
        const where = { campaignId };
        if (status) {
            where.status = status;
        }
        if (assignedAfter || assignedBefore) {
            where.assignedAt = {};
            if (assignedAfter) {
                where.assignedAt.gte = new Date(assignedAfter);
            }
            if (assignedBefore) {
                where.assignedAt.lte = new Date(assignedBefore);
            }
        }
        const [userCampaigns, total] = await Promise.all([
            this.prisma.userCampaign.findMany({
                where,
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
                    redeemer: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { assignedAt: 'desc' },
            }),
            this.prisma.userCampaign.count({ where }),
        ]);
        return {
            users: userCampaigns.map((uc) => ({
                id: uc.id,
                userId: uc.user.id,
                email: uc.user.email,
                firstName: uc.user.firstName,
                lastName: uc.user.lastName,
                avatarUrl: uc.user.avatarUrl,
                status: uc.status,
                assignedAt: uc.assignedAt,
                redeemedAt: uc.redeemedAt,
                redeemedBy: uc.redeemedBy,
                redeemedByName: uc.redeemer
                    ? `${uc.redeemer.firstName} ${uc.redeemer.lastName}`
                    : null,
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getAllCampaignsStats(query) {
        const campaigns = await this.prisma.campaign.findMany({
            orderBy: { createdAt: 'desc' },
        });
        const dateFilter = {};
        if (query.startDate) {
            dateFilter.assignedAt = { gte: new Date(query.startDate) };
        }
        if (query.endDate) {
            dateFilter.assignedAt = {
                ...dateFilter.assignedAt,
                lte: new Date(query.endDate),
            };
        }
        const stats = await Promise.all(campaigns.map(async (campaign) => {
            const [totalAssigned, totalRedeemed, activeCount, expiredCount] = await Promise.all([
                this.prisma.userCampaign.count({
                    where: { campaignId: campaign.id, ...dateFilter },
                }),
                this.prisma.userCampaign.count({
                    where: { campaignId: campaign.id, status: client_1.CampaignStatus.used, ...dateFilter },
                }),
                this.prisma.userCampaign.count({
                    where: { campaignId: campaign.id, status: client_1.CampaignStatus.active, ...dateFilter },
                }),
                this.prisma.userCampaign.count({
                    where: { campaignId: campaign.id, status: client_1.CampaignStatus.expired, ...dateFilter },
                }),
            ]);
            const usageRate = totalAssigned > 0 ? (totalRedeemed / totalAssigned) * 100 : 0;
            return {
                campaignId: campaign.id,
                title: campaign.title,
                titleTr: campaign.titleTr,
                totalAssigned,
                totalRedeemed,
                activeCount,
                expiredCount,
                usageRate: Math.round(usageRate * 100) / 100,
            };
        }));
        const totalAssignments = stats.reduce((sum, s) => sum + s.totalAssigned, 0);
        const totalRedemptions = stats.reduce((sum, s) => sum + s.totalRedeemed, 0);
        const overallUsageRate = totalAssignments > 0 ? (totalRedemptions / totalAssignments) * 100 : 0;
        return {
            totalCampaigns: campaigns.length,
            activeCampaigns: campaigns.filter((c) => c.isActive).length,
            totalAssignments,
            totalRedemptions,
            overallUsageRate: Math.round(overallUsageRate * 100) / 100,
            campaignBreakdown: stats,
        };
    }
    async getDashboardOverview(query) {
        const dateFilter = {};
        const createdAtFilter = {};
        if (query.startDate) {
            dateFilter.assignedAt = { gte: new Date(query.startDate) };
            createdAtFilter.createdAt = { gte: new Date(query.startDate) };
        }
        if (query.endDate) {
            dateFilter.assignedAt = { ...dateFilter.assignedAt, lte: new Date(query.endDate) };
            createdAtFilter.createdAt = { ...createdAtFilter.createdAt, lte: new Date(query.endDate) };
        }
        const customerFilter = { role: 'customer', emailVerified: true };
        const wheelSpinFilter = { used: true };
        if (query.startDate || query.endDate) {
            wheelSpinFilter.spunAt = {};
            if (query.startDate)
                wheelSpinFilter.spunAt.gte = new Date(query.startDate);
            if (query.endDate)
                wheelSpinFilter.spunAt.lte = new Date(query.endDate);
        }
        const [totalUsers, verifiedUsers, activeUsers, newUsersInPeriod, campaignsStats, loyaltyData, totalSpins, wheelRewards,] = await Promise.all([
            this.prisma.user.count({ where: customerFilter }),
            this.prisma.user.count({ where: { ...customerFilter, emailVerified: true } }),
            this.prisma.user.count({ where: { ...customerFilter, isActive: true } }),
            this.prisma.user.count({ where: { ...customerFilter, ...createdAtFilter } }),
            this.getAllCampaignsStats(query),
            this.prisma.loyaltyPoints.aggregate({
                _sum: { totalPoints: true, redeemedPoints: true },
                _count: true,
            }),
            this.prisma.wheelSpin.count({ where: wheelSpinFilter }),
            this.prisma.wheelSpin.groupBy({
                by: ['rewardType'],
                where: wheelSpinFilter,
                _count: true,
            }),
        ]);
        const totalPointsEarned = loyaltyData._sum.totalPoints ?? 0;
        const totalPointsRedeemed = loyaltyData._sum.redeemedPoints ?? 0;
        const usersWithPoints = loyaltyData._count;
        const averagePointsPerUser = usersWithPoints > 0 ? totalPointsEarned / usersWithPoints : 0;
        const rewardBreakdown = {
            points: 0,
            discount: 0,
            free_coffee: 0,
            badge: 0,
            nothing: 0,
        };
        wheelRewards.forEach((r) => {
            if (r.rewardType && r.rewardType in rewardBreakdown) {
                rewardBreakdown[r.rewardType] = r._count;
            }
        });
        const winningSpins = totalSpins - rewardBreakdown.nothing;
        const winRate = totalSpins > 0 ? (winningSpins / totalSpins) * 100 : 0;
        return {
            users: {
                totalUsers,
                verifiedUsers,
                activeUsers,
                newUsersInPeriod,
            },
            campaigns: campaignsStats,
            points: {
                totalPointsEarned,
                totalPointsRedeemed,
                totalPointsAvailable: totalPointsEarned - totalPointsRedeemed,
                usersWithPoints,
                averagePointsPerUser: Math.round(averagePointsPerUser * 100) / 100,
            },
            wheel: {
                totalSpins,
                winningSpins,
                winRate: Math.round(winRate * 100) / 100,
                rewardBreakdown,
            },
            period: {
                startDate: query.startDate ?? null,
                endDate: query.endDate ?? null,
            },
            generatedAt: new Date(),
        };
    }
};
exports.CampaignsService = CampaignsService;
exports.CampaignsService = CampaignsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        notification_1.NotificationService,
        events_1.EventsGateway])
], CampaignsService);
//# sourceMappingURL=campaigns.service.js.map