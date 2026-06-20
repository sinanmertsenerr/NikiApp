import { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

// Global query client instance
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
            // Web has no pull-to-refresh gesture, so refresh data when the user
            // returns to the tab. Native keeps the previous behavior (manual
            // RefreshControl pull-to-refresh).
            refetchOnWindowFocus: Platform.OS === 'web',
            refetchOnReconnect: Platform.OS === 'web',
        },
        mutations: {
            retry: 1,
        },
    },
});
