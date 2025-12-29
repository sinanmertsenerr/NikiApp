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
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
const events_1 = require("../events");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const uuid_1 = require("uuid");
const DISCOUNT_RATES = {
    IEU: 15,
    NIKI: 10,
};
const NIKI_DISCOUNT_PERCENTAGE = 15;
let WalletService = class WalletService {
    prisma;
    eventsGateway;
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
    }
    async getMyWallet(userId) {
        let wallets = await this.prisma.wallet.findMany({
            where: { userId },
        });
        if (wallets.length === 0) {
            wallets = await this.createWalletsForUser(userId);
        }
        const ieuWallet = wallets.find(w => w.walletType === client_1.WalletType.IEU);
        const nikiWallet = wallets.find(w => w.walletType === client_1.WalletType.NIKI);
        return {
            ieuWallet: ieuWallet ? {
                id: ieuWallet.id,
                balance: ieuWallet.balance.toString(),
                qrCode: ieuWallet.qrCode,
                walletType: ieuWallet.walletType,
                discountRate: DISCOUNT_RATES[client_1.WalletType.IEU],
                isActive: ieuWallet.isActive ?? false,
            } : null,
            nikiWallet: nikiWallet ? {
                id: nikiWallet.id,
                balance: nikiWallet.balance.toString(),
                qrCode: nikiWallet.qrCode,
                walletType: nikiWallet.walletType,
                discountRate: DISCOUNT_RATES[client_1.WalletType.NIKI],
                isActive: true,
            } : null,
            nikiCredits: ieuWallet?.balance.toString() || '0',
            qrCode: ieuWallet?.qrCode || '',
        };
    }
    async getMyTransactions(userId, query) {
        const wallets = await this.prisma.wallet.findMany({
            where: { userId },
        });
        if (wallets.length === 0) {
            return {
                transactions: [],
                total: 0,
                page: query.page || 1,
                limit: query.limit || 20,
                totalPages: 0,
            };
        }
        const walletIds = wallets.map(w => w.id);
        return this.getTransactionsForWallets(walletIds, query);
    }
    async scanQrCode(qrCode) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { qrCode },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        phone: true,
                        loyaltyPoints: true,
                    },
                },
            },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Invalid QR code');
        }
        const activeCampaignsCount = await this.prisma.userCampaign.count({
            where: {
                userId: wallet.userId,
                status: client_1.CampaignStatus.active,
            },
        });
        const totalPoints = wallet.user.loyaltyPoints?.totalPoints ?? 0;
        const redeemedPoints = wallet.user.loyaltyPoints?.redeemedPoints ?? 0;
        return {
            id: wallet.id,
            balance: wallet.balance.toString(),
            qrCode: wallet.qrCode,
            walletType: wallet.walletType,
            discountRate: DISCOUNT_RATES[wallet.walletType],
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
            user: {
                id: wallet.user.id,
                email: wallet.user.email,
                firstName: wallet.user.firstName,
                lastName: wallet.user.lastName,
                avatarUrl: wallet.user.avatarUrl,
                phone: wallet.user.phone,
            },
            loyaltyPoints: {
                totalPoints,
                availablePoints: totalPoints - redeemedPoints,
            },
            activeCampaignsCount,
        };
    }
    async topUp(dto, adminId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { qrCode: dto.qrCode },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Invalid QR code');
        }
        const balanceBefore = wallet.balance;
        const amount = new library_1.Decimal(dto.amount);
        const balanceAfter = balanceBefore.add(amount);
        const [transaction, updatedWallet] = await this.prisma.$transaction([
            this.prisma.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: client_1.TransactionType.topup,
                    amount: amount,
                    balanceBefore: balanceBefore,
                    balanceAfter: balanceAfter,
                    adminId: adminId,
                    description: dto.description || 'Top up',
                },
            }),
            this.prisma.wallet.update({
                where: { id: wallet.id },
                data: { balance: balanceAfter },
            }),
        ]);
        this.eventsGateway.emitBalanceUpdate(wallet.userId, {
            newBalance: updatedWallet.balance.toString(),
            transactionType: 'topup',
            amount: amount.toString(),
            description: dto.description || 'Top up',
        });
        this.eventsGateway.emitUserUpdated({
            userId: wallet.userId,
            updateType: 'balance',
            newValue: updatedWallet.balance.toString(),
        });
        return {
            success: true,
            message: 'Top up successful',
            transaction: this.formatTransaction(transaction),
            newBalance: updatedWallet.balance.toString(),
        };
    }
    async processPayment(dto, adminId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { qrCode: dto.qrCode },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Invalid QR code');
        }
        const originalAmount = new library_1.Decimal(dto.amount);
        const useDiscount = dto.useDiscount !== false;
        const discountPercentage = DISCOUNT_RATES[wallet.walletType];
        const discountAmount = useDiscount
            ? originalAmount.mul(discountPercentage).div(100)
            : new library_1.Decimal(0);
        const chargedAmount = useDiscount
            ? originalAmount.sub(discountAmount)
            : originalAmount;
        const allowNegative = wallet.allowNegative ?? false;
        const negativeLimit = new library_1.Decimal(wallet.negativeLimit ?? 0);
        const minBalance = allowNegative ? negativeLimit.neg() : new library_1.Decimal(0);
        const newBalanceAfterPayment = wallet.balance.sub(chargedAmount);
        if (newBalanceAfterPayment.lessThan(minBalance)) {
            if (allowNegative) {
                throw new common_1.BadRequestException(`Insufficient balance. Required: ${chargedAmount.toString()} TL, Available: ${wallet.balance.toString()} TL (Negative limit: -${negativeLimit.toString()} TL)`);
            }
            throw new common_1.BadRequestException(`Insufficient balance. Required: ${chargedAmount.toString()} TL, Available: ${wallet.balance.toString()} TL`);
        }
        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore.sub(chargedAmount);
        const [transaction, updatedWallet] = await this.prisma.$transaction([
            this.prisma.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: client_1.TransactionType.payment,
                    amount: chargedAmount,
                    originalAmount: originalAmount,
                    discountApplied: discountAmount,
                    discountPercentage: useDiscount ? new library_1.Decimal(discountPercentage) : new library_1.Decimal(0),
                    isFullPayment: useDiscount,
                    balanceBefore: balanceBefore,
                    balanceAfter: balanceAfter,
                    adminId: adminId,
                    description: dto.description || 'Payment',
                },
            }),
            this.prisma.wallet.update({
                where: { id: wallet.id },
                data: { balance: balanceAfter },
            }),
        ]);
        this.eventsGateway.emitBalanceUpdate(wallet.userId, {
            newBalance: updatedWallet.balance.toString(),
            transactionType: 'payment',
            amount: chargedAmount.toString(),
            description: dto.description || 'Payment',
            originalAmount: originalAmount.toString(),
            discountAmount: discountAmount.toString(),
            discountPercentage: useDiscount ? discountPercentage : 0,
        });
        this.eventsGateway.emitUserUpdated({
            userId: wallet.userId,
            updateType: 'balance',
            newValue: updatedWallet.balance.toString(),
        });
        return {
            success: true,
            message: 'Payment successful',
            transaction: this.formatTransaction(transaction),
            originalAmount: originalAmount.toString(),
            chargedAmount: chargedAmount.toString(),
            discountSaved: discountAmount.toString(),
            newBalance: updatedWallet.balance.toString(),
        };
    }
    async processRefund(dto, adminId) {
        const originalTransaction = await this.prisma.transaction.findUnique({
            where: { id: dto.transactionId },
            include: { wallet: true },
        });
        if (!originalTransaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        if (originalTransaction.type !== client_1.TransactionType.payment) {
            throw new common_1.BadRequestException('Can only refund payment transactions');
        }
        const existingRefund = await this.prisma.transaction.findFirst({
            where: {
                walletId: originalTransaction.walletId,
                type: client_1.TransactionType.refund,
                amount: originalTransaction.amount,
                createdAt: { gt: originalTransaction.createdAt },
                description: { contains: originalTransaction.id },
            },
        });
        if (existingRefund) {
            throw new common_1.BadRequestException('This transaction has already been refunded');
        }
        const wallet = originalTransaction.wallet;
        const refundAmount = originalTransaction.amount;
        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore.add(refundAmount);
        const [transaction, updatedWallet] = await this.prisma.$transaction([
            this.prisma.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: client_1.TransactionType.refund,
                    amount: refundAmount,
                    balanceBefore: balanceBefore,
                    balanceAfter: balanceAfter,
                    adminId: adminId,
                    description: dto.reason
                        ? `Refund: ${dto.reason} (Original: ${originalTransaction.id})`
                        : `Refund for transaction ${originalTransaction.id}`,
                },
            }),
            this.prisma.wallet.update({
                where: { id: wallet.id },
                data: { balance: balanceAfter },
            }),
        ]);
        this.eventsGateway.emitBalanceUpdate(wallet.userId, {
            newBalance: updatedWallet.balance.toString(),
            transactionType: 'refund',
            amount: refundAmount.toString(),
            description: dto.reason || 'Refund',
        });
        this.eventsGateway.emitUserUpdated({
            userId: wallet.userId,
            updateType: 'balance',
            newValue: updatedWallet.balance.toString(),
        });
        return {
            success: true,
            message: 'Refund successful',
            transaction: this.formatTransaction(transaction),
            refundedAmount: refundAmount.toString(),
            newBalance: updatedWallet.balance.toString(),
        };
    }
    async getAllTransactions(query) {
        const { page = 1, limit = 20, type, startDate, endDate, userId, adminId } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (type) {
            where.type = type;
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        if (userId) {
            where.wallet = { userId };
        }
        if (adminId) {
            where.adminId = adminId;
        }
        const [transactions, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                include: {
                    admin: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    wallet: {
                        select: {
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
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.transaction.count({ where }),
        ]);
        return {
            transactions: transactions.map((t) => ({
                ...this.formatTransaction(t),
                user: t.wallet.user,
                admin: t.admin,
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getDashboardStats(startDate, endDate) {
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate)
                dateFilter.createdAt.gte = new Date(startDate);
            if (endDate)
                dateFilter.createdAt.lte = new Date(endDate);
        }
        const [walletsCount, totalCredits, topUpSum, paymentSum, refundSum, rewardSum, discountSum, transactionCounts,] = await Promise.all([
            this.prisma.wallet.count(),
            this.prisma.wallet.aggregate({
                _sum: { balance: true },
            }),
            this.prisma.transaction.aggregate({
                where: { type: client_1.TransactionType.topup, ...dateFilter },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.transaction.aggregate({
                where: { type: client_1.TransactionType.payment, ...dateFilter },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.transaction.aggregate({
                where: { type: client_1.TransactionType.refund, ...dateFilter },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.transaction.aggregate({
                where: { type: client_1.TransactionType.reward, ...dateFilter },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.transaction.aggregate({
                where: { type: client_1.TransactionType.payment, ...dateFilter },
                _sum: { discountApplied: true },
            }),
            this.prisma.transaction.count({ where: dateFilter }),
        ]);
        return {
            totalCreditsInCirculation: totalCredits._sum.balance?.toString() ?? '0.00',
            totalTopUps: topUpSum._sum.amount?.toString() ?? '0.00',
            totalPayments: paymentSum._sum.amount?.toString() ?? '0.00',
            totalRefunds: refundSum._sum.amount?.toString() ?? '0.00',
            totalDiscountsGiven: discountSum._sum.discountApplied?.toString() ?? '0.00',
            walletsCount,
            transactionsCount: transactionCounts,
            transactionBreakdown: {
                topup: topUpSum._count,
                payment: paymentSum._count,
                refund: refundSum._count,
                reward: rewardSum._count,
            },
        };
    }
    async createWalletsForUser(userId) {
        const existingWallets = await this.prisma.wallet.findMany({
            where: { userId },
        });
        const existingIeu = existingWallets.find(w => w.walletType === client_1.WalletType.IEU);
        const existingNiki = existingWallets.find(w => w.walletType === client_1.WalletType.NIKI);
        const walletsToCreate = [];
        if (!existingIeu) {
            const ieuQrCode = this.generateQrCode(client_1.WalletType.IEU, userId);
            walletsToCreate.push(this.prisma.wallet.create({
                data: {
                    userId,
                    walletType: client_1.WalletType.IEU,
                    qrCode: ieuQrCode,
                    balance: 0,
                    isActive: false,
                },
            }));
        }
        if (!existingNiki) {
            const nikiQrCode = this.generateQrCode(client_1.WalletType.NIKI, userId);
            walletsToCreate.push(this.prisma.wallet.create({
                data: {
                    userId,
                    walletType: client_1.WalletType.NIKI,
                    qrCode: nikiQrCode,
                    balance: 0,
                    isActive: true,
                },
            }));
        }
        if (walletsToCreate.length > 0) {
            await this.prisma.$transaction(walletsToCreate);
        }
        return this.prisma.wallet.findMany({
            where: { userId },
        });
    }
    generateQrCode(walletType, userId) {
        const userPrefix = userId.substring(0, 8).toUpperCase();
        const random = (0, uuid_1.v4)().replace(/-/g, '').substring(0, 4).toUpperCase();
        return `${walletType}-${userPrefix}-${random}`;
    }
    async getTransactions(walletId, query) {
        const { page = 1, limit = 20, type, startDate, endDate } = query;
        const skip = (page - 1) * limit;
        const where = { walletId };
        if (type) {
            where.type = type;
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const [transactions, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.transaction.count({ where }),
        ]);
        return {
            transactions: transactions.map((t) => this.formatTransaction(t)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getTransactionsForWallets(walletIds, query) {
        const { page = 1, limit = 20, type, startDate, endDate } = query;
        const skip = (page - 1) * limit;
        const where = { walletId: { in: walletIds } };
        if (type) {
            where.type = type;
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const [transactions, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { wallet: true },
            }),
            this.prisma.transaction.count({ where }),
        ]);
        return {
            transactions: transactions.map((t) => ({
                ...this.formatTransaction(t),
                walletType: t.wallet?.walletType,
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    formatTransaction(transaction) {
        return {
            id: transaction.id,
            type: transaction.type,
            amount: transaction.amount.toString(),
            originalAmount: transaction.originalAmount?.toString(),
            discountApplied: transaction.discountApplied?.toString() ?? '0',
            discountPercentage: transaction.discountPercentage?.toString() ?? '0',
            isFullPayment: transaction.isFullPayment,
            balanceBefore: transaction.balanceBefore.toString(),
            balanceAfter: transaction.balanceAfter.toString(),
            description: transaction.description,
            createdAt: transaction.createdAt,
        };
    }
    async addReward(userId, amount, description) {
        let wallet = await this.prisma.wallet.findFirst({
            where: { userId, walletType: client_1.WalletType.IEU },
        });
        if (!wallet) {
            const wallets = await this.createWalletsForUser(userId);
            wallet = wallets.find(w => w.walletType === client_1.WalletType.IEU);
        }
        const balanceBefore = wallet.balance;
        const rewardAmount = new library_1.Decimal(amount);
        const balanceAfter = balanceBefore.add(rewardAmount);
        const [transaction, updatedWallet] = await this.prisma.$transaction([
            this.prisma.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: client_1.TransactionType.reward,
                    amount: rewardAmount,
                    balanceBefore: balanceBefore,
                    balanceAfter: balanceAfter,
                    description: description,
                },
            }),
            this.prisma.wallet.update({
                where: { id: wallet.id },
                data: { balance: balanceAfter },
            }),
        ]);
        this.eventsGateway.emitBalanceUpdate(userId, {
            newBalance: updatedWallet.balance.toString(),
            transactionType: 'topup',
            amount: rewardAmount.toString(),
            description: description,
        });
        return {
            success: true,
            transaction: this.formatTransaction(transaction),
            newBalance: updatedWallet.balance.toString(),
        };
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        events_1.EventsGateway])
], WalletService);
//# sourceMappingURL=wallet.service.js.map