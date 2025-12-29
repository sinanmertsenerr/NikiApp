import { NotificationService } from './notification.service';
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    getNotifications(userId: string): Promise<{
        success: boolean;
        data: {
            notifications: any[];
        };
    }>;
    getUnreadCount(userId: string): Promise<{
        success: boolean;
        data: {
            count: number;
        };
    }>;
    markAsRead(userId: string, notificationId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    markAllAsRead(userId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            markedCount: number;
        };
    }>;
}
