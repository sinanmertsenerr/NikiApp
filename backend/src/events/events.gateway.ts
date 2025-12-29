import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: string;
}

@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
    namespace: '/',
})
@Injectable()
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(EventsGateway.name);
    private connectedClients: Map<string, AuthenticatedSocket> = new Map();

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway initialized');
    }

    async handleConnection(client: AuthenticatedSocket) {
        try {
            // Get token from handshake auth or query
            const token = client.handshake.auth?.token || client.handshake.query?.token;

            if (!token) {
                this.logger.warn(`Client ${client.id} connected without token`);
                // Allow connection but without authentication
                return;
            }

            // Verify JWT token
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_SECRET'),
            });

            client.userId = payload.sub;
            client.userRole = payload.role;

            // Join user-specific room
            client.join(`user:${payload.sub}`);

            // If admin, join admin room
            if (payload.role === 'admin' || payload.role === 'super_admin') {
                client.join('admin');
            }

            this.connectedClients.set(client.id, client);
            this.logger.log(`Client ${client.id} connected - User: ${payload.sub}, Role: ${payload.role}`);

            // Send connection confirmation
            client.emit('connected', {
                success: true,
                userId: payload.sub,
                message: 'Successfully connected to real-time server'
            });

        } catch (error) {
            this.logger.error(`Authentication failed for client ${client.id}: ${error.message}`);
            client.emit('auth_error', { message: 'Invalid authentication token' });
            // Don't disconnect - allow reconnection with valid token
        }
    }

    handleDisconnect(client: AuthenticatedSocket) {
        this.connectedClients.delete(client.id);
        this.logger.log(`Client ${client.id} disconnected`);
    }

    @SubscribeMessage('authenticate')
    async handleAuthenticate(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { token: string },
    ) {
        try {
            const payload = await this.jwtService.verifyAsync(data.token, {
                secret: this.configService.get<string>('JWT_SECRET'),
            });

            client.userId = payload.sub;
            client.userRole = payload.role;

            // Join rooms
            client.join(`user:${payload.sub}`);
            if (payload.role === 'admin' || payload.role === 'super_admin') {
                client.join('admin');
            }

            this.connectedClients.set(client.id, client);

            return { success: true, userId: payload.sub };
        } catch (error) {
            return { success: false, error: 'Invalid token' };
        }
    }

    // ==================== EMIT METHODS ====================

    /**
     * Emit balance update to a specific user
     */
    emitBalanceUpdate(userId: string, data: {
        newBalance: string;
        transactionType: 'topup' | 'payment' | 'refund';
        amount: string;
        description?: string;
        originalAmount?: string;
        discountAmount?: string;
        discountPercentage?: number;
    }) {
        this.server.to(`user:${userId}`).emit('balance_updated', data);
        this.logger.log(`Emitted balance_updated to user:${userId}`);
    }

    /**
     * Emit campaign assignment to a specific user
     */
    emitCampaignAssigned(userId: string, data: {
        campaignId: string;
        campaignTitle: string;
        campaignTitleTr: string;
    }) {
        this.server.to(`user:${userId}`).emit('campaign_assigned', data);
        this.logger.log(`Emitted campaign_assigned to user:${userId}`);
    }

    /**
     * Emit user update to admins (for real-time admin panel updates)
     */
    emitUserUpdated(data: {
        userId: string;
        updateType: 'balance' | 'campaign' | 'status' | 'wallet_status';
        newValue?: any;
    }) {
        this.server.to('admin').emit('user_updated', data);
        this.logger.log(`Emitted user_updated to admin room`);
    }

    /**
     * Emit wallet status update to specific user (for IEU wallet activation)
     */
    emitWalletStatusUpdate(userId: string, data: {
        walletType: 'IEU' | 'NIKI';
        isActive: boolean;
    }) {
        this.server.to(`user:${userId}`).emit('wallet_status_updated', data);
        this.logger.log(`Emitted wallet_status_updated to user:${userId}`);
    }

    /**
     * Emit campaign update to all users
     * This ensures real-time updates for everyone when a campaign is deleted/updated
     */
    emitCampaignUpdated(data: {
        campaignId: string;
        updateType: 'created' | 'updated' | 'deleted' | 'assigned';
        assignedCount?: number;
    }) {
        // Broadcast to everyone so users can invalidate their cache if needed
        this.server.emit('campaign_updated', data);
        this.logger.log(`Emitted campaign_updated to all clients`);
    }

    /**
     * Emit menu update (category or product changes)
     */
    emitMenuUpdated(data: {
        type: 'category' | 'product';
        action: 'created' | 'updated' | 'deleted' | 'reordered';
        itemId: string;
        categoryId?: string;
        brand?: string;
    }) {
        // Broadcast to all connected clients
        this.server.emit('menu_updated', data);
        this.logger.log(`Emitted menu_updated: ${data.type} ${data.action}`);
    }

    /**
     * Emit wheel spin result to user
     */
    emitWheelResult(userId: string, data: {
        rewardType: string;
        rewardValue: string;
        message: string;
        messageTr: string;
        nextSpinAvailable: Date;
    }) {
        this.server.to(`user:${userId}`).emit('wheel_result', data);
        this.logger.log(`Emitted wheel_result to user:${userId}`);
    }

    /**
     * Emit profile update to the user
     */
    emitProfileUpdated(userId: string, data: {
        updateType: 'profile' | 'avatar' | 'settings';
        newValue?: any;
    }) {
        this.server.to(`user:${userId}`).emit('profile_updated', data);
        this.logger.log(`Emitted profile_updated to user:${userId}`);
    }

    /**
     * Emit badge earned notification to user
     */
    emitBadgeEarned(userId: string, data: {
        badgeId: string;
        badgeName: string;
        badgeNameTr: string;
        iconUrl?: string;
    }) {
        this.server.to(`user:${userId}`).emit('badge_earned', data);
        this.logger.log(`Emitted badge_earned to user:${userId}`);
    }

    /**
     * Emit stats update to user (points, etc.)
     */
    emitStatsUpdated(userId: string, data: {
        type: 'points' | 'badge' | 'campaign';
        change: number;
        newTotal?: number;
    }) {
        this.server.to(`user:${userId}`).emit('stats_updated', data);
        this.logger.log(`Emitted stats_updated to user:${userId}`);
    }

    /**
     * Get connected clients count
     */
    getConnectedClientsCount(): number {
        return this.connectedClients.size;
    }
}
