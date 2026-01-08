'use client';

import { useState, useEffect } from 'react';
import { Box, Flex, Text, Icon } from '@chakra-ui/react';
import { LuBell, LuCalendar, LuClock } from 'react-icons/lu';
import { useAuthStore } from '../../store';

export function Header() {
    const user = useAuthStore((state) => state.user);
    const [currentTime, setCurrentTime] = useState(new Date());

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
            bg="#F5F5F5"
        >
            {/* Left spacer - matches right side width for true center */}
            <Box w="180px" />

            {/* Center - Date & Time */}
            <Flex align="center" gap={4}>
                <Flex align="center" gap={2}>
                    <Icon as={LuCalendar} boxSize={4} color="#666666" />
                    <Text fontSize="sm" color="#1A1A1A" fontWeight="medium">
                        {formatDate(currentTime)}
                    </Text>
                </Flex>
                <Text color="#E0E0E0">|</Text>
                <Flex align="center" gap={2}>
                    <Icon as={LuClock} boxSize={4} color="#666666" />
                    <Text fontSize="sm" color="#1A1A1A" fontWeight="semibold">
                        {formatTime(currentTime)}
                    </Text>
                </Flex>
            </Flex>

            {/* Right side */}
            <Flex align="center" gap={3}>
                {/* Notifications */}
                <Flex
                    w={9}
                    h={9}
                    align="center"
                    justify="center"
                    borderRadius="lg"
                    bg="white"
                    cursor="pointer"
                    _hover={{ bg: '#EEEEEE' }}
                    transition="all 0.2s"
                >
                    <Icon as={LuBell} boxSize={4} color="#666666" />
                </Flex>

                {/* User */}
                <Flex
                    align="center"
                    gap={2}
                    bg="white"
                    px={3}
                    py={2}
                    borderRadius="lg"
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
                        <Text fontSize="sm" fontWeight="semibold" color="#1A1A1A" lineHeight="1.2">
                            {user?.firstName} {user?.lastName}
                        </Text>
                        <Text fontSize="xs" color="#666666" lineHeight="1.2">
                            {user?.role === 'super_admin' ? 'Süper Admin' : user?.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                        </Text>
                    </Box>
                </Flex>
            </Flex>
        </Flex>
    );
}

export default Header;
