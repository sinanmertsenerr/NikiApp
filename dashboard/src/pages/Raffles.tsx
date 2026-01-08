'use client';

import { useState } from 'react';
import {
    Box,
    Flex,
    Text,
    Grid,
    GridItem,
    Badge,
    Icon,
    Button,
    Progress,
} from '@chakra-ui/react';
import {
    LuDices,
    LuGift,
    LuUsers,
    LuTrophy,
    LuCalendar,
    LuCircleCheck,
    LuCircleDot,
    LuTicket,
    LuSparkles,
    LuPercent,
} from 'react-icons/lu';
import { Header } from '../components/layout';
import { StatCard } from '../components/cards/StatCard';
import { PageHeader } from '../components/shared/PageHeader';
import { useColorMode } from '../components/ui/ColorModeProvider';

// Mock Data
const mockWheelStats = { totalSpins: 4523, totalWinners: 1892, winRate: 41.8, todaySpins: 87, todayWinners: 34 };

const mockWheelPrizes = [
    { id: 1, name: 'Ücretsiz Kahve', count: 890, percent: 47, color: '#4CAF50' },
    { id: 2, name: '%20 İndirim', count: 456, percent: 24, color: '#3B82F6' },
    { id: 3, name: 'Çift Puan', count: 312, percent: 16, color: '#8B5CF6' },
    { id: 4, name: '50₺ Hediye', count: 134, percent: 7, color: '#FF9800' },
    { id: 5, name: 'Tatlı Hediye', count: 100, percent: 5, color: '#EC4899' },
];

const mockRaffles = [
    { id: 1, name: 'Yılbaşı Özel Çekilişi', prize: 'iPhone 15 Pro', status: 'active', endDate: '2026-01-15', participants: 1234, maxParticipants: 2000, ticketPrice: 100, winner: null },
    { id: 2, name: 'Kahve Severler Çekilişi', prize: '1 Yıllık Ücretsiz Kahve', status: 'active', endDate: '2026-01-31', participants: 567, maxParticipants: 1000, ticketPrice: 50, winner: null },
    { id: 3, name: 'Aralık Sürpriz Çekilişi', prize: 'AirPods Pro', status: 'completed', endDate: '2025-12-31', participants: 892, maxParticipants: 1000, ticketPrice: 75, winner: 'Ahmet Y.' },
    { id: 4, name: 'Black Friday Çekilişi', prize: '500₺ Hediye Çeki', status: 'completed', endDate: '2025-11-30', participants: 1500, maxParticipants: 1500, ticketPrice: 25, winner: 'Zeynep K.' },
];

const mockRecentWinners = [
    { id: 1, name: 'Mehmet D.', prize: 'Ücretsiz Kahve', type: 'wheel', date: '14:32' },
    { id: 2, name: 'Elif Ş.', prize: '%20 İndirim', type: 'wheel', date: '14:28' },
    { id: 3, name: 'Can Ö.', prize: 'Çift Puan', type: 'wheel', date: '14:15' },
    { id: 4, name: 'Selin A.', prize: 'Ücretsiz Kahve', type: 'wheel', date: '13:55' },
];

type TabType = 'wheel' | 'raffles';

const statusConfig = {
    active: { label: 'Aktif', color: 'green', icon: LuCircleDot },
    completed: { label: 'Tamamlandı', color: 'gray', icon: LuCircleCheck },
};

export function RafflesPage() {
    const [activeTab, setActiveTab] = useState<TabType>('wheel');
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0
        }).format(value);

    return (
        <Box
            h="100vh"
            overflow="hidden"
            display="flex"
            flexDirection="column"
            bg={isDark ? '#121212' : '#FFFFFF'}
            transition="background 0.2s"
        >
            <Header />

            <Box p={4} flex={1} overflow="hidden" display="flex" flexDirection="column">
                {/* Page Header */}
                <PageHeader
                    title="Çekiliş & Çark"
                    subtitle="Şans oyunları ve ödül istatistikleri"
                />

                {/* Tab Buttons */}
                <Flex gap={3} mb={3}>
                    <Button
                        size="md"
                        variant={activeTab === 'wheel' ? 'solid' : 'outline'}
                        bg={activeTab === 'wheel' ? '#FF9800' : (isDark ? '#1E1E1E' : 'white')}
                        color={activeTab === 'wheel' ? 'white' : '#FF9800'}
                        borderColor="#FF9800"
                        borderWidth="2px"
                        _hover={{ bg: activeTab === 'wheel' ? '#fb8c00' : (isDark ? '#333' : '#FFF3E0') }}
                        onClick={() => setActiveTab('wheel')}
                        px={5}
                    >
                        <Icon as={LuDices} mr={2} />Şans Çarkı
                    </Button>
                    <Button
                        size="md"
                        variant={activeTab === 'raffles' ? 'solid' : 'outline'}
                        bg={activeTab === 'raffles' ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#1E1E1E' : 'white')}
                        color={activeTab === 'raffles' ? (isDark ? '#000000' : 'white') : (isDark ? '#FFFFFF' : '#000000')}
                        borderColor={isDark ? '#FFFFFF' : '#000000'}
                        borderWidth="2px"
                        _hover={{ bg: activeTab === 'raffles' ? (isDark ? '#E0E0E0' : '#333') : (isDark ? '#333' : '#F5F5F5') }}
                        onClick={() => setActiveTab('raffles')}
                        px={5}
                    >
                        <Icon as={LuTicket} mr={2} />Çekilişler
                    </Button>
                </Flex>

                {/* Şans Çarkı Tab */}
                {activeTab === 'wheel' && (
                    <Box flex={1} overflow="auto">
                        {/* Stats Grid */}
                        <Grid templateColumns={{ base: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={3} mb={3}>
                            <GridItem>
                                <StatCard
                                    label="Toplam Çevirme"
                                    value={mockWheelStats.totalSpins.toLocaleString('tr-TR')}
                                    icon={LuDices}
                                    color="ieu"
                                    subtitle={`Bugün: ${mockWheelStats.todaySpins}`}
                                />
                            </GridItem>
                            <GridItem>
                                <StatCard
                                    label="Toplam Kazanan"
                                    value={mockWheelStats.totalWinners.toLocaleString('tr-TR')}
                                    icon={LuTrophy}
                                    color="green"
                                    subtitle={`Bugün: ${mockWheelStats.todayWinners}`}
                                />
                            </GridItem>
                            <GridItem>
                                <StatCard
                                    label="Kazanma Oranı"
                                    value={`%${mockWheelStats.winRate}`}
                                    icon={LuPercent}
                                    color="blue"
                                    subtitle="Ortalama"
                                />
                            </GridItem>
                            <GridItem>
                                <StatCard
                                    label="Bugün"
                                    value={mockWheelStats.todaySpins}
                                    icon={LuSparkles}
                                    color="ieu"
                                    subtitle="Çevirme"
                                />
                            </GridItem>
                        </Grid>

                        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={3}>
                            {/* Prize Distribution */}
                            <GridItem>
                                <Box
                                    bg={isDark ? '#1E1E1E' : 'white'}
                                    borderRadius="xl"
                                    border="1px solid"
                                    borderColor={isDark ? '#333333' : '#E0E0E0'}
                                    p={4}
                                >
                                    <Text
                                        fontWeight="semibold"
                                        color={isDark ? 'white' : '#1A1A1A'}
                                        mb={3}
                                        fontSize="sm"
                                    >
                                        Ödül Dağılımı
                                    </Text>
                                    <Flex direction="column" gap={3}>
                                        {mockWheelPrizes.map((prize) => (
                                            <Box key={prize.id}>
                                                <Flex justify="space-between" mb={1}>
                                                    <Flex align="center" gap={2}>
                                                        <Box w={3} h={3} borderRadius="full" bg={prize.color} />
                                                        <Text
                                                            fontSize="xs"
                                                            color={isDark ? 'white' : '#1A1A1A'}
                                                            fontWeight="medium"
                                                        >
                                                            {prize.name}
                                                        </Text>
                                                    </Flex>
                                                    <Text
                                                        fontSize="xs"
                                                        color={isDark ? '#B0B0B0' : '#666666'}
                                                    >
                                                        {prize.count} ({prize.percent}%)
                                                    </Text>
                                                </Flex>
                                                <Progress.Root value={prize.percent} size="sm" borderRadius="full">
                                                    <Progress.Track bg={isDark ? '#333333' : '#E0E0E0'}>
                                                        <Progress.Range bg={prize.color} />
                                                    </Progress.Track>
                                                </Progress.Root>
                                            </Box>
                                        ))}
                                    </Flex>
                                </Box>
                            </GridItem>

                            {/* Recent Winners */}
                            <GridItem>
                                <Box
                                    bg={isDark ? '#1E1E1E' : 'white'}
                                    borderRadius="xl"
                                    border="1px solid"
                                    borderColor={isDark ? '#333333' : '#E0E0E0'}
                                    overflow="hidden"
                                >
                                    <Flex
                                        justify="space-between"
                                        align="center"
                                        p={3}
                                        borderBottom="1px solid"
                                        borderColor={isDark ? '#333333' : '#E0E0E0'}
                                    >
                                        <Text
                                            fontWeight="semibold"
                                            color={isDark ? 'white' : '#1A1A1A'}
                                            fontSize="sm"
                                        >
                                            Son Kazananlar
                                        </Text>
                                        <Badge colorPalette="yellow" variant="subtle" fontSize="xs">
                                            <Flex align="center" gap={1}>
                                                <Icon as={LuTrophy} boxSize={3} />
                                                Canlı
                                            </Flex>
                                        </Badge>
                                    </Flex>
                                    <Box>
                                        {mockRecentWinners.map((winner, index) => (
                                            <Flex
                                                key={winner.id}
                                                align="center"
                                                justify="space-between"
                                                p={3}
                                                borderBottom={index < mockRecentWinners.length - 1 ? '1px solid' : 'none'}
                                                borderColor={isDark ? '#333333' : '#F0F0F0'}
                                                _hover={{ bg: isDark ? '#2D2D2D' : '#FAFAFA' }}
                                            >
                                                <Flex align="center" gap={3}>
                                                    <Flex
                                                        w={8}
                                                        h={8}
                                                        borderRadius="lg"
                                                        bg={isDark ? '#3D2D1A' : '#FFF3E0'}
                                                        align="center"
                                                        justify="center"
                                                    >
                                                        <Icon as={LuDices} color="#FF9800" boxSize={4} />
                                                    </Flex>
                                                    <Box>
                                                        <Text
                                                            fontWeight="medium"
                                                            color={isDark ? 'white' : '#1A1A1A'}
                                                            fontSize="sm"
                                                        >
                                                            {winner.name}
                                                        </Text>
                                                        <Text
                                                            fontSize="xs"
                                                            color={isDark ? '#808080' : '#666666'}
                                                        >
                                                            {winner.prize}
                                                        </Text>
                                                    </Box>
                                                </Flex>
                                                <Text
                                                    fontSize="xs"
                                                    color={isDark ? '#666666' : '#999999'}
                                                >
                                                    {winner.date}
                                                </Text>
                                            </Flex>
                                        ))}
                                    </Box>
                                </Box>
                            </GridItem>
                        </Grid>
                    </Box>
                )}

                {/* Çekilişler Tab */}
                {activeTab === 'raffles' && (
                    <Box flex={1} overflow="auto">
                        {/* Stats */}
                        <Grid templateColumns={{ base: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={3} mb={3}>
                            <GridItem>
                                <StatCard
                                    label="Aktif Çekiliş"
                                    value={mockRaffles.filter(r => r.status === 'active').length}
                                    icon={LuTicket}
                                    color="green"
                                    subtitle="Devam eden"
                                />
                            </GridItem>
                            <GridItem>
                                <StatCard
                                    label="Toplam Katılımcı"
                                    value={mockRaffles.reduce((acc, r) => acc + r.participants, 0).toLocaleString('tr-TR')}
                                    icon={LuUsers}
                                    color="blue"
                                    subtitle="Tüm çekilişler"
                                />
                            </GridItem>
                            <GridItem>
                                <StatCard
                                    label="Dağıtılan Ödül"
                                    value={mockRaffles.filter(r => r.winner).length}
                                    icon={LuGift}
                                    color="ieu"
                                    subtitle="Tamamlanan"
                                />
                            </GridItem>
                            <GridItem>
                                <StatCard
                                    label="Toplam Gelir"
                                    value={formatCurrency(mockRaffles.reduce((acc, r) => acc + (r.participants * r.ticketPrice), 0))}
                                    icon={LuTrophy}
                                    color="brand"
                                    subtitle="Bilet satışı"
                                />
                            </GridItem>
                        </Grid>

                        {/* Raffle Cards */}
                        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
                            {mockRaffles.map((raffle) => {
                                const status = statusConfig[raffle.status as keyof typeof statusConfig];
                                const participantPercent = (raffle.participants / raffle.maxParticipants) * 100;

                                return (
                                    <GridItem key={raffle.id}>
                                        <Box
                                            bg={isDark ? '#1E1E1E' : 'white'}
                                            borderRadius="xl"
                                            border="1px solid"
                                            borderColor={isDark ? '#333333' : '#E0E0E0'}
                                            p={4}
                                            _hover={{
                                                borderColor: isDark ? '#4A4A4A' : '#BDBDBD',
                                                shadow: 'sm'
                                            }}
                                            transition="all 0.2s"
                                        >
                                            <Flex justify="space-between" align="flex-start" mb={2}>
                                                <Badge colorPalette={status.color} variant="subtle" fontSize="xs">
                                                    <Flex align="center" gap={1}>
                                                        <Icon as={status.icon} boxSize={3} />
                                                        {status.label}
                                                    </Flex>
                                                </Badge>
                                                <Flex
                                                    bg={isDark ? '#2D2D2D' : '#F5F5F5'}
                                                    borderRadius="lg"
                                                    px={2}
                                                    py={1}
                                                    align="center"
                                                    gap={1}
                                                >
                                                    <Icon
                                                        as={LuTicket}
                                                        boxSize={3}
                                                        color={isDark ? 'white' : '#000000'}
                                                    />
                                                    <Text
                                                        fontWeight="bold"
                                                        color={isDark ? 'white' : '#000000'}
                                                        fontSize="xs"
                                                    >
                                                        {formatCurrency(raffle.ticketPrice)}
                                                    </Text>
                                                </Flex>
                                            </Flex>

                                            <Text
                                                fontWeight="semibold"
                                                color={isDark ? 'white' : '#1A1A1A'}
                                                fontSize="sm"
                                                mb={1}
                                            >
                                                {raffle.name}
                                            </Text>
                                            <Flex align="center" gap={2} mb={3}>
                                                <Icon as={LuGift} color="#FF9800" boxSize={4} />
                                                <Text color="#FF9800" fontWeight="medium" fontSize="xs">
                                                    {raffle.prize}
                                                </Text>
                                            </Flex>

                                            <Box mb={3}>
                                                <Flex justify="space-between" mb={1}>
                                                    <Text
                                                        fontSize="xs"
                                                        color={isDark ? '#808080' : '#666666'}
                                                    >
                                                        Katılım
                                                    </Text>
                                                    <Text
                                                        fontSize="xs"
                                                        color={isDark ? '#B0B0B0' : '#666666'}
                                                    >
                                                        {raffle.participants}/{raffle.maxParticipants}
                                                    </Text>
                                                </Flex>
                                                <Progress.Root value={participantPercent} size="sm" borderRadius="full">
                                                    <Progress.Track bg={isDark ? '#333333' : '#E0E0E0'}>
                                                        <Progress.Range
                                                            bg={raffle.status === 'active'
                                                                ? (isDark ? '#FFFFFF' : '#000000')
                                                                : '#9e9e9e'
                                                            }
                                                        />
                                                    </Progress.Track>
                                                </Progress.Root>
                                            </Box>

                                            <Flex
                                                justify="space-between"
                                                pt={2}
                                                borderTop="1px solid"
                                                borderColor={isDark ? '#333333' : '#F0F0F0'}
                                            >
                                                <Box>
                                                    <Text
                                                        fontSize="xs"
                                                        color={isDark ? '#666666' : '#999999'}
                                                    >
                                                        {raffle.status === 'completed' ? 'Kazanan' : 'Bitiş'}
                                                    </Text>
                                                    {raffle.status === 'completed' && raffle.winner ? (
                                                        <Flex align="center" gap={1}>
                                                            <Icon as={LuTrophy} boxSize={3} color="#FF9800" />
                                                            <Text
                                                                fontSize="xs"
                                                                fontWeight="semibold"
                                                                color={isDark ? 'white' : '#1A1A1A'}
                                                            >
                                                                {raffle.winner}
                                                            </Text>
                                                        </Flex>
                                                    ) : (
                                                        <Flex align="center" gap={1}>
                                                            <Icon
                                                                as={LuCalendar}
                                                                boxSize={3}
                                                                color={isDark ? '#808080' : '#666666'}
                                                            />
                                                            <Text
                                                                fontSize="xs"
                                                                color={isDark ? '#B0B0B0' : '#666666'}
                                                            >
                                                                {new Date(raffle.endDate).toLocaleDateString('tr-TR')}
                                                            </Text>
                                                        </Flex>
                                                    )}
                                                </Box>
                                                <Box textAlign="right">
                                                    <Text
                                                        fontSize="xs"
                                                        color={isDark ? '#666666' : '#999999'}
                                                    >
                                                        Toplam
                                                    </Text>
                                                    <Text fontSize="xs" fontWeight="semibold" color="#4CAF50">
                                                        {formatCurrency(raffle.participants * raffle.ticketPrice)}
                                                    </Text>
                                                </Box>
                                            </Flex>
                                        </Box>
                                    </GridItem>
                                );
                            })}
                        </Grid>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export default RafflesPage;
