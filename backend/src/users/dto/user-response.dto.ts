import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Language, Theme, Brand, UserRole } from '@prisma/client';

export class UserProfileResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiPropertyOptional({ example: 'Coffee enthusiast' })
  bio?: string;

  @ApiPropertyOptional({ example: '+905551234567' })
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string;

  @ApiProperty({ enum: Language, example: 'tr' })
  language: Language;

  @ApiProperty({ enum: Theme, example: 'light' })
  theme: Theme;

  @ApiProperty({ enum: Brand, example: 'coffee' })
  selectedBrand: Brand;

  @ApiProperty({ example: true })
  emailVerified: boolean;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;
}

export class UserStatsResponseDto {
  @ApiProperty({ example: 25 })
  totalPoints: number;

  @ApiProperty({ example: 5 })
  availablePoints: number;

  @ApiProperty({ example: 20 })
  redeemedPoints: number;

  @ApiProperty({ example: '150.00' })
  nikiCredits: string;

  @ApiProperty({ example: 3 })
  badgeCount: number;

  @ApiProperty({ example: 12 })
  orderCount: number;

  @ApiProperty({ example: 2 })
  activeCampaigns: number;

  @ApiProperty({ example: 5 })
  wheelSpinsUsed: number;
}

export class UserBadgeResponseDto {
  @ApiProperty({ example: 'badge-uuid' })
  id: string;

  @ApiProperty({ example: 'Coffee Lover' })
  name: string;

  @ApiProperty({ example: 'Kahve Aşığı' })
  nameTr: string;

  @ApiPropertyOptional({ example: 'Ordered 10 coffees' })
  description?: string;

  @ApiPropertyOptional({ example: '10 kahve sipariş ettin' })
  descriptionTr?: string;

  @ApiPropertyOptional({ example: 'https://example.com/badge.png' })
  iconUrl?: string;

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z' })
  earnedAt: Date;
}

export class AdminUserListItemDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string;

  @ApiProperty({ enum: UserRole, example: 'customer' })
  role: UserRole;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: true })
  emailVerified: boolean;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '2025-01-15T10:30:00.000Z' })
  lastLoginAt?: Date;
}

export class AdminUserDetailDto extends AdminUserListItemDto {
  @ApiPropertyOptional({ example: 'Coffee enthusiast' })
  bio?: string;

  @ApiPropertyOptional({ example: '+905551234567' })
  phone?: string;

  @ApiProperty({ enum: Language, example: 'tr' })
  language: Language;

  @ApiProperty({ enum: Theme, example: 'light' })
  theme: Theme;

  @ApiProperty({ enum: Brand, example: 'coffee' })
  selectedBrand: Brand;

  @ApiProperty()
  stats: UserStatsResponseDto;

  @ApiProperty({ type: [UserBadgeResponseDto] })
  badges: UserBadgeResponseDto[];
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [AdminUserListItemDto] })
  users: AdminUserListItemDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}
