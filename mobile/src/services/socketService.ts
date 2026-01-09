import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { AppState, AppStateStatus } from 'react-native';
import { API_BASE_URL, STORAGE_KEYS } from '@/constants/api';
import { queryClient } from '@/services/queryClient';
import api from '@/services/api';

// Socket events types
export interface BalanceUpdateEvent {
    newBalance: string;
    transactionType: 'topup' | 'payment' | 'refund';
    amount: string;
    description?: string;
    originalAmount?: string;
    discountAmount?: string;
    discountPercentage?: number;
}

export interface CampaignAssignedEvent {
    campaignId: string;
    campaignTitle: string;
    campaignTitleTr: string;
}

export interface UserUpdatedEvent {
    userId: string;
    updateType: 'balance' | 'campaign' | 'status' | 'wallet_status';
    newValue?: any;
}

export interface WalletStatusUpdatedEvent {
    walletType: 'IEU' | 'NIKI';
    isActive: boolean;
}



export interface CampaignUpdatedEvent {
    campaignId: string;
    updateType: 'created' | 'updated' | 'deleted' | 'assigned';
    assignedCount?: number;
}

export interface MenuUpdatedEvent {
    type: 'category' | 'product';
    action: 'created' | 'updated' | 'deleted';
    itemId: string;
    categoryId?: string;
    brand?: string;
}

export interface WheelResultEvent {
    rewardType: string;
    rewardValue: string;
    message: string;
    messageTr: string;
    nextSpinAvailable: string;
}

export interface ProfileUpdatedEvent {
    updateType: 'profile' | 'avatar' | 'settings';
    newValue?: any;
}

export interface BadgeEarnedEvent {
    badgeId: string;
    badgeName: string;
    badgeNameTr: string;
    iconUrl?: string;
}

export interface StatsUpdatedEvent {
    type: 'points' | 'badge' | 'campaign';
    change: number;
    newTotal?: number;
}

class SocketService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = Infinity; // Never give up on reconnecting
    private isRefreshing = false;
    private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
    private appStateSubscription: any = null;

    // External callback listeners for balance updates
    private balanceUpdateListeners: Set<(data: BalanceUpdateEvent) => void> = new Set();

    // Single callback for auth failure (401 during token refresh)
    private authFailureCallback: (() => void) | null = null;

    // External callback listeners for wallet status updates


    /**
     * Register a callback for balance_updated events
     * Use this to show notifications when QR modal is open
     */
    onBalanceUpdate(callback: (data: BalanceUpdateEvent) => void): void {
        this.balanceUpdateListeners.add(callback);
    }

    /**
     * Unregister a balance_updated callback
     */
    offBalanceUpdate(callback: (data: BalanceUpdateEvent) => void): void {
        this.balanceUpdateListeners.delete(callback);
    }

    /**
     * Notify all registered listeners of a balance update
     */
    private notifyBalanceListeners(data: BalanceUpdateEvent): void {
        this.balanceUpdateListeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('[Socket] Error in balance update listener:', error);
            }
        });
    }

    /**
     * Set the callback for auth failure events (401 during token refresh)
     * Use this to trigger automatic logout
     * Note: This replaces any previously set callback
     */
    onAuthFailure(callback: () => void): void {
        this.authFailureCallback = callback;
    }

    /**
     * Clear the auth failure callback
     */
    offAuthFailure(): void {
        this.authFailureCallback = null;
    }

    /**
     * Trigger the auth failure callback if set
     */
    private notifyAuthFailureListeners(): void {
        if (this.authFailureCallback) {
            try {
                this.authFailureCallback();
            } catch (error) {
                console.error('[Socket] Error in auth failure callback:', error);
            }
        }
    }


    // Extract base URL without /api/v1 for socket connection
    private getSocketUrl(): string {
        // API_BASE_URL is like http://192.168.1.x:3000/api/v1
        // Socket connects to http://192.168.1.x:3000
        const url = API_BASE_URL.replace('/api/v1', '');
        return url;
    }

    public get getSocket(): Socket | null {
        return this.socket;
    }

    async connect(): Promise<void> {
        if (this.socket?.connected) {
            console.log('[Socket] Already connected');
            return;
        }

        try {
            const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);

            if (!token) {
                console.log('[Socket] No token available, skipping connection');
                return;
            }

            const socketUrl = this.getSocketUrl();
            console.log('[Socket] Connecting to:', socketUrl);

            this.socket = io(socketUrl, {
                auth: { token },
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
            });

            this.setupListeners();
            this.startHealthCheck();
            this.startAppStateListener();
        } catch (error) {
            console.error('[Socket] Connection error:', error);
        }
    }

    /**
     * Start periodic health check - reconnect if disconnected
     */
    private startHealthCheck(): void {
        // Clear existing interval
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        // Check connection every 30 seconds
        this.healthCheckInterval = setInterval(async () => {
            if (!this.socket?.connected) {
                console.log('[Socket] Health check: disconnected, attempting reconnect...');
                await this.connect();
            }
        }, 30000);
    }

    /**
     * Stop health check interval
     */
    private stopHealthCheck(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    /**
     * Listen for app state changes - reconnect when app comes to foreground
     */
    private startAppStateListener(): void {
        // Remove existing subscription
        if (this.appStateSubscription) {
            this.appStateSubscription.remove();
        }

        this.appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                // App came to foreground
                console.log('[Socket] App came to foreground, checking connection...');
                if (!this.socket?.connected) {
                    console.log('[Socket] Reconnecting after foreground...');
                    await this.connect();
                }
            }
        });
    }

    /**
     * Stop app state listener
     */
    private stopAppStateListener(): void {
        if (this.appStateSubscription) {
            this.appStateSubscription.remove();
            this.appStateSubscription = null;
        }
    }

    private setupListeners(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('[Socket] Connected successfully');
            this.reconnectAttempts = 0;
        });

        this.socket.on('connected', (data) => {
            console.log('[Socket] Authentication confirmed:', data);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
        });

        this.socket.on('auth_error', async (error) => {
            console.warn('[Socket] Auth error, attempting token refresh:', error);

            // Prevent multiple refresh attempts
            if (this.isRefreshing) {
                return;
            }

            this.isRefreshing = true;

            try {
                // Try to refresh token
                const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

                if (refreshToken) {
                    const response = await api.post('/auth/refresh', { refreshToken });

                    if (response.data?.accessToken) {
                        // Save new tokens
                        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
                        if (response.data.refreshToken) {
                            await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);
                        }

                        console.log('[Socket] Token refreshed, reconnecting...');

                        // Disconnect and reconnect with new token
                        this.socket?.disconnect();
                        this.socket = null;
                        this.isRefreshing = false;

                        // Wait a bit then reconnect
                        setTimeout(() => {
                            this.connect();
                        }, 500);
                        return;
                    }
                }
            } catch (refreshError: any) {
                console.error('[Socket] Token refresh failed:', refreshError);

                // Check if it's a 401 error - trigger auto logout
                if (refreshError?.response?.status === 401 || refreshError?.status === 401) {
                    console.log('[Socket] Token refresh returned 401 - triggering auth failure');
                    this.notifyAuthFailureListeners();
                }
            }

            this.isRefreshing = false;
            this.disconnect();
        });

        this.socket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error.message);
            this.reconnectAttempts++;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.log('[Socket] Max reconnect attempts reached');
                this.disconnect();
            }
        });

        // ==================== BUSINESS EVENTS ====================

        // Balance updated - invalidate and refetch wallet queries
        this.socket.on('balance_updated', (data: BalanceUpdateEvent) => {
            console.log('[Socket] Balance updated:', data);

            // Invalidate with refetchType: 'all' to ensure immediate update
            queryClient.invalidateQueries({ queryKey: ['wallet'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['userStats'], refetchType: 'all' });

            // Notify registered listeners (e.g., wallet screen for QR modal)
            this.notifyBalanceListeners(data);
        });

        // Campaign assigned - invalidate and refetch campaign queries
        this.socket.on('campaign_assigned', (data: CampaignAssignedEvent) => {
            console.log('[Socket] Campaign assigned:', data);

            // Invalidate with refetchType: 'all' to ensure immediate update
            queryClient.invalidateQueries({ queryKey: ['my-campaigns'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['activeCampaigns'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['notifications'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['notification-count'], refetchType: 'all' });
        });

        // Admin events - user updated
        this.socket.on('user_updated', (data: UserUpdatedEvent) => {
            console.log('[Socket] User updated:', data);

            // Invalidate with refetchType: 'all' to ensure immediate update
            queryClient.invalidateQueries({ queryKey: ['admin-users'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['adminUser', data.userId], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['dashboard-overview'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['currentUser'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['userStats'], refetchType: 'all' });


        });

        // Wallet status updated - IEU wallet activated/deactivated
        this.socket.on('wallet_status_updated', (data: WalletStatusUpdatedEvent) => {
            console.log('[Socket] Wallet status updated:', data);
            queryClient.invalidateQueries({ queryKey: ['wallet'], refetchType: 'all' });
        });

        // Admin events - campaign updated (create, update, delete)
        this.socket.on('campaign_updated', (data: CampaignUpdatedEvent) => {
            console.log('[Socket] Campaign updated:', data);

            // Standard invalidation for all events
            queryClient.invalidateQueries({ queryKey: ['admin-campaigns'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['dashboard-overview'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['activeCampaigns'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['my-campaigns'], refetchType: 'all' });

            if (data.updateType === 'deleted') {
                console.log('[Socket] Campaign deleted, cache invalidated.');
            }
        });

        // Menu updated - invalidate and refetch menu queries
        this.socket.on('menu_updated', (data: MenuUpdatedEvent) => {
            console.log('[Socket] Menu updated:', data);

            // Invalidate menu queries with refetchType: 'all'
            queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['products'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['menu'], refetchType: 'all' });

            // If specific category updated
            if (data.categoryId) {
                queryClient.invalidateQueries({ queryKey: ['category', data.categoryId], refetchType: 'all' });
                queryClient.invalidateQueries({ queryKey: ['categoryProducts', data.categoryId], refetchType: 'all' });
            }

            // Admin menu queries
            queryClient.invalidateQueries({ queryKey: ['admin-categories'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['admin-products'], refetchType: 'all' });
        });

        // Wheel result - invalidate wheel status
        this.socket.on('wheel_result', (data: WheelResultEvent) => {
            console.log('[Socket] Wheel result:', data);

            // Invalidate wheel queries
            queryClient.invalidateQueries({ queryKey: ['wheel-status'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['wheel-history'], refetchType: 'all' });

            // If points won
            if (data.rewardType === 'points') {
                queryClient.invalidateQueries({ queryKey: ['userStats'], refetchType: 'all' });
            }

            // If campaign won
            if (data.rewardType === 'free_coffee' || data.rewardType === 'discount') {
                queryClient.invalidateQueries({ queryKey: ['my-campaigns'], refetchType: 'all' });
                queryClient.invalidateQueries({ queryKey: ['activeCampaigns'], refetchType: 'all' });
            }
        });

        // Profile updated - invalidate user queries
        this.socket.on('profile_updated', (data: ProfileUpdatedEvent) => {
            console.log('[Socket] Profile updated:', data);

            // Invalidate user/profile queries
            queryClient.invalidateQueries({ queryKey: ['currentUser'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['profile'], refetchType: 'all' });

            if (data.updateType === 'settings') {
                queryClient.invalidateQueries({ queryKey: ['settings'], refetchType: 'all' });

                // Check for account deactivation
                if (data.newValue?.isActive === false) {
                    console.log('[Socket] Account deactivated! Logging out...');
                    import('@/stores/authStore').then(({ useAuthStore }) => {
                        useAuthStore.getState().logout();
                        const { router } = require('expo-router');
                        router.replace('/(auth)/login');
                    });
                }
            }
        });

        // Badge earned - invalidate badge queries
        this.socket.on('badge_earned', (data: BadgeEarnedEvent) => {
            console.log('[Socket] Badge earned:', data);

            // Invalidate badge queries
            queryClient.invalidateQueries({ queryKey: ['badges'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['userStats'], refetchType: 'all' });
        });

        // Stats updated - invalidate stats queries
        this.socket.on('stats_updated', (data: StatsUpdatedEvent) => {
            console.log('[Socket] Stats updated:', data);

            // Invalidate stats queries
            queryClient.invalidateQueries({ queryKey: ['userStats'], refetchType: 'all' });

            if (data.type === 'points') {
                queryClient.invalidateQueries({ queryKey: ['wallet'], refetchType: 'all' });
            }

            if (data.type === 'badge') {
                queryClient.invalidateQueries({ queryKey: ['badges'], refetchType: 'all' });
            }

            if (data.type === 'campaign') {
                queryClient.invalidateQueries({ queryKey: ['my-campaigns'], refetchType: 'all' });
                queryClient.invalidateQueries({ queryKey: ['activeCampaigns'], refetchType: 'all' });
            }
        });
    }

    disconnect(): void {
        if (this.socket) {
            console.log('[Socket] Disconnecting...');
            this.socket.disconnect();
            this.socket = null;
            this.reconnectAttempts = 0;
        }
        this.stopHealthCheck();
        this.stopAppStateListener();
    }

    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    // Manually authenticate (useful after login)
    async authenticate(): Promise<void> {
        if (!this.socket) {
            await this.connect();
            return;
        }

        const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        if (token) {
            this.socket.emit('authenticate', { token });
        }
    }
}

export const socketService = new SocketService();
