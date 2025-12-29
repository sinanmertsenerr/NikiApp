import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { EventsGateway } from '../events';
import { TransactionType, CampaignStatus, WalletType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';
import {
  TopUpDto,
  PaymentDto,
  RefundDto,
  GetTransactionsQueryDto,
  AdminTransactionsQueryDto,
} from './dto';

// Discount percentages by wallet type
const DISCOUNT_RATES: Record<WalletType, number> = {
  IEU: 15,   // İEÜ Cüzdan - 15% discount
  NIKI: 10,  // Niki Cüzdan - 10% discount
};

// Legacy constant for backward compatibility
const NIKI_DISCOUNT_PERCENTAGE = 15;

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) { }

  // ==================== CUSTOMER ====================

  /**
   * Get current user's wallets (both IEU and NIKI)
   */
  async getMyWallet(userId: string) {
    let wallets = await this.prisma.wallet.findMany({
      where: { userId },
    });

    // Create wallets if they don't exist
    if (wallets.length === 0) {
      wallets = await this.createWalletsForUser(userId);
    }

    const ieuWallet = wallets.find(w => w.walletType === WalletType.IEU);
    const nikiWallet = wallets.find(w => w.walletType === WalletType.NIKI);

    return {
      ieuWallet: ieuWallet ? {
        id: ieuWallet.id,
        balance: ieuWallet.balance.toString(),
        qrCode: ieuWallet.qrCode,
        walletType: ieuWallet.walletType,
        discountRate: DISCOUNT_RATES[WalletType.IEU],
        isActive: (ieuWallet as any).isActive ?? false,
      } : null,
      nikiWallet: nikiWallet ? {
        id: nikiWallet.id,
        balance: nikiWallet.balance.toString(),
        qrCode: nikiWallet.qrCode,
        walletType: nikiWallet.walletType,
        discountRate: DISCOUNT_RATES[WalletType.NIKI],
        isActive: true, // NIKI wallet is always active
      } : null,
      // Legacy format for backward compatibility
      nikiCredits: ieuWallet?.balance.toString() || '0',
      qrCode: ieuWallet?.qrCode || '',
    };
  }

  /**
   * Get user's transaction history (from all wallets)
   */
  async getMyTransactions(userId: string, query: GetTransactionsQueryDto) {
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

    // Get transactions from all wallets
    const walletIds = wallets.map(w => w.id);
    return this.getTransactionsForWallets(walletIds, query);
  }

  // ==================== ADMIN ====================

  /**
   * Scan QR code and get user info
   */
  async scanQrCode(qrCode: string) {
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
      throw new NotFoundException('Invalid QR code');
    }

    // Get active campaigns count
    const activeCampaignsCount = await this.prisma.userCampaign.count({
      where: {
        userId: wallet.userId,
        status: CampaignStatus.active,
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

  /**
   * Top up user's wallet (add credits)
   */
  async topUp(dto: TopUpDto, adminId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { qrCode: dto.qrCode },
    });

    if (!wallet) {
      throw new NotFoundException('Invalid QR code');
    }

    const balanceBefore = wallet.balance;
    const amount = new Decimal(dto.amount);
    const balanceAfter = balanceBefore.add(amount);

    const [transaction, updatedWallet] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.topup,
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

    // Emit real-time events
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

  /**
   * Process payment with or without discount
   * - useDiscount=true (default): 15% discount applied, deduct discounted amount
   * - useDiscount=false: No discount, deduct full amount (partial payment with cash/card for remaining)
   */
  async processPayment(dto: PaymentDto, adminId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { qrCode: dto.qrCode },
    });

    if (!wallet) {
      throw new NotFoundException('Invalid QR code');
    }

    const originalAmount = new Decimal(dto.amount);
    const useDiscount = dto.useDiscount !== false; // Default to true

    // Get the correct discount rate based on wallet type (IEU=15%, NIKI=10%)
    const discountPercentage = DISCOUNT_RATES[wallet.walletType];

    // Calculate amounts based on payment type
    const discountAmount = useDiscount
      ? originalAmount.mul(discountPercentage).div(100)
      : new Decimal(0);
    const chargedAmount = useDiscount
      ? originalAmount.sub(discountAmount)
      : originalAmount; // No discount for cash/card partial payment

    // Always check balance - both payment types deduct from wallet
    // If negative balance is allowed, check against the limit
    const allowNegative = (wallet as any).allowNegative ?? false;
    const negativeLimit = new Decimal((wallet as any).negativeLimit ?? 0);
    const minBalance = allowNegative ? negativeLimit.neg() : new Decimal(0);
    const newBalanceAfterPayment = wallet.balance.sub(chargedAmount);

    if (newBalanceAfterPayment.lessThan(minBalance)) {
      if (allowNegative) {
        throw new BadRequestException(
          `Insufficient balance. Required: ${chargedAmount.toString()} TL, Available: ${wallet.balance.toString()} TL (Negative limit: -${negativeLimit.toString()} TL)`,
        );
      }
      throw new BadRequestException(
        `Insufficient balance. Required: ${chargedAmount.toString()} TL, Available: ${wallet.balance.toString()} TL`,
      );
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore.sub(chargedAmount); // Always deduct

    const [transaction, updatedWallet] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.payment,
          amount: chargedAmount,
          originalAmount: originalAmount,
          discountApplied: discountAmount,
          discountPercentage: useDiscount ? new Decimal(discountPercentage) : new Decimal(0),
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

    // Emit real-time events
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

  /**
   * Process refund for a transaction
   */
  async processRefund(dto: RefundDto, adminId: string) {
    const originalTransaction = await this.prisma.transaction.findUnique({
      where: { id: dto.transactionId },
      include: { wallet: true },
    });

    if (!originalTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (originalTransaction.type !== TransactionType.payment) {
      throw new BadRequestException('Can only refund payment transactions');
    }

    // Check if already refunded (look for refund with same amount after this transaction)
    const existingRefund = await this.prisma.transaction.findFirst({
      where: {
        walletId: originalTransaction.walletId,
        type: TransactionType.refund,
        amount: originalTransaction.amount,
        createdAt: { gt: originalTransaction.createdAt },
        description: { contains: originalTransaction.id },
      },
    });

    if (existingRefund) {
      throw new BadRequestException('This transaction has already been refunded');
    }

    const wallet = originalTransaction.wallet;
    const refundAmount = originalTransaction.amount;
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore.add(refundAmount);

    const [transaction, updatedWallet] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.refund,
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

    // Emit real-time events
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

  /**
   * Get all transactions (admin)
   */
  async getAllTransactions(query: AdminTransactionsQueryDto) {
    const { page = 1, limit = 20, type, startDate, endDate, userId, adminId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
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

  /**
   * Get wallet dashboard stats
   */
  async getDashboardStats(startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    // Get totals by transaction type
    const [
      walletsCount,
      totalCredits,
      topUpSum,
      paymentSum,
      refundSum,
      rewardSum,
      discountSum,
      transactionCounts,
    ] = await Promise.all([
      this.prisma.wallet.count(),
      this.prisma.wallet.aggregate({
        _sum: { balance: true },
      }),
      this.prisma.transaction.aggregate({
        where: { type: TransactionType.topup, ...dateFilter },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: { type: TransactionType.payment, ...dateFilter },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: { type: TransactionType.refund, ...dateFilter },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: { type: TransactionType.reward, ...dateFilter },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: { type: TransactionType.payment, ...dateFilter },
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

  // ==================== HELPERS ====================

  /**
   * Create both wallets (IEU and NIKI) for user
   * IEU wallet starts inactive (admin activates it)
   * NIKI wallet is always active
   */
  private async createWalletsForUser(userId: string) {
    // Check if wallets already exist to prevent duplicates
    const existingWallets = await this.prisma.wallet.findMany({
      where: { userId },
    });

    const existingIeu = existingWallets.find(w => w.walletType === WalletType.IEU);
    const existingNiki = existingWallets.find(w => w.walletType === WalletType.NIKI);

    const walletsToCreate: any[] = [];

    // Create IEU wallet if not exists (starts inactive)
    if (!existingIeu) {
      const ieuQrCode = this.generateQrCode(WalletType.IEU, userId);
      walletsToCreate.push(
        this.prisma.wallet.create({
          data: {
            userId,
            walletType: WalletType.IEU,
            qrCode: ieuQrCode,
            balance: 0,
            isActive: false, // Admin must activate
          } as any,
        })
      );
    }

    // Create NIKI wallet if not exists (always active)
    if (!existingNiki) {
      const nikiQrCode = this.generateQrCode(WalletType.NIKI, userId);
      walletsToCreate.push(
        this.prisma.wallet.create({
          data: {
            userId,
            walletType: WalletType.NIKI,
            qrCode: nikiQrCode,
            balance: 0,
            isActive: true, // NIKI is always active
          } as any,
        })
      );
    }

    // Create any missing wallets
    if (walletsToCreate.length > 0) {
      await this.prisma.$transaction(walletsToCreate);
    }

    // Return all wallets
    return this.prisma.wallet.findMany({
      where: { userId },
    });
  }



  /**
   * Generate unique QR code with wallet type prefix
   */
  private generateQrCode(walletType: WalletType, userId: string): string {
    const userPrefix = userId.substring(0, 8).toUpperCase();
    const random = uuidv4().replace(/-/g, '').substring(0, 4).toUpperCase();
    return `${walletType}-${userPrefix}-${random}`;
  }

  /**
   * Get transactions for a wallet
   */
  private async getTransactions(walletId: string, query: GetTransactionsQueryDto) {
    const { page = 1, limit = 20, type, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = { walletId };

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
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

  /**
   * Get transactions for multiple wallets
   */
  private async getTransactionsForWallets(walletIds: string[], query: GetTransactionsQueryDto) {
    const { page = 1, limit = 20, type, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = { walletId: { in: walletIds } };

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { wallet: true }, // Include wallet to show which wallet
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions: transactions.map((t) => ({
        ...this.formatTransaction(t),
        walletType: (t as any).wallet?.walletType,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Format transaction for response
   */
  private formatTransaction(transaction: any) {
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

  /**
   * Add reward to IEU wallet (called from wheel or other services)
   */
  async addReward(userId: string, amount: number, description: string) {
    // Rewards go to IEU wallet by default
    let wallet = await this.prisma.wallet.findFirst({
      where: { userId, walletType: WalletType.IEU },
    });

    if (!wallet) {
      // Create both wallets and get the IEU one
      const wallets = await this.createWalletsForUser(userId);
      wallet = wallets.find(w => w.walletType === WalletType.IEU)!;
    }

    const balanceBefore = wallet.balance;
    const rewardAmount = new Decimal(amount);
    const balanceAfter = balanceBefore.add(rewardAmount);

    const [transaction, updatedWallet] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.reward,
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

    // Emit real-time events
    this.eventsGateway.emitBalanceUpdate(userId, {
      newBalance: updatedWallet.balance.toString(),
      transactionType: 'topup', // reward is treated as topup for display
      amount: rewardAmount.toString(),
      description: description,
    });

    return {
      success: true,
      transaction: this.formatTransaction(transaction),
      newBalance: updatedWallet.balance.toString(),
    };
  }
}
