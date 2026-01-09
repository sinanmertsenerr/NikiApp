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
    LuMenu,
    LuX,
} from 'react-icons/lu';
import { useColorMode } from '../ui/ColorModeProvider';

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
    const { colorMode } = useColorMode();
    const [isOpen, setIsOpen] = useState(false);

    const isDark = colorMode === 'dark';

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
                bg={isDark ? '#2D2D2D' : 'white'}
                shadow="md"
                align="center"
                justify="center"
                cursor="pointer"
                onClick={toggleSidebar}
            >
                <Icon as={isOpen ? LuX : LuMenu} boxSize={5} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
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
                bg={isDark ? '#1E1E1E' : '#F5F5F5'}
                position="fixed"
                left={{ base: isOpen ? 0 : '-280px', lg: 0 }}
                top={0}
                py={6}
                display="flex"
                flexDirection="column"
                zIndex={1000}
                transition="left 0.3s ease, background 0.2s"
            >
                {/* Logo */}
                <Flex align="center" px={6} mb={8}>
                    <img
                        src="/images/brands/niki-logo.png"
                        alt="NikiTheCat"
                        style={{
                            height: '36px',
                            marginRight: '10px',
                            filter: isDark ? 'invert(1)' : 'none'
                        }}
                    />
                    <Box>
                        <Text fontWeight="bold" fontSize="md" color={isDark ? '#FFFFFF' : '#1A1A1A'}>
                            NikiTheCat
                        </Text>
                        <Text fontSize="xs" color={isDark ? '#B0B0B0' : '#666666'}>
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
                                        color={isActive ? (isDark ? '#FFFFFF' : '#1A1A1A') : (isDark ? '#B0B0B0' : '#666666')}
                                        bg={isActive ? (isDark ? '#2D2D2D' : '#FFFFFF') : 'transparent'}
                                        shadow={isActive ? 'sm' : 'none'}
                                        _hover={{ bg: isDark ? '#2D2D2D' : '#FFFFFF', color: isDark ? '#FFFFFF' : '#1A1A1A' }}
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
            </Box>
        </>
    );
}

export default Sidebar;

