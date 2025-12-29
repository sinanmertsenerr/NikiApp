import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignType, RewardType, CampaignStatus } from '@prisma/client';

export class CampaignResponseDto {
  @ApiProperty({ example: 'campaign-uuid' })
  id: string;

  @ApiProperty({ enum: CampaignType })
  type: CampaignType;

  @ApiProperty({ example: 'Free Coffee' })
  title: string;

  @ApiProperty({ example: 'Bedava Kahve' })
  titleTr: string;

  @ApiPropertyOptional({ example: 'Earn 10 points and get a free coffee!' })
  description?: string;

  @ApiPropertyOptional({ example: '10 puan kazanın, bedava kahve alın!' })
  descriptionTr?: string;

  @ApiProperty({ enum: RewardType })
  rewardType: RewardType;

  @ApiPropertyOptional({ example: '10.00' })
  rewardValue?: string;

  @ApiProperty({ example: 10 })
  requiredPoints: number;

  @ApiPropertyOptional({ example: 'https://example.com/campaign.jpg' })
  imageUrl?: string;

  @ApiPropertyOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  endDate?: Date;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class UserCampaignResponseDto {
  @ApiProperty({ example: 'user-campaign-uuid' })
  id: string;

  @ApiProperty({ enum: CampaignStatus })
  status: CampaignStatus;

  @ApiProperty()
  assignedAt: Date;

  @ApiPropertyOptional()
  redeemedAt?: Date;

  @ApiProperty()
  campaign: CampaignResponseDto;
}

export class PaginatedCampaignsResponseDto {
  @ApiProperty({ type: [CampaignResponseDto] })
  campaigns: CampaignResponseDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class UserCampaignListResponseDto {
  @ApiProperty({ type: [UserCampaignResponseDto] })
  campaigns: UserCampaignResponseDto[];

  @ApiProperty({ example: 5 })
  total: number;
}

export class CampaignRedeemResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Campaign redeemed successfully' })
  message: string;

  @ApiProperty({ enum: RewardType })
  rewardType: RewardType;

  @ApiPropertyOptional({ example: '10.00' })
  rewardValue?: string;
}
