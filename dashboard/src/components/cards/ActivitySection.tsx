'use client';

import { useState, useMemo } from 'react';
import { Box, Text, Flex, Grid, GridItem, Icon } from '@chakra-ui/react';
import { LuCoffee, LuSandwich } from 'react-icons/lu';

// Define type locally to avoid import issues
type WalletType = 'IEU' | 'NIKI';

// Mock Data Generator
const generateMockData = (walletType: string) => {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const today = new Date();

    return days.map((day, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - index));

        // Random transaction count (10-60)
        const transactions = Math.floor(Math.random() * 50) + 10;

        // Average ticket size (Coffee ~45TL, Sandwich ~85TL)
        const avgTicket = walletType === 'IEU' ? 45 : 85;
        const totalAmount = transactions * (avgTicket + Math.random() * 10);

        // Hourly breakdown
        const hourly = Array.from({ length: 24 }, (_, h) => {
            const hourStr = h.toString().padStart(2, '0');
            // Mock peak hours
            let count = 0;
            if ((h >= 8 && h <= 10) || (h >= 12 && h <= 14) || (h >= 18 && h <= 20)) {
                count = Math.floor(Math.random() * (transactions / 4));
            } else if (h > 7 && h < 22) {
                count = Math.floor(Math.random() * 2);
            }

            const hourlyAmount = count * avgTicket;

            return {
                hour: `${hourStr}:00`,
                count,
                amount: hourlyAmount
            };
        });

        return {
            day,
            fullDate: date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }),
            transactions,
            totalAmount,
            hourly
        };
    });
};

interface WeeklyActivityChartProps {
    title: string;
    icon: typeof LuCoffee;
    accentColor: string;
    bgColor: string;
    walletType: WalletType | string;
    isActive: boolean;
}

export function WeeklyActivityChart({ title, icon, accentColor, bgColor, walletType, isActive }: WeeklyActivityChartProps) {
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [hoveredDay, setHoveredDay] = useState<number | null>(null);

    // Use mock data
    const weekData = useMemo(() => generateMockData(walletType), [walletType]);

    const maxTransactions = Math.max(...weekData.map(d => d.transactions), 1);

    const handleDayClick = (index: number) => {
        if (isActive && weekData[index].transactions > 0) setSelectedDay(index);
    };

    const closeModal = () => setSelectedDay(null);

    const getBarHeight = (value: number) => {
        return (value / maxTransactions) * 100;
    };

    // Format currency
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <>
            <Box
                bg="white"
                borderRadius="xl"
                border="1px solid"
                borderColor="#E8E8E8"
                p={4} // Reduced padding from 5 to 4
                h="100%"
                opacity={isActive ? 1 : 0.6}
            >
                {/* Header */}
                <Flex align="center" justify="space-between" mb={3}> {/* Reduced margin from 5 to 3 */}
                    <Flex align="center" gap={3}>
                        <Flex w={10} h={10} borderRadius="xl" bg={bgColor} align="center" justify="center">
                            <Icon as={icon} boxSize={5} color={accentColor} />
                        </Flex>
                        <Box>
                            <Text fontWeight="600" color="#1A1A1A" fontSize="md">{title}</Text>
                            <Text fontSize="xs" color="#888">Haftalık Aktivite</Text>
                        </Box>
                    </Flex>
                    {!isActive && (
                        <Box bg="#F5F5F5" px={3} py={1} borderRadius="full">
                            <Text fontSize="xs" color="#888" fontWeight="500">Yakında</Text>
                        </Box>
                    )}
                </Flex>

                {/* Chart Container */}
                <Box
                    bg="#FAFAFA"
                    borderRadius="lg"
                    p={3} // Reduced padding from 4 to 3
                    border="1px solid"
                    borderColor="#F0F0F0"
                >
                    {/* Bars */}
                    <Flex gap={2} align="flex-end" h="70px" mb={2}> {/* Reduced height from 90px to 70px, margin from 3 to 2 */}
                        {weekData.map((day, index) => {
                            const isHovered = hoveredDay === index;
                            const barHeight = day.transactions === 0 ? 2 : getBarHeight(day.transactions);

                            return (
                                <Flex
                                    key={index}
                                    flex={1}
                                    direction="column"
                                    align="center"
                                    h="100%"
                                    justify="flex-end"
                                    cursor={isActive ? 'pointer' : 'default'}
                                    onClick={() => handleDayClick(index)}
                                    onMouseEnter={() => isActive && setHoveredDay(index)}
                                    onMouseLeave={() => setHoveredDay(null)}
                                    position="relative"
                                >
                                    {/* Tooltip */}
                                    {isHovered && isActive && (
                                        <Box
                                            position="absolute"
                                            top="-52px"
                                            left="50%"
                                            transform="translateX(-50%)"
                                            bg="#333"
                                            color="white"
                                            px={3}
                                            py={2}
                                            borderRadius="md"
                                            fontSize="xs"
                                            fontWeight="500"
                                            whiteSpace="nowrap"
                                            zIndex={10}
                                            textAlign="center"
                                            boxShadow="lg"
                                            minW="80px"
                                        >
                                            <Text fontWeight="bold">{day.transactions} işlem</Text>
                                            <Text fontSize="10px" opacity={0.8}>{formatCurrency(day.totalAmount)}</Text>
                                            <Box
                                                position="absolute"
                                                bottom="-4px"
                                                left="50%"
                                                transform="translateX(-50%) rotate(45deg)"
                                                w="8px"
                                                h="8px"
                                                bg="#333"
                                            />
                                        </Box>
                                    )}

                                    {/* Bar */}
                                    <Box
                                        w="100%"
                                        maxW="32px"
                                        h={`${barHeight}%`}
                                        minH="4px"
                                        bg={isActive
                                            ? isHovered ? '#333' : '#555'
                                            : '#D0D0D0'
                                        }
                                        borderRadius="4px"
                                        transition="all 0.15s ease"
                                    />
                                </Flex>
                            );
                        })}
                    </Flex>

                    {/* Labels */}
                    <Flex gap={2}>
                        {weekData.map((day, index) => (
                            <Flex key={index} flex={1} justify="center">
                                <Text
                                    fontSize="xs"
                                    color={hoveredDay === index ? '#333' : '#888'}
                                    fontWeight={hoveredDay === index ? '600' : '500'}
                                    transition="all 0.15s"
                                >
                                    {day.day}
                                </Text>
                            </Flex>
                        ))}
                    </Flex>
                </Box>

                {/* Footer */}
                <Flex justify="space-between" align="center" mt={3}> {/* Reduced margin from 4 to 3 */}
                    <Flex align="center" gap={2}>
                        <Text fontSize="sm" color="#888">Toplam</Text>
                    </Flex>
                    <Box textAlign="right">
                        <Text fontWeight="700" fontSize="lg" color={isActive ? '#1A1A1A' : '#AAA'}>
                            {formatCurrency(weekData.reduce((sum, d) => sum + d.totalAmount, 0))}
                        </Text>
                        <Text fontSize="xs" color="#888">
                            {weekData.reduce((sum, d) => sum + d.transactions, 0)} işlem
                        </Text>
                    </Box>
                </Flex>
            </Box>

            {/* Modal */}
            {selectedDay !== null && weekData[selectedDay] && (
                <Box
                    position="fixed"
                    top={0} left={0} right={0} bottom={0}
                    bg="rgba(0,0,0,0.4)"
                    zIndex={1000}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    p={4}
                    onClick={closeModal}
                >
                    <Box
                        bg="white"
                        borderRadius="2xl"
                        p={6}
                        maxW="650px"
                        w="100%"
                        onClick={(e) => e.stopPropagation()}
                        boxShadow="xl"
                        maxH="90vh"
                        overflowY="auto"
                    >
                        <Flex justify="space-between" align="center" mb={5}>
                            <Box>
                                <Text fontSize="lg" fontWeight="700" color="#1A1A1A">
                                    {weekData[selectedDay].fullDate}
                                </Text>
                                <Text fontSize="sm" color="#888">Saatlik işlem ve ciro dağılımı</Text>
                            </Box>
                            <Flex
                                w={9} h={9} borderRadius="full" bg="#F5F5F5"
                                align="center" justify="center" cursor="pointer"
                                _hover={{ bg: '#EEE' }} onClick={closeModal}
                            >
                                <Text fontSize="sm" fontWeight="bold">✕</Text>
                            </Flex>
                        </Flex>

                        <Grid templateColumns={{ base: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(6, 1fr)' }} gap={3}>
                            {weekData[selectedDay].hourly.map((hour, index) => (
                                <GridItem key={index}>
                                    <Box
                                        bg={hour.count > 0 ? '#F9F9F9' : '#FAFAFA'}
                                        borderRadius="lg"
                                        p={3}
                                        textAlign="center"
                                        border="1px solid"
                                        borderColor={hour.count > 0 ? '#E0E0E0' : 'transparent'}
                                        opacity={hour.count > 0 ? 1 : 0.6}
                                    >
                                        <Flex align="center" justify="center" gap={1} mb={2}>
                                            <Text fontSize="xs" color="#888" fontWeight="500">{hour.hour}</Text>
                                        </Flex>
                                        <Text
                                            fontSize="md"
                                            fontWeight="700"
                                            color={hour.count > 0 ? '#333' : '#CCC'}
                                            lineHeight="1.2"
                                        >
                                            {hour.count}
                                        </Text>
                                        <Text fontSize="10px" color="#999">işlem</Text>

                                        {hour.count > 0 && (
                                            <Text fontSize="xs" fontWeight="600" color={accentColor} mt={1}>
                                                {formatCurrency(hour.amount).replace('₺', '')}₺
                                            </Text>
                                        )}
                                    </Box>
                                </GridItem>
                            ))}
                        </Grid>

                        <Flex justify="space-between" align="center" mt={6} pt={4} borderTop="1px solid #F0F0F0">
                            <Box>
                                <Text color="#888" fontSize="sm">Günlük Toplam</Text>
                                <Text fontSize="xl" fontWeight="700" color="#1A1A1A">
                                    {weekData[selectedDay].transactions}
                                    <Text as="span" fontSize="sm" fontWeight="500" color="#888" ml={1}>işlem</Text>
                                </Text>
                            </Box>
                            <Box textAlign="right">
                                <Text color="#888" fontSize="sm">Günlük Ciro</Text>
                                <Text fontSize="xl" fontWeight="700" color={accentColor}>
                                    {formatCurrency(weekData[selectedDay].totalAmount)}
                                </Text>
                            </Box>
                        </Flex>
                    </Box>
                </Box>
            )}
        </>
    );
}

export function ActivitySection() {
    return (
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={4} mb={3}> {/* Reduced mb from 4 to 3 */}
            <GridItem>
                <WeeklyActivityChart
                    title="Niki Coffee"
                    icon={LuCoffee}
                    accentColor="#6B4423"
                    bgColor="#F5EDE8"
                    walletType={'IEU'}
                    isActive={true}
                />
            </GridItem>
            <GridItem>
                <WeeklyActivityChart
                    title="Niki Sandwich"
                    icon={LuSandwich}
                    accentColor="#E8A838"
                    bgColor="#FEF7E8"
                    walletType={'NIKI'}
                    isActive={false}
                />
            </GridItem>
        </Grid>
    );
}

export default ActivitySection;
