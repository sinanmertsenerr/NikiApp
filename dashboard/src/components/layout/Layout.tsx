'use client';

import { Box, Flex } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export function DashboardLayout() {
    return (
        <Flex minH="100vh" bg="#F5F5F5">
            {/* Sidebar */}
            <Sidebar />

            {/* Main content - responsive margin */}
            <Box
                flex={1}
                ml={{ base: 0, lg: '260px' }}
                bg="#F5F5F5"
                minH="100vh"
                transition="margin-left 0.3s ease"
            >
                <Outlet />
            </Box>
        </Flex>
    );
}

export default DashboardLayout;
