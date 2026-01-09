// Socket.IO Client Singleton for Dashboard
import { io, Socket } from 'socket.io-client';

// Get the base URL without /api/v1 for socket connection
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;

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

export function connectSocket(token: string): Socket {
    // If already connected, disconnect first
    if (socket?.connected) {
        socket.disconnect();
    }

    // Create new socket connection with auth token
    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
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

    return socket;
}

export function disconnectSocket(): void {
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
    if (socket) {
        socket.auth = { token: newToken };
        socket.disconnect().connect();
        console.log('[Socket] Re-authenticating with new token');
    }
}

export default {
    connect: connectSocket,
    disconnect: disconnectSocket,
    getSocket,
    isConnected: isSocketConnected,
    updateAuth: updateSocketAuth,
};
