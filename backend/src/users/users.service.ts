import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { EventsGateway } from '../events';
import { CampaignStatus, UserRole, WalletType } from '@prisma/client';
import {
  UpdateProfileDto,
  UpdateSettingsDto,
  GetUsersQueryDto,
  UpdateUserStatusDto,
} from './dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) { }

  // ==================== PROFILE ====================

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        bio: true,
        phone: true,
        avatarUrl: true,
        language: true,
        theme: true,
        selectedBrand: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    this.logger.debug(`UpdateProfile Request: userId=${userId}`);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        bio: dto.bio,
        phone: dto.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        bio: true,
        phone: true,
        avatarUrl: true,
        language: true,
        theme: true,
        selectedBrand: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Emit real-time event for admin panel
    this.eventsGateway.emitUserUpdated({
      userId,
      updateType: 'status',
      newValue: { firstName: dto.firstName, lastName: dto.lastName },
    });

    // Emit profile update to user
    this.eventsGateway.emitProfileUpdated(userId, {
      updateType: 'profile',
      newValue: { firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone },
    });

    return updated;
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        avatarUrl: true,
      },
    });

    // Emit profile update to user
    this.eventsGateway.emitProfileUpdated(userId, {
      updateType: 'avatar',
      newValue: { avatarUrl },
    });

    // Emit to admin panel
    this.eventsGateway.emitUserUpdated({
      userId,
      updateType: 'status',
      newValue: { avatarUrl },
    });

    return updated;
  }

  async deleteAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      select: {
        id: true,
        avatarUrl: true,
      },
    });

    // Emit profile update to user
    this.eventsGateway.emitProfileUpdated(userId, {
      updateType: 'avatar',
      newValue: { avatarUrl: null },
    });

    return updated;
  }

  // ==================== SETTINGS ====================

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        language: dto.language,
        theme: dto.theme,
        selectedBrand: dto.selectedBrand,
      },
      select: {
        id: true,
        language: true,
        theme: true,
        selectedBrand: true,
      },
    });

    // Emit settings update to user
    this.eventsGateway.emitProfileUpdated(userId, {
      updateType: 'settings',
      newValue: {
        language: dto.language,
        theme: dto.theme,
        selectedBrand: dto.selectedBrand,
      },
    });

    return updated;
  }

  // ==================== STATS ====================

  async getStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: true,
        loyaltyPoints: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [badgeCount, orderCount, activeCampaigns, wheelSpinsUsed] = await Promise.all([
      this.prisma.userBadge.count({ where: { userId } }),
      this.prisma.order.count({ where: { userId } }),
      this.prisma.userCampaign.count({
        where: { userId, status: CampaignStatus.active },
      }),
      this.prisma.wheelSpin.count({
        where: { userId, used: true },
      }),
    ]);

    const totalPoints = user.loyaltyPoints?.totalPoints ?? 0;
    const redeemedPoints = user.loyaltyPoints?.redeemedPoints ?? 0;

    // Get IEU wallet balance for backward compatibility
    const ieuWallet = user.wallets?.find((w: any) => w.walletType === 'IEU');

    return {
      totalPoints,
      availablePoints: totalPoints - redeemedPoints,
      redeemedPoints,
      nikiCredits: ieuWallet?.balance?.toString() ?? '0.00',
      badgeCount,
      orderCount,
      activeCampaigns,
      wheelSpinsUsed,
    };
  }

  // ==================== BADGES ====================

  async getBadges(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
      },
      orderBy: { earnedAt: 'desc' },
    });

    return userBadges.map((ub) => ({
      id: ub.badge.id,
      name: ub.badge.name,
      nameTr: ub.badge.nameTr,
      description: ub.badge.description,
      descriptionTr: ub.badge.descriptionTr,
      iconUrl: ub.badge.iconUrl,
      earnedAt: ub.earnedAt,
    }));
  }

  // ==================== ADMIN ====================

  async getUsers(query: GetUsersQueryDto) {
    const { page = 1, limit = 20, search, role, isActive, emailVerified } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (emailVerified !== undefined) {
      where.emailVerified = emailVerified;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          wallets: {
            select: {
              id: true,
              walletType: true,
              qrCode: true,
              balance: true,
            },
          },
          loyaltyPoints: {
            select: {
              totalPoints: true,
              redeemedPoints: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Transform users to include calculated fields
    const transformedUsers = users.map((user) => {
      const ieuWallet = user.wallets?.find((w: any) => w.walletType === 'IEU');
      const nikiWallet = user.wallets?.find((w: any) => w.walletType === 'NIKI');
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        // Backward compatibility
        wallet: ieuWallet ? {
          id: ieuWallet.id,
          qrCode: ieuWallet.qrCode,
          balance: ieuWallet.balance?.toString() ?? '0.00',
        } : null,
        // Dual wallet support
        wallets: {
          ieu: ieuWallet ? {
            id: ieuWallet.id,
            qrCode: ieuWallet.qrCode,
            balance: ieuWallet.balance?.toString() ?? '0.00',
            isActive: (ieuWallet as any).isActive ?? false,
          } : null,
          niki: nikiWallet ? {
            id: nikiWallet.id,
            qrCode: nikiWallet.qrCode,
            balance: nikiWallet.balance?.toString() ?? '0.00',
            isActive: true,
          } : null,
        },
        loyaltyPoints: user.loyaltyPoints ? {
          totalPoints: user.loyaltyPoints.totalPoints,
          availablePoints: user.loyaltyPoints.totalPoints - (user.loyaltyPoints.redeemedPoints ?? 0),
        } : null,
      };
    });

    return {
      users: transformedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(userId: string, requesterId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: true,
        loyaltyPoints: true,
        userBadges: {
          include: { badge: true },
          orderBy: { earnedAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get both wallets for admin panel
    const ieuWallet = user.wallets?.find((w: any) => w.walletType === 'IEU');
    const nikiWallet = user.wallets?.find((w: any) => w.walletType === 'NIKI');

    // Get stats
    const [badgeCount, orderCount, activeCampaigns, wheelSpinsUsed] = await Promise.all([
      this.prisma.userBadge.count({ where: { userId } }),
      this.prisma.order.count({ where: { userId } }),
      this.prisma.userCampaign.count({
        where: { userId, status: CampaignStatus.active },
      }),
      this.prisma.wheelSpin.count({
        where: { userId, used: true },
      }),
    ]);

    const totalPoints = user.loyaltyPoints?.totalPoints ?? 0;
    const redeemedPoints = user.loyaltyPoints?.redeemedPoints ?? 0;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      language: user.language,
      theme: user.theme,
      selectedBrand: user.selectedBrand,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      // Add wallet info for user detail page (backward compatibility)
      wallet: ieuWallet ? {
        id: ieuWallet.id,
        qrCode: ieuWallet.qrCode,
        balance: ieuWallet.balance?.toString() ?? '0.00',
        isActive: (ieuWallet as any).isActive ?? false,
      } : null,
      // Add both wallets for admin panel dual wallet support
      wallets: {
        ieu: ieuWallet ? {
          id: ieuWallet.id,
          qrCode: ieuWallet.qrCode,
          balance: ieuWallet.balance?.toString() ?? '0.00',
          isActive: (ieuWallet as any).isActive ?? false,
          allowNegative: (ieuWallet as any).allowNegative ?? false,
          negativeLimit: parseFloat((ieuWallet as any).negativeLimit?.toString() ?? '0'),
        } : null,
        niki: nikiWallet ? {
          id: nikiWallet.id,
          qrCode: nikiWallet.qrCode,
          balance: nikiWallet.balance?.toString() ?? '0.00',
          isActive: true, // NIKI wallet is always active
          allowNegative: (nikiWallet as any).allowNegative ?? false,
          negativeLimit: parseFloat((nikiWallet as any).negativeLimit?.toString() ?? '0'),
        } : null,
      },
      // Add loyalty points for user detail page
      loyaltyPoints: user.loyaltyPoints ? {
        totalPoints,
        availablePoints: totalPoints - redeemedPoints,
      } : null,
      stats: {
        totalPoints,
        availablePoints: totalPoints - redeemedPoints,
        redeemedPoints,
        ieuCredits: ieuWallet?.balance?.toString() ?? '0.00',
        nikiCredits: nikiWallet?.balance?.toString() ?? '0.00',
        badgeCount,
        orderCount,
        activeCampaigns,
        wheelSpinsUsed,
      },
      badges: user.userBadges.map((ub) => ({
        id: ub.badge.id,
        name: ub.badge.name,
        nameTr: ub.badge.nameTr,
        description: ub.badge.description,
        descriptionTr: ub.badge.descriptionTr,
        iconUrl: ub.badge.iconUrl,
        earnedAt: ub.earnedAt,
      })),
    };
  }

  async updateUserStatus(
    userId: string,
    dto: UpdateUserStatusDto,
    adminId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent self-deactivation
    if (userId === adminId && dto.isActive === false) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    // Prevent changing super_admin role unless you're also super_admin
    if (user.role === UserRole.super_admin && dto.role && dto.role !== UserRole.super_admin) {
      const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
      if (admin?.role !== UserRole.super_admin) {
        throw new ForbiddenException('Only super admins can change super admin roles');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: dto.isActive,
        role: dto.role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    // Emit real-time event for admin panel
    this.eventsGateway.emitUserUpdated({
      userId,
      updateType: 'status',
      newValue: { isActive: dto.isActive, role: dto.role },
    });

    // Also notify the user specifically about the status change
    // This allows the mobile app to react (e.g. logout if banned)
    this.eventsGateway.emitProfileUpdated(userId, {
      updateType: 'settings', // Reuse settings type or add 'status' to frontend types if needed
      newValue: { isActive: dto.isActive, role: dto.role },
    });

    return updated;
  }

  // ==================== PUSH NOTIFICATIONS ====================

  async savePushToken(userId: string, token: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { expoPushToken: token },
    });

    return { success: true, message: 'Push token saved' };
  }

  async removePushToken(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { expoPushToken: null },
    });

    return { success: true, message: 'Push token removed' };
  }

  // ==================== IEU WALLET STATUS ====================

  async toggleIeuWalletStatus(userId: string, isActive: boolean, adminId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { userId, walletType: WalletType.IEU },
    });

    if (!wallet) {
      throw new NotFoundException('IEU wallet not found');
    }

    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { isActive } as any,
    });

    // Emit to admin panel
    this.eventsGateway.emitUserUpdated({
      userId,
      updateType: 'wallet_status',
      newValue: { ieuWalletActive: isActive },
    });

    // Emit directly to user for real-time update
    this.eventsGateway.emitWalletStatusUpdate(userId, {
      walletType: 'IEU',
      isActive,
    });

    return { success: true, ieuWalletActive: isActive };
  }

  // ==================== NEGATIVE BALANCE ====================

  async toggleNegativeBalance(
    userId: string,
    walletType: 'IEU' | 'NIKI',
    allowNegative: boolean,
    negativeLimit: number = 0,
  ) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { userId, walletType: walletType as any },
    });

    if (!wallet) {
      throw new NotFoundException(`${walletType} wallet not found`);
    }

    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        allowNegative,
        negativeLimit: allowNegative ? negativeLimit : 0,
      } as any,
    });

    return {
      success: true,
      walletType,
      allowNegative,
      negativeLimit: allowNegative ? negativeLimit : 0,
    };
  }
}
