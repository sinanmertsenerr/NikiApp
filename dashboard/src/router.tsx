// Router configuration
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout';
import { useAuthStore } from './store';
import {
    LoginPage,
    OverviewPage,
    WalletPage,
    UsersPage,
    CampaignsPage,
    RafflesPage,
    ReportsPage,
} from './pages';

// Protected route wrapper - uses Zustand state for reactivity
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const accessToken = useAuthStore((state) => state.accessToken);

    // Check both Zustand state and localStorage (for initial page load)
    const hasToken = isAuthenticated || !!accessToken || !!localStorage.getItem('accessToken');

    if (!hasToken) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

// Public route wrapper (redirects to dashboard if logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

export const router = createBrowserRouter([
    {
        path: '/login',
        element: (
            <PublicRoute>
                <LoginPage />
            </PublicRoute>
        ),
    },
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <DashboardLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <OverviewPage />,
            },
            {
                path: 'wallet',
                element: <WalletPage />,
            },
            {
                path: 'users',
                element: <UsersPage />,
            },
            {
                path: 'campaigns',
                element: <CampaignsPage />,
            },
            {
                path: 'raffles',
                element: <RafflesPage />,
            },
            {
                path: 'reports',
                element: <ReportsPage />,
            },
        ],
    },
    {
        path: '*',
        element: <Navigate to="/" replace />,
    },
]);

export default router;
