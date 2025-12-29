import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ==================== CREATE PRODUCT ====================

export class CreateProductDto {
  @ApiProperty({ example: 'uuid-category-id' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'Latte' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Latte' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nameTr: string;

  @ApiPropertyOptional({ example: 'Smooth espresso with steamed milk' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'Yumuşak espresso ve buharda ısıtılmış süt' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  descriptionTr?: string;

  @ApiProperty({ example: 65.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ example: 'https://example.com/latte.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'If true, this product counts towards loyalty points',
  })
  @IsBoolean()
  @IsOptional()
  isCoffee?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

// ==================== UPDATE PRODUCT ====================

export class UpdateProductDto extends PartialType(CreateProductDto) {}

// ==================== TOGGLE PRODUCT STATUS ====================

export class ToggleProductDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}

// ==================== PRODUCT RESPONSE ====================

export class ProductResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'uuid-category-id' })
  categoryId: string;

  @ApiProperty({ example: 'Latte' })
  name: string;

  @ApiProperty({ example: 'Latte' })
  nameTr: string;

  @ApiPropertyOptional({ example: 'Smooth espresso with steamed milk' })
  description?: string;

  @ApiPropertyOptional({ example: 'Yumuşak espresso ve buharda ısıtılmış süt' })
  descriptionTr?: string;

  @ApiProperty({ example: 65.0 })
  price: number;

  @ApiPropertyOptional({ example: 'https://example.com/latte.jpg' })
  imageUrl?: string;

  @ApiProperty({ example: true })
  isCoffee: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 1 })
  sortOrder: number;
}

// ==================== PRODUCT WITH CATEGORY ====================

export class ProductWithCategoryDto extends ProductResponseDto {
  @ApiProperty({ example: { id: 'uuid', name: 'Hot Coffees', nameTr: 'Sıcak Kahveler' } })
  category: {
    id: string;
    name: string;
    nameTr: string;
  };
}
