// Router configuration
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout';
import {
    LoginPage,
    OverviewPage,
    WalletPage,
    UsersPage,
    CampaignsPage,
    RafflesPage,
    ReportsPage,
} from './pages';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const token = localStorage.getItem('accessToken');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

// Public route wrapper (redirects to dashboard if logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
    const token = localStorage.getItem('accessToken');

    if (token) {
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
