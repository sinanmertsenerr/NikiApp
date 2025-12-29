import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CampaignType, RewardType, CampaignTargetType } from '@prisma/client';

export class CreateCampaignDto {
  @ApiProperty({ enum: CampaignType, example: 'auto' })
  @IsEnum(CampaignType)
  type: CampaignType;

  @ApiProperty({ enum: CampaignTargetType, example: 'users', default: 'users' })
  @IsEnum(CampaignTargetType)
  @IsOptional()
  targetType?: CampaignTargetType;

  @ApiProperty({ example: 'Free Coffee' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Bedava Kahve' })
  @IsString()
  titleTr: string;

  @ApiPropertyOptional({ example: 'Earn 10 points and get a free coffee!' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '10 puan kazanın, bedava kahve alın!' })
  @IsOptional()
  @IsString()
  descriptionTr?: string;

  @ApiProperty({ enum: RewardType, example: 'free_coffee' })
  @IsEnum(RewardType)
  rewardType: RewardType;

  @ApiPropertyOptional({ example: 10, description: 'Reward value (discount %, fixed amount, or bonus points)' })
  @IsOptional()
  @IsNumber()
  rewardValue?: number;

  @ApiPropertyOptional({ example: 10, description: 'Required points to earn this campaign' })
  @IsOptional()
  @IsInt()
  @Min(0)
  requiredPoints?: number;

  @ApiPropertyOptional({ example: 'https://example.com/campaign.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCampaignDto {
  @ApiPropertyOptional({ enum: CampaignType })
  @IsOptional()
  @IsEnum(CampaignType)
  type?: CampaignType;

  @ApiPropertyOptional({ enum: CampaignTargetType })
  @IsOptional()
  @IsEnum(CampaignTargetType)
  targetType?: CampaignTargetType;

  @ApiPropertyOptional({ example: 'Free Coffee' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Bedava Kahve' })
  @IsOptional()
  @IsString()
  titleTr?: string;

  @ApiPropertyOptional({ example: 'Earn 10 points and get a free coffee!' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '10 puan kazanın, bedava kahve alın!' })
  @IsOptional()
  @IsString()
  descriptionTr?: string;

  @ApiPropertyOptional({ enum: RewardType })
  @IsOptional()
  @IsEnum(RewardType)
  rewardType?: RewardType;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  rewardValue?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  requiredPoints?: number;

  @ApiPropertyOptional({ example: 'https://example.com/campaign.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignCampaignDto {
  @ApiProperty({ example: 'user-uuid', description: 'User ID to assign campaign to' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'campaign-uuid', description: 'Campaign ID to assign' })
  @IsString()
  campaignId: string;
}

export class AssignCampaignBulkDto {
  @ApiProperty({ example: 'campaign-uuid', description: 'Campaign ID to assign' })
  @IsString()
  campaignId: string;

  @ApiPropertyOptional({
    example: ['user-uuid-1', 'user-uuid-2'],
    description: 'User IDs to assign campaign to. If empty or not provided, campaign becomes available to all users.',
    type: [String]
  })
  @IsOptional()
  @IsString({ each: true })
  userIds?: string[];

  @ApiPropertyOptional({
    example: ['group-uuid-1', 'group-uuid-2'],
    description: 'Group IDs - all members of these groups will be assigned the campaign.',
    type: [String]
  })
  @IsOptional()
  @IsString({ each: true })
  groupIds?: string[];
}

export class RedeemCampaignDto {
  @ApiProperty({ example: 'user-campaign-uuid', description: 'UserCampaign ID to redeem' })
  @IsString()
  userCampaignId: string;
}

export class RedeemCampaignByQrDto {
  @ApiProperty({ example: 'CAMPAIGN-uuid', description: 'QR code from user\'s campaign' })
  @IsString()
  qrCode: string;
}

export class GetCampaignsQueryDto {
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

  @ApiPropertyOptional({ enum: CampaignType })
  @IsOptional()
  @IsEnum(CampaignType)
  type?: CampaignType;

  @ApiPropertyOptional({ enum: CampaignTargetType })
  @IsOptional()
  @IsEnum(CampaignTargetType)
  targetType?: CampaignTargetType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
