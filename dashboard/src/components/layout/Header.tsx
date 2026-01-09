'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Flex, Text, Icon } from '@chakra-ui/react';
import { LuSun, LuMoon, LuCalendar, LuClock, LuLogOut, LuChevronDown } from 'react-icons/lu';
import { useAuthStore } from '../../store';
import { useColorMode } from '../ui/ColorModeProvider';
import { authApi } from '../../api';
import { ConnectionStatus } from '../shared/ConnectionStatus';

export function Header() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const { colorMode, toggleColorMode } = useColorMode();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const isDark = colorMode === 'dark';

    const handleLogout = () => {
        setIsProfileOpen(false);
        authApi.logout().catch(() => { }); // API call (fire and forget)
        logout(); // Clear Zustand state - router will redirect automatically
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            weekday: 'long',
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Flex
            as="header"
            align="center"
            justify="space-between"
            px={6}
            py={4}
            bg={isDark ? '#1E1E1E' : '#F5F5F5'}
            transition="background 0.2s"
        >
            {/* Left side - Connection Status */}
            <Box w="180px">
                <ConnectionStatus showLabel={true} size="sm" />
            </Box>

            {/* Center - Date & Time */}
            <Flex align="center" gap={4}>
                <Flex align="center" gap={2}>
                    <Icon as={LuCalendar} boxSize={4} color={isDark ? '#B0B0B0' : '#666666'} />
                    <Text fontSize="sm" color={isDark ? '#FFFFFF' : '#1A1A1A'} fontWeight="medium">
                        {formatDate(currentTime)}
                    </Text>
                </Flex>
                <Text color={isDark ? '#333333' : '#E0E0E0'}>|</Text>
                <Flex align="center" gap={2}>
                    <Icon as={LuClock} boxSize={4} color={isDark ? '#B0B0B0' : '#666666'} />
                    <Text fontSize="sm" color={isDark ? '#FFFFFF' : '#1A1A1A'} fontWeight="semibold">
                        {formatTime(currentTime)}
                    </Text>
                </Flex>
            </Flex>

            {/* Right side */}
            <Flex align="center" gap={3}>
                {/* Theme Toggle */}
                <Flex
                    w="72px"
                    h={9}
                    align="center"
                    borderRadius="lg"
                    bg={isDark ? '#2D2D2D' : '#E8E8E8'}
                    cursor="pointer"
                    onClick={toggleColorMode}
                    p="4px"
                    position="relative"
                    transition="all 0.2s"
                >
                    {/* Sliding indicator */}
                    <Box
                        position="absolute"
                        left={isDark ? 'calc(100% - 32px - 4px)' : '4px'}
                        w="32px"
                        h="28px"
                        borderRadius="md"
                        bg={isDark ? '#3D3D3D' : 'white'}
                        boxShadow="sm"
                        transition="left 0.2s ease-in-out"
                    />
                    {/* Sun icon - Left */}
                    <Flex w="32px" h="28px" align="center" justify="center" zIndex={1}>
                        <Icon
                            as={LuSun}
                            boxSize={4}
                            color={!isDark ? '#FFB300' : '#666666'}
                            transition="color 0.2s"
                        />
                    </Flex>
                    {/* Moon icon - Right */}
                    <Flex w="32px" h="28px" align="center" justify="center" zIndex={1}>
                        <Icon
                            as={LuMoon}
                            boxSize={4}
                            color={isDark ? '#FFB300' : '#999999'}
                            transition="color 0.2s"
                        />
                    </Flex>
                </Flex>

                {/* User Profile with Dropdown */}
                <Box position="relative" ref={profileRef}>
                    <Flex
                        align="center"
                        gap={2}
                        bg={isDark ? '#2D2D2D' : 'white'}
                        px={3}
                        py={2}
                        borderRadius="lg"
                        transition="all 0.2s"
                        cursor="pointer"
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        _hover={{ bg: isDark ? '#3D3D3D' : '#F0F0F0' }}
                    >
                        <Flex
                            w={8}
                            h={8}
                            borderRadius="lg"
                            bg="#1A1A1A"
                            color="white"
                            align="center"
                            justify="center"
                            fontWeight="semibold"
                            fontSize="xs"
                        >
                            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </Flex>
                        <Box>
                            <Text fontSize="sm" fontWeight="semibold" color={isDark ? '#FFFFFF' : '#1A1A1A'} lineHeight="1.2">
                                {user?.firstName} {user?.lastName}
                            </Text>
                            <Text fontSize="xs" color={isDark ? '#B0B0B0' : '#666666'} lineHeight="1.2">
                                {user?.role === 'super_admin' ? 'Süper Admin' : user?.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                            </Text>
                        </Box>
                        <Icon
                            as={LuChevronDown}
                            boxSize={4}
                            color={isDark ? '#B0B0B0' : '#666666'}
                            transform={isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
                            transition="transform 0.2s"
                        />
                    </Flex>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <Box
                            position="absolute"
                            top="calc(100% + 8px)"
                            right={0}
                            bg={isDark ? '#2D2D2D' : 'white'}
                            borderRadius="lg"
                            boxShadow="lg"
                            border="1px solid"
                            borderColor={isDark ? '#3D3D3D' : '#E0E0E0'}
                            py={2}
                            minW="180px"
                            zIndex={1000}
                        >
                            <Flex
                                align="center"
                                px={4}
                                py={3}
                                gap={3}
                                color="#F44336"
                                cursor="pointer"
                                _hover={{ bg: isDark ? 'rgba(244, 67, 54, 0.1)' : '#FFEBEE' }}
                                transition="all 0.2s"
                                onClick={handleLogout}
                            >
                                <Icon as={LuLogOut} boxSize={5} />
                                <Text fontSize="sm" fontWeight="500">Çıkış Yap</Text>
                            </Flex>
                        </Box>
                    )}
                </Box>
            </Flex>
        </Flex>
    );
}

export default Header;

