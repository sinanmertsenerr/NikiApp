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
exports.WheelStatusResponseDto = exports.LastSpinDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class LastSpinDto {
    rewardType;
    rewardValue;
    spunAt;
}
exports.LastSpinDto = LastSpinDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'points' }),
    __metadata("design:type", String)
], LastSpinDto.prototype, "rewardType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '25' }),
    __metadata("design:type", String)
], LastSpinDto.prototype, "rewardValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-12-14T15:30:00Z' }),
    __metadata("design:type", Date)
], LastSpinDto.prototype, "spunAt", void 0);
class WheelStatusResponseDto {
    canSpin;
    spinRights;
    weekNumber;
    year;
    lastSpin;
    nextSpinAvailable;
}
exports.WheelStatusResponseDto = WheelStatusResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], WheelStatusResponseDto.prototype, "canSpin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], WheelStatusResponseDto.prototype, "spinRights", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50 }),
    __metadata("design:type", Number)
], WheelStatusResponseDto.prototype, "weekNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2025 }),
    __metadata("design:type", Number)
], WheelStatusResponseDto.prototype, "year", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: LastSpinDto, required: false }),
    __metadata("design:type", LastSpinDto)
], WheelStatusResponseDto.prototype, "lastSpin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-12-16T00:00:00Z', required: false }),
    __metadata("design:type", Date)
], WheelStatusResponseDto.prototype, "nextSpinAvailable", void 0);
//# sourceMappingURL=wheel-status.dto.js.map