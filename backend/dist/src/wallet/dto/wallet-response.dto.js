"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletDashboardStatsDto = exports.RefundResultDto = exports.PaymentResultDto = exports.TopUpResultDto = exports.PaginatedTransactionsDto = exports.TransactionResponseDto = exports.WalletWithUserDto = exports.WalletResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class WalletResponseDto {
    id;
    nikiCredits;
    qrCode;
    createdAt;
    updatedAt;
}
exports.WalletResponseDto = WalletResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'wallet-uuid' }),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '150.00', description: 'Current Niki Credits balance' }),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "nikiCredits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'NIKI-ABC123XYZ', description: 'Unique QR code for this wallet' }),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "qrCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], WalletResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], WalletResponseDto.prototype, "updatedAt", void 0);
class WalletWithUserDto extends WalletResponseDto {
    user;
    loyaltyPoints;
    activeCampaignsCount;
}
exports.WalletWithUserDto = WalletWithUserDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], WalletWithUserDto.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Loyalty points info' }),
    __metadata("design:type", Object)
], WalletWithUserDto.prototype, "loyaltyPoints", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, description: 'Active campaigns count' }),
    __metadata("design:type", Number)
], WalletWithUserDto.prototype, "activeCampaignsCount", void 0);
class TransactionResponseDto {
    id;
    type;
    amount;
    originalAmount;
    discountApplied;
    discountPercentage;
    isFullPayment;
    balanceBefore;
    balanceAfter;
    description;
    createdAt;
    admin;
}
exports.TransactionResponseDto = TransactionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'transaction-uuid' }),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.TransactionType }),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '55.25', description: 'Transaction amount' }),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '65.00', description: 'Original amount before discount' }),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "originalAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '9.75', description: 'Discount applied' }),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "discountApplied", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '15.00', description: 'Discount percentage' }),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "discountPercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Was full payment with Niki Credits' }),
    __metadata("design:type", Boolean)
], TransactionResponseDto.prototype, "isFullPayment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '200.00', description: 'Balance before transaction' }),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "balanceBefore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '144.75', description: 'Balance after transaction' }),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "balanceAfter", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Latte + Brownie' }),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], TransactionResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Admin who processed (for admin view)' }),
    __metadata("design:type", Object)
], TransactionResponseDto.prototype, "admin", void 0);
class PaginatedTransactionsDto {
    transactions;
    total;
    page;
    limit;
    totalPages;
}
exports.PaginatedTransactionsDto = PaginatedTransactionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TransactionResponseDto] }),
    __metadata("design:type", Array)
], PaginatedTransactionsDto.prototype, "transactions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50 }),
    __metadata("design:type", Number)
], PaginatedTransactionsDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], PaginatedTransactionsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 20 }),
    __metadata("design:type", Number)
], PaginatedTransactionsDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], PaginatedTransactionsDto.prototype, "totalPages", void 0);
class TopUpResultDto {
    success;
    message;
    transaction;
    newBalance;
}
exports.TopUpResultDto = TopUpResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], TopUpResultDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Top up successful' }),
    __metadata("design:type", String)
], TopUpResultDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", TransactionResponseDto)
], TopUpResultDto.prototype, "transaction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '250.00', description: 'New balance after top up' }),
    __metadata("design:type", String)
], TopUpResultDto.prototype, "newBalance", void 0);
class PaymentResultDto {
    success;
    message;
    transaction;
    originalAmount;
    chargedAmount;
    discountSaved;
    newBalance;
}
exports.PaymentResultDto = PaymentResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], PaymentResultDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Payment successful' }),
    __metadata("design:type", String)
], PaymentResultDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", TransactionResponseDto)
], PaymentResultDto.prototype, "transaction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '65.00', description: 'Original order amount' }),
    __metadata("design:type", String)
], PaymentResultDto.prototype, "originalAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '55.25', description: 'Amount charged after 15% discount' }),
    __metadata("design:type", String)
], PaymentResultDto.prototype, "chargedAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '9.75', description: 'Amount saved with discount' }),
    __metadata("design:type", String)
], PaymentResultDto.prototype, "discountSaved", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '94.75', description: 'Remaining balance' }),
    __metadata("design:type", String)
], PaymentResultDto.prototype, "newBalance", void 0);
class RefundResultDto {
    success;
    message;
    transaction;
    refundedAmount;
    newBalance;
}
exports.RefundResultDto = RefundResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], RefundResultDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Refund successful' }),
    __metadata("design:type", String)
], RefundResultDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", TransactionResponseDto)
], RefundResultDto.prototype, "transaction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '55.25', description: 'Amount refunded' }),
    __metadata("design:type", String)
], RefundResultDto.prototype, "refundedAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '150.00', description: 'New balance after refund' }),
    __metadata("design:type", String)
], RefundResultDto.prototype, "newBalance", void 0);
class WalletDashboardStatsDto {
    totalCreditsInCirculation;
    totalTopUps;
    totalPayments;
    totalRefunds;
    totalDiscountsGiven;
    walletsCount;
    transactionsCount;
    transactionBreakdown;
}
exports.WalletDashboardStatsDto = WalletDashboardStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '15000.00', description: 'Total Niki Credits in circulation' }),
    __metadata("design:type", String)
], WalletDashboardStatsDto.prototype, "totalCreditsInCirculation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '8500.00', description: 'Total top-ups' }),
    __metadata("design:type", String)
], WalletDashboardStatsDto.prototype, "totalTopUps", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '6500.00', description: 'Total payments received' }),
    __metadata("design:type", String)
], WalletDashboardStatsDto.prototype, "totalPayments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '500.00', description: 'Total refunds' }),
    __metadata("design:type", String)
], WalletDashboardStatsDto.prototype, "totalRefunds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '975.00', description: 'Total discounts given' }),
    __metadata("design:type", String)
], WalletDashboardStatsDto.prototype, "totalDiscountsGiven", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 250, description: 'Number of wallets' }),
    __metadata("design:type", Number)
], WalletDashboardStatsDto.prototype, "walletsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1200, description: 'Total transactions' }),
    __metadata("design:type", Number)
], WalletDashboardStatsDto.prototype, "transactionsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Breakdown by transaction type' }),
    __metadata("design:type", Object)
], WalletDashboardStatsDto.prototype, "transactionBreakdown", void 0);
//# sourceMappingURL=wallet-response.dto.js.map