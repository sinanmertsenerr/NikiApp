import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  MaxLength,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Brand } from '@prisma/client';

// ==================== CREATE CATEGORY ====================

export class CreateCategoryDto {
  @ApiProperty({ enum: Brand, example: 'coffee' })
  @IsEnum(Brand)
  @IsNotEmpty()
  brand: Brand;

  @ApiProperty({ example: 'Hot Coffees' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Sıcak Kahveler' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nameTr: string;

  @ApiPropertyOptional({ example: 'Our finest hot coffee selection' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'En kaliteli sıcak kahve seçkimiz' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  descriptionTr?: string;

  @ApiPropertyOptional({ example: 'https://example.com/hot-coffees.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ==================== UPDATE CATEGORY ====================

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) { }

// ==================== CATEGORY RESPONSE ====================

export class CategoryResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ enum: Brand, example: 'coffee' })
  brand: Brand;

  @ApiProperty({ example: 'Hot Coffees' })
  name: string;

  @ApiProperty({ example: 'Sıcak Kahveler' })
  nameTr: string;

  @ApiPropertyOptional({ example: 'Our finest hot coffee selection' })
  description?: string;

  @ApiPropertyOptional({ example: 'En kaliteli sıcak kahve seçkimiz' })
  descriptionTr?: string;

  @ApiPropertyOptional({ example: 'https://example.com/hot-coffees.jpg' })
  imageUrl?: string;

  @ApiProperty({ example: 1 })
  sortOrder: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: 5 })
  productCount?: number;
}

// ==================== REORDER CATEGORIES ====================

export class ReorderCategoriesDto {
  @ApiProperty({
    description: 'Ordered array of category IDs',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  orderedIds: string[];
}
