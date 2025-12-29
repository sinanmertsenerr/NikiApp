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
exports.DashboardOverviewDto = exports.DashboardUsersSummaryDto = exports.DashboardWheelSummaryDto = exports.DashboardPointsSummaryDto = exports.DashboardCampaignSummaryDto = exports.PaginatedCampaignUsersDto = exports.CampaignUserItemDto = exports.CampaignStatsResponseDto = exports.DashboardStatsQueryDto = exports.CampaignUsersQueryDto = exports.CampaignStatsQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CampaignStatsQueryDto {
    startDate;
    endDate;
}
exports.CampaignStatsQueryDto = CampaignStatsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-01-01', description: 'Start date filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CampaignStatsQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-12-31', description: 'End date filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CampaignStatsQueryDto.prototype, "endDate", void 0);
class CampaignUsersQueryDto {
    page = 1;
    limit = 20;
    status;
    assignedAfter;
    assignedBefore;
}
exports.CampaignUsersQueryDto = CampaignUsersQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CampaignUsersQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10000),
    __metadata("design:type", Number)
], CampaignUsersQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.CampaignStatus, description: 'Filter by status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CampaignStatus),
    __metadata("design:type", String)
], CampaignUsersQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-01-01', description: 'Assigned after date' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CampaignUsersQueryDto.prototype, "assignedAfter", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-12-31', description: 'Assigned before date' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CampaignUsersQueryDto.prototype, "assignedBefore", void 0);
class DashboardStatsQueryDto {
    startDate;
    endDate;
}
exports.DashboardStatsQueryDto = DashboardStatsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-01-01', description: 'Start date filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DashboardStatsQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-12-31', description: 'End date filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DashboardStatsQueryDto.prototype, "endDate", void 0);
class CampaignStatsResponseDto {
    campaignId;
    title;
    titleTr;
    totalAssigned;
    totalRedeemed;
    activeCount;
    expiredCount;
    usageRate;
}
exports.CampaignStatsResponseDto = CampaignStatsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'campaign-uuid' }),
    __metadata("design:type", String)
], CampaignStatsResponseDto.prototype, "campaignId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Free Coffee' }),
    __metadata("design:type", String)
], CampaignStatsResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Bedava Kahve' }),
    __metadata("design:type", String)
], CampaignStatsResponseDto.prototype, "titleTr", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 150, description: 'Total times assigned to users' }),
    __metadata("design:type", Number)
], CampaignStatsResponseDto.prototype, "totalAssigned", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 85, description: 'Times redeemed/used' }),
    __metadata("design:type", Number)
], CampaignStatsResponseDto.prototype, "totalRedeemed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50, description: 'Currently active (not used)' }),
    __metadata("design:type", Number)
], CampaignStatsResponseDto.prototype, "activeCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 15, description: 'Expired without use' }),
    __metadata("design:type", Number)
], CampaignStatsResponseDto.prototype, "expiredCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 56.67, description: 'Usage rate percentage' }),
    __metadata("design:type", Number)
], CampaignStatsResponseDto.prototype, "usageRate", void 0);
class CampaignUserItemDto {
    id;
    userId;
    email;
    firstName;
    lastName;
    avatarUrl;
    status;
    assignedAt;
    redeemedAt;
    redeemedBy;
    redeemedByName;
}
exports.CampaignUserItemDto = CampaignUserItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user-campaign-uuid' }),
    __metadata("design:type", String)
], CampaignUserItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user-uuid' }),
    __metadata("design:type", String)
], CampaignUserItemDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john@example.com' }),
    __metadata("design:type", String)
], CampaignUserItemDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John' }),
    __metadata("design:type", String)
], CampaignUserItemDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Doe' }),
    __metadata("design:type", String)
], CampaignUserItemDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/avatar.jpg' }),
    __metadata("design:type", String)
], CampaignUserItemDto.prototype, "avatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.CampaignStatus }),
    __metadata("design:type", String)
], CampaignUserItemDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], CampaignUserItemDto.prototype, "assignedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Date)
], CampaignUserItemDto.prototype, "redeemedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'admin-uuid', description: 'Admin who redeemed' }),
    __metadata("design:type", String)
], CampaignUserItemDto.prototype, "redeemedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Admin Name', description: 'Admin name who redeemed' }),
    __metadata("design:type", String)
], CampaignUserItemDto.prototype, "redeemedByName", void 0);
class PaginatedCampaignUsersDto {
    users;
    total;
    page;
    limit;
    totalPages;
}
exports.PaginatedCampaignUsersDto = PaginatedCampaignUsersDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CampaignUserItemDto] }),
    __metadata("design:type", Array)
], PaginatedCampaignUsersDto.prototype, "users", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 150 }),
    __metadata("design:type", Number)
], PaginatedCampaignUsersDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], PaginatedCampaignUsersDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 20 }),
    __metadata("design:type", Number)
], PaginatedCampaignUsersDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 8 }),
    __metadata("design:type", Number)
], PaginatedCampaignUsersDto.prototype, "totalPages", void 0);
class DashboardCampaignSummaryDto {
    totalCampaigns;
    activeCampaigns;
    totalAssignments;
    totalRedemptions;
    overallUsageRate;
    campaignBreakdown;
}
exports.DashboardCampaignSummaryDto = DashboardCampaignSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10, description: 'Total campaigns' }),
    __metadata("design:type", Number)
], DashboardCampaignSummaryDto.prototype, "totalCampaigns", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 8, description: 'Active campaigns' }),
    __metadata("design:type", Number)
], DashboardCampaignSummaryDto.prototype, "activeCampaigns", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 500, description: 'Total times campaigns assigned' }),
    __metadata("design:type", Number)
], DashboardCampaignSummaryDto.prototype, "totalAssignments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 320, description: 'Total redemptions' }),
    __metadata("design:type", Number)
], DashboardCampaignSummaryDto.prototype, "totalRedemptions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 64.0, description: 'Overall usage rate %' }),
    __metadata("design:type", Number)
], DashboardCampaignSummaryDto.prototype, "overallUsageRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CampaignStatsResponseDto], description: 'Stats per campaign' }),
    __metadata("design:type", Array)
], DashboardCampaignSummaryDto.prototype, "campaignBreakdown", void 0);
class DashboardPointsSummaryDto {
    totalPointsEarned;
    totalPointsRedeemed;
    totalPointsAvailable;
    usersWithPoints;
    averagePointsPerUser;
}
exports.DashboardPointsSummaryDto = DashboardPointsSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5000, description: 'Total points earned by all users' }),
    __metadata("design:type", Number)
], DashboardPointsSummaryDto.prototype, "totalPointsEarned", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3200, description: 'Total points redeemed' }),
    __metadata("design:type", Number)
], DashboardPointsSummaryDto.prototype, "totalPointsRedeemed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1800, description: 'Total points still available' }),
    __metadata("design:type", Number)
], DashboardPointsSummaryDto.prototype, "totalPointsAvailable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 250, description: 'Users with points' }),
    __metadata("design:type", Number)
], DashboardPointsSummaryDto.prototype, "usersWithPoints", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 20.0, description: 'Average points per user' }),
    __metadata("design:type", Number)
], DashboardPointsSummaryDto.prototype, "averagePointsPerUser", void 0);
class DashboardWheelSummaryDto {
    totalSpins;
    winningSpins;
    winRate;
    rewardBreakdown;
}
exports.DashboardWheelSummaryDto = DashboardWheelSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1200, description: 'Total wheel spins' }),
    __metadata("design:type", Number)
], DashboardWheelSummaryDto.prototype, "totalSpins", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 450, description: 'Spins that won something' }),
    __metadata("design:type", Number)
], DashboardWheelSummaryDto.prototype, "winningSpins", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 37.5, description: 'Win rate %' }),
    __metadata("design:type", Number)
], DashboardWheelSummaryDto.prototype, "winRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Breakdown by reward type' }),
    __metadata("design:type", Object)
], DashboardWheelSummaryDto.prototype, "rewardBreakdown", void 0);
class DashboardUsersSummaryDto {
    totalUsers;
    verifiedUsers;
    activeUsers;
    newUsersInPeriod;
}
exports.DashboardUsersSummaryDto = DashboardUsersSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 500, description: 'Total registered users' }),
    __metadata("design:type", Number)
], DashboardUsersSummaryDto.prototype, "totalUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 450, description: 'Verified users' }),
    __metadata("design:type", Number)
], DashboardUsersSummaryDto.prototype, "verifiedUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 480, description: 'Active users' }),
    __metadata("design:type", Number)
], DashboardUsersSummaryDto.prototype, "activeUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 25, description: 'New users in period' }),
    __metadata("design:type", Number)
], DashboardUsersSummaryDto.prototype, "newUsersInPeriod", void 0);
class DashboardOverviewDto {
    users;
    campaigns;
    points;
    wheel;
    period;
    generatedAt;
}
exports.DashboardOverviewDto = DashboardOverviewDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", DashboardUsersSummaryDto)
], DashboardOverviewDto.prototype, "users", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", DashboardCampaignSummaryDto)
], DashboardOverviewDto.prototype, "campaigns", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", DashboardPointsSummaryDto)
], DashboardOverviewDto.prototype, "points", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", DashboardWheelSummaryDto)
], DashboardOverviewDto.prototype, "wheel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Query period' }),
    __metadata("design:type", Object)
], DashboardOverviewDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], DashboardOverviewDto.prototype, "generatedAt", void 0);
//# sourceMappingURL=campaign-stats.dto.js.map