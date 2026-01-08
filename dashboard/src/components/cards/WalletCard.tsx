'use client';

import { Box, Flex, Text, Icon, Badge } from '@chakra-ui/react';
import { LuCreditCard, LuGraduationCap, LuCat } from 'react-icons/lu';
import type { WalletType } from '../../types';
import { formatCurrency } from '../../utils';

interface WalletCardProps {
    type: WalletType;
    balance: string;
    transactionCount?: number;
    discount: number;
    isActive?: boolean;
}

export function WalletCard({ type, balance, transactionCount, discount, isActive = true }: WalletCardProps) {
    const isIeu = type === 'IEU';

    const bgGradient = isIeu
        ? 'linear(to-br, ieu.500, ieu.600)'
        : 'linear(to-br, niki.500, niki.600)';

    const IconComponent = isIeu ? LuGraduationCap : LuCat;
    const cardName = isIeu ? 'IEU Card' : 'NIKI Card';
    const cardDescription = isIeu ? 'İzmir Ekonomi Üniversitesi' : 'Genel Kullanım';

    return (
        <Box
            bgGradient={bgGradient}
            borderRadius="2xl"
            p={6}
            color="white"
            position="relative"
            overflow="hidden"
            transition="all 0.2s"
            _hover={{ transform: 'scale(1.02)' }}
            opacity={isActive ? 1 : 0.6}
        >
            {/* Background pattern */}
            <Box
                position="absolute"
                right={-10}
                top={-10}
                opacity={0.1}
            >
                <Icon as={IconComponent} boxSize={40} />
            </Box>

            <Flex justify="space-between" align="flex-start" mb={6}>
                <Box>
                    <Flex align="center" gap={2} mb={1}>
                        <Icon as={LuCreditCard} boxSize={5} />
                        <Text fontWeight="bold" fontSize="lg">
                            {cardName}
                        </Text>
                    </Flex>
                    <Text fontSize="sm" opacity={0.8}>
                        {cardDescription}
                    </Text>
                </Box>
                <Badge
                    colorPalette={isActive ? 'green' : 'red'}
                    variant="solid"
                    borderRadius="full"
                    px={3}
                >
                    {isActive ? 'Aktif' : 'Pasif'}
                </Badge>
            </Flex>

            <Box mb={4}>
                <Text fontSize="sm" opacity={0.8} mb={1}>
                    Toplam Bakiye
                </Text>
                <Text fontSize="3xl" fontWeight="bold">
                    {formatCurrency(balance)}
                </Text>
            </Box>

            <Flex justify="space-between" align="center">
                <Box>
                    <Text fontSize="xs" opacity={0.8}>
                        İşlem Sayısı
                    </Text>
                    <Text fontWeight="semibold">
                        {transactionCount?.toLocaleString('tr-TR') ?? '—'}
                    </Text>
                </Box>
                <Box textAlign="right">
                    <Text fontSize="xs" opacity={0.8}>
                        İndirim Oranı
                    </Text>
                    <Text fontWeight="semibold">
                        %{discount}
                    </Text>
                </Box>
            </Flex>
        </Box>
    );
}

export default WalletCard;
