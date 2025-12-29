import { Brand } from '@prisma/client';
import { MenuService } from './menu.service';
export declare class MenuController {
    private readonly menuService;
    constructor(menuService: MenuService);
    getCategories(brand?: Brand): Promise<{
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
    getCategoryById(id: string): Promise<{
        success: boolean;
        data: {
            category: {
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
            };
        };
    }>;
    getProducts(categoryId?: string, brand?: Brand): Promise<{
        success: boolean;
        data: {
            products: any;
        };
    }>;
    getProductById(id: string): Promise<{
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
    }>;
    getFullMenu(brand: Brand): Promise<{
        success: boolean;
        data: {
            menu: ({
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
            })[];
        };
    }>;
}
