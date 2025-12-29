import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Brand } from '@prisma/client';
import { MenuService } from './menu.service';
import { Public } from '../common/decorators';

@ApiTags('Menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // ==================== CATEGORIES ====================

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get all categories (optionally filter by brand)' })
  @ApiQuery({
    name: 'brand',
    required: false,
    enum: Brand,
    description: 'Filter by brand (coffee/sandwich)',
  })
  @ApiResponse({ status: 200, description: 'Categories returned' })
  async getCategories(@Query('brand') brand?: Brand) {
    const categories = await this.menuService.getCategories(brand);
    return {
      success: true,
      data: { categories },
    };
  }

  @Public()
  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category returned' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryById(@Param('id') id: string) {
    const category = await this.menuService.getCategoryById(id);
    return {
      success: true,
      data: { category },
    };
  }

  // ==================== PRODUCTS ====================

  @Public()
  @Get('products')
  @ApiOperation({ summary: 'Get all products (optionally filter by category)' })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'brand',
    required: false,
    enum: Brand,
    description: 'Filter by brand (coffee/sandwich)',
  })
  @ApiResponse({ status: 200, description: 'Products returned' })
  async getProducts(
    @Query('categoryId') categoryId?: string,
    @Query('brand') brand?: Brand,
  ) {
    let products;

    if (categoryId) {
      products = await this.menuService.getProducts(categoryId);
    } else if (brand) {
      products = await this.menuService.getProductsByBrand(brand);
    } else {
      products = await this.menuService.getProducts();
    }

    return {
      success: true,
      data: { products },
    };
  }

  @Public()
  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product returned' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductById(@Param('id') id: string) {
    const product = await this.menuService.getProductById(id);
    return {
      success: true,
      data: { product },
    };
  }

  // ==================== FULL MENU ====================

  @Public()
  @Get('full')
  @ApiOperation({ summary: 'Get full menu with categories and products' })
  @ApiQuery({
    name: 'brand',
    required: true,
    enum: Brand,
    description: 'Brand (coffee/sandwich)',
  })
  @ApiResponse({ status: 200, description: 'Full menu returned' })
  async getFullMenu(@Query('brand') brand: Brand) {
    const menu = await this.menuService.getFullMenu(brand);
    return {
      success: true,
      data: { menu },
    };
  }
}
