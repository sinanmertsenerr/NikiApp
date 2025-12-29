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
exports.MenuController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const menu_service_1 = require("./menu.service");
const decorators_1 = require("../common/decorators");
let MenuController = class MenuController {
    menuService;
    constructor(menuService) {
        this.menuService = menuService;
    }
    async getCategories(brand) {
        const categories = await this.menuService.getCategories(brand);
        return {
            success: true,
            data: { categories },
        };
    }
    async getCategoryById(id) {
        const category = await this.menuService.getCategoryById(id);
        return {
            success: true,
            data: { category },
        };
    }
    async getProducts(categoryId, brand) {
        let products;
        if (categoryId) {
            products = await this.menuService.getProducts(categoryId);
        }
        else if (brand) {
            products = await this.menuService.getProductsByBrand(brand);
        }
        else {
            products = await this.menuService.getProducts();
        }
        return {
            success: true,
            data: { products },
        };
    }
    async getProductById(id) {
        const product = await this.menuService.getProductById(id);
        return {
            success: true,
            data: { product },
        };
    }
    async getFullMenu(brand) {
        const menu = await this.menuService.getFullMenu(brand);
        return {
            success: true,
            data: { menu },
        };
    }
};
exports.MenuController = MenuController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all categories (optionally filter by brand)' }),
    (0, swagger_1.ApiQuery)({
        name: 'brand',
        required: false,
        enum: client_1.Brand,
        description: 'Filter by brand (coffee/sandwich)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Categories returned' }),
    __param(0, (0, common_1.Query)('brand')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "getCategories", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('categories/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get category by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Category ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Category returned' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Category not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "getCategoryById", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('products'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all products (optionally filter by category)' }),
    (0, swagger_1.ApiQuery)({
        name: 'categoryId',
        required: false,
        description: 'Filter by category ID',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'brand',
        required: false,
        enum: client_1.Brand,
        description: 'Filter by brand (coffee/sandwich)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Products returned' }),
    __param(0, (0, common_1.Query)('categoryId')),
    __param(1, (0, common_1.Query)('brand')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "getProducts", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('products/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get product by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Product returned' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Product not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "getProductById", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('full'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full menu with categories and products' }),
    (0, swagger_1.ApiQuery)({
        name: 'brand',
        required: true,
        enum: client_1.Brand,
        description: 'Brand (coffee/sandwich)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Full menu returned' }),
    __param(0, (0, common_1.Query)('brand')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "getFullMenu", null);
exports.MenuController = MenuController = __decorate([
    (0, swagger_1.ApiTags)('Menu'),
    (0, common_1.Controller)('menu'),
    __metadata("design:paramtypes", [menu_service_1.MenuService])
], MenuController);
//# sourceMappingURL=menu.controller.js.map