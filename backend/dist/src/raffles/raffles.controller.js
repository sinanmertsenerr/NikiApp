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
exports.RafflesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_1 = require("../auth");
const decorators_1 = require("../common/decorators");
const raffles_service_1 = require("./raffles.service");
let RafflesController = class RafflesController {
    rafflesService;
    constructor(rafflesService) {
        this.rafflesService = rafflesService;
    }
    async getActiveRaffles() {
        return this.rafflesService.getActiveRaffles();
    }
    async getMyRaffles(userId) {
        return this.rafflesService.getUserRaffles(userId);
    }
    async joinRaffle(userId, raffleId) {
        return this.rafflesService.joinRaffle(userId, raffleId);
    }
};
exports.RafflesController = RafflesController;
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active raffles that user can join' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RafflesController.prototype, "getActiveRaffles", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiOperation)({ summary: 'Get raffles user has joined' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RafflesController.prototype, "getMyRaffles", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    (0, swagger_1.ApiOperation)({ summary: 'Join a raffle' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RafflesController.prototype, "joinRaffle", null);
exports.RafflesController = RafflesController = __decorate([
    (0, swagger_1.ApiTags)('Raffles'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('raffles'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard),
    __metadata("design:paramtypes", [raffles_service_1.RafflesService])
], RafflesController);
//# sourceMappingURL=raffles.controller.js.map