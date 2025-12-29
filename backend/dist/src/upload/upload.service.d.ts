import { PrismaService } from '../prisma/prisma.service';
export declare class UploadService {
    private prisma;
    constructor(prisma: PrismaService);
    getFileUrl(filename: string, type: 'avatars' | 'products'): string;
    updateUserAvatar(userId: string, filename: string): Promise<string>;
    updateProductImage(productId: string, filename: string): Promise<string>;
    deleteFile(fileUrl: string): Promise<void>;
    getProductsWithImages(): Promise<({
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
}
