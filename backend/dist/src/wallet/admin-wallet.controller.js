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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminWalletController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const wallet_service_1 = require("./wallet.service");
const decorators_1 = require("../common/decorators");
const dto_1 = require("./dto");
let AdminWalletController = class AdminWalletController {
    walletService;
    constructor(walletService) {
        this.walletService = walletService;
    }
    async scanQrCode(qrCode) {
        return this.walletService.scanQrCode(qrCode);
    }
    async topUp(dto, admin) {
        return this.walletService.topUp(dto, admin.id);
    }
    async processPayment(dto, admin) {
        return this.walletService.processPayment(dto, admin.id);
    }
    async processRefund(dto, admin) {
        return this.walletService.processRefund(dto, admin.id);
    }
    async getAllTransactions(query) {
        return this.walletService.getAllTransactions(query);
    }
    async getDashboardStats(startDate, endDate) {
        return this.walletService.getDashboardStats(startDate, endDate);
    }
};
exports.AdminWalletController = AdminWalletController;
__decorate([
    (0, common_1.Get)('scan/:qrCode'),
    (0, swagger_1.ApiOperation)({ summary: 'Scan QR code and get user wallet info' }),
    (0, swagger_1.ApiParam)({ name: 'qrCode', description: 'User QR code from wallet' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.WalletWithUserDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Invalid QR code' }),
    __param(0, (0, common_1.Param)('qrCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminWalletController.prototype, "scanQrCode", null);
__decorate([
    (0, common_1.Post)('topup'),
    (0, swagger_1.ApiOperation)({ summary: 'Add credits to user wallet (top up)' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: dto_1.TopUpResultDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Invalid QR code' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.TopUpDto, Object]),
    __metadata("design:returntype", Promise)
], AdminWalletController.prototype, "topUp", null);
__decorate([
    (0, common_1.Post)('payment'),
    (0, swagger_1.ApiOperation)({ summary: 'Process payment with Niki Credits (15% discount applied)' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: dto_1.PaymentResultDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Insufficient balance' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Invalid QR code' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PaymentDto, Object]),
    __metadata("design:returntype", Promise)
], AdminWalletController.prototype, "processPayment", null);
__decorate([
    (0, common_1.Post)('refund'),
    (0, swagger_1.ApiOperation)({ summary: 'Process refund for a payment transaction' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: dto_1.RefundResultDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cannot refund this transaction' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Transaction not found' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RefundDto, Object]),
    __metadata("design:returntype", Promise)
], AdminWalletController.prototype, "processRefund", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all transactions (with filters)' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.PaginatedTransactionsDto }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AdminTransactionsQueryDto]),
    __metadata("design:returntype", Promise)
], AdminWalletController.prototype, "getAllTransactions", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get wallet dashboard statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.WalletDashboardStatsDto }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminWalletController.prototype, "getDashboardStats", null);
exports.AdminWalletController = AdminWalletController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Wallet'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('admin/wallet'),
    (0, decorators_1.Roles)(client_1.UserRole.admin, client_1.UserRole.super_admin),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], AdminWalletController);
//# sourceMappingURL=admin-wallet.controller.js.map