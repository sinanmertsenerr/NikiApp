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
exports.CampaignRedeemResultDto = exports.UserCampaignListResponseDto = exports.PaginatedCampaignsResponseDto = exports.UserCampaignResponseDto = exports.CampaignResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CampaignResponseDto {
    id;
    type;
    title;
    titleTr;
    description;
    descriptionTr;
    rewardType;
    rewardValue;
    requiredPoints;
    imageUrl;
    startDate;
    endDate;
    isActive;
    createdAt;
}
exports.CampaignResponseDto = CampaignResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'campaign-uuid' }),
    __metadata("design:type", String)
], CampaignResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.CampaignType }),
    __metadata("design:type", String)
], CampaignResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Free Coffee' }),
    __metadata("design:type", String)
], CampaignResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Bedava Kahve' }),
    __metadata("design:type", String)
], CampaignResponseDto.prototype, "titleTr", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Earn 10 points and get a free coffee!' }),
    __metadata("design:type", String)
], CampaignResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '10 puan kazanın, bedava kahve alın!' }),
    __metadata("design:type", String)
], CampaignResponseDto.prototype, "descriptionTr", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.RewardType }),
    __metadata("design:type", String)
], CampaignResponseDto.prototype, "rewardType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '10.00' }),
    __metadata("design:type", String)
], CampaignResponseDto.prototype, "rewardValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    __metadata("design:type", Number)
], CampaignResponseDto.prototype, "requiredPoints", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/campaign.jpg' }),
    __metadata("design:type", String)
], CampaignResponseDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Date)
], CampaignResponseDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Date)
], CampaignResponseDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], CampaignResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], CampaignResponseDto.prototype, "createdAt", void 0);
class UserCampaignResponseDto {
    id;
    status;
    assignedAt;
    redeemedAt;
    campaign;
}
exports.UserCampaignResponseDto = UserCampaignResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user-campaign-uuid' }),
    __metadata("design:type", String)
], UserCampaignResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.CampaignStatus }),
    __metadata("design:type", String)
], UserCampaignResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], UserCampaignResponseDto.prototype, "assignedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Date)
], UserCampaignResponseDto.prototype, "redeemedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", CampaignResponseDto)
], UserCampaignResponseDto.prototype, "campaign", void 0);
class PaginatedCampaignsResponseDto {
    campaigns;
    total;
    page;
    limit;
    totalPages;
}
exports.PaginatedCampaignsResponseDto = PaginatedCampaignsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CampaignResponseDto] }),
    __metadata("design:type", Array)
], PaginatedCampaignsResponseDto.prototype, "campaigns", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50 }),
    __metadata("design:type", Number)
], PaginatedCampaignsResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], PaginatedCampaignsResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 20 }),
    __metadata("design:type", Number)
], PaginatedCampaignsResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], PaginatedCampaignsResponseDto.prototype, "totalPages", void 0);
class UserCampaignListResponseDto {
    campaigns;
    total;
}
exports.UserCampaignListResponseDto = UserCampaignListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [UserCampaignResponseDto] }),
    __metadata("design:type", Array)
], UserCampaignListResponseDto.prototype, "campaigns", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    __metadata("design:type", Number)
], UserCampaignListResponseDto.prototype, "total", void 0);
class CampaignRedeemResultDto {
    success;
    message;
    rewardType;
    rewardValue;
}
exports.CampaignRedeemResultDto = CampaignRedeemResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], CampaignRedeemResultDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Campaign redeemed successfully' }),
    __metadata("design:type", String)
], CampaignRedeemResultDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.RewardType }),
    __metadata("design:type", String)
], CampaignRedeemResultDto.prototype, "rewardType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '10.00' }),
    __metadata("design:type", String)
], CampaignRedeemResultDto.prototype, "rewardValue", void 0);
//# sourceMappingURL=campaign-response.dto.js.map