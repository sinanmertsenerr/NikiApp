// Socket.IO Client Singleton for Dashboard
import { io, Socket } from 'socket.io-client';

// Get the base URL without /api/v1 for socket connection
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;
let healthCheckInterval: ReturnType<typeof setInterval> | null = null;
let visibilityHandler: (() => void) | null = null;

// Event types from backend
export interface SocketEvents {
    // Connection events
    connected: { success: boolean; userId: string; message: string };
    auth_error: { message: string; code?: string };
    force_disconnect: { message: string; code: string };

    // Admin events (for dashboard)
    user_updated: {
        userId: string;
        updateType: 'balance' | 'campaign' | 'status' | 'wallet_status';
        newValue?: any;
    };

    // Broadcast events
    campaign_updated: {
        campaignId: string;
        updateType: 'created' | 'updated' | 'deleted' | 'assigned';
        assignedCount?: number;
    };
    menu_updated: {
        type: 'category' | 'product';
        action: 'created' | 'updated' | 'deleted' | 'reordered';
        itemId: string;
        categoryId?: string;
        brand?: string;
    };
}

// Store current token for reconnection
let currentToken: string | null = null;

export function connectSocket(token: string): Socket {
    // Store token for reconnection
    currentToken = token;

    // If already connected with same token, return existing socket
    if (socket?.connected) {
        console.log('[Socket] Already connected, reusing existing socket');
        return socket;
    }

    // If socket exists but disconnected, try to reconnect
    if (socket && !socket.connected) {
        console.log('[Socket] Socket exists but disconnected, reconnecting...');
        socket.connect();
        return socket;
    }

    // Create new socket connection with auth token
    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity, // Never give up
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000, // Max 5 seconds between attempts
    });

    // Connection event handlers
    socket.on('connect', () => {
        console.log('[Socket] Connected to server');
    });

    socket.on('connected', (data: SocketEvents['connected']) => {
        console.log('[Socket] Authenticated:', data.message);
    });

    socket.on('auth_error', (data: SocketEvents['auth_error']) => {
        console.error('[Socket] Auth error:', data.message);
        disconnectSocket();
    });

    socket.on('force_disconnect', (data: SocketEvents['force_disconnect']) => {
        console.warn('[Socket] Force disconnected:', data.message);
        disconnectSocket();
    });

    socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error.message);
    });

    // Start health check and visibility listener
    startHealthCheck();
    startVisibilityListener();

    return socket;
}

export function disconnectSocket(): void {
    stopHealthCheck();
    stopVisibilityListener();
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('[Socket] Disconnected and cleaned up');
    }
}

export function getSocket(): Socket | null {
    return socket;
}

export function isSocketConnected(): boolean {
    return socket?.connected ?? false;
}

// Re-authenticate with new token (after token refresh)
export function updateSocketAuth(newToken: string): void {
    currentToken = newToken;
    if (socket) {
        socket.auth = { token: newToken };
        socket.disconnect().connect();
        console.log('[Socket] Re-authenticating with new token');
    }
}

/**
 * Start periodic health check - reconnect if disconnected
 */
function startHealthCheck(): void {
    stopHealthCheck();

    // Check every 30 seconds
    healthCheckInterval = setInterval(() => {
        if (!socket?.connected && currentToken) {
            console.log('[Socket] Health check: disconnected, reconnecting...');
            connectSocket(currentToken);
        }
    }, 30000);
}

function stopHealthCheck(): void {
    if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
    }
}

/**
 * Listen for page visibility changes - reconnect when tab becomes visible
 */
function startVisibilityListener(): void {
    stopVisibilityListener();

    visibilityHandler = () => {
        if (document.visibilityState === 'visible' && currentToken) {
            console.log('[Socket] Tab became visible, checking connection...');
            if (!socket?.connected) {
                console.log('[Socket] Reconnecting after tab focus...');
                connectSocket(currentToken);
            }
        }
    };

    document.addEventListener('visibilitychange', visibilityHandler);
}

function stopVisibilityListener(): void {
    if (visibilityHandler) {
        document.removeEventListener('visibilitychange', visibilityHandler);
        visibilityHandler = null;
    }
}

export default {
    connect: connectSocket,
    disconnect: disconnectSocket,
    getSocket,
    isConnected: isSocketConnected,
    updateAuth: updateSocketAuth,
};
