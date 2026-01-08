'use client';

import { useState } from 'react';
import { Box, Flex, Text, VStack, Icon } from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import {
    LuLayoutDashboard,
    LuWallet,
    LuUsers,
    LuGift,
    LuDices,
    LuFileText,
    LuLogOut,
    LuMenu,
    LuX,
} from 'react-icons/lu';
import { useAuthStore } from '../../store';
import { authApi } from '../../api';

interface NavItem {
    label: string;
    icon: typeof LuLayoutDashboard;
    path: string;
}

const navItems: NavItem[] = [
    { label: 'Genel Bakış', icon: LuLayoutDashboard, path: '/' },
    { label: 'Cüzdan', icon: LuWallet, path: '/wallet' },
    { label: 'Kullanıcılar', icon: LuUsers, path: '/users' },
    { label: 'Kampanyalar', icon: LuGift, path: '/campaigns' },
    { label: 'Çekiliş & Çark', icon: LuDices, path: '/raffles' },
    { label: 'Raporlar', icon: LuFileText, path: '/reports' },
];

export function Sidebar() {
    const location = useLocation();
    const logout = useAuthStore((state) => state.logout);
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        await authApi.logout();
        logout();
    };

    const toggleSidebar = () => setIsOpen(!isOpen);
    const closeSidebar = () => setIsOpen(false);

    return (
        <>
            {/* Mobile Menu Button */}
            <Flex
                display={{ base: 'flex', lg: 'none' }}
                position="fixed"
                top={4}
                left={4}
                zIndex={1001}
                w={10}
                h={10}
                borderRadius="lg"
                bg="white"
                shadow="md"
                align="center"
                justify="center"
                cursor="pointer"
                onClick={toggleSidebar}
            >
                <Icon as={isOpen ? LuX : LuMenu} boxSize={5} color="#1A1A1A" />
            </Flex>

            {/* Mobile Overlay */}
            {isOpen && (
                <Box
                    display={{ base: 'block', lg: 'none' }}
                    position="fixed"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bg="rgba(0,0,0,0.5)"
                    zIndex={999}
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <Box
                as="aside"
                w={{ base: '280px', lg: '260px' }}
                minH="100vh"
                bg="#F5F5F5"
                position="fixed"
                left={{ base: isOpen ? 0 : '-280px', lg: 0 }}
                top={0}
                py={6}
                display="flex"
                flexDirection="column"
                zIndex={1000}
                transition="left 0.3s ease"
            >
                {/* Logo */}
                <Flex align="center" px={6} mb={8}>
                    <img
                        src="/images/brands/niki-logo.png"
                        alt="NikiTheCat"
                        style={{ height: '36px', marginRight: '10px' }}
                    />
                    <Box>
                        <Text fontWeight="bold" fontSize="md" color="#1A1A1A">
                            NikiTheCat
                        </Text>
                        <Text fontSize="xs" color="#666666">
                            Analytics Portal
                        </Text>
                    </Box>
                </Flex>

                {/* Navigation */}
                <VStack align="stretch" flex={1} px={3} gap={1}>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Box key={item.path}>
                                <Link to={item.path} style={{ textDecoration: 'none' }} onClick={closeSidebar}>
                                    <Flex
                                        align="center"
                                        px={4}
                                        py={3}
                                        borderRadius="lg"
                                        fontWeight={isActive ? '600' : '400'}
                                        color={isActive ? '#1A1A1A' : '#666666'}
                                        bg={isActive ? '#FFFFFF' : 'transparent'}
                                        shadow={isActive ? 'sm' : 'none'}
                                        _hover={{ bg: '#FFFFFF', color: '#1A1A1A' }}
                                        transition="all 0.2s"
                                    >
                                        <Icon as={item.icon} boxSize={5} mr={3} />
                                        <Text fontSize="sm">{item.label}</Text>
                                    </Flex>
                                </Link>
                            </Box>
                        );
                    })}
                </VStack>

                {/* Logout */}
                <Box px={3} mt="auto">
                    <Flex
                        align="center"
                        px={4}
                        py={3}
                        borderRadius="lg"
                        color="#F44336"
                        cursor="pointer"
                        _hover={{ bg: '#FFEBEE' }}
                        transition="all 0.2s"
                        onClick={handleLogout}
                    >
                        <Icon as={LuLogOut} boxSize={5} mr={3} />
                        <Text fontSize="sm" fontWeight="500">Çıkış Yap</Text>
                    </Flex>
                </Box>
            </Box>
        </>
    );
}

export default Sidebar;
