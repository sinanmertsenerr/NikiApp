import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Brand } from '@prisma/client';
import { PrismaService } from '../prisma';
import { EventsGateway } from '../events';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
} from './dto';

@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) { }

  // ==================== CATEGORY OPERATIONS ====================

  /**
   * Get all categories (optionally by brand)
   */
  async getCategories(brand?: Brand, includeInactive = false) {
    const where: any = {};

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

  /**
   * Get single category by ID
   */
  async getCategoryById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Kategori bulunamadı');
    }

    return {
      ...category,
      productCount: category._count.products,
      _count: undefined,
    };
  }

  /**
   * Create new category (Admin)
   */
  async createCategory(dto: CreateCategoryDto) {
    // Check if category with same name exists for this brand
    const existing = await this.prisma.category.findFirst({
      where: {
        brand: dto.brand,
        name: dto.name,
      },
    });

    if (existing) {
      throw new ConflictException('Bu isimde bir kategori zaten mevcut');
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

    // Emit socket event for real-time menu update
    this.eventsGateway.emitMenuUpdated({
      type: 'category',
      action: 'created',
      itemId: category.id,
      brand: dto.brand,
    });

    return category;
  }

  /**
   * Update category (Admin)
   */
  async updateCategory(id: string, dto: UpdateCategoryDto) {
    // Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Kategori bulunamadı');
    }

    // If name is being changed, check for duplicates
    if (dto.name && dto.name !== category.name) {
      const existing = await this.prisma.category.findFirst({
        where: {
          brand: dto.brand || category.brand,
          name: dto.name,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Bu isimde bir kategori zaten mevcut');
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: dto,
    });

    // Emit socket event for real-time menu update
    this.eventsGateway.emitMenuUpdated({
      type: 'category',
      action: 'updated',
      itemId: id,
      brand: updated.brand,
    });

    return updated;
  }

  /**
   * Delete category (Admin) - Hard delete
   */
  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Kategori bulunamadı');
    }

    // First delete all products in this category
    await this.prisma.product.deleteMany({
      where: { categoryId: id },
    });

    // Then delete the category
    await this.prisma.category.delete({
      where: { id },
    });

    // Emit socket event for real-time menu update
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

  /**
   * Reorder categories (Admin) - Updates sortOrder for all categories
   */
  async reorderCategories(orderedIds: string[]) {
    // Verify all categories exist
    const categories = await this.prisma.category.findMany({
      where: { id: { in: orderedIds } },
    });

    if (categories.length !== orderedIds.length) {
      throw new NotFoundException('Bir veya daha fazla kategori bulunamadı');
    }

    // Update sortOrder for each category in a transaction
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.category.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    // Get the brand from the first category for the socket event
    const brand = categories[0]?.brand;

    // Emit socket event for real-time menu update
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

  // ==================== PRODUCT OPERATIONS ====================

  /**
   * Get all products (optionally by category)
   */
  async getProducts(categoryId?: string, includeInactive = false) {
    const where: any = {};

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

  /**
   * Get products by brand
   */
  async getProductsByBrand(brand: Brand, includeInactive = false) {
    const where: any = {
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

  /**
   * Get single product by ID
   */
  async getProductById(id: string) {
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
      throw new NotFoundException('Ürün bulunamadı');
    }

    return product;
  }

  /**
   * Create new product (Admin)
   */
  async createProduct(dto: CreateProductDto) {
    // Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Kategori bulunamadı');
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

    // Emit socket event for real-time menu update
    this.eventsGateway.emitMenuUpdated({
      type: 'product',
      action: 'created',
      itemId: product.id,
      categoryId: dto.categoryId,
      brand: product.category.brand,
    });

    return product;
  }

  /**
   * Update product (Admin)
   */
  async updateProduct(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { brand: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    // If changing category, verify new category exists
    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Yeni kategori bulunamadı');
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

    // Emit socket event for real-time menu update
    this.eventsGateway.emitMenuUpdated({
      type: 'product',
      action: 'updated',
      itemId: id,
      categoryId: updated.categoryId,
      brand: updated.category.brand,
    });

    return updated;
  }

  /**
   * Toggle product active status (Admin)
   */
  async toggleProductStatus(id: string, isActive: boolean) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { brand: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { isActive },
    });

    // Emit socket event for real-time menu update
    this.eventsGateway.emitMenuUpdated({
      type: 'product',
      action: 'updated',
      itemId: id,
      categoryId: product.categoryId,
      brand: product.category.brand,
    });

    return updated;
  }

  /**
   * Delete product (Admin) - Hard delete
   */
  async deleteProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { brand: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    // Emit socket event for real-time menu update
    this.eventsGateway.emitMenuUpdated({
      type: 'product',
      action: 'deleted',
      itemId: id,
      categoryId: product.categoryId,
      brand: product.category.brand,
    });

    return { message: 'Ürün silindi' };
  }

  // ==================== MENU OVERVIEW ====================

  /**
   * Get full menu with categories and products
   */
  async getFullMenu(brand: Brand) {
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
}
