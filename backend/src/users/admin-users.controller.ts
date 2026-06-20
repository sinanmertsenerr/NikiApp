import {
  Controller,
  UseGuards,
  Get,
  Patch,
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
import { UsersService } from './users.service';
import { Roles, CurrentUser } from '../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import {
  GetUsersQueryDto,
  UpdateUserStatusDto,
  ToggleIeuWalletDto,
  ToggleNegativeBalanceDto,
  PaginatedUsersResponseDto,
  AdminUserDetailDto,
} from './dto';

@ApiTags('Admin - Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/users')
@Roles(UserRole.admin, UserRole.super_admin)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @ApiOperation({ summary: 'Get all users (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated users list', type: PaginatedUsersResponseDto })
  async getUsers(@Query() query: GetUsersQueryDto) {
    return this.usersService.getUsers(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User details', type: AdminUserDetailDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(
    @Param('id') id: string,
    @CurrentUser() admin: any,
  ) {
    return this.usersService.getUserById(id, admin.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user status (active/role)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User status updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Cannot modify this user' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() admin: any,
  ) {
    return this.usersService.updateUserStatus(id, dto, admin.id);
  }

  @Patch(':id/ieu-wallet-status')
  @ApiOperation({ summary: 'Toggle IEU wallet active status' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'IEU wallet status updated' })
  @ApiResponse({ status: 404, description: 'User or IEU wallet not found' })
  async toggleIeuWalletStatus(
    @Param('id') id: string,
    @Body() dto: ToggleIeuWalletDto,
    @CurrentUser() admin: any,
  ) {
    return this.usersService.toggleIeuWalletStatus(id, dto.isActive, admin.id);
  }

  @Patch(':id/negative-balance')
  @ApiOperation({ summary: 'Toggle wallet negative balance permission' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Negative balance settings updated' })
  @ApiResponse({ status: 404, description: 'User or wallet not found' })
  async toggleNegativeBalance(
    @Param('id') id: string,
    @Body() dto: ToggleNegativeBalanceDto,
    @CurrentUser() admin: any,
  ) {
    return this.usersService.toggleNegativeBalance(
      id,
      dto.walletType,
      dto.allowNegative,
      dto.negativeLimit || 0,
    );
  }
}
