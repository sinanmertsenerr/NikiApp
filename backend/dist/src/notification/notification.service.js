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
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_1 = require("../prisma");
let NotificationService = NotificationService_1 = class NotificationService {
    prisma;
    configService;
    logger = new common_1.Logger(NotificationService_1.name);
    EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    async sendToUser(userId, title, body, data) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { expoPushToken: true, firstName: true },
        });
        if (!user?.expoPushToken) {
            this.logger.warn(`No push token for user ${userId}`);
            return false;
        }
        return this.sendPushNotification({
            to: user.expoPushToken,
            title,
            body,
            data,
            sound: 'default',
        });
    }
    async sendToUsers(userIds, title, body, data) {
        const users = await this.prisma.user.findMany({
            where: {
                id: { in: userIds },
                expoPushToken: { not: null },
            },
            select: { expoPushToken: true },
        });
        const tokens = users
            .map((u) => u.expoPushToken)
            .filter((token) => !!token);
        if (tokens.length === 0) {
            this.logger.warn('No valid push tokens found');
            return { sent: 0, failed: userIds.length };
        }
        const messages = tokens.map((token) => ({
            to: token,
            title,
            body,
            data,
            sound: 'default',
        }));
        const results = await this.sendBatchPushNotifications(messages);
        const sent = results.filter((r) => r.status === 'ok').length;
        return { sent, failed: userIds.length - sent };
    }
    async notifyPointsEarned(userId, points) {
        await this.sendToUser(userId, '⭐ Puan Kazandınız!', `${points} puan hesabınıza eklendi.`, { type: 'points_earned', points });
    }
    async notifyFreeCoffeeEarned(userId) {
        await this.sendToUser(userId, '☕ Bedava Kahve Kazandınız!', '10 puana ulaştınız! Bedava kahvenizi almak için QR kodunuzu gösterin.', { type: 'free_coffee' });
    }
    async notifyWheelReward(userId, rewardType, rewardValue) {
        let title = '🎡 Çark Ödülü!';
        let body = '';
        switch (rewardType) {
            case 'points':
                body = `Tebrikler! ${rewardValue} puan kazandınız!`;
                break;
            case 'free_coffee':
                body = 'Tebrikler! Bedava kahve kazandınız!';
                break;
            case 'discount':
                body = `Tebrikler! %${rewardValue} indirim kazandınız!`;
                break;
            case 'badge':
                body = 'Tebrikler! Özel bir rozet kazandınız!';
                break;
            case 'nothing':
                title = '🎡 Çark Çevirdiniz';
                body = 'Maalesef bu sefer kazanamadınız. Haftaya tekrar deneyin!';
                break;
        }
        await this.sendToUser(userId, title, body, { type: 'wheel_reward', rewardType, rewardValue });
    }
    async notifyCampaignAssigned(userId, campaignTitle) {
        await this.sendToUser(userId, '🎁 Yeni Kampanya!', `"${campaignTitle}" kampanyası size tanımlandı.`, { type: 'campaign_assigned' });
    }
    async sendPushNotification(message) {
        try {
            const response = await fetch(this.EXPO_PUSH_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });
            const result = await response.json();
            const ticket = result.data;
            if (ticket.status === 'ok') {
                this.logger.log(`Push notification sent: ${ticket.id}`);
                return true;
            }
            else {
                this.logger.error(`Push notification failed: ${ticket.message}`);
                return false;
            }
        }
        catch (error) {
            this.logger.error('Failed to send push notification:', error);
            return false;
        }
    }
    async sendBatchPushNotifications(messages) {
        try {
            const response = await fetch(this.EXPO_PUSH_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messages),
            });
            const result = await response.json();
            return result.data;
        }
        catch (error) {
            this.logger.error('Failed to send batch push notifications:', error);
            return messages.map(() => ({ status: 'error', message: 'Request failed' }));
        }
    }
    async savePushToken(userId, token) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { expoPushToken: token },
        });
        this.logger.log(`Push token saved for user ${userId}`);
    }
    async removePushToken(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { expoPushToken: null },
        });
        this.logger.log(`Push token removed for user ${userId}`);
    }
    async createNotification(data) {
        await this.prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                titleTr: data.titleTr,
                message: data.message,
                messageTr: data.messageTr,
                actionUrl: data.actionUrl,
                metadata: data.metadata,
            },
        });
        this.logger.log(`Notification created for user ${data.userId}: ${data.type}`);
    }
    async getUserNotifications(userId, limit = 50) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async getUnreadCount(userId) {
        return this.prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
    }
    async markAsRead(userId, notificationId) {
        await this.prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId,
            },
            data: { isRead: true },
        });
    }
    async markAllAsRead(userId) {
        const result = await this.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: { isRead: true },
        });
        return result.count;
    }
    async notifyUser(userId, type, title, titleTr, message, messageTr, actionUrl, metadata) {
        await this.createNotification({
            userId,
            type,
            title,
            titleTr,
            message,
            messageTr,
            actionUrl,
            metadata,
        });
        await this.sendToUser(userId, titleTr, messageTr, { type, ...metadata });
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        config_1.ConfigService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map