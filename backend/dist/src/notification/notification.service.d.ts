import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma';
export declare class NotificationService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    private readonly EXPO_PUSH_URL;
    constructor(prisma: PrismaService, configService: ConfigService);
    sendToUser(userId: string, title: string, body: string, data?: Record<string, any>): Promise<boolean>;
    sendToUsers(userIds: string[], title: string, body: string, data?: Record<string, any>): Promise<{
        sent: number;
        failed: number;
    }>;
    notifyPointsEarned(userId: string, points: number): Promise<void>;
    notifyFreeCoffeeEarned(userId: string): Promise<void>;
    notifyWheelReward(userId: string, rewardType: string, rewardValue: string): Promise<void>;
    notifyCampaignAssigned(userId: string, campaignTitle: string): Promise<void>;
    private sendPushNotification;
    private sendBatchPushNotifications;
    savePushToken(userId: string, token: string): Promise<void>;
    removePushToken(userId: string): Promise<void>;
    createNotification(data: {
        userId: string;
        type: 'campaign' | 'reward' | 'badge' | 'order' | 'system' | 'balance';
        title: string;
        titleTr: string;
        message: string;
        messageTr: string;
        actionUrl?: string;
        metadata?: Record<string, any>;
    }): Promise<void>;
    getUserNotifications(userId: string, limit?: number): Promise<any[]>;
    getUnreadCount(userId: string): Promise<number>;
    markAsRead(userId: string, notificationId: string): Promise<void>;
    markAllAsRead(userId: string): Promise<number>;
    notifyUser(userId: string, type: 'campaign' | 'reward' | 'badge' | 'order' | 'system' | 'balance', title: string, titleTr: string, message: string, messageTr: string, actionUrl?: string, metadata?: Record<string, any>): Promise<void>;
}
