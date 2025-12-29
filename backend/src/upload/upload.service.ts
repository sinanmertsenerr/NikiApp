import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { join } from 'path';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService) {}

  // Get the base URL for uploaded files
  getFileUrl(filename: string, type: 'avatars' | 'products'): string {
    // This will be served from /uploads/avatars/filename or /uploads/products/filename
    return `/uploads/${type}/${filename}`;
  }

  // Update user avatar
  async updateUserAvatar(userId: string, filename: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete old avatar if exists
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

  // Update product image
  async updateProductImage(productId: string, filename: string): Promise<string> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Delete old image if exists
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

  // Delete file from disk
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Convert URL to file path
      const filePath = join(process.cwd(), fileUrl);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  // Get all products with images
  async getProductsWithImages() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
