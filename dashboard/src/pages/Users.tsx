'use client';

import { useState, useMemo } from 'react';
import {
    Box,
    Flex,
    Text,
    Input,
    Badge,
    Table,
    Icon,
    Button,
    Grid,
    GridItem,
    Portal,
} from '@chakra-ui/react';
import {
    LuSearch,
    LuMail,
    LuPhone,
    LuWallet,
    LuUsers,
    LuUserCheck,
    LuUserPlus,
    LuFilter,
    LuChevronLeft,
    LuChevronRight,
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
                bg="white"
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
                    borderColor="#E0E0E0"
                    bg="#FAFAFA"
                >
                    <Text fontWeight="bold" fontSize="md" color="#1A1A1A">
                        Kullanıcı Detayları
                    </Text>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onClose}
                        borderRadius="full"
                        p={1}
                    >
                        <Icon as={LuX} boxSize={5} />
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
                        <Grid templateColumns="repeat(3, 1fr)" gap={3} flex={1}>
                            {/* Row 1 */}
                            <Box>
                                <Text fontSize="xs" color="#888" mb={1}>Ad-Soyad</Text>
                                <Text fontWeight="semibold" color="#1A1A1A" fontSize="sm">
                                    {user.firstName} {user.lastName}
                                </Text>
                            </Box>
                            <Box>
                                <Text fontSize="xs" color="#888" mb={1}>İletişim</Text>
                                <Flex align="center" gap={1} mb={0.5}>
                                    <Icon as={LuMail} boxSize={3} color="#666" />
                                    <Text fontSize="xs" color="#1A1A1A">{user.email}</Text>
                                </Flex>
                                <Flex align="center" gap={1}>
                                    <Icon as={LuPhone} boxSize={3} color="#666" />
                                    <Text fontSize="xs" color="#1A1A1A">{user.phone}</Text>
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
                                    <Text fontWeight="semibold" color="#1A1A1A" fontSize="sm">
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
                        bg="#F8F9FA"
                        borderRadius="lg"
                        justify="space-between"
                    >
                        <Flex align="center" gap={2}>
                            <Icon as={LuCalendar} boxSize={4} color="#666" />
                            <Box>
                                <Text fontSize="2xs" color="#888">Kayıt Tarihi</Text>
                                <Text fontSize="xs" color="#1A1A1A" fontWeight="medium">{formatDate(user.createdAt)}</Text>
                            </Box>
                        </Flex>
                        <Flex align="center" gap={2}>
                            <Icon as={LuClock} boxSize={4} color="#666" />
                            <Box>
                                <Text fontSize="2xs" color="#888">Son Giriş</Text>
                                <Text fontSize="xs" color="#1A1A1A" fontWeight="medium">{formatDateTime(user.lastLoginAt)}</Text>
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
                        borderColor="#E0E0E0"
                    >
                        <Button
                            variant="ghost"
                            size="sm"
                            px={4}
                            py={2}
                            borderRadius="none"
                            borderBottom="2px solid"
                            borderColor={activeTab === 'transactions' ? '#1976D2' : 'transparent'}
                            color={activeTab === 'transactions' ? '#1976D2' : '#666'}
                            fontWeight={activeTab === 'transactions' ? 'semibold' : 'normal'}
                            mb="-2px"
                            onClick={() => setActiveTab('transactions')}
                            _hover={{ bg: activeTab === 'transactions' ? 'transparent' : '#F5F5F5' }}
                        >
                            <Icon as={LuCreditCard} boxSize={4} mr={2} />
                            İşlemler
                            <Badge ml={2} bg="#E0E0E0" color="#666" fontSize="2xs">{userTransactions.length}</Badge>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            px={4}
                            py={2}
                            borderRadius="none"
                            borderBottom="2px solid"
                            borderColor={activeTab === 'campaigns' ? '#9C27B0' : 'transparent'}
                            color={activeTab === 'campaigns' ? '#9C27B0' : '#666'}
                            fontWeight={activeTab === 'campaigns' ? 'semibold' : 'normal'}
                            mb="-2px"
                            onClick={() => setActiveTab('campaigns')}
                            _hover={{ bg: activeTab === 'campaigns' ? 'transparent' : '#F5F5F5' }}
                        >
                            <Icon as={LuGift} boxSize={4} mr={2} />
                            Kampanyalar
                            <Badge ml={2} bg="#E0E0E0" color="#666" fontSize="2xs">{userCampaigns.length}</Badge>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            px={4}
                            py={2}
                            borderRadius="none"
                            borderBottom="2px solid"
                            borderColor={activeTab === 'wheel' ? '#FF6B35' : 'transparent'}
                            color={activeTab === 'wheel' ? '#FF6B35' : '#666'}
                            fontWeight={activeTab === 'wheel' ? 'semibold' : 'normal'}
                            mb="-2px"
                            onClick={() => setActiveTab('wheel')}
                            _hover={{ bg: activeTab === 'wheel' ? 'transparent' : '#F5F5F5' }}
                        >
                            <Icon as={LuCircleDot} boxSize={4} mr={2} />
                            Gizemli Kutu
                            <Badge ml={2} bg="#E0E0E0" color="#666" fontSize="2xs">{userWheelSpins.length}</Badge>
                        </Button>
                    </Flex>

                    {/* Tab Content */}
                    <Box
                        border="1px solid"
                        borderColor="#E0E0E0"
                        borderRadius="xl"
                        overflow="hidden"
                    >
                        {/* Transaction History Tab */}
                        {activeTab === 'transactions' && (
                            <>
                                {/* Wallet Filter */}
                                <Flex p={3} bg="#FAFAFA" justify="flex-end" borderBottom="1px solid" borderColor="#E0E0E0">
                                    <Flex gap={1}>
                                        {(['all', 'IEU', 'NIKI'] as WalletFilter[]).map((w) => (
                                            <Button
                                                key={w}
                                                size="xs"
                                                variant={walletFilter === w ? 'solid' : 'ghost'}
                                                bg={walletFilter === w ? (w === 'IEU' ? '#FF9800' : w === 'NIKI' ? '#1A1A1A' : '#666') : 'transparent'}
                                                color={walletFilter === w ? 'white' : '#666'}
                                                _hover={{ bg: walletFilter === w ? undefined : '#E8E8E8' }}
                                                onClick={() => setWalletFilter(w)}
                                                fontSize="xs"
                                                px={2}
                                            >
                                                {w === 'all' ? 'Tümü' : w}
                                            </Button>
                                        ))}
                                    </Flex>
                                </Flex>
                                <Box h="170px" overflow="auto">
                                    {filteredTransactions.length === 0 ? (
                                        <Flex justify="center" py={4}>
                                            <Text color="#999" fontSize="sm">İşlem bulunamadı</Text>
                                        </Flex>
                                    ) : (
                                        <Table.Root size="sm">
                                            <Table.Body>
                                                {filteredTransactions.map((tx) => (
                                                    <Table.Row key={tx.id} _hover={{ bg: '#FAFAFA' }} h="55px">
                                                        <Table.Cell w="50px" px={3}>
                                                            <Badge
                                                                bg={tx.wallet === 'IEU' ? '#FF9800' : '#1A1A1A'}
                                                                color="white"
                                                                fontSize="2xs"
                                                            >
                                                                {tx.wallet}
                                                            </Badge>
                                                        </Table.Cell>
                                                        <Table.Cell w="120px">
                                                            <Flex align="center" gap={2}>
                                                                <Icon
                                                                    as={tx.type === 'topup' ? LuCircleArrowUp : LuCircleArrowDown}
                                                                    color={tx.type === 'topup' ? '#4CAF50' : '#FF5722'}
                                                                    boxSize={4}
                                                                />
                                                                <Text fontWeight="medium" fontSize="sm" color="#1A1A1A">
                                                                    {tx.type === 'topup' ? 'Yükleme' : 'Ödeme'}
                                                                </Text>
                                                            </Flex>
                                                        </Table.Cell>
                                                        <Table.Cell w="110px">
                                                            <Text
                                                                fontWeight="semibold"
                                                                color={tx.type === 'topup' ? '#4CAF50' : '#1A1A1A'}
                                                                fontSize="sm"
                                                            >
                                                                {tx.type === 'topup' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                            </Text>
                                                        </Table.Cell>
                                                        <Table.Cell w="100px">
                                                            <Box>
                                                                <Text fontSize="xs" color="#666">{formatDate(tx.date)}</Text>
                                                                <Text fontSize="xs" color="#999">{formatTime(tx.date)}</Text>
                                                            </Box>
                                                        </Table.Cell>
                                                        <Table.Cell w="160px">
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
                                                                    <Text fontSize="2xs" color="#999">İşlemi Yapan</Text>
                                                                    <Text fontSize="xs" color="#555" fontWeight="medium">{tx.admin}</Text>
                                                                </Box>
                                                            </Flex>
                                                        </Table.Cell>
                                                    </Table.Row>
                                                ))}
                                            </Table.Body>
                                        </Table.Root>
                                    )}
                                </Box>
                            </>
                        )}

                        {/* Campaigns Tab */}
                        {activeTab === 'campaigns' && (
                            <>
                                {/* Campaign Status Filter */}
                                <Flex p={3} bg="#FAFAFA" justify="flex-end" borderBottom="1px solid" borderColor="#E0E0E0">
                                    <Flex gap={1}>
                                        {(['all', 'used', 'active'] as const).map((s) => (
                                            <Button
                                                key={s}
                                                size="xs"
                                                variant={campaignStatusFilter === s ? 'solid' : 'ghost'}
                                                bg={campaignStatusFilter === s ? '#9C27B0' : 'transparent'}
                                                color={campaignStatusFilter === s ? 'white' : '#666'}
                                                _hover={{ bg: campaignStatusFilter === s ? undefined : '#E8E8E8' }}
                                                onClick={() => setCampaignStatusFilter(s)}
                                                fontSize="xs"
                                                px={2}
                                            >
                                                {s === 'all' ? 'Tümü' : s === 'used' ? 'Kullanıldı' : 'Bekliyor'}
                                            </Button>
                                        ))}
                                    </Flex>
                                </Flex>
                                <Box h="170px" overflow="auto">
                                    {filteredCampaigns.length === 0 ? (
                                        <Flex justify="center" py={4}>
                                            <Text color="#999" fontSize="sm">Kampanya bulunamadı</Text>
                                        </Flex>
                                    ) : (
                                        <Table.Root size="sm">
                                            <Table.Body>
                                                {filteredCampaigns.map((c) => (
                                                    <Table.Row key={c.id} _hover={{ bg: '#FAFAFA' }} h="55px">
                                                        <Table.Cell w="50px" px={3}>
                                                            <Icon as={LuGift} color="#9C27B0" boxSize={4} />
                                                        </Table.Cell>
                                                        <Table.Cell w="120px">
                                                            <Text fontWeight="medium" fontSize="sm" color="#1A1A1A">
                                                                {c.name}
                                                            </Text>
                                                        </Table.Cell>
                                                        <Table.Cell w="110px">
                                                            <Badge
                                                                colorPalette={c.status === 'used' ? 'green' : c.status === 'active' ? 'blue' : 'gray'}
                                                                variant="subtle"
                                                                fontSize="2xs"
                                                            >
                                                                {c.status === 'used' ? 'Kullanıldı' : c.status === 'active' ? 'Aktif' : 'Süresi Doldu'}
                                                            </Badge>
                                                        </Table.Cell>
                                                        <Table.Cell w="100px">
                                                            <Box>
                                                                <Text fontSize="xs" color="#666">
                                                                    {c.usedAt ? formatDate(c.usedAt) : '-'}
                                                                </Text>
                                                                <Text fontSize="xs" color="#999">
                                                                    {c.usedAt ? formatTime(c.usedAt) : ''}
                                                                </Text>
                                                            </Box>
                                                        </Table.Cell>
                                                        <Table.Cell w="160px">
                                                            {c.admin ? (
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
                                                                        <Text fontSize="2xs" color="#999">İşlemi Yapan</Text>
                                                                        <Text fontSize="xs" color="#555" fontWeight="medium">{c.admin}</Text>
                                                                    </Box>
                                                                </Flex>
                                                            ) : (
                                                                <Text fontSize="xs" color="#999">-</Text>
                                                            )}
                                                        </Table.Cell>
                                                    </Table.Row>
                                                ))}
                                            </Table.Body>
                                        </Table.Root>
                                    )}
                                </Box>
                            </>
                        )}

                        {/* Wheel Spin Tab */}
                        {activeTab === 'wheel' && (
                            <>
                                {/* Wheel Status Filter */}
                                <Flex p={3} bg="#FAFAFA" justify="flex-end" borderBottom="1px solid" borderColor="#E0E0E0">
                                    <Flex gap={1}>
                                        {(['all', 'used', 'pending'] as const).map((s) => (
                                            <Button
                                                key={s}
                                                size="xs"
                                                variant={wheelStatusFilter === s ? 'solid' : 'ghost'}
                                                bg={wheelStatusFilter === s ? '#FF6B35' : 'transparent'}
                                                color={wheelStatusFilter === s ? 'white' : '#666'}
                                                _hover={{ bg: wheelStatusFilter === s ? undefined : '#E8E8E8' }}
                                                onClick={() => setWheelStatusFilter(s)}
                                                fontSize="xs"
                                                px={2}
                                            >
                                                {s === 'all' ? 'Tümü' : s === 'used' ? 'Kullanıldı' : 'Bekliyor'}
                                            </Button>
                                        ))}
                                    </Flex>
                                </Flex>
                                <Box h="170px" overflow="auto">
                                    {filteredWheelSpins.length === 0 ? (
                                        <Flex justify="center" py={4}>
                                            <Text color="#999" fontSize="sm">Gizemli kutu geçmişi bulunamadı</Text>
                                        </Flex>
                                    ) : (
                                        <Table.Root size="sm">
                                            <Table.Body>
                                                {filteredWheelSpins.map((spin) => (
                                                    <Table.Row key={spin.id} _hover={{ bg: '#FAFAFA' }} h="55px">
                                                        <Table.Cell w="50px" px={3}>
                                                            <Icon as={LuCircleDot} color="#FF6B35" boxSize={4} />
                                                        </Table.Cell>
                                                        <Table.Cell w="140px">
                                                            <Text fontWeight="medium" fontSize="sm" color="#1A1A1A">
                                                                {spin.rewardValue}
                                                            </Text>
                                                            <Text fontSize="2xs" color="#888">
                                                                Hafta {spin.weekNumber} / {spin.year}
                                                            </Text>
                                                        </Table.Cell>
                                                        <Table.Cell w="90px">
                                                            <Badge
                                                                colorPalette={spin.used ? 'green' : spin.rewardType === 'nothing' ? 'gray' : 'orange'}
                                                                variant="subtle"
                                                                fontSize="2xs"
                                                            >
                                                                {spin.used ? 'Kullanıldı' : spin.rewardType === 'nothing' ? 'Boş' : 'Bekliyor'}
                                                            </Badge>
                                                        </Table.Cell>
                                                        <Table.Cell w="100px">
                                                            <Box>
                                                                <Text fontSize="xs" color="#666">{formatDate(spin.spunAt)}</Text>
                                                                <Text fontSize="xs" color="#999">{formatTime(spin.spunAt)}</Text>
                                                            </Box>
                                                        </Table.Cell>
                                                        <Table.Cell w="160px">
                                                            {spin.usedAt ? (
                                                                <Box>
                                                                    <Text fontSize="2xs" color="#888">Kullanım Tarihi</Text>
                                                                    <Text fontSize="xs" color="#555" fontWeight="medium">
                                                                        {formatDateTime(spin.usedAt)}
                                                                    </Text>
                                                                </Box>
                                                            ) : (
                                                                <Text fontSize="xs" color="#999">-</Text>
                                                            )}
                                                        </Table.Cell>
                                                    </Table.Row>
                                                ))}
                                            </Table.Body>
                                        </Table.Root>
                                    )}
                                </Box>
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
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const itemsPerPage = 8;

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

    const paginatedUsers = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        return filteredUsers.slice(start, start + itemsPerPage);
    }, [filteredUsers, page]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(value);
    };

    return (
        <Box h="100vh" overflow="hidden" display="flex" flexDirection="column">
            <Header />

            <Box p={4} flex={1} overflow="hidden" display="flex" flexDirection="column">
                {/* Page Title */}
                <Box mb={3}>
                    <Text fontSize="lg" fontWeight="bold" color="#1A1A1A">
                        Kullanıcılar
                    </Text>
                    <Text fontSize="xs" color="#666666">
                        {mockStats.totalUsers} kullanıcı kayıtlı
                    </Text>
                </Box>

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
                    <Flex bg="white" borderRadius="lg" border="1px solid" borderColor="#E0E0E0" px={3} py={1} align="center" flex={1} minW="200px" maxW="300px">
                        <Icon as={LuSearch} color="#666666" mr={2} boxSize={4} />
                        <Input
                            placeholder="Ara..."
                            border="none"
                            _focus={{ boxShadow: 'none' }}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            size="sm"
                        />
                    </Flex>
                    <Flex align="center" gap={1}>
                        <Icon as={LuFilter} color="#666666" boxSize={4} />
                        {[
                            { key: 'all', label: 'Tümü' },
                            { key: 'active', label: 'Aktif' },
                            { key: 'customers', label: 'Müşteriler' },
                            { key: 'admins', label: 'Adminler' },
                        ].map((f) => (
                            <Button
                                key={f.key}
                                size="xs"
                                variant={filter === f.key ? 'solid' : 'ghost'}
                                bg={filter === f.key ? '#1A1A1A' : 'transparent'}
                                color={filter === f.key ? 'white' : '#666666'}
                                _hover={{ bg: filter === f.key ? '#333' : '#F5F5F5' }}
                                onClick={() => { setFilter(f.key as FilterType); setPage(1); }}
                            >
                                {f.label}
                            </Button>
                        ))}
                    </Flex>
                </Flex>

                {/* Users Table */}
                <Box bg="white" borderRadius="xl" border="1px solid" borderColor="#E0E0E0" flex={1} overflow="hidden" display="flex" flexDirection="column">
                    <Box flex={1} overflow="auto">
                        <Table.Root size="sm">
                            <Table.Header>
                                <Table.Row bg="#FAFAFA">
                                    <Table.ColumnHeader fontWeight="semibold" color="#666666" fontSize="xs">Kullanıcı</Table.ColumnHeader>
                                    <Table.ColumnHeader fontWeight="semibold" color="#666666" fontSize="xs">İletişim</Table.ColumnHeader>
                                    <Table.ColumnHeader fontWeight="semibold" color="#666666" fontSize="xs">Toplam Bakiye</Table.ColumnHeader>
                                    <Table.ColumnHeader fontWeight="semibold" color="#666666" fontSize="xs">Rol</Table.ColumnHeader>
                                    <Table.ColumnHeader fontWeight="semibold" color="#666666" fontSize="xs">Durum</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {paginatedUsers.length === 0 ? (
                                    <Table.Row>
                                        <Table.Cell colSpan={5}>
                                            <Flex justify="center" py={4}>
                                                <Text color="#666666" fontSize="sm">Kullanıcı bulunamadı</Text>
                                            </Flex>
                                        </Table.Cell>
                                    </Table.Row>
                                ) : (
                                    paginatedUsers.map((user) => (
                                        <Table.Row
                                            key={user.id}
                                            _hover={{ bg: '#FAFAFA', cursor: 'pointer' }}
                                            onClick={() => setSelectedUser(user)}
                                        >
                                            <Table.Cell>
                                                <Flex align="center" gap={2}>
                                                    <Flex
                                                        w={8} h={8} borderRadius="lg"
                                                        bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                                        color="white"
                                                        align="center" justify="center" fontWeight="semibold" fontSize="xs"
                                                    >
                                                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                                    </Flex>
                                                    <Text fontWeight="medium" color="#1A1A1A" fontSize="sm">
                                                        {user.firstName} {user.lastName}
                                                    </Text>
                                                </Flex>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Flex flexDir="column" gap={0}>
                                                    <Flex align="center" gap={1}>
                                                        <Icon as={LuMail} boxSize={3} color="#666666" />
                                                        <Text fontSize="xs" color="#666666">{user.email}</Text>
                                                    </Flex>
                                                    <Flex align="center" gap={1}>
                                                        <Icon as={LuPhone} boxSize={3} color="#666666" />
                                                        <Text fontSize="xs" color="#666666">{user.phone}</Text>
                                                    </Flex>
                                                </Flex>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Flex align="center" gap={2}>
                                                    <Icon as={LuCreditCard} boxSize={4} color="#4CAF50" />
                                                    <Text fontWeight="medium" color="#1A1A1A" fontSize="sm">
                                                        {formatCurrency(user.ieuBalance + user.nikiBalance)}
                                                    </Text>
                                                </Flex>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Badge
                                                    colorPalette={user.role === 'super_admin' ? 'red' : user.role === 'admin' ? 'purple' : 'gray'}
                                                    variant="subtle"
                                                    fontSize="xs"
                                                >
                                                    {user.role === 'super_admin' ? 'S.Admin' : user.role === 'admin' ? 'Admin' : 'Müşteri'}
                                                </Badge>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Badge colorPalette={user.isActive ? 'green' : 'red'} variant="subtle" fontSize="xs">
                                                    {user.isActive ? 'Aktif' : 'Pasif'}
                                                </Badge>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))
                                )}
                            </Table.Body>
                        </Table.Root>
                    </Box>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Flex justify="space-between" align="center" p={2} borderTop="1px solid" borderColor="#E0E0E0" flexShrink={0}>
                            <Text fontSize="xs" color="#666666">
                                {filteredUsers.length} kullanıcıdan {(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, filteredUsers.length)}
                            </Text>
                            <Flex gap={1} align="center">
                                <Button size="xs" variant="ghost" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                                    <Icon as={LuChevronLeft} />
                                </Button>
                                <Text fontSize="xs" color="#666666">{page}/{totalPages}</Text>
                                <Button size="xs" variant="ghost" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                                    <Icon as={LuChevronRight} />
                                </Button>
                            </Flex>
                        </Flex>
                    )}
                </Box>
            </Box>

            {/* User Detail Modal */}
            {selectedUser && (
                <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
            )}
        </Box>
    );
}

export default UsersPage;
