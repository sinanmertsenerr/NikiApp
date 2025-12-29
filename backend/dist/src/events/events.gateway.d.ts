import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: string;
}
export declare class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly configService;
    server: Server;
    private readonly logger;
    private connectedClients;
    constructor(jwtService: JwtService, configService: ConfigService);
    afterInit(server: Server): void;
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleAuthenticate(client: AuthenticatedSocket, data: {
        token: string;
    }): Promise<{
        success: boolean;
        userId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        userId?: undefined;
    }>;
    emitBalanceUpdate(userId: string, data: {
        newBalance: string;
        transactionType: 'topup' | 'payment' | 'refund';
        amount: string;
        description?: string;
        originalAmount?: string;
        discountAmount?: string;
        discountPercentage?: number;
    }): void;
    emitCampaignAssigned(userId: string, data: {
        campaignId: string;
        campaignTitle: string;
        campaignTitleTr: string;
    }): void;
    emitUserUpdated(data: {
        userId: string;
        updateType: 'balance' | 'campaign' | 'status' | 'wallet_status';
        newValue?: any;
    }): void;
    emitWalletStatusUpdate(userId: string, data: {
        walletType: 'IEU' | 'NIKI';
        isActive: boolean;
    }): void;
    emitCampaignUpdated(data: {
        campaignId: string;
        updateType: 'created' | 'updated' | 'deleted' | 'assigned';
        assignedCount?: number;
    }): void;
    emitMenuUpdated(data: {
        type: 'category' | 'product';
        action: 'created' | 'updated' | 'deleted' | 'reordered';
        itemId: string;
        categoryId?: string;
        brand?: string;
    }): void;
    emitWheelResult(userId: string, data: {
        rewardType: string;
        rewardValue: string;
        message: string;
        messageTr: string;
        nextSpinAvailable: Date;
    }): void;
    emitProfileUpdated(userId: string, data: {
        updateType: 'profile' | 'avatar' | 'settings';
        newValue?: any;
    }): void;
    emitBadgeEarned(userId: string, data: {
        badgeId: string;
        badgeName: string;
        badgeNameTr: string;
        iconUrl?: string;
    }): void;
    emitStatsUpdated(userId: string, data: {
        type: 'points' | 'badge' | 'campaign';
        change: number;
        newTotal?: number;
    }): void;
    getConnectedClientsCount(): number;
}
export {};
