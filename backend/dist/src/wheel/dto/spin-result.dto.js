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
exports.SpinResultDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class SpinResultDto {
    rewardType;
    rewardValue;
    message;
    spunAt;
}
exports.SpinResultDto = SpinResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'points', enum: client_1.WheelRewardType }),
    __metadata("design:type", String)
], SpinResultDto.prototype, "rewardType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '25' }),
    __metadata("design:type", String)
], SpinResultDto.prototype, "rewardValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '25 puan kazandınız!' }),
    __metadata("design:type", String)
], SpinResultDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-12-15T10:30:00Z' }),
    __metadata("design:type", Date)
], SpinResultDto.prototype, "spunAt", void 0);
//# sourceMappingURL=spin-result.dto.js.map