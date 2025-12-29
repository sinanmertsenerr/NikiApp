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
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
let UploadService = class UploadService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getFileUrl(filename, type) {
        return `/uploads/${type}/${filename}`;
    }
    async updateUserAvatar(userId, filename) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.avatarUrl) {
            await this.deleteFile(user.avatarUrl);
        }
        const avatarUrl = this.getFileUrl(filename, 'avatars');
        await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
        });
        return avatarUrl;
    }
    async updateProductImage(productId, filename) {
        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (product.imageUrl) {
            await this.deleteFile(product.imageUrl);
        }
        const imageUrl = this.getFileUrl(filename, 'products');
        await this.prisma.product.update({
            where: { id: productId },
            data: { imageUrl },
        });
        return imageUrl;
    }
    async deleteFile(fileUrl) {
        try {
            const filePath = (0, path_1.join)(process.cwd(), fileUrl);
            if ((0, fs_1.existsSync)(filePath)) {
                await (0, promises_1.unlink)(filePath);
            }
        }
        catch (error) {
            console.error('Error deleting file:', error);
        }
    }
    async getProductsWithImages() {
        return this.prisma.product.findMany({
            where: { isActive: true },
            include: { category: true },
            orderBy: { sortOrder: 'asc' },
        });
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UploadService);
//# sourceMappingURL=upload.service.js.map