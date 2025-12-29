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
exports.AdminMenuController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const menu_service_1 = require("./menu.service");
const guards_1 = require("../auth/guards");
const decorators_1 = require("../common/decorators");
const dto_1 = require("./dto");
let AdminMenuController = class AdminMenuController {
    menuService;
    constructor(menuService) {
        this.menuService = menuService;
    }
    async getCategories(brand, includeInactive) {
        const categories = await this.menuService.getCategories(brand, includeInactive ?? true);
        return {
            success: true,
            data: { categories },
        };
    }
    async createCategory(dto) {
        const category = await this.menuService.createCategory(dto);
        return {
            success: true,
            data: { category },
            message: 'Kategori oluşturuldu',
        };
    }
    async updateCategory(id, dto) {
        const category = await this.menuService.updateCategory(id, dto);
        return {
            success: true,
            data: { category },
            message: 'Kategori güncellendi',
        };
    }
    async deleteCategory(id) {
        const result = await this.menuService.deleteCategory(id);
        return {
            success: true,
            data: result,
        };
    }
    async reorderCategories(dto) {
        const result = await this.menuService.reorderCategories(dto.orderedIds);
        return {
            success: true,
            data: result,
            message: 'Kategoriler yeniden sıralandı',
        };
    }
    async getProducts(categoryId, includeInactive) {
        const products = await this.menuService.getProducts(categoryId, includeInactive ?? true);
        return {
            success: true,
            data: { products },
        };
    }
    async createProduct(dto) {
        const product = await this.menuService.createProduct(dto);
        return {
            success: true,
            data: { product },
            message: 'Ürün oluşturuldu',
        };
    }
    async updateProduct(id, dto) {
        const product = await this.menuService.updateProduct(id, dto);
        return {
            success: true,
            data: { product },
            message: 'Ürün güncellendi',
        };
    }
    async toggleProductStatus(id, dto) {
        const product = await this.menuService.toggleProductStatus(id, dto.isActive);
        return {
            success: true,
            data: { product },
            message: dto.isActive ? 'Ürün aktif edildi' : 'Ürün pasif edildi',
        };
    }
    async deleteProduct(id) {
        const result = await this.menuService.deleteProduct(id);
        return {
            success: true,
            data: result,
        };
    }
};
exports.AdminMenuController = AdminMenuController;
__decorate([
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all categories (including inactive)' }),
    (0, swagger_1.ApiQuery)({ name: 'brand', required: false, enum: client_1.Brand }),
    (0, swagger_1.ApiQuery)({ name: 'includeInactive', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Categories returned' }),
    __param(0, (0, common_1.Query)('brand')),
    __param(1, (0, common_1.Query)('includeInactive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], AdminMenuController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Post)('category'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new category' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Category created' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Category already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateCategoryDto]),
    __metadata("design:returntype", Promise)
], AdminMenuController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Put)('category/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update category' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Category ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Category updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Category not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateCategoryDto]),
    __metadata("design:returntype", Promise)
], AdminMenuController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Delete)('category/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete category (soft delete)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Category ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Category deactivated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Category not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminMenuController.prototype, "deleteCategory", null);
__decorate([
    (0, common_1.Post)('categories/reorder'),
    (0, swagger_1.ApiOperation)({ summary: 'Reorder categories' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Categories reordered' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'One or more categories not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ReorderCategoriesDto]),
    __metadata("design:returntype", Promise)
], AdminMenuController.prototype, "reorderCategories", null);
__decorate([
    (0, common_1.Get)('products'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all products (including inactive)' }),
    (0, swagger_1.ApiQuery)({ name: 'categoryId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'includeInactive', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Products returned' }),
    __param(0, (0, common_1.Query)('categoryId')),
    __param(1, (0, common_1.Query)('includeInactive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], AdminMenuController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Post)('product'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new product' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Product created' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Category not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateProductDto]),
    __metadata("design:returntype", Promise)
], AdminMenuController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Put)('product/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update product' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Product updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Product not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateProductDto]),
    __metadata("design:returntype", Promise)
], AdminMenuController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Patch)('product/:id/toggle'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle product active status' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Product status toggled' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Product not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ToggleProductDto]),
    __metadata("design:returntype", Promise)
], AdminMenuController.prototype, "toggleProductStatus", null);
__decorate([
    (0, common_1.Delete)('product/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete product (hard delete)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Product deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Product not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminMenuController.prototype, "deleteProduct", null);
exports.AdminMenuController = AdminMenuController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Menu'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.UserRole.admin, client_1.UserRole.super_admin),
    (0, common_1.Controller)('admin/menu'),
    __metadata("design:paramtypes", [menu_service_1.MenuService])
], AdminMenuController);
//# sourceMappingURL=admin-menu.controller.js.map