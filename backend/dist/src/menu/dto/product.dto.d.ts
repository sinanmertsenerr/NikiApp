export declare class CreateProductDto {
    categoryId: string;
    name: string;
    nameTr: string;
    description?: string;
    descriptionTr?: string;
    price: number;
    imageUrl?: string;
    isCoffee?: boolean;
    isActive?: boolean;
    sortOrder?: number;
}
declare const UpdateProductDto_base: import("@nestjs/common").Type<Partial<CreateProductDto>>;
export declare class UpdateProductDto extends UpdateProductDto_base {
}
export declare class ToggleProductDto {
    isActive: boolean;
}
export declare class ProductResponseDto {
    id: string;
    categoryId: string;
    name: string;
    nameTr: string;
    description?: string;
    descriptionTr?: string;
    price: number;
    imageUrl?: string;
    isCoffee: boolean;
    isActive: boolean;
    sortOrder: number;
}
export declare class ProductWithCategoryDto extends ProductResponseDto {
    category: {
        id: string;
        name: string;
        nameTr: string;
    };
}
export {};
