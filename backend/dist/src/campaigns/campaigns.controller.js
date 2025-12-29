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
exports.CampaignsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const campaigns_service_1 = require("./campaigns.service");
const decorators_1 = require("../common/decorators");
const dto_1 = require("./dto");
let CampaignsController = class CampaignsController {
    campaignsService;
    constructor(campaignsService) {
        this.campaignsService = campaignsService;
    }
    async getMyCampaigns(user) {
        return this.campaignsService.getUserCampaigns(user.id);
    }
    async getMyActiveCampaigns(user) {
        return this.campaignsService.getActiveCampaigns(user.id);
    }
    async getAvailableCampaigns(user) {
        return this.campaignsService.getAvailableCampaigns(user.id);
    }
    async claimCampaign(user, campaignId) {
        return this.campaignsService.claimCampaign(user.id, campaignId);
    }
};
exports.CampaignsController = CampaignsController;
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all my campaigns (active, used, expired)' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.UserCampaignListResponseDto }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "getMyCampaigns", null);
__decorate([
    (0, common_1.Get)('my/active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my active (usable) campaigns' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.UserCampaignListResponseDto }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "getMyActiveCampaigns", null);
__decorate([
    (0, common_1.Get)('available'),
    (0, swagger_1.ApiOperation)({ summary: 'Get campaigns I can claim with my points' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "getAvailableCampaigns", null);
__decorate([
    (0, common_1.Post)('claim/:campaignId'),
    (0, swagger_1.ApiOperation)({ summary: 'Claim an auto campaign using my points' }),
    (0, swagger_1.ApiParam)({ name: 'campaignId', description: 'Campaign ID to claim' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Campaign claimed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Not enough points or invalid campaign' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Campaign not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Already have this campaign' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('campaignId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "claimCampaign", null);
exports.CampaignsController = CampaignsController = __decorate([
    (0, swagger_1.ApiTags)('Campaigns'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('campaigns'),
    __metadata("design:paramtypes", [campaigns_service_1.CampaignsService])
], CampaignsController);
//# sourceMappingURL=campaigns.controller.js.map