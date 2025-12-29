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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
const events_1 = require("../events");
const client_1 = require("@prisma/client");
let UsersService = class UsersService {
    prisma;
    eventsGateway;
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
    }
    async getProfile(userId) {
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
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async updateProfile(userId, dto) {
        console.log('UpdateProfile Request:', { userId, dto });
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
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
        this.eventsGateway.emitUserUpdated({
            userId,
            updateType: 'status',
            newValue: { firstName: dto.firstName, lastName: dto.lastName },
        });
        this.eventsGateway.emitProfileUpdated(userId, {
            updateType: 'profile',
            newValue: { firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone },
        });
        return updated;
    }
    async updateAvatar(userId, avatarUrl) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
            select: {
                id: true,
                avatarUrl: true,
            },
        });
        this.eventsGateway.emitProfileUpdated(userId, {
            updateType: 'avatar',
            newValue: { avatarUrl },
        });
        this.eventsGateway.emitUserUpdated({
            userId,
            updateType: 'status',
            newValue: { avatarUrl },
        });
        return updated;
    }
    async deleteAvatar(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl: null },
            select: {
                id: true,
                avatarUrl: true,
            },
        });
        this.eventsGateway.emitProfileUpdated(userId, {
            updateType: 'avatar',
            newValue: { avatarUrl: null },
        });
        return updated;
    }
    async updateSettings(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
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
    async getStats(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                wallets: true,
                loyaltyPoints: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const [badgeCount, orderCount, activeCampaigns, wheelSpinsUsed] = await Promise.all([
            this.prisma.userBadge.count({ where: { userId } }),
            this.prisma.order.count({ where: { userId } }),
            this.prisma.userCampaign.count({
                where: { userId, status: client_1.CampaignStatus.active },
            }),
            this.prisma.wheelSpin.count({
                where: { userId, used: true },
            }),
        ]);
        const totalPoints = user.loyaltyPoints?.totalPoints ?? 0;
        const redeemedPoints = user.loyaltyPoints?.redeemedPoints ?? 0;
        const ieuWallet = user.wallets?.find((w) => w.walletType === 'IEU');
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
    async getBadges(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
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
    async getUsers(query) {
        const { page = 1, limit = 20, search, role, isActive, emailVerified } = query;
        const skip = (page - 1) * limit;
        const where = {
            role: role || 'customer',
        };
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
        const transformedUsers = users.map((user) => {
            const ieuWallet = user.wallets?.find((w) => w.walletType === 'IEU');
            const nikiWallet = user.wallets?.find((w) => w.walletType === 'NIKI');
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
                wallet: ieuWallet ? {
                    id: ieuWallet.id,
                    qrCode: ieuWallet.qrCode,
                    balance: ieuWallet.balance?.toString() ?? '0.00',
                } : null,
                wallets: {
                    ieu: ieuWallet ? {
                        id: ieuWallet.id,
                        qrCode: ieuWallet.qrCode,
                        balance: ieuWallet.balance?.toString() ?? '0.00',
                        isActive: ieuWallet.isActive ?? false,
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
    async getUserById(userId, requesterId) {
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
            throw new common_1.NotFoundException('User not found');
        }
        const ieuWallet = user.wallets?.find((w) => w.walletType === 'IEU');
        const nikiWallet = user.wallets?.find((w) => w.walletType === 'NIKI');
        const [badgeCount, orderCount, activeCampaigns, wheelSpinsUsed] = await Promise.all([
            this.prisma.userBadge.count({ where: { userId } }),
            this.prisma.order.count({ where: { userId } }),
            this.prisma.userCampaign.count({
                where: { userId, status: client_1.CampaignStatus.active },
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
            wallet: ieuWallet ? {
                id: ieuWallet.id,
                qrCode: ieuWallet.qrCode,
                balance: ieuWallet.balance?.toString() ?? '0.00',
                isActive: ieuWallet.isActive ?? false,
            } : null,
            wallets: {
                ieu: ieuWallet ? {
                    id: ieuWallet.id,
                    qrCode: ieuWallet.qrCode,
                    balance: ieuWallet.balance?.toString() ?? '0.00',
                    isActive: ieuWallet.isActive ?? false,
                    allowNegative: ieuWallet.allowNegative ?? false,
                    negativeLimit: parseFloat(ieuWallet.negativeLimit?.toString() ?? '0'),
                } : null,
                niki: nikiWallet ? {
                    id: nikiWallet.id,
                    qrCode: nikiWallet.qrCode,
                    balance: nikiWallet.balance?.toString() ?? '0.00',
                    isActive: true,
                    allowNegative: nikiWallet.allowNegative ?? false,
                    negativeLimit: parseFloat(nikiWallet.negativeLimit?.toString() ?? '0'),
                } : null,
            },
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
    async updateUserStatus(userId, dto, adminId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (userId === adminId && dto.isActive === false) {
            throw new common_1.ForbiddenException('You cannot deactivate your own account');
        }
        if (user.role === client_1.UserRole.super_admin && dto.role && dto.role !== client_1.UserRole.super_admin) {
            const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
            if (admin?.role !== client_1.UserRole.super_admin) {
                throw new common_1.ForbiddenException('Only super admins can change super admin roles');
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
        this.eventsGateway.emitUserUpdated({
            userId,
            updateType: 'status',
            newValue: { isActive: dto.isActive, role: dto.role },
        });
        this.eventsGateway.emitProfileUpdated(userId, {
            updateType: 'settings',
            newValue: { isActive: dto.isActive, role: dto.role },
        });
        return updated;
    }
    async savePushToken(userId, token) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { expoPushToken: token },
        });
        return { success: true, message: 'Push token saved' };
    }
    async removePushToken(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { expoPushToken: null },
        });
        return { success: true, message: 'Push token removed' };
    }
    async toggleIeuWalletStatus(userId, isActive, adminId) {
        const wallet = await this.prisma.wallet.findFirst({
            where: { userId, walletType: client_1.WalletType.IEU },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('IEU wallet not found');
        }
        await this.prisma.wallet.update({
            where: { id: wallet.id },
            data: { isActive },
        });
        this.eventsGateway.emitUserUpdated({
            userId,
            updateType: 'wallet_status',
            newValue: { ieuWalletActive: isActive },
        });
        this.eventsGateway.emitWalletStatusUpdate(userId, {
            walletType: 'IEU',
            isActive,
        });
        return { success: true, ieuWalletActive: isActive };
    }
    async toggleNegativeBalance(userId, walletType, allowNegative, negativeLimit = 0) {
        const wallet = await this.prisma.wallet.findFirst({
            where: { userId, walletType: walletType },
        });
        if (!wallet) {
            throw new common_1.NotFoundException(`${walletType} wallet not found`);
        }
        await this.prisma.wallet.update({
            where: { id: wallet.id },
            data: {
                allowNegative,
                negativeLimit: allowNegative ? negativeLimit : 0,
            },
        });
        return {
            success: true,
            walletType,
            allowNegative,
            negativeLimit: allowNegative ? negativeLimit : 0,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        events_1.EventsGateway])
], UsersService);
//# sourceMappingURL=users.service.js.map