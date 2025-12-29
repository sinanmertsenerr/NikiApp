import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators';
import {
  UpdateProfileDto,
  UpdateSettingsDto,
  UserProfileResponseDto,
  UserStatsResponseDto,
  UserBadgeResponseDto,
} from './dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // ==================== PROFILE ====================

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile', type: UserProfileResponseDto })
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Updated profile', type: UserProfileResponseDto })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/avatar')
  @ApiOperation({ summary: 'Update avatar URL' })
  @ApiResponse({ status: 200, description: 'Avatar updated' })
  async updateAvatar(
    @CurrentUser() user: any,
    @Body('avatarUrl') avatarUrl: string,
  ) {
    return this.usersService.updateAvatar(user.id, avatarUrl);
  }

  @Delete('me/avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove avatar' })
  @ApiResponse({ status: 200, description: 'Avatar removed' })
  async deleteAvatar(@CurrentUser() user: any) {
    return this.usersService.deleteAvatar(user.id);
  }

  // ==================== SETTINGS ====================

  @Patch('me/settings')
  @ApiOperation({ summary: 'Update user settings (language, theme, brand)' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(
    @CurrentUser() user: any,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.usersService.updateSettings(user.id, dto);
  }

  // ==================== STATS ====================

  @Get('me/stats')
  @ApiOperation({ summary: 'Get current user statistics' })
  @ApiResponse({ status: 200, description: 'User stats', type: UserStatsResponseDto })
  async getStats(@CurrentUser() user: any) {
    return this.usersService.getStats(user.id);
  }

  // ==================== BADGES ====================

  @Get('me/badges')
  @ApiOperation({ summary: 'Get current user badges' })
  @ApiResponse({ status: 200, description: 'User badges', type: [UserBadgeResponseDto] })
  async getBadges(@CurrentUser() user: any) {
    return this.usersService.getBadges(user.id);
  }

  // ==================== PUSH NOTIFICATIONS ====================

  @Patch('me/push-token')
  @ApiOperation({ summary: 'Save Expo push notification token' })
  @ApiResponse({ status: 200, description: 'Push token saved' })
  async savePushToken(
    @CurrentUser() user: any,
    @Body('token') token: string,
  ) {
    return this.usersService.savePushToken(user.id, token);
  }

  @Delete('me/push-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove Expo push notification token' })
  @ApiResponse({ status: 200, description: 'Push token removed' })
  async removePushToken(@CurrentUser() user: any) {
    return this.usersService.removePushToken(user.id);
  }
}
