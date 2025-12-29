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
exports.MenuService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
const events_1 = require("../events");
let MenuService = class MenuService {
    prisma;
    eventsGateway;
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
    }
    async getCategories(brand, includeInactive = false) {
        const where = {};
        if (brand) {
            where.brand = brand;
        }
        if (!includeInactive) {
            where.isActive = true;
        }
        const categories = await this.prisma.category.findMany({
            where,
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });
        return categories.map((cat) => ({
            ...cat,
            productCount: cat._count.products,
            _count: undefined,
        }));
    }
    async getCategoryById(id) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });
        if (!category) {
            throw new common_1.NotFoundException('Kategori bulunamadı');
        }
        return {
            ...category,
            productCount: category._count.products,
            _count: undefined,
        };
    }
    async createCategory(dto) {
        const existing = await this.prisma.category.findFirst({
            where: {
                brand: dto.brand,
                name: dto.name,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Bu isimde bir kategori zaten mevcut');
        }
        const category = await this.prisma.category.create({
            data: {
                brand: dto.brand,
                name: dto.name,
                nameTr: dto.nameTr,
                description: dto.description,
                descriptionTr: dto.descriptionTr,
                imageUrl: dto.imageUrl,
                sortOrder: dto.sortOrder ?? 0,
                isActive: dto.isActive ?? true,
            },
        });
        this.eventsGateway.emitMenuUpdated({
            type: 'category',
            action: 'created',
            itemId: category.id,
            brand: dto.brand,
        });
        return category;
    }
    async updateCategory(id, dto) {
        const category = await this.prisma.category.findUnique({
            where: { id },
        });
        if (!category) {
            throw new common_1.NotFoundException('Kategori bulunamadı');
        }
        if (dto.name && dto.name !== category.name) {
            const existing = await this.prisma.category.findFirst({
                where: {
                    brand: dto.brand || category.brand,
                    name: dto.name,
                    NOT: { id },
                },
            });
            if (existing) {
                throw new common_1.ConflictException('Bu isimde bir kategori zaten mevcut');
            }
        }
        const updated = await this.prisma.category.update({
            where: { id },
            data: dto,
        });
        this.eventsGateway.emitMenuUpdated({
            type: 'category',
            action: 'updated',
            itemId: id,
            brand: updated.brand,
        });
        return updated;
    }
    async deleteCategory(id) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });
        if (!category) {
            throw new common_1.NotFoundException('Kategori bulunamadı');
        }
        await this.prisma.product.deleteMany({
            where: { categoryId: id },
        });
        await this.prisma.category.delete({
            where: { id },
        });
        this.eventsGateway.emitMenuUpdated({
            type: 'category',
            action: 'deleted',
            itemId: id,
            brand: category.brand,
        });
        return {
            message: 'Kategori ve ürünleri kalıcı olarak silindi',
            deletedProducts: category._count.products,
        };
    }
    async reorderCategories(orderedIds) {
        const categories = await this.prisma.category.findMany({
            where: { id: { in: orderedIds } },
        });
        if (categories.length !== orderedIds.length) {
            throw new common_1.NotFoundException('Bir veya daha fazla kategori bulunamadı');
        }
        await this.prisma.$transaction(orderedIds.map((id, index) => this.prisma.category.update({
            where: { id },
            data: { sortOrder: index },
        })));
        const brand = categories[0]?.brand;
        if (brand) {
            this.eventsGateway.emitMenuUpdated({
                type: 'category',
                action: 'reordered',
                itemId: 'all',
                brand,
            });
        }
        return { message: 'Kategoriler yeniden sıralandı' };
    }
    async getProducts(categoryId, includeInactive = false) {
        const where = {};
        if (categoryId) {
            where.categoryId = categoryId;
        }
        if (!includeInactive) {
            where.isActive = true;
            where.category = { isActive: true };
        }
        return this.prisma.product.findMany({
            where,
            orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        nameTr: true,
                        brand: true,
                    },
                },
            },
        });
    }
    async getProductsByBrand(brand, includeInactive = false) {
        const where = {
            category: {
                brand,
            },
        };
        if (!includeInactive) {
            where.isActive = true;
            where.category.isActive = true;
        }
        return this.prisma.product.findMany({
            where,
            orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        nameTr: true,
                        brand: true,
                    },
                },
            },
        });
    }
    async getProductById(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        nameTr: true,
                        brand: true,
                    },
                },
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Ürün bulunamadı');
        }
        return product;
    }
    async createProduct(dto) {
        const category = await this.prisma.category.findUnique({
            where: { id: dto.categoryId },
        });
        if (!category) {
            throw new common_1.NotFoundException('Kategori bulunamadı');
        }
        const product = await this.prisma.product.create({
            data: {
                categoryId: dto.categoryId,
                name: dto.name,
                nameTr: dto.nameTr,
                description: dto.description,
                descriptionTr: dto.descriptionTr,
                price: dto.price,
                imageUrl: dto.imageUrl,
                isCoffee: dto.isCoffee ?? false,
                isActive: dto.isActive ?? true,
                sortOrder: dto.sortOrder ?? 0,
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        nameTr: true,
                        brand: true,
                    },
                },
            },
        });
        this.eventsGateway.emitMenuUpdated({
            type: 'product',
            action: 'created',
            itemId: product.id,
            categoryId: dto.categoryId,
            brand: product.category.brand,
        });
        return product;
    }
    async updateProduct(id, dto) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                category: { select: { brand: true } },
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Ürün bulunamadı');
        }
        if (dto.categoryId && dto.categoryId !== product.categoryId) {
            const category = await this.prisma.category.findUnique({
                where: { id: dto.categoryId },
            });
            if (!category) {
                throw new common_1.NotFoundException('Yeni kategori bulunamadı');
            }
        }
        const updated = await this.prisma.product.update({
            where: { id },
            data: dto,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        nameTr: true,
                        brand: true,
                    },
                },
            },
        });
        this.eventsGateway.emitMenuUpdated({
            type: 'product',
            action: 'updated',
            itemId: id,
            categoryId: updated.categoryId,
            brand: updated.category.brand,
        });
        return updated;
    }
    async toggleProductStatus(id, isActive) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                category: { select: { brand: true } },
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Ürün bulunamadı');
        }
        const updated = await this.prisma.product.update({
            where: { id },
            data: { isActive },
        });
        this.eventsGateway.emitMenuUpdated({
            type: 'product',
            action: 'updated',
            itemId: id,
            categoryId: product.categoryId,
            brand: product.category.brand,
        });
        return updated;
    }
    async deleteProduct(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                category: { select: { brand: true } },
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Ürün bulunamadı');
        }
        await this.prisma.product.delete({
            where: { id },
        });
        this.eventsGateway.emitMenuUpdated({
            type: 'product',
            action: 'deleted',
            itemId: id,
            categoryId: product.categoryId,
            brand: product.category.brand,
        });
        return { message: 'Ürün silindi' };
    }
    async getFullMenu(brand) {
        const categories = await this.prisma.category.findMany({
            where: {
                brand,
                isActive: true,
            },
            orderBy: { sortOrder: 'asc' },
            include: {
                products: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });
        return categories;
    }
};
exports.MenuService = MenuService;
exports.MenuService = MenuService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        events_1.EventsGateway])
], MenuService);
//# sourceMappingURL=menu.service.js.map