import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

// ==================== WALLET RESPONSE ====================

export class WalletResponseDto {
  @ApiProperty({ example: 'wallet-uuid' })
  id: string;

  @ApiProperty({ example: '150.00', description: 'Current Niki Credits balance' })
  nikiCredits: string;

  @ApiProperty({ example: 'NIKI-ABC123XYZ', description: 'Unique QR code for this wallet' })
  qrCode: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class WalletWithUserDto extends WalletResponseDto {
  @ApiProperty()
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    phone?: string;
  };

  @ApiProperty({ description: 'Loyalty points info' })
  loyaltyPoints: {
    totalPoints: number;
    availablePoints: number;
  };

  @ApiProperty({ example: 3, description: 'Active campaigns count' })
  activeCampaignsCount: number;
}

// ==================== TRANSACTION RESPONSE ====================

export class TransactionResponseDto {
  @ApiProperty({ example: 'transaction-uuid' })
  id: string;

  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ example: '55.25', description: 'Transaction amount' })
  amount: string;

  @ApiPropertyOptional({ example: '65.00', description: 'Original amount before discount' })
  originalAmount?: string;

  @ApiProperty({ example: '9.75', description: 'Discount applied' })
  discountApplied: string;

  @ApiProperty({ example: '15.00', description: 'Discount percentage' })
  discountPercentage: string;

  @ApiProperty({ example: true, description: 'Was full payment with Niki Credits' })
  isFullPayment: boolean;

  @ApiProperty({ example: '200.00', description: 'Balance before transaction' })
  balanceBefore: string;

  @ApiProperty({ example: '144.75', description: 'Balance after transaction' })
  balanceAfter: string;

  @ApiPropertyOptional({ example: 'Latte + Brownie' })
  description?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Admin who processed (for admin view)' })
  admin?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export class PaginatedTransactionsDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  transactions: TransactionResponseDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

// ==================== OPERATION RESULTS ====================

export class TopUpResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Top up successful' })
  message: string;

  @ApiProperty()
  transaction: TransactionResponseDto;

  @ApiProperty({ example: '250.00', description: 'New balance after top up' })
  newBalance: string;
}

export class PaymentResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Payment successful' })
  message: string;

  @ApiProperty()
  transaction: TransactionResponseDto;

  @ApiProperty({ example: '65.00', description: 'Original order amount' })
  originalAmount: string;

  @ApiProperty({ example: '55.25', description: 'Amount charged after 15% discount' })
  chargedAmount: string;

  @ApiProperty({ example: '9.75', description: 'Amount saved with discount' })
  discountSaved: string;

  @ApiProperty({ example: '94.75', description: 'Remaining balance' })
  newBalance: string;
}

export class RefundResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Refund successful' })
  message: string;

  @ApiProperty()
  transaction: TransactionResponseDto;

  @ApiProperty({ example: '55.25', description: 'Amount refunded' })
  refundedAmount: string;

  @ApiProperty({ example: '150.00', description: 'New balance after refund' })
  newBalance: string;
}

// ==================== DASHBOARD STATS ====================

export class WalletDashboardStatsDto {
  @ApiProperty({ example: '15000.00', description: 'Total Niki Credits in circulation' })
  totalCreditsInCirculation: string;

  @ApiProperty({ example: '8500.00', description: 'Total top-ups' })
  totalTopUps: string;

  @ApiProperty({ example: '6500.00', description: 'Total payments received' })
  totalPayments: string;

  @ApiProperty({ example: '500.00', description: 'Total refunds' })
  totalRefunds: string;

  @ApiProperty({ example: '975.00', description: 'Total discounts given' })
  totalDiscountsGiven: string;

  @ApiProperty({ example: 250, description: 'Number of wallets' })
  walletsCount: number;

  @ApiProperty({ example: 1200, description: 'Total transactions' })
  transactionsCount: number;

  @ApiProperty({ description: 'Breakdown by transaction type' })
  transactionBreakdown: {
    topup: number;
    payment: number;
    refund: number;
    reward: number;
  };
}
