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
exports.AdminCampaignsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const campaigns_service_1 = require("./campaigns.service");
const decorators_1 = require("../common/decorators");
const dto_1 = require("./dto");
let AdminCampaignsController = class AdminCampaignsController {
    campaignsService;
    constructor(campaignsService) {
        this.campaignsService = campaignsService;
    }
    async getCampaigns(query) {
        return this.campaignsService.getCampaigns(query);
    }
    async getAllCampaignsStats(query) {
        return this.campaignsService.getAllCampaignsStats(query);
    }
    async getCampaignStats(id, query) {
        return this.campaignsService.getCampaignStats(id, query);
    }
    async getCampaignUsers(id, query) {
        return this.campaignsService.getCampaignUsers(id, query);
    }
    async getCampaignGroups(id) {
        return this.campaignsService.getCampaignAssignedGroups(id);
    }
    async getDashboardOverview(query) {
        return this.campaignsService.getDashboardOverview(query);
    }
    async getCampaignById(id) {
        return this.campaignsService.getCampaignById(id);
    }
    async createCampaign(dto) {
        return this.campaignsService.createCampaign(dto);
    }
    async updateCampaign(id, dto) {
        return this.campaignsService.updateCampaign(id, dto);
    }
    async deleteCampaign(id) {
        return this.campaignsService.deleteCampaign(id);
    }
    async assignCampaign(dto) {
        return this.campaignsService.assignCampaignToUser(dto.userId, dto.campaignId);
    }
    async assignCampaignBulk(dto) {
        return this.campaignsService.assignCampaignToUsers(dto.campaignId, dto.userIds, dto.groupIds);
    }
    async redeemCampaign(dto, admin) {
        return this.campaignsService.redeemCampaign(dto.userCampaignId, admin.id);
    }
    async redeemCampaignByQr(dto, admin) {
        return this.campaignsService.redeemCampaignByQr(dto.qrCode, admin.id);
    }
};
exports.AdminCampaignsController = AdminCampaignsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all campaigns (paginated)' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.PaginatedCampaignsResponseDto }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.GetCampaignsQueryDto]),
    __metadata("design:returntype", Promise)
], AdminCampaignsController.prototype, "getCampaigns", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all campaigns statistics summary' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.DashboardCampaignSummaryDto }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CampaignStatsQueryDto]),
    __metadata("design:returntype", Promise)
], AdminCampaignsController.prototype, "getAllCampaignsStats", null);
__decorate([
    (0, common_1.Get)('stats/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get statistics for a specific campaign' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.CampaignStatsResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Campaign not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CampaignStatsQueryDto]),
    __metadata("design:returntype", Promise)
], AdminCampaignsController.prototype, "getCampaignStats", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get users who have a specific campaign' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.PaginatedCampaignUsersDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Campaign not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CampaignUsersQueryDto]),
    __metadata("design:returntype", Promise)
], AdminCampaignsController.prototype, "getCampaignUsers", null);
__decorate([
    (0, common_1.Get)('groups/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get groups assigned to a specific campaign' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of assigned groups' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Campaign not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminCampaignsController.prototype, "getCampaignGroups", null);
__decorate([
    (0, common_1.Get)('dashboard/overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full dashboard overview (users, campaigns, points, wheel)' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.DashboardOverviewDto }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.DashboardStatsQueryDto]),
    __metadata("design:returntype", Promise)
], AdminCampaignsController.prototype, "getDashboardOverview", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get campaign by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.CampaignResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Campaign not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminCampaignsController.prototype, "getCampaignById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new campaign' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: dto_1.CampaignResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateCampaignDto]),
    __metadata("design:returntype", Promise)
], AdminCampaignsController.prototype, "createCampaign", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update campaign' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.CampaignResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Campaign not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateCampaignDto]),
    __metadata("design:returntype", Promise)
], AdminCampaignsController.prototype, "updateCampaign", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete campaign' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Campaign deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Campaign not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminCampaignsController.prototype, "deleteCampaign", null);
__decorate([
    (0, common_1.Post)('assign'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign campaign to a single user' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Campaign assigned' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User or campaign not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AssignCampaignDto]),
    __metadata("design:returntype", Promise)
], AdminCampaignsController.prototype, "assignCampaign", null);
__decorate([
    (0, common_1.Post)('assign-bulk'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign campaign to multiple users or all users' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Campaign assigned to users' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Campaign not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AssignCampaignBulkDto]),
    __metadata("design:returntype", Promise)
], AdminCampaignsController.prototype, "assignCampaignBulk", null);
__decorate([
    (0, common_1.Post)('redeem'),
    (0, swagger_1.ApiOperation)({ summary: 'Redeem user campaign (when customer uses at store)' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.CampaignRedeemResultDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Campaign not active or expired' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User campaign not found' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RedeemCampaignDto, Object]),
    __metadata("design:returntype", Promise)
], AdminCampaignsController.prototype, "redeemCampaign", null);
__decorate([
    (0, common_1.Post)('redeem-qr'),
    (0, swagger_1.ApiOperation)({ summary: 'Redeem campaign by scanning QR code' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Campaign redeemed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid QR, campaign not active or expired' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Campaign not found' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RedeemCampaignByQrDto, Object]),
    __metadata("design:returntype", Promise)
], AdminCampaignsController.prototype, "redeemCampaignByQr", null);
exports.AdminCampaignsController = AdminCampaignsController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Campaigns'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('admin/campaigns'),
    (0, decorators_1.Roles)(client_1.UserRole.admin, client_1.UserRole.super_admin),
    __metadata("design:paramtypes", [campaigns_service_1.CampaignsService])
], AdminCampaignsController);
//# sourceMappingURL=admin-campaigns.controller.js.map