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
exports.PaginatedUsersResponseDto = exports.AdminUserDetailDto = exports.AdminUserListItemDto = exports.UserBadgeResponseDto = exports.UserStatsResponseDto = exports.UserProfileResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class UserProfileResponseDto {
    id;
    email;
    firstName;
    lastName;
    bio;
    phone;
    avatarUrl;
    language;
    theme;
    selectedBrand;
    emailVerified;
    createdAt;
}
exports.UserProfileResponseDto = UserProfileResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-here' }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john@example.com' }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John' }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Doe' }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Coffee enthusiast' }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+905551234567' }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/avatar.jpg' }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "avatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.Language, example: 'tr' }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.Theme, example: 'light' }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "theme", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.Brand, example: 'coffee' }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "selectedBrand", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], UserProfileResponseDto.prototype, "emailVerified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-01T00:00:00.000Z' }),
    __metadata("design:type", Date)
], UserProfileResponseDto.prototype, "createdAt", void 0);
class UserStatsResponseDto {
    totalPoints;
    availablePoints;
    redeemedPoints;
    nikiCredits;
    badgeCount;
    orderCount;
    activeCampaigns;
    wheelSpinsUsed;
}
exports.UserStatsResponseDto = UserStatsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 25 }),
    __metadata("design:type", Number)
], UserStatsResponseDto.prototype, "totalPoints", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    __metadata("design:type", Number)
], UserStatsResponseDto.prototype, "availablePoints", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 20 }),
    __metadata("design:type", Number)
], UserStatsResponseDto.prototype, "redeemedPoints", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '150.00' }),
    __metadata("design:type", String)
], UserStatsResponseDto.prototype, "nikiCredits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], UserStatsResponseDto.prototype, "badgeCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12 }),
    __metadata("design:type", Number)
], UserStatsResponseDto.prototype, "orderCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    __metadata("design:type", Number)
], UserStatsResponseDto.prototype, "activeCampaigns", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    __metadata("design:type", Number)
], UserStatsResponseDto.prototype, "wheelSpinsUsed", void 0);
class UserBadgeResponseDto {
    id;
    name;
    nameTr;
    description;
    descriptionTr;
    iconUrl;
    earnedAt;
}
exports.UserBadgeResponseDto = UserBadgeResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'badge-uuid' }),
    __metadata("design:type", String)
], UserBadgeResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Coffee Lover' }),
    __metadata("design:type", String)
], UserBadgeResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Kahve Aşığı' }),
    __metadata("design:type", String)
], UserBadgeResponseDto.prototype, "nameTr", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Ordered 10 coffees' }),
    __metadata("design:type", String)
], UserBadgeResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '10 kahve sipariş ettin' }),
    __metadata("design:type", String)
], UserBadgeResponseDto.prototype, "descriptionTr", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/badge.png' }),
    __metadata("design:type", String)
], UserBadgeResponseDto.prototype, "iconUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-15T10:30:00.000Z' }),
    __metadata("design:type", Date)
], UserBadgeResponseDto.prototype, "earnedAt", void 0);
class AdminUserListItemDto {
    id;
    email;
    firstName;
    lastName;
    avatarUrl;
    role;
    isActive;
    emailVerified;
    createdAt;
    lastLoginAt;
}
exports.AdminUserListItemDto = AdminUserListItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-here' }),
    __metadata("design:type", String)
], AdminUserListItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john@example.com' }),
    __metadata("design:type", String)
], AdminUserListItemDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John' }),
    __metadata("design:type", String)
], AdminUserListItemDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Doe' }),
    __metadata("design:type", String)
], AdminUserListItemDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/avatar.jpg' }),
    __metadata("design:type", String)
], AdminUserListItemDto.prototype, "avatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.UserRole, example: 'customer' }),
    __metadata("design:type", String)
], AdminUserListItemDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], AdminUserListItemDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], AdminUserListItemDto.prototype, "emailVerified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-01T00:00:00.000Z' }),
    __metadata("design:type", Date)
], AdminUserListItemDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-01-15T10:30:00.000Z' }),
    __metadata("design:type", Date)
], AdminUserListItemDto.prototype, "lastLoginAt", void 0);
class AdminUserDetailDto extends AdminUserListItemDto {
    bio;
    phone;
    language;
    theme;
    selectedBrand;
    stats;
    badges;
}
exports.AdminUserDetailDto = AdminUserDetailDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Coffee enthusiast' }),
    __metadata("design:type", String)
], AdminUserDetailDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+905551234567' }),
    __metadata("design:type", String)
], AdminUserDetailDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.Language, example: 'tr' }),
    __metadata("design:type", String)
], AdminUserDetailDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.Theme, example: 'light' }),
    __metadata("design:type", String)
], AdminUserDetailDto.prototype, "theme", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.Brand, example: 'coffee' }),
    __metadata("design:type", String)
], AdminUserDetailDto.prototype, "selectedBrand", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", UserStatsResponseDto)
], AdminUserDetailDto.prototype, "stats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [UserBadgeResponseDto] }),
    __metadata("design:type", Array)
], AdminUserDetailDto.prototype, "badges", void 0);
class PaginatedUsersResponseDto {
    users;
    total;
    page;
    limit;
    totalPages;
}
exports.PaginatedUsersResponseDto = PaginatedUsersResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [AdminUserListItemDto] }),
    __metadata("design:type", Array)
], PaginatedUsersResponseDto.prototype, "users", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100 }),
    __metadata("design:type", Number)
], PaginatedUsersResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], PaginatedUsersResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 20 }),
    __metadata("design:type", Number)
], PaginatedUsersResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    __metadata("design:type", Number)
], PaginatedUsersResponseDto.prototype, "totalPages", void 0);
//# sourceMappingURL=user-response.dto.js.map