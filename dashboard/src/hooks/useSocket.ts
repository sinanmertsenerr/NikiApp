// React Hook for Socket.IO - Enhanced with notifications
import { useEffect, useCallback, useRef } from 'react';
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
    const setConnected = useSocketStore((state) => state.setConnected);
    const setLastEvent = useSocketStore((state) => state.setLastEvent);
    const reconnectTrigger = useSocketStore((state) => state.reconnectTrigger);

    // Connect socket when authenticated
    useEffect(() => {
        const token = accessToken || localStorage.getItem('accessToken');

        if (isAuthenticated && token) {
            const socket = connectSocket(token);

            // Sync state immediately if already connected (e.g., after page navigation)
            if (socket.connected) {
                setConnected(true);
            }

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
                useAuthStore.getState().logout(); // Call via getter, not hook
            });

            // Handle auth errors - try refresh first, then logout
            socket.on('auth_error', async (data) => {
                console.warn('[useSocket] Auth error received:', data.message);
                setLastEvent('auth_error', data.message);

                // Try to refresh token before logging out
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    try {
                        console.log('[useSocket] Attempting token refresh...');
                        const { authApi } = await import('../api/auth');
                        const tokens = await authApi.refreshToken(refreshToken);

                        // Save new tokens
                        localStorage.setItem('accessToken', tokens.accessToken);
                        localStorage.setItem('refreshToken', tokens.refreshToken);
                        useAuthStore.getState().setTokens(tokens.accessToken, tokens.refreshToken);

                        console.log('[useSocket] Token refreshed, reconnecting...');

                        // Disconnect and reconnect with new token
                        disconnectSocket();
                        setConnected(false);

                        // Wait a bit then reconnect
                        setTimeout(() => {
                            connectSocket(tokens.accessToken);
                        }, 500);
                        return;
                    } catch (refreshError: any) {
                        console.error('[useSocket] Token refresh failed:', refreshError);
                        // 401 from refresh means both tokens are invalid
                    }
                }

                // If refresh failed or no refresh token, logout
                console.log('[useSocket] Logging out due to auth failure');
                setConnected(false);
                disconnectSocket();
                useAuthStore.getState().logout();
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

            // Cleanup function - only remove listeners, DON'T disconnect socket
            // Socket should stay alive during page navigation
            return () => {
                socket.off('connect');
                socket.off('disconnect');
                socket.off('connected');
                socket.off('force_disconnect');
                socket.off('auth_error');
                socket.off('user_updated');
                socket.off('campaign_updated');
                socket.off('menu_updated');
                // Don't call disconnectSocket() here - socket should persist across pages
            };
        } else if (!isAuthenticated) {
            // Only disconnect when user logs out
            disconnectSocket();
            setConnected(false);
        }
    }, [isAuthenticated, accessToken, queryClient, setConnected, setLastEvent, reconnectTrigger]);

    // Auto-reconnect logic: visibility change, focus, and periodic check
    const triggerReconnect = useSocketStore((state) => state.triggerReconnect);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        const checkAndReconnect = () => {
            const socket = getSocket();
            if (!socket?.connected) {
                console.log('[Socket] Auto-reconnect triggered');
                triggerReconnect();
            }
        };

        // Visibility change - when tab becomes active
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkAndReconnect();
            }
        };

        // Window focus
        const handleFocus = () => {
            checkAndReconnect();
        };

        // Periodic check every 5 seconds when disconnected
        const startPeriodicCheck = () => {
            if (intervalRef.current) return;
            intervalRef.current = setInterval(() => {
                const socket = getSocket();
                if (!socket?.connected) {
                    console.log('[Socket] Periodic reconnect check');
                    triggerReconnect();
                }
            }, 5000);
        };

        const stopPeriodicCheck = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        // Start periodic check
        startPeriodicCheck();

        // Add event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            stopPeriodicCheck();
        };
    }, [isAuthenticated, triggerReconnect]);

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

