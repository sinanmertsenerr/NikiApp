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
} from '@chakra-ui/react';
import {
    LuCircleArrowUp,
    LuCircleArrowDown,
    LuTrendingUp,
    LuUsers,
    LuCreditCard,
    LuCalendar,
} from 'react-icons/lu';
import { Header } from '../components/layout';
import { StatCard } from '../components/cards/StatCard';
import { useColorMode } from '../components/ui/ColorModeProvider';
import { PageHeader } from '../components/shared/PageHeader';
import { DataTable } from '../components/shared/DataTable';

// Mock Data
const mockIEUStats = {
    totalUsers: 234,
    totalTransactions: 1847,
    topUps: 28450.00,
    payments: 17560.00,
};

const mockNIKIStats = {
    totalUsers: 412,
    totalTransactions: 2156,
    topUps: 19800.00,
    payments: 12350.00,
};

const mockTransactions = [
    { id: 1, user: 'Ahmet Yılmaz', type: 'topup', amount: 500, date: '2026-01-08T14:32:00', cardType: 'IEU', admin: 'Sinan Sener' },
    { id: 2, user: 'Zeynep Kaya', type: 'payment', amount: 45.50, date: '2026-01-08T14:28:00', cardType: 'NIKI', admin: 'Can Öztürk' },
    { id: 3, user: 'Mehmet Demir', type: 'payment', amount: 32.00, date: '2026-01-08T14:15:00', cardType: 'IEU', admin: 'Sinan Sener' },
    { id: 4, user: 'Elif Şahin', type: 'topup', amount: 200, date: '2026-01-08T13:55:00', cardType: 'NIKI', admin: 'Can Öztürk' },
    { id: 5, user: 'Can Öztürk', type: 'payment', amount: 78.25, date: '2026-01-08T13:42:00', cardType: 'IEU', admin: 'Sinan Sener' },
    { id: 6, user: 'Selin Arslan', type: 'topup', amount: 1000, date: '2026-01-08T13:30:00', cardType: 'IEU', admin: 'Sinan Sener' },
    { id: 7, user: 'Burak Çelik', type: 'payment', amount: 25.00, date: '2026-01-08T13:18:00', cardType: 'NIKI', admin: 'Can Öztürk' },
    { id: 8, user: 'Ayşe Koç', type: 'payment', amount: 56.75, date: '2026-01-08T12:55:00', cardType: 'NIKI', admin: 'Can Öztürk' },
    { id: 9, user: 'Emre Yıldız', type: 'topup', amount: 300, date: '2026-01-08T12:40:00', cardType: 'IEU', admin: 'Sinan Sener' },
    { id: 10, user: 'Deniz Aydın', type: 'payment', amount: 42.00, date: '2026-01-08T12:22:00', cardType: 'NIKI', admin: 'Can Öztürk' },
    { id: 11, user: 'Merve Aksoy', type: 'topup', amount: 150, date: '2026-01-08T11:50:00', cardType: 'IEU', admin: 'Sinan Sener' },
    { id: 12, user: 'Ali Kara', type: 'payment', amount: 65.00, date: '2026-01-08T11:30:00', cardType: 'NIKI', admin: 'Can Öztürk' },
    // Daha fazla mock veri - scroll'u test etmek için
    { id: 13, user: 'Fatma Yıldırım', type: 'topup', amount: 750, date: '2026-01-08T11:15:00', cardType: 'IEU', admin: 'Sinan Sener' },
    { id: 14, user: 'Hakan Bayrak', type: 'payment', amount: 38.50, date: '2026-01-08T11:00:00', cardType: 'IEU', admin: 'Sinan Sener' },
    { id: 15, user: 'Gamze Tuncer', type: 'payment', amount: 22.00, date: '2026-01-08T10:45:00', cardType: 'NIKI', admin: 'Can Öztürk' },
    { id: 16, user: 'Oğuz Ateş', type: 'topup', amount: 400, date: '2026-01-08T10:30:00', cardType: 'NIKI', admin: 'Can Öztürk' },
    { id: 17, user: 'Pınar Demirtaş', type: 'payment', amount: 55.25, date: '2026-01-08T10:18:00', cardType: 'IEU', admin: 'Sinan Sener' },
    { id: 18, user: 'Serkan Güneş', type: 'topup', amount: 600, date: '2026-01-08T10:05:00', cardType: 'IEU', admin: 'Sinan Sener' },
    { id: 19, user: 'Tuğba Acar', type: 'payment', amount: 18.75, date: '2026-01-08T09:50:00', cardType: 'NIKI', admin: 'Can Öztürk' },
    { id: 20, user: 'Ufuk Karaca', type: 'payment', amount: 48.00, date: '2026-01-08T09:35:00', cardType: 'IEU', admin: 'Sinan Sener' },
    { id: 21, user: 'Vildan Polat', type: 'topup', amount: 250, date: '2026-01-08T09:20:00', cardType: 'NIKI', admin: 'Can Öztürk' },
    { id: 22, user: 'Yasemin Koçak', type: 'payment', amount: 72.50, date: '2026-01-08T09:08:00', cardType: 'IEU', admin: 'Sinan Sener' },
    { id: 23, user: 'Zeki Şen', type: 'topup', amount: 350, date: '2026-01-08T08:55:00', cardType: 'IEU', admin: 'Sinan Sener' },
    { id: 24, user: 'Aslı Tekin', type: 'payment', amount: 29.00, date: '2026-01-08T08:42:00', cardType: 'NIKI', admin: 'Can Öztürk' },
    { id: 25, user: 'Barış Yalçın', type: 'topup', amount: 180, date: '2026-01-08T08:30:00', cardType: 'NIKI', admin: 'Can Öztürk' },
    { id: 26, user: 'Ceren Özkan', type: 'payment', amount: 41.25, date: '2026-01-08T08:18:00', cardType: 'IEU', admin: 'Sinan Sener' },
    { id: 27, user: 'Doruk Kılıç', type: 'topup', amount: 900, date: '2026-01-08T08:05:00', cardType: 'IEU', admin: 'Sinan Sener' },
    { id: 28, user: 'Ebru Çetin', type: 'payment', amount: 33.50, date: '2026-01-08T07:52:00', cardType: 'NIKI', admin: 'Can Öztürk' },
    { id: 29, user: 'Furkan Aydoğan', type: 'topup', amount: 275, date: '2026-01-08T07:40:00', cardType: 'IEU', admin: 'Sinan Sener' },
    { id: 30, user: 'Gizem Başar', type: 'payment', amount: 62.00, date: '2026-01-08T07:28:00', cardType: 'NIKI', admin: 'Can Öztürk' },
];

type CardType = 'IEU' | 'NIKI';

export function WalletPage() {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [activeTab, setActiveTab] = useState<CardType>('IEU');

    const stats = activeTab === 'IEU' ? mockIEUStats : mockNIKIStats;
    const filteredTransactions = mockTransactions.filter(t => t.cardType === activeTab);

    // IEU: Orange, NIKI: Black
    const accentColor = activeTab === 'IEU' ? '#FF9800' : (isDark ? '#FFFFFF' : '#000000');

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <Box h="100vh" overflow="hidden" display="flex" flexDirection="column" bg={isDark ? '#121212' : '#FFFFFF'} transition="background 0.2s">
            <Header />

            <Box p={4} flex={1} overflow="hidden" display="flex" flexDirection="column">
                <PageHeader
                    title="Cüzdan"
                    subtitle="IEU & NIKI Kart işlemleri"
                />

                {/* Card Type Tabs */}
                <Flex gap={3} mb={3}>
                    <Button
                        size="md"
                        variant={activeTab === 'IEU' ? 'solid' : 'outline'}
                        bg={activeTab === 'IEU' ? '#FF9800' : (isDark ? '#1E1E1E' : 'white')}
                        color={activeTab === 'IEU' ? 'white' : '#FF9800'}
                        borderColor="#FF9800"
                        borderWidth="2px"
                        _hover={{ bg: activeTab === 'IEU' ? '#fb8c00' : (isDark ? '#333' : '#FFF3E0') }}
                        onClick={() => setActiveTab('IEU')}
                        px={5}
                    >
                        <Icon as={LuCreditCard} mr={2} />
                        IEU Card
                        <Badge ml={2} bg={activeTab === 'IEU' ? 'white' : '#FF9800'} color={activeTab === 'IEU' ? '#FF9800' : 'white'}>
                            %15
                        </Badge>
                    </Button>
                    <Button
                        size="md"
                        variant={activeTab === 'NIKI' ? 'solid' : 'outline'}
                        bg={activeTab === 'NIKI' ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#1E1E1E' : 'white')}
                        color={activeTab === 'NIKI' ? (isDark ? '#000000' : 'white') : (isDark ? '#FFFFFF' : '#000000')}
                        borderColor={isDark ? '#FFFFFF' : '#000000'}
                        borderWidth="2px"
                        _hover={{ bg: activeTab === 'NIKI' ? (isDark ? '#E0E0E0' : '#333') : (isDark ? '#333' : '#F5F5F5') }}
                        onClick={() => setActiveTab('NIKI')}
                        px={5}
                    >
                        <Icon as={LuCreditCard} mr={2} />
                        NIKI Card
                        <Badge ml={2} bg={activeTab === 'NIKI' ? (isDark ? '#000000' : 'white') : (isDark ? '#FFFFFF' : '#000000')} color={activeTab === 'NIKI' ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#000000' : 'white')}>
                            %10
                        </Badge>
                    </Button>
                </Flex>

                {/* Stats Grid */}
                <Grid
                    templateColumns={{ base: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
                    gap={3}
                    mb={3}
                >
                    <GridItem>
                        <StatCard
                            label="Toplam Kullanıcı"
                            value={stats.totalUsers}
                            icon={LuUsers}
                            color={activeTab === 'IEU' ? 'ieu' : 'niki'}
                            subtitle="Aktif kart sahibi"
                        />
                    </GridItem>
                    <GridItem>
                        <StatCard
                            label="Toplam İşlem"
                            value={stats.totalTransactions.toLocaleString('tr-TR')}
                            icon={LuTrendingUp}
                            color={activeTab === 'IEU' ? 'ieu' : 'niki'}
                            subtitle="Tüm zamanlar"
                        />
                    </GridItem>
                    <GridItem>
                        <StatCard
                            label="Toplam Yükleme"
                            value={formatCurrency(stats.topUps)}
                            icon={LuCircleArrowUp}
                            color="green"
                            subtitle="Bu ay"
                        />
                    </GridItem>
                    <GridItem>
                        <StatCard
                            label="Toplam Harcama"
                            value={formatCurrency(stats.payments)}
                            icon={LuCircleArrowDown}
                            color={activeTab === 'IEU' ? 'ieu' : 'niki'}
                            subtitle="Bu ay"
                        />
                    </GridItem>
                </Grid>

                {/* Section Title - Outside the table */}
                {/* Section Title - Outside the table */}
                <Flex justify="space-between" align="center" mb={2}>
                    <Text fontWeight="semibold" color={isDark ? '#FFFFFF' : '#1A1A1A'} fontSize="sm">
                        Son İşlemler
                    </Text>
                    <Flex align="center" gap={2} bg={isDark ? '#2D2D2D' : '#F5F5F5'} px={3} py={1} borderRadius="full">
                        <Icon as={LuCalendar} color={isDark ? '#B0B0B0' : '#666666'} boxSize={3} />
                        <Text fontSize="xs" color={isDark ? '#B0B0B0' : '#666666'} fontWeight="500">
                            Bugün
                        </Text>
                    </Flex>
                </Flex>

                <DataTable
                    data={filteredTransactions}
                    keyExtractor={(tx) => tx.id}
                    columns={[
                        {
                            header: 'Kullanıcı',
                            cell: (tx) => (
                                <Flex align="center" gap={3}>
                                    <Flex
                                        w={8} h={8} borderRadius="full"
                                        bg={isDark ? '#333333' : '#F5F5F5'}
                                        align="center"
                                        justify="center"
                                        flexShrink={0}
                                    >
                                        <Text fontWeight="600" color={accentColor} fontSize="xs">
                                            {tx.user.split(' ').map(n => n[0]).join('')}
                                        </Text>
                                    </Flex>
                                    <Text fontWeight="500" color={isDark ? '#FFFFFF' : '#1A1A1A'} fontSize="sm">
                                        {tx.user}
                                    </Text>
                                </Flex>
                            )
                        },
                        {
                            header: 'İşlem Tipi',
                            textAlign: 'center',
                            cell: (tx) => (
                                <Flex justify="center">
                                    <Badge
                                        colorPalette={tx.type === 'topup' ? 'green' : 'orange'}
                                        variant="subtle"
                                        fontSize="xs"
                                    >
                                        <Flex align="center" gap={1}>
                                            <Icon
                                                as={tx.type === 'topup' ? LuCircleArrowUp : LuCircleArrowDown}
                                                boxSize={3}
                                            />
                                            {tx.type === 'topup' ? 'Yükleme' : 'Ödeme'}
                                        </Flex>
                                    </Badge>
                                </Flex>
                            )
                        },
                        {
                            header: 'Tutar',
                            textAlign: 'center',
                            cell: (tx) => (
                                <Text
                                    fontWeight="600"
                                    color={tx.type === 'topup' ? '#4CAF50' : '#1A1A1A'}
                                    fontSize="sm"
                                >
                                    {tx.type === 'topup' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </Text>
                            )
                        },
                        {
                            header: 'Tarih',
                            textAlign: 'center',
                            cell: (tx) => (
                                <Text fontSize="xs" color={isDark ? '#808080' : '#666666'}>
                                    {formatDate(tx.date)}
                                </Text>
                            )
                        },
                        {
                            header: 'İşlemi Yapan',
                            textAlign: 'center',
                            cell: (tx) => (
                                <Text fontSize="xs" color="#555" fontWeight="500">
                                    {tx.admin}
                                </Text>
                            )
                        }
                    ]}
                />
            </Box>
        </Box>
    );
}

export default WalletPage;
