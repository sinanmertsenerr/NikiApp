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
exports.DrawRaffleDto = exports.GetRafflesQueryDto = exports.UpdateRaffleDto = exports.CreateRaffleDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CreateRaffleDto {
    title;
    titleTr;
    description;
    descriptionTr;
    rewardType;
    rewardValue;
    startDate;
    endDate;
    winnerCount;
}
exports.CreateRaffleDto = CreateRaffleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'New Year Raffle' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRaffleDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Yılbaşı Çekilişi' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRaffleDto.prototype, "titleTr", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Win a free coffee!' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRaffleDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Bedava kahve kazanın!' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRaffleDto.prototype, "descriptionTr", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.RewardType, example: 'free_coffee' }),
    (0, class_validator_1.IsEnum)(client_1.RewardType),
    __metadata("design:type", String)
], CreateRaffleDto.prototype, "rewardType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Free Coffee', description: 'Reward description (e.g., Free Coffee, 50% Discount)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRaffleDto.prototype, "rewardValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-01T00:00:00.000Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateRaffleDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-07T23:59:59.000Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateRaffleDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, description: 'Number of winners' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateRaffleDto.prototype, "winnerCount", void 0);
class UpdateRaffleDto {
    title;
    titleTr;
    description;
    descriptionTr;
    rewardType;
    rewardValue;
    startDate;
    endDate;
    winnerCount;
    status;
}
exports.UpdateRaffleDto = UpdateRaffleDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'New Year Raffle' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRaffleDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Yılbaşı Çekilişi' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRaffleDto.prototype, "titleTr", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Win a free coffee!' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRaffleDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Bedava kahve kazanın!' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRaffleDto.prototype, "descriptionTr", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.RewardType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.RewardType),
    __metadata("design:type", String)
], UpdateRaffleDto.prototype, "rewardType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Free Coffee' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRaffleDto.prototype, "rewardValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateRaffleDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateRaffleDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateRaffleDto.prototype, "winnerCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.RaffleStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.RaffleStatus),
    __metadata("design:type", String)
], UpdateRaffleDto.prototype, "status", void 0);
class GetRafflesQueryDto {
    page = 1;
    limit = 20;
    status;
}
exports.GetRafflesQueryDto = GetRafflesQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GetRafflesQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], GetRafflesQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.RaffleStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.RaffleStatus),
    __metadata("design:type", String)
], GetRafflesQueryDto.prototype, "status", void 0);
class DrawRaffleDto {
    winnerCount;
}
exports.DrawRaffleDto = DrawRaffleDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, description: 'Number of winners to draw (defaults to raffle winnerCount)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], DrawRaffleDto.prototype, "winnerCount", void 0);
//# sourceMappingURL=raffle.dto.js.map