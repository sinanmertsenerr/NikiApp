import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CurrentUser } from '../common/decorators';
import {
  GetTransactionsQueryDto,
  WalletResponseDto,
  PaginatedTransactionsDto,
} from './dto';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my wallet info (QR code, balance)' })
  @ApiResponse({ status: 200, type: WalletResponseDto })
  async getMyWallet(@CurrentUser() user: any) {
    return this.walletService.getMyWallet(user.id);
  }

  @Get('me/transactions')
  @ApiOperation({ summary: 'Get my transaction history' })
  @ApiResponse({ status: 200, type: PaginatedTransactionsDto })
  async getMyTransactions(
    @CurrentUser() user: any,
    @Query() query: GetTransactionsQueryDto,
  ) {
    return this.walletService.getMyTransactions(user.id, query);
  }
}
