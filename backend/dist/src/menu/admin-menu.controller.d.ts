import { Brand } from '@prisma/client';
import { MenuService } from './menu.service';
import { CreateCategoryDto, UpdateCategoryDto, CreateProductDto, UpdateProductDto, ToggleProductDto, ReorderCategoriesDto } from './dto';
export declare class AdminMenuController {
    private readonly menuService;
    constructor(menuService: MenuService);
    getCategories(brand?: Brand, includeInactive?: boolean): Promise<{
        success: boolean;
        data: {
            categories: {
                productCount: number;
                _count: undefined;
                id: string;
                description: string | null;
                descriptionTr: string | null;
                imageUrl: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                brand: import("@prisma/client").$Enums.Brand;
                nameTr: string;
                sortOrder: number;
            }[];
        };
    }>;
    createCategory(dto: CreateCategoryDto): Promise<{
        success: boolean;
        data: {
            category: {
                id: string;
                description: string | null;
                descriptionTr: string | null;
                imageUrl: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                brand: import("@prisma/client").$Enums.Brand;
                nameTr: string;
                sortOrder: number;
            };
        };
        message: string;
    }>;
    updateCategory(id: string, dto: UpdateCategoryDto): Promise<{
        success: boolean;
        data: {
            category: {
                id: string;
                description: string | null;
                descriptionTr: string | null;
                imageUrl: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                brand: import("@prisma/client").$Enums.Brand;
                nameTr: string;
                sortOrder: number;
            };
        };
        message: string;
    }>;
    deleteCategory(id: string): Promise<{
        success: boolean;
        data: {
            message: string;
            deletedProducts: number;
        };
    }>;
    reorderCategories(dto: ReorderCategoriesDto): Promise<{
        success: boolean;
        data: {
            message: string;
        };
        message: string;
    }>;
    getProducts(categoryId?: string, includeInactive?: boolean): Promise<{
        success: boolean;
        data: {
            products: ({
                category: {
                    id: string;
                    name: string;
                    brand: import("@prisma/client").$Enums.Brand;
                    nameTr: string;
                };
            } & {
                id: string;
                description: string | null;
                descriptionTr: string | null;
                imageUrl: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                nameTr: string;
                sortOrder: number;
                categoryId: string;
                price: import("@prisma/client/runtime/library").Decimal;
                isCoffee: boolean;
            })[];
        };
    }>;
    createProduct(dto: CreateProductDto): Promise<{
        success: boolean;
        data: {
            product: {
                category: {
                    id: string;
                    name: string;
                    brand: import("@prisma/client").$Enums.Brand;
                    nameTr: string;
                };
            } & {
                id: string;
                description: string | null;
                descriptionTr: string | null;
                imageUrl: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                nameTr: string;
                sortOrder: number;
                categoryId: string;
                price: import("@prisma/client/runtime/library").Decimal;
                isCoffee: boolean;
            };
        };
        message: string;
    }>;
    updateProduct(id: string, dto: UpdateProductDto): Promise<{
        success: boolean;
        data: {
            product: {
                category: {
                    id: string;
                    name: string;
                    brand: import("@prisma/client").$Enums.Brand;
                    nameTr: string;
                };
            } & {
                id: string;
                description: string | null;
                descriptionTr: string | null;
                imageUrl: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                nameTr: string;
                sortOrder: number;
                categoryId: string;
                price: import("@prisma/client/runtime/library").Decimal;
                isCoffee: boolean;
            };
        };
        message: string;
    }>;
    toggleProductStatus(id: string, dto: ToggleProductDto): Promise<{
        success: boolean;
        data: {
            product: {
                id: string;
                description: string | null;
                descriptionTr: string | null;
                imageUrl: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                nameTr: string;
                sortOrder: number;
                categoryId: string;
                price: import("@prisma/client/runtime/library").Decimal;
                isCoffee: boolean;
            };
        };
        message: string;
    }>;
    deleteProduct(id: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
}
