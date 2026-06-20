import {
  Controller,
  UseGuards,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CampaignsService } from './campaigns.service';
import { Roles, CurrentUser } from '../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  GetCampaignsQueryDto,
  AssignCampaignDto,
  AssignCampaignBulkDto,
  RedeemCampaignDto,
  RedeemCampaignByQrDto,
  PaginatedCampaignsResponseDto,
  CampaignResponseDto,
  CampaignRedeemResultDto,
  CampaignStatsQueryDto,
  CampaignUsersQueryDto,
  DashboardStatsQueryDto,
  CampaignStatsResponseDto,
  PaginatedCampaignUsersDto,
  DashboardCampaignSummaryDto,
  DashboardOverviewDto,
} from './dto';

@ApiTags('Admin - Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/campaigns')
@Roles(UserRole.admin, UserRole.super_admin)
export class AdminCampaignsController {
  constructor(private readonly campaignsService: CampaignsService) { }

  @Get()
  @ApiOperation({ summary: 'Get all campaigns (paginated)' })
  @ApiResponse({ status: 200, type: PaginatedCampaignsResponseDto })
  async getCampaigns(@Query() query: GetCampaignsQueryDto) {
    return this.campaignsService.getCampaigns(query);
  }

  // ==================== SPECIFIC ROUTES (must be before :id) ====================

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get all campaigns statistics summary' })
  @ApiResponse({ status: 200, type: DashboardCampaignSummaryDto })
  async getAllCampaignsStats(@Query() query: CampaignStatsQueryDto) {
    return this.campaignsService.getAllCampaignsStats(query);
  }

  @Get('stats/:id')
  @ApiOperation({ summary: 'Get statistics for a specific campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({ status: 200, type: CampaignStatsResponseDto })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignStats(
    @Param('id') id: string,
    @Query() query: CampaignStatsQueryDto,
  ) {
    return this.campaignsService.getCampaignStats(id, query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get users who have a specific campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({ status: 200, type: PaginatedCampaignUsersDto })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignUsers(
    @Param('id') id: string,
    @Query() query: CampaignUsersQueryDto,
  ) {
    return this.campaignsService.getCampaignUsers(id, query);
  }

  @Get('groups/:id')
  @ApiOperation({ summary: 'Get groups assigned to a specific campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({ status: 200, description: 'List of assigned groups' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignGroups(
    @Param('id') id: string,
  ) {
    return this.campaignsService.getCampaignAssignedGroups(id);
  }

  @Get('dashboard/overview')
  @ApiOperation({ summary: 'Get full dashboard overview (users, campaigns, points, wheel)' })
  @ApiResponse({ status: 200, type: DashboardOverviewDto })
  async getDashboardOverview(@Query() query: DashboardStatsQueryDto) {
    return this.campaignsService.getDashboardOverview(query);
  }

  // ==================== GENERIC :id ROUTE (must be after specific routes) ====================

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({ status: 200, type: CampaignResponseDto })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignById(@Param('id') id: string) {
    return this.campaignsService.getCampaignById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({ status: 201, type: CampaignResponseDto })
  async createCampaign(@Body() dto: CreateCampaignDto) {
    return this.campaignsService.createCampaign(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({ status: 200, type: CampaignResponseDto })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async updateCampaign(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.updateCampaign(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({ status: 200, description: 'Campaign deleted' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async deleteCampaign(@Param('id') id: string) {
    return this.campaignsService.deleteCampaign(id);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign campaign to a single user' })
  @ApiResponse({ status: 201, description: 'Campaign assigned' })
  @ApiResponse({ status: 404, description: 'User or campaign not found' })
  async assignCampaign(@Body() dto: AssignCampaignDto) {
    return this.campaignsService.assignCampaignToUser(dto.userId, dto.campaignId);
  }

  @Post('assign-bulk')
  @ApiOperation({ summary: 'Assign campaign to multiple users or all users' })
  @ApiResponse({ status: 201, description: 'Campaign assigned to users' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async assignCampaignBulk(@Body() dto: AssignCampaignBulkDto) {
    return this.campaignsService.assignCampaignToUsers(dto.campaignId, dto.userIds, dto.groupIds);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem user campaign (when customer uses at store)' })
  @ApiResponse({ status: 200, type: CampaignRedeemResultDto })
  @ApiResponse({ status: 400, description: 'Campaign not active or expired' })
  @ApiResponse({ status: 404, description: 'User campaign not found' })
  async redeemCampaign(
    @Body() dto: RedeemCampaignDto,
    @CurrentUser() admin: any,
  ) {
    return this.campaignsService.redeemCampaign(dto.userCampaignId, admin.id);
  }

  @Post('redeem-qr')
  @ApiOperation({ summary: 'Redeem campaign by scanning QR code' })
  @ApiResponse({ status: 200, description: 'Campaign redeemed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid QR, campaign not active or expired' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async redeemCampaignByQr(
    @Body() dto: RedeemCampaignByQrDto,
    @CurrentUser() admin: any,
  ) {
    return this.campaignsService.redeemCampaignByQr(dto.qrCode, admin.id);
  }
}
