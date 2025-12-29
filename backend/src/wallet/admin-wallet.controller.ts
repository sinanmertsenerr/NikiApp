import {
  Controller,
  Get,
  Post,
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
import { WalletService } from './wallet.service';
import { Roles, CurrentUser } from '../common/decorators';
import {
  TopUpDto,
  PaymentDto,
  RefundDto,
  AdminTransactionsQueryDto,
  WalletWithUserDto,
  TopUpResultDto,
  PaymentResultDto,
  RefundResultDto,
  PaginatedTransactionsDto,
  WalletDashboardStatsDto,
} from './dto';

@ApiTags('Admin - Wallet')
@ApiBearerAuth()
@Controller('admin/wallet')
@Roles(UserRole.admin, UserRole.super_admin)
export class AdminWalletController {
  constructor(private readonly walletService: WalletService) { }

  @Get('scan/:qrCode')
  @ApiOperation({ summary: 'Scan QR code and get user wallet info' })
  @ApiParam({ name: 'qrCode', description: 'User QR code from wallet' })
  @ApiResponse({ status: 200, type: WalletWithUserDto })
  @ApiResponse({ status: 404, description: 'Invalid QR code' })
  async scanQrCode(@Param('qrCode') qrCode: string) {
    return this.walletService.scanQrCode(qrCode);
  }

  @Post('topup')
  @ApiOperation({ summary: 'Add credits to user wallet (top up)' })
  @ApiResponse({ status: 201, type: TopUpResultDto })
  @ApiResponse({ status: 404, description: 'Invalid QR code' })
  async topUp(
    @Body() dto: TopUpDto,
    @CurrentUser() admin: any,
  ) {
    return this.walletService.topUp(dto, admin.id);
  }

  @Post('payment')
  @ApiOperation({ summary: 'Process payment with Niki Credits (15% discount applied)' })
  @ApiResponse({ status: 201, type: PaymentResultDto })
  @ApiResponse({ status: 400, description: 'Insufficient balance' })
  @ApiResponse({ status: 404, description: 'Invalid QR code' })
  async processPayment(
    @Body() dto: PaymentDto,
    @CurrentUser() admin: any,
  ) {
    return this.walletService.processPayment(dto, admin.id);
  }

  @Post('refund')
  @ApiOperation({ summary: 'Process refund for a payment transaction' })
  @ApiResponse({ status: 201, type: RefundResultDto })
  @ApiResponse({ status: 400, description: 'Cannot refund this transaction' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async processRefund(
    @Body() dto: RefundDto,
    @CurrentUser() admin: any,
  ) {
    return this.walletService.processRefund(dto, admin.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get all transactions (with filters)' })
  @ApiResponse({ status: 200, type: PaginatedTransactionsDto })
  async getAllTransactions(@Query() query: AdminTransactionsQueryDto) {
    return this.walletService.getAllTransactions(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get wallet dashboard statistics' })
  @ApiResponse({ status: 200, type: WalletDashboardStatsDto })
  async getDashboardStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.walletService.getDashboardStats(startDate, endDate);
  }


}
