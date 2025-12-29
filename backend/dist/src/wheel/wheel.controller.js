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
exports.WheelController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const wheel_service_1 = require("./wheel.service");
const guards_1 = require("../auth/guards");
const decorators_1 = require("../common/decorators");
let WheelController = class WheelController {
    wheelService;
    constructor(wheelService) {
        this.wheelService = wheelService;
    }
    async getStatus(userId) {
        const status = await this.wheelService.getStatus(userId);
        return {
            success: true,
            data: status,
        };
    }
    async spin(userId) {
        const result = await this.wheelService.spin(userId);
        return {
            success: true,
            data: result,
        };
    }
    async getHistory(userId, limit) {
        const history = await this.wheelService.getHistory(userId, limit || 10);
        return {
            success: true,
            data: { spins: history },
        };
    }
};
exports.WheelController = WheelController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Check spin rights for current week' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Wheel status returned',
    }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WheelController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('spin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Spin the wheel (1 right per week)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Spin result returned',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Already spun this week or no spin rights',
    }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WheelController.prototype, "spin", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get spin history' }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Number of records to return (default: 10)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Spin history returned',
    }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], WheelController.prototype, "getHistory", null);
exports.WheelController = WheelController = __decorate([
    (0, swagger_1.ApiTags)('Wheel'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, common_1.Controller)('wheel'),
    __metadata("design:paramtypes", [wheel_service_1.WheelService])
], WheelController);
//# sourceMappingURL=wheel.controller.js.map