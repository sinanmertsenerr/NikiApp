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
exports.AdminTransactionsQueryDto = exports.GetTransactionsQueryDto = exports.RefundDto = exports.PaymentDto = exports.TopUpDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class TopUpDto {
    qrCode;
    amount;
    description;
}
exports.TopUpDto = TopUpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'qr-code-here', description: 'User QR code from wallet' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TopUpDto.prototype, "qrCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100, description: 'Amount to add (TL)' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], TopUpDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Birthday bonus', description: 'Description for the transaction' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TopUpDto.prototype, "description", void 0);
class PaymentDto {
    qrCode;
    amount;
    useDiscount;
    description;
}
exports.PaymentDto = PaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'qr-code-here', description: 'User QR code from wallet' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentDto.prototype, "qrCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 65, description: 'Original order amount (TL) before discount' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], PaymentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true, description: 'Use Niki Credits with 15% discount (default: true). Set false for cash/card payment.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], PaymentDto.prototype, "useDiscount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Latte + Brownie', description: 'Order description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentDto.prototype, "description", void 0);
class RefundDto {
    transactionId;
    reason;
}
exports.RefundDto = RefundDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'transaction-uuid', description: 'Original transaction ID to refund' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RefundDto.prototype, "transactionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Customer complaint', description: 'Reason for refund' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RefundDto.prototype, "reason", void 0);
class GetTransactionsQueryDto {
    page = 1;
    limit = 20;
    type;
    startDate;
    endDate;
}
exports.GetTransactionsQueryDto = GetTransactionsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GetTransactionsQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], GetTransactionsQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.TransactionType, description: 'Filter by transaction type' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TransactionType),
    __metadata("design:type", String)
], GetTransactionsQueryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-01-01', description: 'Start date filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetTransactionsQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-12-31', description: 'End date filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetTransactionsQueryDto.prototype, "endDate", void 0);
class AdminTransactionsQueryDto extends GetTransactionsQueryDto {
    userId;
    adminId;
}
exports.AdminTransactionsQueryDto = AdminTransactionsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'user-uuid', description: 'Filter by user ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminTransactionsQueryDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'admin-uuid', description: 'Filter by admin who processed' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminTransactionsQueryDto.prototype, "adminId", void 0);
//# sourceMappingURL=wallet.dto.js.map