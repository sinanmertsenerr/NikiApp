'use client';

import { Box, Flex, Text, Icon } from '@chakra-ui/react';
import type { IconType } from 'react-icons';
import { useColorMode } from '../ui/ColorModeProvider';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: IconType;
    subtitle?: string;
    color?: 'brand' | 'ieu' | 'niki' | 'green' | 'blue';
}

const lightColorMap = {
    brand: { bg: '#F5F5F5', color: '#1A1A1A' },
    ieu: { bg: '#FFF3E0', color: '#FF9800' },
    niki: { bg: '#F5F5F5', color: '#000000' },
    green: { bg: '#E8F5E9', color: '#4CAF50' },
    blue: { bg: '#E3F2FD', color: '#3B82F6' },
};

const darkColorMap = {
    brand: { bg: '#2D2D2D', color: '#FFFFFF' },
    ieu: { bg: 'rgba(255, 152, 0, 0.15)', color: '#FFB74D' },
    niki: { bg: '#333333', color: '#FFFFFF' },
    green: { bg: 'rgba(76, 175, 80, 0.15)', color: '#81C784' },
    blue: { bg: 'rgba(59, 130, 246, 0.15)', color: '#64B5F6' },
};

export function StatCard({ label, value, icon, subtitle, color = 'brand' }: StatCardProps) {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const colors = isDark ? darkColorMap[color] : lightColorMap[color];

    return (
        <Box
            bg={isDark ? '#1E1E1E' : 'white'}
            borderRadius="xl"
            border="1px solid"
            borderColor={isDark ? '#333333' : '#E0E0E0'}
            p={4}
            h="100%"
            transition="all 0.2s"
        >
            <Flex justify="space-between" align="flex-start" mb={2}>
                <Text fontSize="sm" color={isDark ? '#B0B0B0' : '#666666'} fontWeight="medium">
                    {label}
                </Text>
                <Flex
                    w={8}
                    h={8}
                    borderRadius="lg"
                    bg={colors.bg}
                    align="center"
                    justify="center"
                >
                    <Icon as={icon} boxSize={4} color={colors.color} />
                </Flex>
            </Flex>
            <Text fontSize="2xl" fontWeight="bold" color={isDark ? '#FFFFFF' : '#1A1A1A'} mb={1}>
                {value}
            </Text>
            {subtitle && (
                <Text fontSize="xs" color={isDark ? '#808080' : '#999999'}>
                    {subtitle}
                </Text>
            )}
        </Box>
    );
}

export default StatCard;

