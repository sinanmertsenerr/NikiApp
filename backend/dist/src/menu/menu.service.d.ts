import { Brand } from '@prisma/client';
import { PrismaService } from '../prisma';
import { EventsGateway } from '../events';
import { CreateCategoryDto, UpdateCategoryDto, CreateProductDto, UpdateProductDto } from './dto';
export declare class MenuService {
    private prisma;
    private eventsGateway;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
    getCategories(brand?: Brand, includeInactive?: boolean): Promise<{
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
    }[]>;
    getCategoryById(id: string): Promise<{
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
    }>;
    createCategory(dto: CreateCategoryDto): Promise<{
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
    }>;
    updateCategory(id: string, dto: UpdateCategoryDto): Promise<{
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
    }>;
    deleteCategory(id: string): Promise<{
        message: string;
        deletedProducts: number;
    }>;
    reorderCategories(orderedIds: string[]): Promise<{
        message: string;
    }>;
    getProducts(categoryId?: string, includeInactive?: boolean): Promise<({
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
    })[]>;
    getProductsByBrand(brand: Brand, includeInactive?: boolean): Promise<({
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
    })[]>;
    getProductById(id: string): Promise<{
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
    }>;
    createProduct(dto: CreateProductDto): Promise<{
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
    }>;
    updateProduct(id: string, dto: UpdateProductDto): Promise<{
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
    }>;
    toggleProductStatus(id: string, isActive: boolean): Promise<{
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
    }>;
    deleteProduct(id: string): Promise<{
        message: string;
    }>;
    getFullMenu(brand: Brand): Promise<({
        products: {
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
        }[];
    } & {
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
    })[]>;
}
