// React Hook for Socket.IO - Enhanced with notifications
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store';
import { useSocketStore } from '../store/socketStore';
import { connectSocket, disconnectSocket, getSocket, type SocketEvents } from '../socket';

// Event message mapping for Turkish
const eventMessages: Record<string, (data: any) => string> = {
    user_updated: (data) => {
        const types: Record<string, string> = {
            balance: 'Bakiye güncellendi',
            campaign: 'Kampanya atandı',
            status: 'Durum değişti',
            wallet_status: 'Cüzdan durumu değişti',
        };
        return types[data.updateType] || 'Kullanıcı güncellendi';
    },
    campaign_updated: (data) => {
        const types: Record<string, string> = {
            created: 'Yeni kampanya oluşturuldu',
            updated: 'Kampanya güncellendi',
            deleted: 'Kampanya silindi',
            assigned: 'Kampanya atandı',
        };
        return types[data.updateType] || 'Kampanya güncellendi';
    },
    menu_updated: () => 'Menü güncellendi',
};

export function useSocket() {
    const queryClient = useQueryClient();
    const accessToken = useAuthStore((state) => state.accessToken);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const logout = useAuthStore((state) => state.logout);
    const { setConnected, setLastEvent } = useSocketStore();

    // Connect socket when authenticated
    useEffect(() => {
        const token = accessToken || localStorage.getItem('accessToken');

        if (isAuthenticated && token) {
            const socket = connectSocket(token);

            // Connection state tracking
            socket.on('connect', () => {
                setConnected(true);
                console.log('[Socket] Connected to server');
            });

            socket.on('disconnect', () => {
                setConnected(false);
                console.log('[Socket] Disconnected from server');
            });

            socket.on('connected', (data) => {
                console.log('[Socket] Authenticated:', data.message);
            });

            // Handle force disconnect (logout from all devices)
            socket.on('force_disconnect', () => {
                setLastEvent('force_disconnect', 'Tüm cihazlardan çıkış yapıldı');
                logout();
            });

            // Handle auth errors
            socket.on('auth_error', (data) => {
                setLastEvent('auth_error', data.message);
                console.warn('[useSocket] Auth error received:', data.message);
            });

            // Admin events - invalidate queries for real-time updates
            socket.on('user_updated', (data: SocketEvents['user_updated']) => {
                console.log('[Socket] User updated:', data);
                setLastEvent('user_updated', eventMessages.user_updated(data));

                // Invalidate all user-related queries
                queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
                queryClient.invalidateQueries({ queryKey: ['users'] });
                queryClient.invalidateQueries({ queryKey: ['user'] }); // Single user

                if (data.updateType === 'balance' || data.updateType === 'wallet_status') {
                    queryClient.invalidateQueries({ queryKey: ['wallet-stats'] });
                    queryClient.invalidateQueries({ queryKey: ['transactions'] });
                }
            });

            socket.on('campaign_updated', (data: SocketEvents['campaign_updated']) => {
                console.log('[Socket] Campaign updated:', data);
                setLastEvent('campaign_updated', eventMessages.campaign_updated(data));

                // Invalidate campaign-related queries
                queryClient.invalidateQueries({ queryKey: ['campaigns'] });
                queryClient.invalidateQueries({ queryKey: ['campaign'] }); // Single campaign
                queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
                queryClient.invalidateQueries({ queryKey: ['raffles'] });
            });

            socket.on('menu_updated', (data: SocketEvents['menu_updated']) => {
                console.log('[Socket] Menu updated:', data);
                setLastEvent('menu_updated', eventMessages.menu_updated(data));

                // Invalidate menu queries
                queryClient.invalidateQueries({ queryKey: ['menu'] });
                queryClient.invalidateQueries({ queryKey: ['categories'] });
                queryClient.invalidateQueries({ queryKey: ['products'] });
            });

            return () => {
                disconnectSocket();
                setConnected(false);
            };
        }
    }, [isAuthenticated, accessToken, queryClient, logout, setConnected, setLastEvent]);

    // Helper to emit events
    const emit = useCallback((event: string, data?: any) => {
        const socket = getSocket();
        if (socket?.connected) {
            socket.emit(event, data);
        }
    }, []);

    // Manual refresh all queries
    const refreshAll = useCallback(() => {
        queryClient.invalidateQueries();
    }, [queryClient]);

    return {
        emit,
        getSocket,
        refreshAll,
        isConnected: () => getSocket()?.connected ?? false,
    };
}

export default useSocket;

