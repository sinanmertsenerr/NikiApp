import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignStatus } from '@prisma/client';

// ==================== QUERY DTOs ====================

export class CampaignStatsQueryDto {
  @ApiPropertyOptional({ example: '2025-01-01', description: 'Start date filter' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'End date filter' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CampaignUsersQueryDto {
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
  @Max(10000)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: CampaignStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional({ example: '2025-01-01', description: 'Assigned after date' })
  @IsOptional()
  @IsDateString()
  assignedAfter?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Assigned before date' })
  @IsOptional()
  @IsDateString()
  assignedBefore?: string;
}

export class DashboardStatsQueryDto {
  @ApiPropertyOptional({ example: '2025-01-01', description: 'Start date filter' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'End date filter' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// ==================== RESPONSE DTOs ====================

export class CampaignStatsResponseDto {
  @ApiProperty({ example: 'campaign-uuid' })
  campaignId: string;

  @ApiProperty({ example: 'Free Coffee' })
  title: string;

  @ApiProperty({ example: 'Bedava Kahve' })
  titleTr: string;

  @ApiProperty({ example: 150, description: 'Total times assigned to users' })
  totalAssigned: number;

  @ApiProperty({ example: 85, description: 'Times redeemed/used' })
  totalRedeemed: number;

  @ApiProperty({ example: 50, description: 'Currently active (not used)' })
  activeCount: number;

  @ApiProperty({ example: 15, description: 'Expired without use' })
  expiredCount: number;

  @ApiProperty({ example: 56.67, description: 'Usage rate percentage' })
  usageRate: number;
}

export class CampaignUserItemDto {
  @ApiProperty({ example: 'user-campaign-uuid' })
  id: string;

  @ApiProperty({ example: 'user-uuid' })
  userId: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string;

  @ApiProperty({ enum: CampaignStatus })
  status: CampaignStatus;

  @ApiProperty()
  assignedAt: Date;

  @ApiPropertyOptional()
  redeemedAt?: Date;

  @ApiPropertyOptional({ example: 'admin-uuid', description: 'Admin who redeemed' })
  redeemedBy?: string;

  @ApiPropertyOptional({ example: 'Admin Name', description: 'Admin name who redeemed' })
  redeemedByName?: string;
}

export class PaginatedCampaignUsersDto {
  @ApiProperty({ type: [CampaignUserItemDto] })
  users: CampaignUserItemDto[];

  @ApiProperty({ example: 150 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 8 })
  totalPages: number;
}

// ==================== DASHBOARD DTOs ====================

export class DashboardCampaignSummaryDto {
  @ApiProperty({ example: 10, description: 'Total campaigns' })
  totalCampaigns: number;

  @ApiProperty({ example: 8, description: 'Active campaigns' })
  activeCampaigns: number;

  @ApiProperty({ example: 500, description: 'Total times campaigns assigned' })
  totalAssignments: number;

  @ApiProperty({ example: 320, description: 'Total redemptions' })
  totalRedemptions: number;

  @ApiProperty({ example: 64.0, description: 'Overall usage rate %' })
  overallUsageRate: number;

  @ApiProperty({ type: [CampaignStatsResponseDto], description: 'Stats per campaign' })
  campaignBreakdown: CampaignStatsResponseDto[];
}

export class DashboardPointsSummaryDto {
  @ApiProperty({ example: 5000, description: 'Total points earned by all users' })
  totalPointsEarned: number;

  @ApiProperty({ example: 3200, description: 'Total points redeemed' })
  totalPointsRedeemed: number;

  @ApiProperty({ example: 1800, description: 'Total points still available' })
  totalPointsAvailable: number;

  @ApiProperty({ example: 250, description: 'Users with points' })
  usersWithPoints: number;

  @ApiProperty({ example: 20.0, description: 'Average points per user' })
  averagePointsPerUser: number;
}

export class DashboardWheelSummaryDto {
  @ApiProperty({ example: 1200, description: 'Total wheel spins' })
  totalSpins: number;

  @ApiProperty({ example: 450, description: 'Spins that won something' })
  winningSpins: number;

  @ApiProperty({ example: 37.5, description: 'Win rate %' })
  winRate: number;

  @ApiProperty({ description: 'Breakdown by reward type' })
  rewardBreakdown: {
    points: number;
    discount: number;
    free_coffee: number;
    badge: number;
    nothing: number;
  };
}

export class DashboardUsersSummaryDto {
  @ApiProperty({ example: 500, description: 'Total registered users' })
  totalUsers: number;

  @ApiProperty({ example: 450, description: 'Verified users' })
  verifiedUsers: number;

  @ApiProperty({ example: 480, description: 'Active users' })
  activeUsers: number;

  @ApiProperty({ example: 25, description: 'New users in period' })
  newUsersInPeriod: number;
}

export class DashboardOverviewDto {
  @ApiProperty()
  users: DashboardUsersSummaryDto;

  @ApiProperty()
  campaigns: DashboardCampaignSummaryDto;

  @ApiProperty()
  points: DashboardPointsSummaryDto;

  @ApiProperty()
  wheel: DashboardWheelSummaryDto;

  @ApiProperty({ description: 'Query period' })
  period: {
    startDate: string | null;
    endDate: string | null;
  };

  @ApiProperty()
  generatedAt: Date;
}
