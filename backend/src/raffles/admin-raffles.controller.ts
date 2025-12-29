import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../auth';
import { Roles } from '../common/decorators';
import { RafflesService } from './raffles.service';
import {
    CreateRaffleDto,
    UpdateRaffleDto,
    GetRafflesQueryDto,
    DrawRaffleDto,
} from './dto';

@ApiTags('Admin Raffles')
@ApiBearerAuth()
@Controller('admin/raffles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.super_admin)
export class AdminRafflesController {
    constructor(private readonly rafflesService: RafflesService) { }

    @Get()
    @ApiOperation({ summary: 'Get all raffles (admin)' })
    async getRaffles(@Query() query: GetRafflesQueryDto) {
        return this.rafflesService.getRaffles(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get raffle by ID (admin)' })
    async getRaffle(@Param('id') id: string) {
        return this.rafflesService.getRaffleById(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create raffle (admin)' })
    async createRaffle(@Body() dto: CreateRaffleDto) {
        return this.rafflesService.createRaffle(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update raffle (admin)' })
    async updateRaffle(@Param('id') id: string, @Body() dto: UpdateRaffleDto) {
        return this.rafflesService.updateRaffle(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete raffle (admin)' })
    async deleteRaffle(@Param('id') id: string) {
        return this.rafflesService.deleteRaffle(id);
    }

    @Get(':id/participants')
    @ApiOperation({ summary: 'Get raffle participants (admin)' })
    async getParticipants(@Param('id') id: string) {
        return this.rafflesService.getRaffleParticipants(id);
    }

    @Post(':id/draw')
    @ApiOperation({ summary: 'Draw raffle and select winners (admin)' })
    async drawRaffle(@Param('id') id: string, @Body() dto: DrawRaffleDto) {
        return this.rafflesService.drawRaffle(id, dto);
    }
}
