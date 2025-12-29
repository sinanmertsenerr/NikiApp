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
exports.AdminUsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const users_service_1 = require("./users.service");
const decorators_1 = require("../common/decorators");
const dto_1 = require("./dto");
let AdminUsersController = class AdminUsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getUsers(query) {
        return this.usersService.getUsers(query);
    }
    async getUserById(id, admin) {
        return this.usersService.getUserById(id, admin.id);
    }
    async updateUserStatus(id, dto, admin) {
        return this.usersService.updateUserStatus(id, dto, admin.id);
    }
    async toggleIeuWalletStatus(id, dto, admin) {
        return this.usersService.toggleIeuWalletStatus(id, dto.isActive, admin.id);
    }
    async toggleNegativeBalance(id, dto, admin) {
        return this.usersService.toggleNegativeBalance(id, dto.walletType, dto.allowNegative, dto.negativeLimit || 0);
    }
};
exports.AdminUsersController = AdminUsersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users (paginated)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated users list', type: dto_1.PaginatedUsersResponseDto }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.GetUsersQueryDto]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user details by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User details', type: dto_1.AdminUserDetailDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user status (active/role)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User status updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Cannot modify this user' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateUserStatusDto, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Patch)(':id/ieu-wallet-status'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle IEU wallet active status' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'IEU wallet status updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User or IEU wallet not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ToggleIeuWalletDto, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "toggleIeuWalletStatus", null);
__decorate([
    (0, common_1.Patch)(':id/negative-balance'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle wallet negative balance permission' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Negative balance settings updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User or wallet not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ToggleNegativeBalanceDto, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "toggleNegativeBalance", null);
exports.AdminUsersController = AdminUsersController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('admin/users'),
    (0, decorators_1.Roles)(client_1.UserRole.admin, client_1.UserRole.super_admin),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], AdminUsersController);
//# sourceMappingURL=admin-users.controller.js.map