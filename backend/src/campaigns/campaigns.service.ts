import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { NotificationService } from '../notification';
import { EventsGateway } from '../events';
import { CampaignStatus, CampaignType, CampaignTargetType } from '@prisma/client';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  GetCampaignsQueryDto,
  CampaignStatsQueryDto,
  CampaignUsersQueryDto,
  DashboardStatsQueryDto,
} from './dto';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly eventsGateway: EventsGateway,
  ) { }

  // ==================== CUSTOMER ====================

  /**
   * Get all campaigns for a user
   * OPTIMIZED: Uses select to fetch only needed fields
   */
  async getUserCampaigns(userId: string) {
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
        qrCode: `CAMPAIGN-${uc.id}`, // Unique QR code for each user-campaign
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

  /**
   * Get active (usable) campaigns for a user
   * OPTIMIZED: Filters at database level + uses select
   */
  async getActiveCampaigns(userId: string) {
    const now = new Date();

    const userCampaigns = await this.prisma.userCampaign.findMany({
      where: {
        userId,
        status: CampaignStatus.active,
        campaign: {
          isActive: true,
          // Filter expired campaigns at DB level
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

  /**
   * Get available campaigns that user can earn (auto campaigns based on points)
   * OPTIMIZED: Uses parallel queries instead of sequential
   */
  async getAvailableCampaigns(userId: string) {
    // Run queries in parallel
    const [loyaltyPoints, autoCampaigns, userActiveCampaigns] = await Promise.all([
      // Get user's loyalty points
      this.prisma.loyaltyPoints.findUnique({
        where: { userId },
      }),
      // Get all active auto campaigns
      this.prisma.campaign.findMany({
        where: {
          type: CampaignType.auto,
          isActive: true,
        },
      }),
      // Get user's active campaigns
      this.prisma.userCampaign.findMany({
        where: {
          userId,
          status: CampaignStatus.active,
        },
        select: { campaignId: true },
      }),
    ]);

    const availablePoints = (loyaltyPoints?.totalPoints ?? 0) - (loyaltyPoints?.redeemedPoints ?? 0);
    const existingCampaignIds = new Set(userActiveCampaigns.map((uc) => uc.campaignId));

    // Filter campaigns: affordable and not already owned
    const available = autoCampaigns.filter(
      (c) => c.requiredPoints <= availablePoints && !existingCampaignIds.has(c.id)
    );

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

  /**
   * Claim an auto campaign using points
   */
  async claimCampaign(userId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.type !== CampaignType.auto) {
      throw new BadRequestException('Only auto campaigns can be claimed');
    }

    if (!campaign.isActive) {
      throw new BadRequestException('Campaign is not active');
    }

    // Check user points
    const loyaltyPoints = await this.prisma.loyaltyPoints.findUnique({
      where: { userId },
    });

    const availablePoints = (loyaltyPoints?.totalPoints ?? 0) - (loyaltyPoints?.redeemedPoints ?? 0);

    if (availablePoints < campaign.requiredPoints) {
      throw new BadRequestException('Not enough points to claim this campaign');
    }

    // Check if user already has this campaign active
    const existing = await this.prisma.userCampaign.findFirst({
      where: {
        userId,
        campaignId,
        status: CampaignStatus.active,
      },
    });

    if (existing) {
      throw new ConflictException('You already have this campaign');
    }

    // Deduct points and assign campaign
    const [userCampaign] = await this.prisma.$transaction([
      this.prisma.userCampaign.create({
        data: {
          userId,
          campaignId,
          status: CampaignStatus.active,
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

    // Emit socket event for campaign claimed
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

  // ==================== ADMIN ====================

  /**
   * Get all campaigns (admin)
   * By default, only shows manual campaigns. Auto campaigns (mystery box) are hidden.
   */
  async getCampaigns(query: GetCampaignsQueryDto) {
    const { page = 1, limit = 20, type, targetType, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      // Exclude raffle-generated campaigns (they show in Raffles section)
      NOT: {
        title: { startsWith: 'Raffle Winner:' },
      },
    };

    // If type is explicitly specified, use it; otherwise default to manual only
    if (type) {
      where.type = type;
    } else {
      // By default, hide auto campaigns (mystery box rewards) from admin
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

  /**
   * Get campaign by ID (admin)
   */
  async getCampaignById(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
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

  /**
   * Create campaign (admin)
   */
  async createCampaign(dto: CreateCampaignDto) {
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

    // Emit real-time event
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

  /**
   * Update campaign (admin)
   */
  async updateCampaign(id: string, dto: UpdateCampaignDto) {
    const existing = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Campaign not found');
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

    // Emit real-time event
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

  /**
   * Delete campaign (admin)
   */
  async deleteCampaign(id: string) {
    const existing = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Campaign not found');
    }

    await this.prisma.campaign.delete({ where: { id } });

    // Emit real-time event
    this.eventsGateway.emitCampaignUpdated({
      campaignId: id,
      updateType: 'deleted',
    });

    return { success: true, message: 'Campaign deleted' };
  }

  /**
   * Assign campaign to user (admin - for manual campaigns)
   */
  async assignCampaignToUser(userId: string, campaignId: string) {
    const [user, campaign] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.campaign.findUnique({ where: { id: campaignId } }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const userCampaign = await this.prisma.userCampaign.create({
      data: {
        userId,
        campaignId,
        status: CampaignStatus.active,
      },
      include: { campaign: true, user: true },
    });

    // Send push notification
    this.notificationService.sendToUser(
      userId,
      'Niki Coffee',
      `Yeni Kampanya: ${campaign.title}`,
      { type: 'campaign_assigned', campaignId },
    ).catch((err) => console.error('Failed to send notification:', err));

    // Create in-app notification
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

    // Emit socket event
    this.eventsGateway.emitCampaignAssigned(userId, {
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      campaignTitleTr: campaign.titleTr || campaign.title,
    });

    // Notify admin room
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

  /**
   * Assign campaign to multiple users (admin - bulk assignment)
   * If userIds is empty or undefined, assigns to ALL active verified users
   * If groupIds provided, fetches all members from those groups
   */
  async assignCampaignToUsers(campaignId: string, userIds?: string[], groupIds?: string[]) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    let targetUserIds: string[] = [];

    // If groupIds provided, fetch all members from those groups
    if (groupIds && groupIds.length > 0) {
      // 1. Persist Group Assignments (NEW)
      // Delete existing group assignments for this campaign to avoid duplicates/stale data if re-assigning?
      // For now, we'll just upsert or ignore duplicates.
      // Actually, let's just create new ones and ignore unique constraint errors if any, or check first.

      for (const groupId of groupIds) {
        try {
          await this.prisma.campaignGroup.upsert({
            where: {
              campaignId_groupId: {
                campaignId,
                groupId
              }
            },
            update: {}, // No update needed
            create: {
              campaignId,
              groupId
            }
          });
        } catch (error) {
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
      targetUserIds = [...new Set(groupUserIds)]; // Remove duplicates
    } else if (!userIds || userIds.length === 0) {
      // Assign to all active verified users
      const allUsers = await this.prisma.user.findMany({
        where: {
          isActive: true,
          emailVerified: true,
          role: 'customer', // Only customers, not admins
        },
        select: { id: true },
      });
      targetUserIds = allUsers.map((u) => u.id);
    } else {
      // Verify all users exist
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true },
      });
      targetUserIds = users.map((u) => u.id);

      if (targetUserIds.length !== userIds.length) {
        const missingCount = userIds.length - targetUserIds.length;
        throw new BadRequestException(`${missingCount} user(s) not found`);
      }
    }

    // Filter out users who already have this campaign active
    const existingAssignments = await this.prisma.userCampaign.findMany({
      where: {
        campaignId,
        userId: { in: targetUserIds },
        status: CampaignStatus.active,
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

    // Create assignments
    await this.prisma.userCampaign.createMany({
      data: newUserIds.map((userId) => ({
        userId,
        campaignId,
        status: CampaignStatus.active,
      })),
    });

    // Send push notifications to all assigned users
    this.notificationService.sendToUsers(
      newUserIds,
      'Niki Coffee',
      `Yeni Kampanya: ${campaign.title}`,
      { type: 'campaign_assigned', campaignId },
    ).catch((err) => console.error('Failed to send notifications:', err));

    // Create in-app notifications for all assigned users
    Promise.all(
      newUserIds.map((userId) =>
        this.notificationService.createNotification({
          userId,
          type: 'campaign',
          title: 'New Campaign',
          titleTr: 'Yeni Kampanya',
          message: `You have received a new campaign: ${campaign.title}`,
          messageTr: `Yeni bir kampanya aldınız: ${campaign.titleTr || campaign.title}`,
          actionUrl: '/(tabs)/campaigns',
          metadata: { campaignId: campaign.id },
        })
      )
    ).catch((err) => console.error('Failed to create in-app notifications:', err));

    // Emit real-time socket events
    newUserIds.forEach((userId) => {
      this.eventsGateway.emitCampaignAssigned(userId, {
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        campaignTitleTr: campaign.titleTr || campaign.title,
      });
    });

    // Notify admin room about campaign update
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

  /**
   * Get groups assigned to a campaign
   */
  async getCampaignAssignedGroups(campaignId: string) {
    const campaignGroups = await this.prisma.campaignGroup.findMany({
      where: { campaignId },
      include: {
        group: true
      }
    });

    return campaignGroups.map(cg => cg.group);
  }

  /**
   * Redeem user campaign (admin - when user uses the campaign at store)
   */
  async redeemCampaign(userCampaignId: string, adminId: string) {
    const userCampaign = await this.prisma.userCampaign.findUnique({
      where: { id: userCampaignId },
      include: { campaign: true },
    });

    if (!userCampaign) {
      throw new NotFoundException('User campaign not found');
    }

    if (userCampaign.status !== CampaignStatus.active) {
      throw new BadRequestException('Campaign is not active or already redeemed');
    }

    // Check if campaign is expired
    if (userCampaign.campaign.endDate && new Date(userCampaign.campaign.endDate) < new Date()) {
      // Mark as expired
      await this.prisma.userCampaign.update({
        where: { id: userCampaignId },
        data: { status: CampaignStatus.expired },
      });
      throw new BadRequestException('Campaign has expired');
    }

    const updated = await this.prisma.userCampaign.update({
      where: { id: userCampaignId },
      data: {
        status: CampaignStatus.used,
        redeemedAt: new Date(),
        redeemedBy: adminId,
      },
      include: { campaign: true, user: true },
    });

    // Emit real-time events
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

  /**
   * Redeem campaign by QR code scan (admin)
   * QR format: CAMPAIGN-{userCampaignId}
   */
  async redeemCampaignByQr(qrCode: string, adminId: string) {
    // Validate QR format
    if (!qrCode.startsWith('CAMPAIGN-')) {
      throw new BadRequestException('Invalid campaign QR code format');
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
      throw new NotFoundException('Campaign not found');
    }

    if (userCampaign.status === CampaignStatus.used) {
      throw new BadRequestException('Campaign already used');
    }

    if (userCampaign.status === CampaignStatus.expired) {
      throw new BadRequestException('Campaign has expired');
    }

    // Check if campaign is expired by date
    if (userCampaign.campaign.endDate && new Date(userCampaign.campaign.endDate) < new Date()) {
      await this.prisma.userCampaign.update({
        where: { id: userCampaignId },
        data: { status: CampaignStatus.expired },
      });
      throw new BadRequestException('Campaign has expired');
    }

    // Mark as used
    const updated = await this.prisma.userCampaign.update({
      where: { id: userCampaignId },
      data: {
        status: CampaignStatus.used,
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

    // Emit real-time events to user
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

  // ==================== STATISTICS & DASHBOARD ====================

  /**
   * Get statistics for a specific campaign
   */
  async getCampaignStats(campaignId: string, query: CampaignStatsQueryDto) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const dateFilter: any = {};
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
        where: { campaignId, status: CampaignStatus.used, ...dateFilter },
      }),
      this.prisma.userCampaign.count({
        where: { campaignId, status: CampaignStatus.active, ...dateFilter },
      }),
      this.prisma.userCampaign.count({
        where: { campaignId, status: CampaignStatus.expired, ...dateFilter },
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

  /**
   * Get users who have a specific campaign (with filters)
   */
  async getCampaignUsers(campaignId: string, query: CampaignUsersQueryDto) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const { page = 1, limit = 20, status, assignedAfter, assignedBefore } = query;
    const skip = (page - 1) * limit;

    const where: any = { campaignId };

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

  /**
   * Get all campaigns statistics summary
   */
  async getAllCampaignsStats(query: CampaignStatsQueryDto) {
    const campaigns = await this.prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const dateFilter: any = {};
    if (query.startDate) {
      dateFilter.assignedAt = { gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      dateFilter.assignedAt = {
        ...dateFilter.assignedAt,
        lte: new Date(query.endDate),
      };
    }

    const stats = await Promise.all(
      campaigns.map(async (campaign) => {
        const [totalAssigned, totalRedeemed, activeCount, expiredCount] = await Promise.all([
          this.prisma.userCampaign.count({
            where: { campaignId: campaign.id, ...dateFilter },
          }),
          this.prisma.userCampaign.count({
            where: { campaignId: campaign.id, status: CampaignStatus.used, ...dateFilter },
          }),
          this.prisma.userCampaign.count({
            where: { campaignId: campaign.id, status: CampaignStatus.active, ...dateFilter },
          }),
          this.prisma.userCampaign.count({
            where: { campaignId: campaign.id, status: CampaignStatus.expired, ...dateFilter },
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
      }),
    );

    // Calculate totals
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

  /**
   * Get full dashboard overview (for admin dashboard)
   * OPTIMIZED: All major queries run in parallel
   */
  async getDashboardOverview(query: DashboardStatsQueryDto) {
    const dateFilter: any = {};
    const createdAtFilter: any = {};

    if (query.startDate) {
      dateFilter.assignedAt = { gte: new Date(query.startDate) };
      createdAtFilter.createdAt = { gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      dateFilter.assignedAt = { ...dateFilter.assignedAt, lte: new Date(query.endDate) };
      createdAtFilter.createdAt = { ...createdAtFilter.createdAt, lte: new Date(query.endDate) };
    }

    const customerFilter = { role: 'customer' as const, emailVerified: true };
    const wheelSpinFilter: any = { used: true };
    if (query.startDate || query.endDate) {
      wheelSpinFilter.spunAt = {};
      if (query.startDate) wheelSpinFilter.spunAt.gte = new Date(query.startDate);
      if (query.endDate) wheelSpinFilter.spunAt.lte = new Date(query.endDate);
    }

    // ===== RUN ALL QUERIES IN PARALLEL =====
    const [
      totalUsers,
      verifiedUsers,
      activeUsers,
      newUsersInPeriod,
      campaignsStats,
      loyaltyData,
      totalSpins,
      wheelRewards,
    ] = await Promise.all([
      // Users
      this.prisma.user.count({ where: customerFilter }),
      this.prisma.user.count({ where: { ...customerFilter, emailVerified: true } }),
      this.prisma.user.count({ where: { ...customerFilter, isActive: true } }),
      this.prisma.user.count({ where: { ...customerFilter, ...createdAtFilter } }),
      // Campaigns
      this.getAllCampaignsStats(query),
      // Points
      this.prisma.loyaltyPoints.aggregate({
        _sum: { totalPoints: true, redeemedPoints: true },
        _count: true,
      }),
      // Wheel
      this.prisma.wheelSpin.count({ where: wheelSpinFilter }),
      this.prisma.wheelSpin.groupBy({
        by: ['rewardType'],
        where: wheelSpinFilter,
        _count: true,
      }),
    ]);

    // Parse loyalty data
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
        rewardBreakdown[r.rewardType as keyof typeof rewardBreakdown] = r._count;
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
}
