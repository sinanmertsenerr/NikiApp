import {
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  Max,
  IsInt,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TransactionType } from '@prisma/client';

// ==================== ADMIN DTOs ====================

export class TopUpDto {
  @ApiProperty({ example: 'qr-code-here', description: 'User QR code from wallet' })
  @IsString()
  qrCode: string;

  @ApiProperty({ example: 100, description: 'Amount to add (TL)' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ example: 'Birthday bonus', description: 'Description for the transaction' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class PaymentDto {
  @ApiProperty({ example: 'qr-code-here', description: 'User QR code from wallet' })
  @IsString()
  qrCode: string;

  @ApiProperty({ example: 65, description: 'Original order amount (TL) before discount' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ example: true, description: 'Use Niki Credits with 15% discount (default: true). Set false for cash/card payment.' })
  @IsOptional()
  useDiscount?: boolean;

  @ApiPropertyOptional({ example: 'Latte + Brownie', description: 'Order description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class RefundDto {
  @ApiProperty({ example: 'transaction-uuid', description: 'Original transaction ID to refund' })
  @IsString()
  transactionId: string;

  @ApiPropertyOptional({ example: 'Customer complaint', description: 'Reason for refund' })
  @IsOptional()
  @IsString()
  reason?: string;
}

// ==================== QUERY DTOs ====================

export class GetTransactionsQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: TransactionType, description: 'Filter by transaction type' })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ example: '2025-01-01', description: 'Start date filter' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'End date filter' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class AdminTransactionsQueryDto extends GetTransactionsQueryDto {
  @ApiPropertyOptional({ example: 'user-uuid', description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: 'admin-uuid', description: 'Filter by admin who processed' })
  @IsOptional()
  @IsString()
  adminId?: string;
}
