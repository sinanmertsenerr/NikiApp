'use client';

import { Box, Flex, Text, Icon } from '@chakra-ui/react';
import type { IconType } from 'react-icons';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: IconType;
    subtitle?: string;
    color?: 'brand' | 'ieu' | 'niki' | 'green' | 'blue';
}

const colorMap = {
    brand: { bg: '#F5F5F5', color: '#1A1A1A' },
    ieu: { bg: '#FFF3E0', color: '#FF9800' },
    niki: { bg: '#F5F5F5', color: '#000000' },
    green: { bg: '#E8F5E9', color: '#4CAF50' },
    blue: { bg: '#E3F2FD', color: '#3B82F6' },
};

export function StatCard({ label, value, icon, subtitle, color = 'brand' }: StatCardProps) {
    const colors = colorMap[color];

    return (
        <Box
            bg="white"
            borderRadius="xl"
            border="1px solid"
            borderColor="#E0E0E0"
            p={4}
            h="100%"
        >
            <Flex justify="space-between" align="flex-start" mb={2}>
                <Text fontSize="sm" color="#666666" fontWeight="medium">
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
            <Text fontSize="2xl" fontWeight="bold" color="#1A1A1A" mb={1}>
                {value}
            </Text>
            {subtitle && (
                <Text fontSize="xs" color="#999999">
                    {subtitle}
                </Text>
            )}
        </Box>
    );
}

export default StatCard;
