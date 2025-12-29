import { IsEnum, IsOptional, IsBoolean, IsInt, Min, Max, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class GetUsersQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'john', description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'Filter by role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: true, description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Filter by email verified status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  emailVerified?: boolean;
}

export class UpdateUserStatusDto {
  @ApiPropertyOptional({ example: false, description: 'Set user active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: UserRole, description: 'Set user role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class ToggleIeuWalletDto {
  @ApiPropertyOptional({ example: true, description: 'Set IEU wallet active status' })
  @IsBoolean()
  isActive: boolean;
}

export class ToggleNegativeBalanceDto {
  @ApiPropertyOptional({ example: 'IEU', description: 'Wallet type (IEU or NIKI)' })
  @IsString()
  walletType: 'IEU' | 'NIKI';

  @ApiPropertyOptional({ example: true, description: 'Allow negative balance' })
  @IsBoolean()
  allowNegative: boolean;

  @ApiPropertyOptional({ example: 50, description: 'Maximum negative balance limit' })
  @IsOptional()
  @Type(() => Number)
  negativeLimit?: number;
}
