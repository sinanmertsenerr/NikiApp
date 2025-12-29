import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma';

interface ExpoPushMessage {
    to: string;
    title: string;
    body: string;
    data?: Record<string, any>;
    sound?: 'default' | null;
    badge?: number;
}

interface ExpoPushTicket {
    status: 'ok' | 'error';
    id?: string;
    message?: string;
    details?: { error: string };
}

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Send push notification to a single user
     */
    async sendToUser(
        userId: string,
        title: string,
        body: string,
        data?: Record<string, any>,
    ): Promise<boolean> {
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

    /**
     * Send push notification to multiple users
     */
    async sendToUsers(
        userIds: string[],
        title: string,
        body: string,
        data?: Record<string, any>,
    ): Promise<{ sent: number; failed: number }> {
        const users = await this.prisma.user.findMany({
            where: {
                id: { in: userIds },
                expoPushToken: { not: null },
            },
            select: { expoPushToken: true },
        });

        const tokens = users
            .map((u) => u.expoPushToken)
            .filter((token): token is string => !!token);

        if (tokens.length === 0) {
            this.logger.warn('No valid push tokens found');
            return { sent: 0, failed: userIds.length };
        }

        const messages: ExpoPushMessage[] = tokens.map((token) => ({
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

    /**
     * Notification helpers for specific events
     */
    async notifyPointsEarned(userId: string, points: number): Promise<void> {
        await this.sendToUser(
            userId,
            '⭐ Puan Kazandınız!',
            `${points} puan hesabınıza eklendi.`,
            { type: 'points_earned', points },
        );
    }

    async notifyFreeCoffeeEarned(userId: string): Promise<void> {
        await this.sendToUser(
            userId,
            '☕ Bedava Kahve Kazandınız!',
            '10 puana ulaştınız! Bedava kahvenizi almak için QR kodunuzu gösterin.',
            { type: 'free_coffee' },
        );
    }

    async notifyWheelReward(
        userId: string,
        rewardType: string,
        rewardValue: string,
    ): Promise<void> {
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

    async notifyCampaignAssigned(
        userId: string,
        campaignTitle: string,
    ): Promise<void> {
        await this.sendToUser(
            userId,
            '🎁 Yeni Kampanya!',
            `"${campaignTitle}" kampanyası size tanımlandı.`,
            { type: 'campaign_assigned' },
        );
    }

    /**
     * Core push notification sending
     */
    private async sendPushNotification(
        message: ExpoPushMessage,
    ): Promise<boolean> {
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
            const ticket = result.data as ExpoPushTicket;

            if (ticket.status === 'ok') {
                this.logger.log(`Push notification sent: ${ticket.id}`);
                return true;
            } else {
                this.logger.error(`Push notification failed: ${ticket.message}`);
                return false;
            }
        } catch (error) {
            this.logger.error('Failed to send push notification:', error);
            return false;
        }
    }

    private async sendBatchPushNotifications(
        messages: ExpoPushMessage[],
    ): Promise<ExpoPushTicket[]> {
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
            return result.data as ExpoPushTicket[];
        } catch (error) {
            this.logger.error('Failed to send batch push notifications:', error);
            return messages.map(() => ({ status: 'error' as const, message: 'Request failed' }));
        }
    }

    /**
     * Save user's Expo Push Token
     */
    async savePushToken(userId: string, token: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { expoPushToken: token },
        });
        this.logger.log(`Push token saved for user ${userId}`);
    }

    /**
     * Remove user's Expo Push Token (on logout)
     */
    async removePushToken(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { expoPushToken: null },
        });
        this.logger.log(`Push token removed for user ${userId}`);
    }

    // ==================== IN-APP NOTIFICATIONS ====================

    /**
     * Create an in-app notification
     */
    async createNotification(data: {
        userId: string;
        type: 'campaign' | 'reward' | 'badge' | 'order' | 'system' | 'balance';
        title: string;
        titleTr: string;
        message: string;
        messageTr: string;
        actionUrl?: string;
        metadata?: Record<string, any>;
    }): Promise<void> {
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

    /**
     * Get user's notifications
     */
    async getUserNotifications(userId: string, limit = 50): Promise<any[]> {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId: string): Promise<number> {
        return this.prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(userId: string, notificationId: string): Promise<void> {
        await this.prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId, // Ensure user owns this notification
            },
            data: { isRead: true },
        });
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId: string): Promise<number> {
        const result = await this.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: { isRead: true },
        });
        return result.count;
    }

    /**
     * Create notification + send push notification
     */
    async notifyUser(
        userId: string,
        type: 'campaign' | 'reward' | 'badge' | 'order' | 'system' | 'balance',
        title: string,
        titleTr: string,
        message: string,
        messageTr: string,
        actionUrl?: string,
        metadata?: Record<string, any>,
    ): Promise<void> {
        // Create in-app notification
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

        // Send push notification (use Turkish by default for push)
        await this.sendToUser(userId, titleTr, messageTr, { type, ...metadata });
    }
}

