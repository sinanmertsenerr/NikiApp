// Socket Connection State Store
import { create } from 'zustand';

interface SocketStore {
    isConnected: boolean;
    lastEvent: {
        type: string;
        message: string;
        timestamp: Date;
    } | null;
    reconnectTrigger: number;
    setConnected: (connected: boolean) => void;
    setLastEvent: (type: string, message: string) => void;
    clearLastEvent: () => void;
    triggerReconnect: () => void;
}

export const useSocketStore = create<SocketStore>((set) => ({
    isConnected: false,
    lastEvent: null,
    reconnectTrigger: 0,

    setConnected: (connected) => set({ isConnected: connected }),

    setLastEvent: (type, message) =>
        set({
            lastEvent: {
                type,
                message,
                timestamp: new Date(),
            },
        }),

    clearLastEvent: () => set({ lastEvent: null }),

    triggerReconnect: () => set((state) => ({ reconnectTrigger: state.reconnectTrigger + 1 })),
}));

export default useSocketStore;
