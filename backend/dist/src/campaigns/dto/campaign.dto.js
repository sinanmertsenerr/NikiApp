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
exports.GetCampaignsQueryDto = exports.RedeemCampaignByQrDto = exports.RedeemCampaignDto = exports.AssignCampaignBulkDto = exports.AssignCampaignDto = exports.UpdateCampaignDto = exports.CreateCampaignDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CreateCampaignDto {
    type;
    targetType;
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
}
exports.CreateCampaignDto = CreateCampaignDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.CampaignType, example: 'auto' }),
    (0, class_validator_1.IsEnum)(client_1.CampaignType),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.CampaignTargetType, example: 'users', default: 'users' }),
    (0, class_validator_1.IsEnum)(client_1.CampaignTargetType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "targetType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Free Coffee' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Bedava Kahve' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "titleTr", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Earn 10 points and get a free coffee!' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '10 puan kazanın, bedava kahve alın!' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "descriptionTr", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.RewardType, example: 'free_coffee' }),
    (0, class_validator_1.IsEnum)(client_1.RewardType),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "rewardType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 10, description: 'Reward value (discount %, fixed amount, or bonus points)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCampaignDto.prototype, "rewardValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 10, description: 'Required points to earn this campaign' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCampaignDto.prototype, "requiredPoints", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/campaign.jpg' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-01-01T00:00:00.000Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-12-31T23:59:59.000Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true, default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCampaignDto.prototype, "isActive", void 0);
class UpdateCampaignDto {
    type;
    targetType;
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
}
exports.UpdateCampaignDto = UpdateCampaignDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.CampaignType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CampaignType),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.CampaignTargetType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CampaignTargetType),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "targetType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Free Coffee' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Bedava Kahve' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "titleTr", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Earn 10 points and get a free coffee!' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '10 puan kazanın, bedava kahve alın!' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "descriptionTr", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.RewardType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.RewardType),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "rewardType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateCampaignDto.prototype, "rewardValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateCampaignDto.prototype, "requiredPoints", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/campaign.jpg' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCampaignDto.prototype, "isActive", void 0);
class AssignCampaignDto {
    userId;
    campaignId;
}
exports.AssignCampaignDto = AssignCampaignDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user-uuid', description: 'User ID to assign campaign to' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignCampaignDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'campaign-uuid', description: 'Campaign ID to assign' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignCampaignDto.prototype, "campaignId", void 0);
class AssignCampaignBulkDto {
    campaignId;
    userIds;
    groupIds;
}
exports.AssignCampaignBulkDto = AssignCampaignBulkDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'campaign-uuid', description: 'Campaign ID to assign' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignCampaignBulkDto.prototype, "campaignId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: ['user-uuid-1', 'user-uuid-2'],
        description: 'User IDs to assign campaign to. If empty or not provided, campaign becomes available to all users.',
        type: [String]
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AssignCampaignBulkDto.prototype, "userIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: ['group-uuid-1', 'group-uuid-2'],
        description: 'Group IDs - all members of these groups will be assigned the campaign.',
        type: [String]
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AssignCampaignBulkDto.prototype, "groupIds", void 0);
class RedeemCampaignDto {
    userCampaignId;
}
exports.RedeemCampaignDto = RedeemCampaignDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user-campaign-uuid', description: 'UserCampaign ID to redeem' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RedeemCampaignDto.prototype, "userCampaignId", void 0);
class RedeemCampaignByQrDto {
    qrCode;
}
exports.RedeemCampaignByQrDto = RedeemCampaignByQrDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'CAMPAIGN-uuid', description: 'QR code from user\'s campaign' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RedeemCampaignByQrDto.prototype, "qrCode", void 0);
class GetCampaignsQueryDto {
    page = 1;
    limit = 20;
    type;
    targetType;
    isActive;
}
exports.GetCampaignsQueryDto = GetCampaignsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GetCampaignsQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], GetCampaignsQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.CampaignType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CampaignType),
    __metadata("design:type", String)
], GetCampaignsQueryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.CampaignTargetType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CampaignTargetType),
    __metadata("design:type", String)
], GetCampaignsQueryDto.prototype, "targetType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GetCampaignsQueryDto.prototype, "isActive", void 0);
//# sourceMappingURL=campaign.dto.js.map