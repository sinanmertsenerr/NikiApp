'use client';

import { useState, useMemo } from 'react';
import {
    Box,
    Flex,
    Text,
    Input,
    Badge,
    Icon,
    Button,
    Grid,
    GridItem,
    Portal,
} from '@chakra-ui/react';
import { useColorMode } from '../components/ui/ColorModeProvider';
import {
    LuSearch,
    LuMail,
    LuPhone,
    LuWallet,
    LuUsers,
    LuUserCheck,
    LuUserPlus,
    LuFilter,
    LuX,
    LuCircleArrowUp,
    LuCircleArrowDown,
    LuGift,
    LuCreditCard,
    LuClock,
    LuCalendar,
    LuCircleDot,
    LuStar,
} from 'react-icons/lu';
import { Header } from '../components/layout';
import { StatCard } from '../components/cards/StatCard';
import { PageHeader } from '../components/shared/PageHeader';
import { FilterTabs } from '../components/shared/FilterTabs';
import type { ColumnDef } from '../types';
import { DataTable } from '../components/shared/DataTable';

// Extended Mock Data with dual wallets
const mockUsers = [
    { id: '1', firstName: 'Ahmet', lastName: 'Yılmaz', email: 'ahmet.yilmaz@ieu.edu.tr', phone: '+90 532 123 4567', role: 'user', isActive: true, ieuBalance: 1250.50, nikiBalance: 340.00, ieuActive: true, nikiActive: true, avatarUrl: null, createdAt: '2025-12-15T10:30:00Z', lastLoginAt: '2026-01-08T12:30:00Z', loyaltyPoints: 450 },
    { id: '2', firstName: 'Zeynep', lastName: 'Kaya', email: 'zeynep.kaya@gmail.com', phone: '+90 533 234 5678', role: 'user', isActive: true, ieuBalance: 0, nikiBalance: 340.00, ieuActive: false, nikiActive: true, avatarUrl: null, createdAt: '2025-12-20T14:15:00Z', lastLoginAt: '2026-01-07T18:45:00Z', loyaltyPoints: 120 },
    { id: '3', firstName: 'Mehmet', lastName: 'Demir', email: 'mehmet.demir@ieu.edu.tr', phone: '+90 534 345 6789', role: 'user', isActive: true, ieuBalance: 890.25, nikiBalance: 125.00, ieuActive: true, nikiActive: true, avatarUrl: null, createdAt: '2025-11-05T09:00:00Z', lastLoginAt: '2026-01-08T09:15:00Z', loyaltyPoints: 780 },
    { id: '4', firstName: 'Elif', lastName: 'Şahin', email: 'elif.sahin@hotmail.com', phone: '+90 535 456 7890', role: 'user', isActive: false, ieuBalance: 0, nikiBalance: 0, ieuActive: false, nikiActive: true, avatarUrl: null, createdAt: '2025-10-22T16:45:00Z', lastLoginAt: '2025-12-28T11:20:00Z', loyaltyPoints: 50 },
    { id: '5', firstName: 'Can', lastName: 'Öztürk', email: 'can.ozturk@ieu.edu.tr', phone: '+90 536 567 8901', role: 'admin', isActive: true, ieuBalance: 2100.00, nikiBalance: 450.00, ieuActive: true, nikiActive: true, avatarUrl: null, createdAt: '2025-09-10T11:20:00Z', lastLoginAt: '2026-01-08T10:00:00Z', loyaltyPoints: 1250 },
    { id: '6', firstName: 'Selin', lastName: 'Arslan', email: 'selin.arslan@gmail.com', phone: '+90 537 678 9012', role: 'user', isActive: true, ieuBalance: 0, nikiBalance: 455.75, ieuActive: false, nikiActive: true, avatarUrl: null, createdAt: '2025-12-01T08:30:00Z', lastLoginAt: '2026-01-06T14:30:00Z', loyaltyPoints: 320 },
    { id: '7', firstName: 'Burak', lastName: 'Çelik', email: 'burak.celik@ieu.edu.tr', phone: '+90 538 789 0123', role: 'user', isActive: true, ieuBalance: 678.50, nikiBalance: 220.00, ieuActive: true, nikiActive: true, avatarUrl: null, createdAt: '2025-11-18T13:10:00Z', lastLoginAt: '2026-01-08T08:00:00Z', loyaltyPoints: 560 },
    { id: '8', firstName: 'Ayşe', lastName: 'Koç', email: 'ayse.koc@outlook.com', phone: '+90 539 890 1234', role: 'user', isActive: true, ieuBalance: 0, nikiBalance: 125.00, ieuActive: false, nikiActive: true, avatarUrl: null, createdAt: '2025-12-28T15:55:00Z', lastLoginAt: '2026-01-07T16:20:00Z', loyaltyPoints: 85 },
    { id: '9', firstName: 'Emre', lastName: 'Yıldız', email: 'emre.yildiz@ieu.edu.tr', phone: '+90 540 901 2345', role: 'user', isActive: true, ieuBalance: 1890.00, nikiBalance: 560.00, ieuActive: true, nikiActive: true, avatarUrl: null, createdAt: '2025-08-25T10:00:00Z', lastLoginAt: '2026-01-08T11:45:00Z', loyaltyPoints: 2100 },
    { id: '10', firstName: 'Deniz', lastName: 'Aydın', email: 'deniz.aydin@gmail.com', phone: '+90 541 012 3456', role: 'user', isActive: false, ieuBalance: 0, nikiBalance: 50.00, ieuActive: false, nikiActive: true, avatarUrl: null, createdAt: '2025-07-15T17:30:00Z', lastLoginAt: '2025-11-20T09:00:00Z', loyaltyPoints: 30 },
    { id: '11', firstName: 'Sinan', lastName: 'Sener', email: 'sinan@nikithecat.com', phone: '+90 542 123 4567', role: 'super_admin', isActive: true, ieuBalance: 5000.00, nikiBalance: 2500.00, ieuActive: true, nikiActive: true, avatarUrl: null, createdAt: '2025-01-01T00:00:00Z', lastLoginAt: '2026-01-08T12:45:00Z', loyaltyPoints: 9999 },
    { id: '12', firstName: 'Merve', lastName: 'Aksoy', email: 'merve.aksoy@ieu.edu.tr', phone: '+90 543 234 5678', role: 'user', isActive: true, ieuBalance: 320.75, nikiBalance: 180.00, ieuActive: true, nikiActive: true, avatarUrl: null, createdAt: '2026-01-02T09:15:00Z', lastLoginAt: '2026-01-08T07:30:00Z', loyaltyPoints: 95 },
];

// Mock transaction history for users
const mockTransactionHistory = [
    { id: 't1', userId: '1', type: 'topup', amount: 500, wallet: 'IEU', date: '2026-01-08T14:32:00', admin: 'Sinan Sener' },
    { id: 't2', userId: '1', type: 'payment', amount: 45.50, wallet: 'IEU', date: '2026-01-08T10:15:00', admin: 'Can Öztürk' },
    { id: 't3', userId: '1', type: 'topup', amount: 200, wallet: 'NIKI', date: '2026-01-07T16:30:00', admin: 'Sinan Sener' },
    { id: 't4', userId: '1', type: 'payment', amount: 32.00, wallet: 'NIKI', date: '2026-01-07T12:00:00', admin: 'Can Öztürk' },
    { id: 't5', userId: '1', type: 'payment', amount: 78.25, wallet: 'IEU', date: '2026-01-06T09:45:00', admin: 'Sinan Sener' },
    { id: 't6', userId: '2', type: 'topup', amount: 340, wallet: 'NIKI', date: '2026-01-08T11:00:00', admin: 'Sinan Sener' },
    { id: 't7', userId: '2', type: 'payment', amount: 25.00, wallet: 'NIKI', date: '2026-01-07T14:20:00', admin: 'Can Öztürk' },
    { id: 't8', userId: '3', type: 'topup', amount: 1000, wallet: 'IEU', date: '2026-01-08T09:00:00', admin: 'Sinan Sener' },
    { id: 't9', userId: '3', type: 'payment', amount: 65.00, wallet: 'IEU', date: '2026-01-07T15:30:00', admin: 'Can Öztürk' },
];

// Mock campaign usage history
const mockCampaignHistory = [
    { id: 'c1', userId: '1', name: 'Bedava Kahve', status: 'used', usedAt: '2026-01-05T14:30:00', admin: 'Sinan Sener' },
    { id: 'c2', userId: '1', name: '%20 İndirim', status: 'used', usedAt: '2026-01-04T09:45:00', admin: 'Sinan Sener' },
    { id: 'c3', userId: '1', name: 'Kurabiye Hediye', status: 'used', usedAt: '2026-01-02T11:15:00', admin: 'Can Öztürk' },
    { id: 'c4', userId: '2', name: 'Bedava Kahve', status: 'used', usedAt: '2026-01-06T10:00:00', admin: 'Sinan Sener' },
    { id: 'c5', userId: '3', name: '%15 İndirim', status: 'expired', usedAt: null, admin: null },
];

// Mock wheel spin history for users
const mockWheelHistory = [
    { id: 'w1', userId: '1', weekNumber: 2, year: 2026, rewardType: 'free_coffee', rewardValue: 'Bedava Kahve', spunAt: '2026-01-08T10:00:00', used: true, usedAt: '2026-01-08T14:30:00' },
    { id: 'w2', userId: '1', weekNumber: 1, year: 2026, rewardType: 'discount', rewardValue: '%30 İndirim', spunAt: '2026-01-02T11:30:00', used: true, usedAt: '2026-01-03T09:15:00' },
    { id: 'w3', userId: '1', weekNumber: 52, year: 2025, rewardType: 'points', rewardValue: '50 Puan', spunAt: '2025-12-28T15:00:00', used: false, usedAt: null },
    { id: 'w4', userId: '2', weekNumber: 2, year: 2026, rewardType: 'free_cookie', rewardValue: 'Kurabiye Hediye', spunAt: '2026-01-07T16:45:00', used: false, usedAt: null },
    { id: 'w5', userId: '2', weekNumber: 1, year: 2026, rewardType: 'nothing', rewardValue: 'Boş', spunAt: '2026-01-01T12:00:00', used: false, usedAt: null },
    { id: 'w6', userId: '3', weekNumber: 2, year: 2026, rewardType: 'second_drink_discount', rewardValue: '2. İçecek %50', spunAt: '2026-01-06T09:30:00', used: true, usedAt: '2026-01-06T09:35:00' },
];

const mockStats = {
    totalUsers: 412,
    activeUsers: 389,
    newThisMonth: 28,
    ieuUsers: 234,
    nikiUsers: 178,
};

type FilterType = 'all' | 'active' | 'customers' | 'admins';
type WalletFilter = 'all' | 'IEU' | 'NIKI';
type ModalTab = 'transactions' | 'campaigns' | 'wheel';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
    ieuBalance: number;
    nikiBalance: number;
    ieuActive: boolean;
    nikiActive: boolean;
    avatarUrl: string | null;
    createdAt: string;
    lastLoginAt: string;
    loyaltyPoints: number;
}

// User Detail Modal Component
function UserDetailModal({ user, onClose }: { user: User; onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<ModalTab>('transactions');
    const [walletFilter, setWalletFilter] = useState<WalletFilter>('all');
    const [campaignStatusFilter, setCampaignStatusFilter] = useState<'all' | 'used' | 'active'>('all');
    const [wheelStatusFilter, setWheelStatusFilter] = useState<'all' | 'used' | 'pending'>('all');
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    const userTransactions = mockTransactionHistory.filter(t => t.userId === user.id);
    const filteredTransactions = walletFilter === 'all'
        ? userTransactions
        : userTransactions.filter(t => t.wallet === walletFilter);

    const userCampaigns = mockCampaignHistory.filter(c => c.userId === user.id);
    const filteredCampaigns = campaignStatusFilter === 'all'
        ? userCampaigns
        : userCampaigns.filter(c => c.status === campaignStatusFilter);

    const userWheelSpins = mockWheelHistory.filter(w => w.userId === user.id);
    const filteredWheelSpins = wheelStatusFilter === 'all'
        ? userWheelSpins
        : wheelStatusFilter === 'used'
            ? userWheelSpins.filter(w => w.used)
            : userWheelSpins.filter(w => !w.used && w.rewardType !== 'nothing');

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(value);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <Portal>
            <Box
                position="fixed"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg="blackAlpha.600"
                zIndex={1000}
                onClick={onClose}
            />
            <Box
                position="fixed"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                bg={isDark ? '#1E1E1E' : 'white'}
                borderRadius="2xl"
                boxShadow="2xl"
                w={{ base: '95%', md: '700px', lg: '800px' }}
                maxH="90vh"
                overflow="hidden"
                zIndex={1001}
            >
                {/* Modal Header */}
                <Flex
                    justify="space-between"
                    align="center"
                    p={4}
                    borderBottom="1px solid"
                    borderColor={isDark ? '#333333' : '#E0E0E0'}
                    bg={isDark ? '#2D2D2D' : '#FAFAFA'}
                >
                    <Text fontWeight="bold" fontSize="md" color={isDark ? '#FFFFFF' : '#1A1A1A'}>
                        Kullanıcı Detayları
                    </Text>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onClose}
                        borderRadius="full"
                        p={1}
                    >
                        <Icon as={LuX} boxSize={5} color={isDark ? '#FFFFFF' : 'inherit'} />
                    </Button>
                </Flex>

                {/* Modal Content */}
                <Box maxH="calc(90vh - 60px)" overflow="auto" p={5}>
                    {/* User Info Header */}
                    <Flex gap={5} mb={4}>
                        {/* Avatar */}
                        <Flex
                            w="80px"
                            h="80px"
                            borderRadius="xl"
                            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                            color="white"
                            align="center"
                            justify="center"
                            fontWeight="bold"
                            fontSize="2xl"
                            flexShrink={0}
                        >
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </Flex>

                        {/* Info Grid */}
                        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={3} flex={1}>
                            {/* Row 1 */}
                            <Box>
                                <Text fontSize="xs" color="#888" mb={1}>Ad-Soyad</Text>
                                <Text fontWeight="semibold" color={isDark ? '#FFFFFF' : '#1A1A1A'} fontSize="sm">
                                    {user.firstName} {user.lastName}
                                </Text>
                            </Box>
                            <Box>
                                <Text fontSize="xs" color="#888" mb={1}>İletişim</Text>
                                <Flex align="center" gap={1} mb={0.5}>
                                    <Icon as={LuMail} boxSize={3} color={isDark ? '#808080' : '#666'} />
                                    <Text fontSize="xs" color={isDark ? '#B0B0B0' : '#1A1A1A'}>{user.email}</Text>
                                </Flex>
                                <Flex align="center" gap={1}>
                                    <Icon as={LuPhone} boxSize={3} color={isDark ? '#808080' : '#666'} />
                                    <Text fontSize="xs" color={isDark ? '#B0B0B0' : '#1A1A1A'}>{user.phone}</Text>
                                </Flex>
                            </Box>
                            <Box>
                                <Text fontSize="xs" color="#888" mb={1}>Durum</Text>
                                <Badge
                                    colorPalette={user.isActive ? 'green' : 'red'}
                                    variant="subtle"
                                    fontSize="xs"
                                >
                                    {user.isActive ? 'Aktif' : 'Pasif'}
                                </Badge>
                            </Box>

                            {/* Row 2 */}
                            <Box>
                                <Text fontSize="xs" color="#888" mb={1}>IEU Cüzdan</Text>
                                <Flex align="center" gap={2}>
                                    <Text fontWeight="semibold" color={user.ieuActive ? '#FF9800' : '#999'} fontSize="sm">
                                        {formatCurrency(user.ieuBalance)}
                                    </Text>
                                    <Badge
                                        bg={user.ieuActive ? '#FFF3E0' : '#F5F5F5'}
                                        color={user.ieuActive ? '#FF9800' : '#999'}
                                        fontSize="2xs"
                                    >
                                        {user.ieuActive ? 'Aktif' : 'Pasif'}
                                    </Badge>
                                </Flex>
                            </Box>
                            <Box>
                                <Text fontSize="xs" color="#888" mb={1}>NIKI Cüzdan</Text>
                                <Flex align="center" gap={2}>
                                    <Text fontWeight="semibold" color={isDark ? '#FFFFFF' : '#1A1A1A'} fontSize="sm">
                                        {formatCurrency(user.nikiBalance)}
                                    </Text>
                                    <Badge
                                        bg={user.nikiActive ? '#E8F5E9' : '#F5F5F5'}
                                        color={user.nikiActive ? '#4CAF50' : '#999'}
                                        fontSize="2xs"
                                    >
                                        {user.nikiActive ? 'Aktif' : 'Pasif'}
                                    </Badge>
                                </Flex>
                            </Box>
                            <Box>
                                <Text fontSize="xs" color="#888" mb={1}>Rol</Text>
                                <Badge
                                    colorPalette={user.role === 'super_admin' ? 'red' : user.role === 'admin' ? 'purple' : 'gray'}
                                    variant="subtle"
                                    fontSize="xs"
                                >
                                    {user.role === 'super_admin' ? 'Süper Admin' : user.role === 'admin' ? 'Admin' : 'Müşteri'}
                                </Badge>
                            </Box>
                        </Grid>
                    </Flex>

                    {/* Extra Info Row - Registration, Last Login, Loyalty Points */}
                    <Flex
                        gap={4}
                        mb={4}
                        p={3}
                        bg={isDark ? '#2D2D2D' : '#F8F9FA'}
                        borderRadius="lg"
                        justify="space-between"
                    >
                        <Flex align="center" gap={2}>
                            <Icon as={LuCalendar} boxSize={4} color="#666" />
                            <Box>
                                <Text fontSize="2xs" color={isDark ? '#808080' : '#888'}>Kayıt Tarihi</Text>
                                <Text fontSize="xs" color={isDark ? '#FFFFFF' : '#1A1A1A'} fontWeight="medium">{formatDate(user.createdAt)}</Text>
                            </Box>
                        </Flex>
                        <Flex align="center" gap={2}>
                            <Icon as={LuClock} boxSize={4} color={isDark ? '#808080' : '#666'} />
                            <Box>
                                <Text fontSize="2xs" color={isDark ? '#808080' : '#888'}>Son Giriş</Text>
                                <Text fontSize="xs" color={isDark ? '#FFFFFF' : '#1A1A1A'} fontWeight="medium">{formatDateTime(user.lastLoginAt)}</Text>
                            </Box>
                        </Flex>
                        <Flex align="center" gap={2}>
                            <Icon as={LuStar} boxSize={4} color="#FFB300" />
                            <Box>
                                <Text fontSize="2xs" color="#888">Sadakat Puanı</Text>
                                <Text fontSize="sm" color="#FFB300" fontWeight="bold">{user.loyaltyPoints.toLocaleString('tr-TR')}</Text>
                            </Box>
                        </Flex>
                    </Flex>

                    {/* Tabs */}
                    <Flex
                        gap={1}
                        mb={3}
                        borderBottom="2px solid"
                        borderColor={isDark ? '#333333' : '#E0E0E0'}
                    >
                        <Button
                            variant="ghost"
                            size="sm"
                            px={4}
                            py={2}
                            borderRadius="none"
                            borderBottom="2px solid"
                            borderColor={activeTab === 'transactions' ? '#1976D2' : 'transparent'}
                            color={activeTab === 'transactions' ? '#1976D2' : (isDark ? '#808080' : '#666')}
                            fontWeight={activeTab === 'transactions' ? 'semibold' : 'normal'}
                            mb="-2px"
                            onClick={() => setActiveTab('transactions')}
                            _hover={{ bg: activeTab === 'transactions' ? 'transparent' : (isDark ? '#2D2D2D' : '#F5F5F5') }}
                        >
                            <Icon as={LuCreditCard} boxSize={4} mr={2} />
                            İşlemler
                            <Badge ml={2} bg={isDark ? '#333333' : '#E0E0E0'} color={isDark ? '#B0B0B0' : '#666'} fontSize="2xs">{userTransactions.length}</Badge>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            px={4}
                            py={2}
                            borderRadius="none"
                            borderBottom="2px solid"
                            borderColor={activeTab === 'campaigns' ? '#9C27B0' : 'transparent'}
                            color={activeTab === 'campaigns' ? '#9C27B0' : (isDark ? '#808080' : '#666')}
                            fontWeight={activeTab === 'campaigns' ? 'semibold' : 'normal'}
                            mb="-2px"
                            onClick={() => setActiveTab('campaigns')}
                            _hover={{ bg: activeTab === 'campaigns' ? 'transparent' : (isDark ? '#2D2D2D' : '#F5F5F5') }}
                        >
                            <Icon as={LuGift} boxSize={4} mr={2} />
                            Kampanyalar
                            <Badge ml={2} bg={isDark ? '#333333' : '#E0E0E0'} color={isDark ? '#B0B0B0' : '#666'} fontSize="2xs">{userCampaigns.length}</Badge>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            px={4}
                            py={2}
                            borderRadius="none"
                            borderBottom="2px solid"
                            borderColor={activeTab === 'wheel' ? '#FF6B35' : 'transparent'}
                            color={activeTab === 'wheel' ? '#FF6B35' : (isDark ? '#808080' : '#666')}
                            fontWeight={activeTab === 'wheel' ? 'semibold' : 'normal'}
                            mb="-2px"
                            onClick={() => setActiveTab('wheel')}
                            _hover={{ bg: activeTab === 'wheel' ? 'transparent' : (isDark ? '#2D2D2D' : '#F5F5F5') }}
                        >
                            <Icon as={LuCircleDot} boxSize={4} mr={2} />
                            Gizemli Kutu
                            <Badge ml={2} bg={isDark ? '#333333' : '#E0E0E0'} color={isDark ? '#B0B0B0' : '#666'} fontSize="2xs">{userWheelSpins.length}</Badge>
                        </Button>
                    </Flex>

                    {/* Tab Content */}
                    <Box
                        border="1px solid"
                        borderColor={isDark ? '#333333' : '#E0E0E0'}
                        borderRadius="xl"
                        overflow="hidden"
                    >
                        {/* Transaction History Tab */}
                        {activeTab === 'transactions' && (
                            <>
                                {/* Wallet Filter */}
                                <Flex p={3} bg={isDark ? '#2D2D2D' : '#FAFAFA'} justify="flex-end" borderBottom="1px solid" borderColor={isDark ? '#333333' : '#E0E0E0'}>
                                    <FilterTabs
                                        options={[{ key: 'all', label: 'Tümü' }, { key: 'IEU', label: 'IEU' }, { key: 'NIKI', label: 'NIKI' }]}
                                        activeFilter={walletFilter}
                                        onChange={setWalletFilter}
                                        size="xs"
                                        bg="transparent"
                                    />
                                </Flex>
                                <DataTable
                                    data={filteredTransactions}
                                    keyExtractor={(tx) => tx.id}
                                    showHeader={false}
                                    noWrapper
                                    maxHeight="170px"
                                    emptyMessage="İşlem bulunamadı"
                                    columns={[
                                        {
                                            header: '',
                                            width: '50px',
                                            px: 3,
                                            cell: (tx) => (
                                                <Badge
                                                    bg={tx.wallet === 'IEU' ? '#FF9800' : (isDark ? '#FFFFFF' : '#1A1A1A')}
                                                    color={tx.wallet === 'IEU' ? 'white' : (isDark ? '#1A1A1A' : 'white')}
                                                    fontSize="2xs"
                                                >
                                                    {tx.wallet}
                                                </Badge>
                                            )
                                        },
                                        {
                                            header: '',
                                            width: '120px',
                                            cell: (tx) => (
                                                <Flex align="center" gap={2}>
                                                    <Icon
                                                        as={tx.type === 'topup' ? LuCircleArrowUp : LuCircleArrowDown}
                                                        color={tx.type === 'topup' ? '#4CAF50' : '#E57373'}
                                                        boxSize={4}
                                                    />
                                                    <Text fontWeight="medium" fontSize="sm" color={isDark ? '#FFFFFF' : '#1A1A1A'}>
                                                        {tx.type === 'topup' ? 'Yükleme' : 'Ödeme'}
                                                    </Text>
                                                </Flex>
                                            )
                                        },
                                        {
                                            header: '',
                                            width: '110px',
                                            cell: (tx) => (
                                                <Text
                                                    fontWeight="semibold"
                                                    color={tx.type === 'topup' ? '#4CAF50' : '#E57373'}
                                                    fontSize="sm"
                                                >
                                                    {tx.type === 'topup' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                </Text>
                                            )
                                        },
                                        {
                                            header: '',
                                            width: '100px',
                                            cell: (tx) => (
                                                <Box>
                                                    <Text fontSize="xs" color={isDark ? '#D0D0D0' : '#555'}>{formatDate(tx.date)}</Text>
                                                    <Text fontSize="xs" color={isDark ? '#A0A0A0' : '#888'}>{formatTime(tx.date)}</Text>
                                                </Box>
                                            )
                                        },
                                        {
                                            header: '',
                                            width: '160px',
                                            cell: (tx) => (
                                                <Flex align="center" gap={2}>
                                                    <Flex
                                                        w={6}
                                                        h={6}
                                                        borderRadius="full"
                                                        bg="#E3F2FD"
                                                        color="#1976D2"
                                                        align="center"
                                                        justify="center"
                                                        fontSize="2xs"
                                                        fontWeight="bold"
                                                    >
                                                        {tx.admin.split(' ').map(n => n[0]).join('')}
                                                    </Flex>
                                                    <Box>
                                                        <Text fontSize="2xs" color={isDark ? '#A0A0A0' : '#999'}>İşlemi Yapan</Text>
                                                        <Text fontSize="xs" color={isDark ? '#D0D0D0' : '#555'} fontWeight="medium">{tx.admin}</Text>
                                                    </Box>
                                                </Flex>
                                            )
                                        }
                                    ]}
                                />
                            </>
                        )}

                        {/* Campaigns Tab */}
                        {activeTab === 'campaigns' && (
                            <>
                                {/* Campaign Status Filter */}
                                <Flex p={3} bg={isDark ? '#2D2D2D' : '#FAFAFA'} justify="flex-end" borderBottom="1px solid" borderColor={isDark ? '#333333' : '#E0E0E0'}>
                                    <FilterTabs
                                        options={[{ key: 'all', label: 'Tümü' }, { key: 'used', label: 'Kullanıldı' }, { key: 'active', label: 'Bekliyor' }]}
                                        activeFilter={campaignStatusFilter}
                                        onChange={setCampaignStatusFilter}
                                        size="xs"
                                        bg="transparent"
                                    />
                                </Flex>
                                <DataTable
                                    data={filteredCampaigns}
                                    keyExtractor={(c) => c.id}
                                    showHeader={false}
                                    noWrapper
                                    maxHeight="170px"
                                    emptyMessage="Kampanya bulunamadı"
                                    columns={[
                                        {
                                            header: '',
                                            width: '50px',
                                            px: 3,
                                            cell: () => (
                                                <Icon as={LuGift} color="#9C27B0" boxSize={4} />
                                            )
                                        },
                                        {
                                            header: '',
                                            width: '120px',
                                            cell: (c) => (
                                                <Text fontWeight="medium" fontSize="sm" color={isDark ? '#FFFFFF' : '#1A1A1A'}>
                                                    {c.name}
                                                </Text>
                                            )
                                        },
                                        {
                                            header: '',
                                            width: '110px',
                                            cell: (c) => (
                                                <Badge
                                                    bg={c.status === 'used'
                                                        ? (isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9')
                                                        : c.status === 'active'
                                                            ? (isDark ? 'rgba(33, 150, 243, 0.15)' : '#E3F2FD')
                                                            : (isDark ? 'rgba(158, 158, 158, 0.15)' : '#F5F5F5')}
                                                    color={c.status === 'used'
                                                        ? (isDark ? '#81C784' : '#66BB6A')
                                                        : c.status === 'active'
                                                            ? (isDark ? '#64B5F6' : '#42A5F5')
                                                            : (isDark ? '#9E9E9E' : '#757575')}
                                                    fontSize="2xs"
                                                    px={2}
                                                    py={1}
                                                    borderRadius="md"
                                                >
                                                    {c.status === 'used' ? 'Kullanıldı' : c.status === 'active' ? 'Aktif' : 'Süresi Doldu'}
                                                </Badge>
                                            )
                                        },
                                        {
                                            header: '',
                                            width: '100px',
                                            cell: (c) => (
                                                <Box>
                                                    <Text fontSize="xs" color={isDark ? '#D0D0D0' : '#555'}>
                                                        {c.usedAt ? formatDate(c.usedAt) : '-'}
                                                    </Text>
                                                    <Text fontSize="xs" color={isDark ? '#A0A0A0' : '#888'}>
                                                        {c.usedAt ? formatTime(c.usedAt) : ''}
                                                    </Text>
                                                </Box>
                                            )
                                        },
                                        {
                                            header: '',
                                            width: '160px',
                                            cell: (c) => (
                                                c.admin ? (
                                                    <Flex align="center" gap={2}>
                                                        <Flex
                                                            w={6}
                                                            h={6}
                                                            borderRadius="full"
                                                            bg="#E3F2FD"
                                                            color="#1976D2"
                                                            align="center"
                                                            justify="center"
                                                            fontSize="2xs"
                                                            fontWeight="bold"
                                                        >
                                                            {c.admin.split(' ').map(n => n[0]).join('')}
                                                        </Flex>
                                                        <Box>
                                                            <Text fontSize="2xs" color={isDark ? '#A0A0A0' : '#999'}>İşlemi Yapan</Text>
                                                            <Text fontSize="xs" color={isDark ? '#D0D0D0' : '#555'} fontWeight="medium">{c.admin}</Text>
                                                        </Box>
                                                    </Flex>
                                                ) : (
                                                    <Text fontSize="xs" color={isDark ? '#808080' : '#999'}>-</Text>
                                                )
                                            )
                                        }
                                    ]}
                                />
                            </>
                        )}

                        {/* Wheel Spin Tab */}
                        {activeTab === 'wheel' && (
                            <>
                                {/* Wheel Status Filter */}
                                <Flex p={3} bg={isDark ? '#2D2D2D' : '#FAFAFA'} justify="flex-end" borderBottom="1px solid" borderColor={isDark ? '#333333' : '#E0E0E0'}>
                                    <FilterTabs
                                        options={[{ key: 'all', label: 'Tümü' }, { key: 'used', label: 'Kullanıldı' }, { key: 'pending', label: 'Bekliyor' }]}
                                        activeFilter={wheelStatusFilter}
                                        onChange={setWheelStatusFilter}
                                        size="xs"
                                        bg="transparent"
                                    />
                                </Flex>
                                <DataTable
                                    data={filteredWheelSpins}
                                    keyExtractor={(spin) => spin.id}
                                    showHeader={false}
                                    noWrapper
                                    maxHeight="170px"
                                    emptyMessage="Gizemli kutu geçmişi bulunamadı"
                                    columns={[
                                        {
                                            header: '',
                                            width: '50px',
                                            px: 3,
                                            cell: () => (
                                                <Icon as={LuCircleDot} color="#FF6B35" boxSize={4} />
                                            )
                                        },
                                        {
                                            header: '',
                                            width: '140px',
                                            cell: (spin) => (
                                                <Box>
                                                    <Text fontWeight="medium" fontSize="sm" color={isDark ? '#FFFFFF' : '#1A1A1A'}>
                                                        {spin.rewardValue}
                                                    </Text>
                                                    <Text fontSize="2xs" color={isDark ? '#A0A0A0' : '#888'}>
                                                        Hafta {spin.weekNumber} / {spin.year}
                                                    </Text>
                                                </Box>
                                            )
                                        },
                                        {
                                            header: '',
                                            width: '90px',
                                            cell: (spin) => (
                                                <Badge
                                                    bg={spin.used
                                                        ? (isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9')
                                                        : spin.rewardType === 'nothing'
                                                            ? (isDark ? 'rgba(158, 158, 158, 0.15)' : '#F5F5F5')
                                                            : (isDark ? 'rgba(255, 152, 0, 0.15)' : '#FFF3E0')}
                                                    color={spin.used
                                                        ? (isDark ? '#81C784' : '#66BB6A')
                                                        : spin.rewardType === 'nothing'
                                                            ? (isDark ? '#9E9E9E' : '#757575')
                                                            : (isDark ? '#FFB74D' : '#FFA726')}
                                                    fontSize="2xs"
                                                    px={2}
                                                    py={1}
                                                    borderRadius="md"
                                                >
                                                    {spin.used ? 'Kullanıldı' : spin.rewardType === 'nothing' ? 'Boş' : 'Bekliyor'}
                                                </Badge>
                                            )
                                        },
                                        {
                                            header: '',
                                            width: '100px',
                                            cell: (spin) => (
                                                <Box>
                                                    <Text fontSize="xs" color={isDark ? '#D0D0D0' : '#555'}>{formatDate(spin.spunAt)}</Text>
                                                    <Text fontSize="xs" color={isDark ? '#A0A0A0' : '#888'}>{formatTime(spin.spunAt)}</Text>
                                                </Box>
                                            )
                                        },
                                        {
                                            header: '',
                                            width: '160px',
                                            cell: (spin) => (
                                                spin.usedAt ? (
                                                    <Box>
                                                        <Text fontSize="2xs" color={isDark ? '#A0A0A0' : '#888'}>Kullanım Tarihi</Text>
                                                        <Text fontSize="xs" color={isDark ? '#D0D0D0' : '#555'} fontWeight="medium">
                                                            {formatDateTime(spin.usedAt)}
                                                        </Text>
                                                    </Box>
                                                ) : (
                                                    <Text fontSize="xs" color={isDark ? '#808080' : '#999'}>-</Text>
                                                )
                                            )
                                        }
                                    ]}
                                />
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
        </Portal>
    );
}

export function UsersPage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    const filteredUsers = useMemo(() => {
        return mockUsers.filter((user) => {
            const searchLower = search.toLowerCase();
            const matchesSearch =
                user.firstName.toLowerCase().includes(searchLower) ||
                user.lastName.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower) ||
                user.phone.includes(search);

            let matchesFilter = true;
            if (filter === 'active') matchesFilter = user.isActive;
            if (filter === 'customers') matchesFilter = user.role === 'user';
            if (filter === 'admins') matchesFilter = user.role === 'admin' || user.role === 'super_admin';

            return matchesSearch && matchesFilter;
        });
    }, [search, filter]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(value);
    };

    return (
        <Box h="100vh" overflow="hidden" display="flex" flexDirection="column" bg={isDark ? '#121212' : '#FFFFFF'} transition="background 0.2s">
            <Header />

            <Box p={4} flex={1} overflow="hidden" display="flex" flexDirection="column">
                {/* Page Title */}
                <PageHeader
                    title="Kullanıcılar"
                    subtitle={`${mockStats.totalUsers} kullanıcı kayıtlı`}
                />

                {/* Stats Grid */}
                <Grid templateColumns={{ base: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }} gap={3} mb={3}>
                    <GridItem>
                        <StatCard label="Toplam" value={mockStats.totalUsers} icon={LuUsers} color="brand" subtitle="Kayıtlı" />
                    </GridItem>
                    <GridItem>
                        <StatCard label="Aktif" value={mockStats.activeUsers} icon={LuUserCheck} color="green" subtitle={`%${((mockStats.activeUsers / mockStats.totalUsers) * 100).toFixed(0)}`} />
                    </GridItem>
                    <GridItem>
                        <StatCard label="Yeni" value={mockStats.newThisMonth} icon={LuUserPlus} color="blue" subtitle="Bu ay" />
                    </GridItem>
                    <GridItem>
                        <StatCard label="IEU Card" value={mockStats.ieuUsers} icon={LuWallet} color="ieu" subtitle="%15" />
                    </GridItem>
                    <GridItem>
                        <StatCard label="NIKI Card" value={mockStats.nikiUsers} icon={LuWallet} color="niki" subtitle="%10" />
                    </GridItem>
                </Grid>

                {/* Search & Filter */}
                <Flex gap={3} mb={3} flexWrap="wrap">
                    <Flex bg={isDark ? '#1E1E1E' : 'white'} borderRadius="lg" border="1px solid" borderColor={isDark ? '#333333' : '#E0E0E0'} px={3} py={1} align="center" flex={1} minW="200px" maxW="300px">
                        <Icon as={LuSearch} color={isDark ? '#808080' : '#666666'} mr={2} boxSize={4} />
                        <Input
                            placeholder="Ara..."
                            border="none"
                            _focus={{ boxShadow: 'none' }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            size="sm"
                            color={isDark ? '#FFFFFF' : 'inherit'}
                            _placeholder={{ color: isDark ? '#666666' : 'gray.400' }}
                        />
                    </Flex>
                    <Flex align="center" gap={1}>
                        <Icon as={LuFilter} color={isDark ? '#808080' : '#666666'} boxSize={4} />
                        <FilterTabs
                            options={[
                                { key: 'all', label: 'Tümü' },
                                { key: 'active', label: 'Aktif' },
                                { key: 'customers', label: 'Müşteriler' },
                                { key: 'admins', label: 'Adminler' },
                            ]}
                            activeFilter={filter}
                            onChange={(key: string) => setFilter(key as FilterType)}
                            size="xs"
                        />
                    </Flex>
                </Flex>

                <DataTable
                    flex={1}
                    data={filteredUsers}
                    keyExtractor={(user) => user.id}
                    columns={[
                        {
                            header: 'Kullanıcı',
                            width: 'auto',
                            cell: (user) => (
                                <Flex align="center" gap={2}>
                                    <Flex
                                        w={8} h={8} borderRadius="lg"
                                        bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                        color="white"
                                        align="center" justify="center" fontWeight="semibold" fontSize="xs"
                                    >
                                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                    </Flex>
                                    <Text fontWeight="medium" color={isDark ? '#FFFFFF' : '#1A1A1A'} fontSize="sm">
                                        {user.firstName} {user.lastName}
                                    </Text>
                                </Flex>
                            )
                        },
                        {
                            header: 'İletişim',
                            width: 'auto',
                            cell: (user) => (
                                <Flex flexDir="column" gap={0}>
                                    <Flex align="center" gap={1}>
                                        <Icon as={LuMail} boxSize={3} color={isDark ? '#A0A0A0' : '#666666'} />
                                        <Text fontSize="xs" color={isDark ? '#D0D0D0' : '#555555'}>{user.email}</Text>
                                    </Flex>
                                    <Flex align="center" gap={1}>
                                        <Icon as={LuPhone} boxSize={3} color={isDark ? '#A0A0A0' : '#666666'} />
                                        <Text fontSize="xs" color={isDark ? '#D0D0D0' : '#555555'}>{user.phone}</Text>
                                    </Flex>
                                </Flex>
                            )
                        },
                        {
                            header: 'Toplam Bakiye',
                            width: 'auto',
                            cell: (user) => (
                                <Flex align="center" gap={2}>
                                    <Icon as={LuCreditCard} boxSize={4} color="#4CAF50" />
                                    <Text fontWeight="medium" color={isDark ? '#FFFFFF' : '#1A1A1A'} fontSize="sm">
                                        {formatCurrency(user.ieuBalance + user.nikiBalance)}
                                    </Text>
                                </Flex>
                            )
                        },
                        {
                            header: 'Rol',
                            width: 'auto',
                            cell: (user) => (
                                <Badge
                                    colorPalette={user.role === 'super_admin' ? 'red' : user.role === 'admin' ? 'purple' : 'gray'}
                                    variant="subtle"
                                    fontSize="xs"
                                >
                                    {user.role === 'super_admin' ? 'S.Admin' : user.role === 'admin' ? 'Admin' : 'Müşteri'}
                                </Badge>
                            )
                        },
                        {
                            header: 'Durum',
                            width: 'auto',
                            cell: (user) => (
                                <Badge
                                    bg={user.isActive
                                        ? (isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9')
                                        : (isDark ? 'rgba(239, 83, 80, 0.15)' : '#FFEBEE')}
                                    color={user.isActive
                                        ? (isDark ? '#81C784' : '#66BB6A')
                                        : (isDark ? '#EF9A9A' : '#E57373')}
                                    fontSize="xs"
                                    px={2}
                                    py={1}
                                    borderRadius="md"
                                >
                                    {user.isActive ? 'Aktif' : 'Pasif'}
                                </Badge>
                            )
                        }
                    ]}
                    onRowClick={(user) => setSelectedUser(user)}
                    emptyMessage="Kullanıcı bulunamadı"
                />
            </Box>

            {/* User Detail Modal */}
            {selectedUser && (
                <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
            )}
        </Box>
    );
}

export default UsersPage;
