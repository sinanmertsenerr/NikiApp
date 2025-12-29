"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EventsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let EventsGateway = EventsGateway_1 = class EventsGateway {
    jwtService;
    configService;
    server;
    logger = new common_1.Logger(EventsGateway_1.name);
    connectedClients = new Map();
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    afterInit(server) {
        this.logger.log('WebSocket Gateway initialized');
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token || client.handshake.query?.token;
            if (!token) {
                this.logger.warn(`Client ${client.id} connected without token`);
                return;
            }
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_SECRET'),
            });
            client.userId = payload.sub;
            client.userRole = payload.role;
            client.join(`user:${payload.sub}`);
            if (payload.role === 'admin' || payload.role === 'super_admin') {
                client.join('admin');
            }
            this.connectedClients.set(client.id, client);
            this.logger.log(`Client ${client.id} connected - User: ${payload.sub}, Role: ${payload.role}`);
            client.emit('connected', {
                success: true,
                userId: payload.sub,
                message: 'Successfully connected to real-time server'
            });
        }
        catch (error) {
            this.logger.error(`Authentication failed for client ${client.id}: ${error.message}`);
            client.emit('auth_error', { message: 'Invalid authentication token' });
        }
    }
    handleDisconnect(client) {
        this.connectedClients.delete(client.id);
        this.logger.log(`Client ${client.id} disconnected`);
    }
    async handleAuthenticate(client, data) {
        try {
            const payload = await this.jwtService.verifyAsync(data.token, {
                secret: this.configService.get('JWT_SECRET'),
            });
            client.userId = payload.sub;
            client.userRole = payload.role;
            client.join(`user:${payload.sub}`);
            if (payload.role === 'admin' || payload.role === 'super_admin') {
                client.join('admin');
            }
            this.connectedClients.set(client.id, client);
            return { success: true, userId: payload.sub };
        }
        catch (error) {
            return { success: false, error: 'Invalid token' };
        }
    }
    emitBalanceUpdate(userId, data) {
        this.server.to(`user:${userId}`).emit('balance_updated', data);
        this.logger.log(`Emitted balance_updated to user:${userId}`);
    }
    emitCampaignAssigned(userId, data) {
        this.server.to(`user:${userId}`).emit('campaign_assigned', data);
        this.logger.log(`Emitted campaign_assigned to user:${userId}`);
    }
    emitUserUpdated(data) {
        this.server.to('admin').emit('user_updated', data);
        this.logger.log(`Emitted user_updated to admin room`);
    }
    emitWalletStatusUpdate(userId, data) {
        this.server.to(`user:${userId}`).emit('wallet_status_updated', data);
        this.logger.log(`Emitted wallet_status_updated to user:${userId}`);
    }
    emitCampaignUpdated(data) {
        this.server.emit('campaign_updated', data);
        this.logger.log(`Emitted campaign_updated to all clients`);
    }
    emitMenuUpdated(data) {
        this.server.emit('menu_updated', data);
        this.logger.log(`Emitted menu_updated: ${data.type} ${data.action}`);
    }
    emitWheelResult(userId, data) {
        this.server.to(`user:${userId}`).emit('wheel_result', data);
        this.logger.log(`Emitted wheel_result to user:${userId}`);
    }
    emitProfileUpdated(userId, data) {
        this.server.to(`user:${userId}`).emit('profile_updated', data);
        this.logger.log(`Emitted profile_updated to user:${userId}`);
    }
    emitBadgeEarned(userId, data) {
        this.server.to(`user:${userId}`).emit('badge_earned', data);
        this.logger.log(`Emitted badge_earned to user:${userId}`);
    }
    emitStatsUpdated(userId, data) {
        this.server.to(`user:${userId}`).emit('stats_updated', data);
        this.logger.log(`Emitted stats_updated to user:${userId}`);
    }
    getConnectedClientsCount() {
        return this.connectedClients.size;
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('authenticate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "handleAuthenticate", null);
exports.EventsGateway = EventsGateway = EventsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
        namespace: '/',
    }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], EventsGateway);
//# sourceMappingURL=events.gateway.js.map