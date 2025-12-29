import {
  Controller,
  Get,
  Post,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CurrentUser } from '../common/decorators';
import {
  UserCampaignListResponseDto,
} from './dto';

@ApiTags('Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get('my')
  @ApiOperation({ summary: 'Get all my campaigns (active, used, expired)' })
  @ApiResponse({ status: 200, type: UserCampaignListResponseDto })
  async getMyCampaigns(@CurrentUser() user: any) {
    return this.campaignsService.getUserCampaigns(user.id);
  }

  @Get('my/active')
  @ApiOperation({ summary: 'Get my active (usable) campaigns' })
  @ApiResponse({ status: 200, type: UserCampaignListResponseDto })
  async getMyActiveCampaigns(@CurrentUser() user: any) {
    return this.campaignsService.getActiveCampaigns(user.id);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get campaigns I can claim with my points' })
  @ApiResponse({ status: 200 })
  async getAvailableCampaigns(@CurrentUser() user: any) {
    return this.campaignsService.getAvailableCampaigns(user.id);
  }

  @Post('claim/:campaignId')
  @ApiOperation({ summary: 'Claim an auto campaign using my points' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID to claim' })
  @ApiResponse({ status: 201, description: 'Campaign claimed successfully' })
  @ApiResponse({ status: 400, description: 'Not enough points or invalid campaign' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({ status: 409, description: 'Already have this campaign' })
  async claimCampaign(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignsService.claimCampaign(user.id, campaignId);
  }
}
