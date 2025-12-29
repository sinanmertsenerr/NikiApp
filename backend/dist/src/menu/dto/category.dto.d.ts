import { Brand } from '@prisma/client';
export declare class CreateCategoryDto {
    brand: Brand;
    name: string;
    nameTr: string;
    description?: string;
    descriptionTr?: string;
    imageUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
}
declare const UpdateCategoryDto_base: import("@nestjs/common").Type<Partial<CreateCategoryDto>>;
export declare class UpdateCategoryDto extends UpdateCategoryDto_base {
}
export declare class CategoryResponseDto {
    id: string;
    brand: Brand;
    name: string;
    nameTr: string;
    description?: string;
    descriptionTr?: string;
    imageUrl?: string;
    sortOrder: number;
    isActive: boolean;
    productCount?: number;
}
export declare class ReorderCategoriesDto {
    orderedIds: string[];
}
export {};
