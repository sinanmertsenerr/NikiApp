import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto, AddMemberDto, AddMembersDto } from './dto/group.dto';

@ApiTags('Groups')
@Controller()
export class GroupsController {
    constructor(private readonly groupsService: GroupsService) { }

    // =============== USER ENDPOINTS ===============

    @Get('groups/my')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get my groups' })
    async getMyGroups(@CurrentUser('id') userId: string) {
        return this.groupsService.getMyGroups(userId);
    }

    // =============== ADMIN ENDPOINTS ===============

    @Get('admin/groups')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'super_admin')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get all groups (admin)' })
    async findAll() {
        return this.groupsService.findAll();
    }

    @Get('admin/groups/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'super_admin')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get group details with members (admin)' })
    async findOne(@Param('id') id: string) {
        return this.groupsService.findOne(id);
    }

    @Post('admin/groups')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'super_admin')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Create new group (admin)' })
    async create(@Body() dto: CreateGroupDto) {
        return this.groupsService.create(dto);
    }

    @Patch('admin/groups/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'super_admin')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update group (admin)' })
    async update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
        return this.groupsService.update(id, dto);
    }

    @Delete('admin/groups/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'super_admin')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Delete group (admin)' })
    async delete(@Param('id') id: string) {
        return this.groupsService.delete(id);
    }

    @Post('admin/groups/:id/members')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'super_admin')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Add single member to group (admin)' })
    async addMember(@Param('id') groupId: string, @Body() dto: AddMemberDto) {
        return this.groupsService.addMember(groupId, dto.userId);
    }

    @Post('admin/groups/:id/members/bulk')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'super_admin')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Add multiple members to group (admin)' })
    async addMembers(@Param('id') groupId: string, @Body() dto: AddMembersDto) {
        return this.groupsService.addMembers(groupId, dto.userIds);
    }

    @Delete('admin/groups/:id/members/:userId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'super_admin')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Remove member from group (admin)' })
    async removeMember(
        @Param('id') groupId: string,
        @Param('userId') userId: string,
    ) {
        return this.groupsService.removeMember(groupId, userId);
    }
}
