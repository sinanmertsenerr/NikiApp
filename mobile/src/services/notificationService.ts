import api from './api';
import { API_ENDPOINTS } from '../constants/api';

export interface Notification {
    id: string;
    type: 'campaign' | 'reward' | 'badge' | 'order' | 'system' | 'balance';
    title: string;
    titleTr: string;
    message: string;
    messageTr: string;
    isRead: boolean;
    actionUrl?: string;
    metadata?: Record<string, any>;
    createdAt: string;
}

export const notificationService = {
    /**
     * Get all notifications for current user
     */
    async getNotifications(): Promise<Notification[]> {
        const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.BASE);
        return response.data.data.notifications;
    },

    /**
     * Get unread notification count
     */
    async getUnreadCount(): Promise<number> {
        const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
        return response.data.data.count;
    },

    /**
     * Mark a single notification as read
     */
    async markAsRead(notificationId: string): Promise<void> {
        await api.patch(`${API_ENDPOINTS.NOTIFICATIONS.MARK_READ}/${notificationId}/read`);
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<number> {
        const response = await api.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
        return response.data.data.markedCount;
    },
};
