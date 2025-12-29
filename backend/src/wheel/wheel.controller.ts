import {
  Controller,
  Get,
  Post,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { WheelService } from './wheel.service';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../common/decorators';

@ApiTags('Wheel')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('wheel')
export class WheelController {
  constructor(private readonly wheelService: WheelService) {}

  // ==================== GET WHEEL STATUS ====================

  @Get('status')
  @ApiOperation({ summary: 'Check spin rights for current week' })
  @ApiResponse({
    status: 200,
    description: 'Wheel status returned',
  })
  async getStatus(@CurrentUser('id') userId: string) {
    const status = await this.wheelService.getStatus(userId);
    return {
      success: true,
      data: status,
    };
  }

  // ==================== SPIN THE WHEEL ====================

  @Post('spin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Spin the wheel (1 right per week)' })
  @ApiResponse({
    status: 200,
    description: 'Spin result returned',
  })
  @ApiResponse({
    status: 400,
    description: 'Already spun this week or no spin rights',
  })
  async spin(@CurrentUser('id') userId: string) {
    const result = await this.wheelService.spin(userId);
    return {
      success: true,
      data: result,
    };
  }

  // ==================== GET SPIN HISTORY ====================

  @Get('history')
  @ApiOperation({ summary: 'Get spin history' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records to return (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Spin history returned',
  })
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    const history = await this.wheelService.getHistory(userId, limit || 10);
    return {
      success: true,
      data: { spins: history },
    };
  }
}
