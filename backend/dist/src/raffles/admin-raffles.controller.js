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
exports.AdminRafflesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const auth_1 = require("../auth");
const decorators_1 = require("../common/decorators");
const raffles_service_1 = require("./raffles.service");
const dto_1 = require("./dto");
let AdminRafflesController = class AdminRafflesController {
    rafflesService;
    constructor(rafflesService) {
        this.rafflesService = rafflesService;
    }
    async getRaffles(query) {
        return this.rafflesService.getRaffles(query);
    }
    async getRaffle(id) {
        return this.rafflesService.getRaffleById(id);
    }
    async createRaffle(dto) {
        return this.rafflesService.createRaffle(dto);
    }
    async updateRaffle(id, dto) {
        return this.rafflesService.updateRaffle(id, dto);
    }
    async deleteRaffle(id) {
        return this.rafflesService.deleteRaffle(id);
    }
    async getParticipants(id) {
        return this.rafflesService.getRaffleParticipants(id);
    }
    async drawRaffle(id, dto) {
        return this.rafflesService.drawRaffle(id, dto);
    }
};
exports.AdminRafflesController = AdminRafflesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all raffles (admin)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.GetRafflesQueryDto]),
    __metadata("design:returntype", Promise)
], AdminRafflesController.prototype, "getRaffles", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get raffle by ID (admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminRafflesController.prototype, "getRaffle", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create raffle (admin)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateRaffleDto]),
    __metadata("design:returntype", Promise)
], AdminRafflesController.prototype, "createRaffle", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update raffle (admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateRaffleDto]),
    __metadata("design:returntype", Promise)
], AdminRafflesController.prototype, "updateRaffle", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete raffle (admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminRafflesController.prototype, "deleteRaffle", null);
__decorate([
    (0, common_1.Get)(':id/participants'),
    (0, swagger_1.ApiOperation)({ summary: 'Get raffle participants (admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminRafflesController.prototype, "getParticipants", null);
__decorate([
    (0, common_1.Post)(':id/draw'),
    (0, swagger_1.ApiOperation)({ summary: 'Draw raffle and select winners (admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.DrawRaffleDto]),
    __metadata("design:returntype", Promise)
], AdminRafflesController.prototype, "drawRaffle", null);
exports.AdminRafflesController = AdminRafflesController = __decorate([
    (0, swagger_1.ApiTags)('Admin Raffles'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('admin/raffles'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.UserRole.admin, client_1.UserRole.super_admin),
    __metadata("design:paramtypes", [raffles_service_1.RafflesService])
], AdminRafflesController);
//# sourceMappingURL=admin-raffles.controller.js.map