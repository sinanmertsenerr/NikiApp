import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Brand, UserRole } from '@prisma/client';
import { MenuService } from './menu.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../common/decorators';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
  ToggleProductDto,
  ReorderCategoriesDto,
} from './dto';

@ApiTags('Admin - Menu')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.super_admin)
@Controller('admin/menu')
export class AdminMenuController {
  constructor(private readonly menuService: MenuService) { }

  // ==================== CATEGORY MANAGEMENT ====================

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories (including inactive)' })
  @ApiQuery({ name: 'brand', required: false, enum: Brand })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Categories returned' })
  async getCategories(
    @Query('brand') brand?: Brand,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    const categories = await this.menuService.getCategories(
      brand,
      includeInactive ?? true,
    );
    return {
      success: true,
      data: { categories },
    };
  }

  @Post('category')
  @ApiOperation({ summary: 'Create new category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  @ApiResponse({ status: 409, description: 'Category already exists' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    const category = await this.menuService.createCategory(dto);
    return {
      success: true,
      data: { category },
      message: 'Kategori oluşturuldu',
    };
  }

  @Put('category/:id')
  @ApiOperation({ summary: 'Update category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.menuService.updateCategory(id, dto);
    return {
      success: true,
      data: { category },
      message: 'Kategori güncellendi',
    };
  }

  @Delete('category/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete category (soft delete)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category deactivated' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async deleteCategory(@Param('id') id: string) {
    const result = await this.menuService.deleteCategory(id);
    return {
      success: true,
      data: result,
    };
  }

  @Post('categories/reorder')
  @ApiOperation({ summary: 'Reorder categories' })
  @ApiResponse({ status: 200, description: 'Categories reordered' })
  @ApiResponse({ status: 404, description: 'One or more categories not found' })
  async reorderCategories(@Body() dto: ReorderCategoriesDto) {
    const result = await this.menuService.reorderCategories(dto.orderedIds);
    return {
      success: true,
      data: result,
      message: 'Kategoriler yeniden sıralandı',
    };
  }

  // ==================== PRODUCT MANAGEMENT ====================

  @Get('products')
  @ApiOperation({ summary: 'Get all products (including inactive)' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Products returned' })
  async getProducts(
    @Query('categoryId') categoryId?: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    const products = await this.menuService.getProducts(
      categoryId,
      includeInactive ?? true,
    );
    return {
      success: true,
      data: { products },
    };
  }

  @Post('product')
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async createProduct(@Body() dto: CreateProductDto) {
    const product = await this.menuService.createProduct(dto);
    return {
      success: true,
      data: { product },
      message: 'Ürün oluşturuldu',
    };
  }

  @Put('product/:id')
  @ApiOperation({ summary: 'Update product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.menuService.updateProduct(id, dto);
    return {
      success: true,
      data: { product },
      message: 'Ürün güncellendi',
    };
  }

  @Patch('product/:id/toggle')
  @ApiOperation({ summary: 'Toggle product active status' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product status toggled' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async toggleProductStatus(
    @Param('id') id: string,
    @Body() dto: ToggleProductDto,
  ) {
    const product = await this.menuService.toggleProductStatus(id, dto.isActive);
    return {
      success: true,
      data: { product },
      message: dto.isActive ? 'Ürün aktif edildi' : 'Ürün pasif edildi',
    };
  }

  @Delete('product/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete product (hard delete)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProduct(@Param('id') id: string) {
    const result = await this.menuService.deleteProduct(id);
    return {
      success: true,
      data: result,
    };
  }
}
