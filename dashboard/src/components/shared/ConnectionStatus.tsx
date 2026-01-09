// Connection Status Indicator Component
'use client';

import { useState, useEffect } from 'react';
import { Box, Flex, Text, Icon } from '@chakra-ui/react';
import { LuRefreshCw } from 'react-icons/lu';
import { useSocketStore } from '../../store/socketStore';
import { useColorMode } from '../ui/ColorModeProvider';
import { useSocket } from '../../hooks/useSocket';
import { getSocket } from '../../socket';

interface ConnectionStatusProps {
    showLabel?: boolean;
    size?: 'sm' | 'md';
}

export function ConnectionStatus({ showLabel = true, size = 'sm' }: ConnectionStatusProps) {
    const storeConnected = useSocketStore((state) => state.isConnected);
    const lastEvent = useSocketStore((state) => state.lastEvent);
    const { colorMode } = useColorMode();
    const { refreshAll } = useSocket();
    const isDark = colorMode === 'dark';

    // Initialize with actual socket connection status
    const [isConnected, setIsConnected] = useState(() => {
        const socket = getSocket();
        return socket?.connected ?? storeConnected ?? false;
    });

    useEffect(() => {
        setIsConnected(storeConnected);
    }, [storeConnected]);

    const iconSize = size === 'sm' ? 3 : 4;
    const textSize = size === 'sm' ? 'xs' : 'sm';
    const dotSize = size === 'sm' ? '6px' : '8px';

    return (
        <Flex align="center" gap={2}>
            {/* Connection dot */}
            <Box
                w={dotSize}
                h={dotSize}
                borderRadius="full"
                bg={isConnected ? '#4CAF50' : '#F44336'}
                boxShadow={isConnected ? '0 0 8px #4CAF50' : '0 0 8px #F44336'}
                transition="all 0.3s"
            />

            {showLabel && (
                <Text fontSize={textSize} color={isDark ? '#B0B0B0' : '#666666'}>
                    {isConnected ? 'Canlı' : 'Bağlantı Yok'}
                </Text>
            )}

            {/* Refresh button when disconnected */}
            {!isConnected && (
                <Icon
                    as={LuRefreshCw}
                    boxSize={iconSize}
                    color={isDark ? '#B0B0B0' : '#666666'}
                    cursor="pointer"
                    _hover={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                    onClick={refreshAll}
                />
            )}

            {/* Last event indicator (fades out) */}
            {lastEvent && (
                <Text
                    fontSize="xs"
                    color={isDark ? '#808080' : '#999999'}
                >
                    • {lastEvent.message}
                </Text>
            )}
        </Flex>
    );
}

export default ConnectionStatus;

