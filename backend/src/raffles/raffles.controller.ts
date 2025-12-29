import {
    Controller,
    Get,
    Post,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth';
import { CurrentUser } from '../common/decorators';
import { RafflesService } from './raffles.service';

@ApiTags('Raffles')
@ApiBearerAuth()
@Controller('raffles')
@UseGuards(JwtAuthGuard)
export class RafflesController {
    constructor(private readonly rafflesService: RafflesService) { }

    @Get('active')
    @ApiOperation({ summary: 'Get active raffles that user can join' })
    async getActiveRaffles() {
        return this.rafflesService.getActiveRaffles();
    }

    @Get('my')
    @ApiOperation({ summary: 'Get raffles user has joined' })
    async getMyRaffles(@CurrentUser('id') userId: string) {
        return this.rafflesService.getUserRaffles(userId);
    }

    @Post(':id/join')
    @ApiOperation({ summary: 'Join a raffle' })
    async joinRaffle(
        @CurrentUser('id') userId: string,
        @Param('id') raffleId: string,
    ) {
        return this.rafflesService.joinRaffle(userId, raffleId);
    }
}
