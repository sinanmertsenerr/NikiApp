import { UserRole } from '@prisma/client';
export declare class GetUsersQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    emailVerified?: boolean;
}
export declare class UpdateUserStatusDto {
    isActive?: boolean;
    role?: UserRole;
}
export declare class ToggleIeuWalletDto {
    isActive: boolean;
}
export declare class ToggleNegativeBalanceDto {
    walletType: 'IEU' | 'NIKI';
    allowNegative: boolean;
    negativeLimit?: number;
}
