import { TransactionType } from '@prisma/client';
export declare class TopUpDto {
    qrCode: string;
    amount: number;
    description?: string;
}
export declare class PaymentDto {
    qrCode: string;
    amount: number;
    useDiscount?: boolean;
    description?: string;
}
export declare class RefundDto {
    transactionId: string;
    reason?: string;
}
export declare class GetTransactionsQueryDto {
    page?: number;
    limit?: number;
    type?: TransactionType;
    startDate?: string;
    endDate?: string;
}
export declare class AdminTransactionsQueryDto extends GetTransactionsQueryDto {
    userId?: string;
    adminId?: string;
}
