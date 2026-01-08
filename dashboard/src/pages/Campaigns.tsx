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
    LuGift,
    LuUsers,
    LuPercent,
    LuCalendar,
    LuTrendingUp,
    LuClock,
    LuCircleCheck,
    LuCircleX,
    LuTag,
} from 'react-icons/lu';
import { Header } from '../components/layout';
import { StatCard } from '../components/cards/StatCard';

// Mock Data
const mockCampaigns = [
    { id: 1, name: 'Yeni Üye Hoş Geldin', description: 'İlk kayıt yapan kullanıcılara özel', type: 'welcome', discount: 20, discountType: 'percent', status: 'active', endDate: '2026-01-31', totalAssigned: 156, totalUsed: 89, totalSavings: 2340.50 },
    { id: 2, name: 'Hafta Sonu Kahve', description: 'Cumartesi-Pazar kahve siparişlerinde', type: 'weekend', discount: 15, discountType: 'percent', status: 'active', endDate: '2026-03-31', totalAssigned: 412, totalUsed: 287, totalSavings: 4580.00 },
    { id: 3, name: 'Öğrenci İndirimi', description: 'IEU öğrencilerine özel', type: 'student', discount: 25, discountType: 'percent', status: 'active', endDate: '2026-06-30', totalAssigned: 890, totalUsed: 654, totalSavings: 12450.00 },
    { id: 4, name: 'Doğum Günü Hediyesi', description: 'Doğum gününde ücretsiz içecek', type: 'birthday', discount: 50, discountType: 'fixed', status: 'active', endDate: '2026-12-31', totalAssigned: 45, totalUsed: 32, totalSavings: 1600.00 },
    { id: 5, name: 'Kış Kampanyası', description: 'Sıcak içeceklerde özel indirim', type: 'seasonal', discount: 10, discountType: 'percent', status: 'ended', endDate: '2025-12-31', totalAssigned: 320, totalUsed: 298, totalSavings: 3560.00 },
    { id: 6, name: 'Happy Hour', description: '14:00-16:00 arası tüm içecekler', type: 'timebased', discount: 30, discountType: 'percent', status: 'paused', endDate: '2026-02-28', totalAssigned: 0, totalUsed: 0, totalSavings: 0 },
];

const mockStats = { totalCampaigns: 6, activeCampaigns: 4, totalAssignments: 1823, totalUsage: 1360, usageRate: 74.6, totalSavings: 24530.50 };

type FilterType = 'all' | 'active' | 'ended' | 'paused';

const statusConfig = {
    active: { label: 'Aktif', color: 'green', icon: LuCircleCheck },
    ended: { label: 'Sona Erdi', color: 'gray', icon: LuCircleX },
    paused: { label: 'Duraklatıldı', color: 'orange', icon: LuClock },
};

const typeConfig: Record<string, { label: string; color: string }> = {
    welcome: { label: 'Hoş Geldin', color: '#3B82F6' },
    weekend: { label: 'Hafta Sonu', color: '#8B5CF6' },
    student: { label: 'Öğrenci', color: '#FF9800' },
    birthday: { label: 'Doğum Günü', color: '#EC4899' },
    seasonal: { label: 'Sezonluk', color: '#4CAF50' },
    timebased: { label: 'Zaman Bazlı', color: '#000000' },
};

export function CampaignsPage() {
    const [filter, setFilter] = useState<FilterType>('all');

    const filteredCampaigns = filter === 'all' ? mockCampaigns : mockCampaigns.filter(c => c.status === filter);

    const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(value);

    return (
        <Box h="100vh" overflow="hidden" display="flex" flexDirection="column">
            <Header />

            <Box p={4} flex={1} overflow="hidden" display="flex" flexDirection="column">
                {/* Page Title */}
                <Box mb={3}>
                    <Text fontSize="lg" fontWeight="bold" color="#1A1A1A">Kampanyalar</Text>
                    <Text fontSize="xs" color="#666666">Aktif ve geçmiş kampanya performansları</Text>
                </Box>

                {/* Stats Grid */}
                <Grid templateColumns={{ base: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={3} mb={3}>
                    <GridItem><StatCard label="Toplam" value={mockStats.totalCampaigns} icon={LuGift} color="brand" subtitle={`${mockStats.activeCampaigns} aktif`} /></GridItem>
                    <GridItem><StatCard label="Atama" value={mockStats.totalAssignments.toLocaleString('tr-TR')} icon={LuUsers} color="blue" subtitle="Kullanıcılara" /></GridItem>
                    <GridItem><StatCard label="Kullanım" value={`%${mockStats.usageRate.toFixed(1)}`} icon={LuTrendingUp} color="green" subtitle={`${mockStats.totalUsage}`} /></GridItem>
                    <GridItem><StatCard label="Tasarruf" value={formatCurrency(mockStats.totalSavings)} icon={LuPercent} color="ieu" subtitle="Müşteri" /></GridItem>
                </Grid>

                {/* Filter Tabs */}
                <Flex gap={1} mb={3}>
                    {[{ key: 'all', label: 'Tümü' }, { key: 'active', label: 'Aktif' }, { key: 'paused', label: 'Duraklatılmış' }, { key: 'ended', label: 'Sona Eren' }].map((tab) => (
                        <Button key={tab.key} size="xs" variant={filter === tab.key ? 'solid' : 'ghost'} bg={filter === tab.key ? '#1A1A1A' : 'transparent'} color={filter === tab.key ? 'white' : '#666666'} _hover={{ bg: filter === tab.key ? '#333' : '#F5F5F5' }} onClick={() => setFilter(tab.key as FilterType)}>
                            {tab.label}
                        </Button>
                    ))}
                </Flex>

                {/* Campaign Cards */}
                <Box flex={1} overflow="auto">
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }} gap={3}>
                        {filteredCampaigns.map((campaign) => {
                            const status = statusConfig[campaign.status as keyof typeof statusConfig];
                            const type = typeConfig[campaign.type] || { label: campaign.type, color: '#666' };
                            const usagePercent = campaign.totalAssigned > 0 ? (campaign.totalUsed / campaign.totalAssigned) * 100 : 0;

                            return (
                                <GridItem key={campaign.id}>
                                    <Box bg="white" borderRadius="xl" border="1px solid" borderColor="#E0E0E0" p={4} _hover={{ borderColor: '#BDBDBD', shadow: 'sm' }} transition="all 0.2s" cursor="pointer">
                                        {/* Header */}
                                        <Flex justify="space-between" align="flex-start" mb={2}>
                                            <Flex align="center" gap={2}>
                                                <Badge bg={type.color} color="white" fontSize="xs" px={2} borderRadius="md">{type.label}</Badge>
                                                <Badge colorPalette={status.color} variant="subtle" fontSize="xs">
                                                    <Flex align="center" gap={1}><Icon as={status.icon} boxSize={3} />{status.label}</Flex>
                                                </Badge>
                                            </Flex>
                                            <Flex bg="#FFF3E0" borderRadius="lg" px={2} py={1} align="center" gap={1}>
                                                <Icon as={LuTag} boxSize={3} color="#FF9800" />
                                                <Text fontWeight="bold" color="#FF9800" fontSize="xs">
                                                    {campaign.discountType === 'percent' ? `%${campaign.discount}` : `${campaign.discount}₺`}
                                                </Text>
                                            </Flex>
                                        </Flex>

                                        {/* Title */}
                                        <Text fontWeight="semibold" color="#1A1A1A" fontSize="sm" mb={1}>{campaign.name}</Text>
                                        <Text color="#666666" fontSize="xs" mb={3} lineClamp={1}>{campaign.description}</Text>

                                        {/* Usage Progress */}
                                        <Box mb={3}>
                                            <Flex justify="space-between" mb={1}>
                                                <Text fontSize="xs" color="#666666">Kullanım</Text>
                                                <Text fontSize="xs" color="#666666">{campaign.totalUsed}/{campaign.totalAssigned}</Text>
                                            </Flex>
                                            <Progress.Root value={usagePercent} size="sm" borderRadius="full">
                                                <Progress.Track bg="#E0E0E0"><Progress.Range bg={campaign.status === 'active' ? '#4CAF50' : '#9e9e9e'} /></Progress.Track>
                                            </Progress.Root>
                                        </Box>

                                        {/* Footer */}
                                        <Flex justify="space-between" pt={2} borderTop="1px solid" borderColor="#F0F0F0">
                                            <Box>
                                                <Text fontSize="xs" color="#999999">Tasarruf</Text>
                                                <Text fontSize="xs" fontWeight="semibold" color="#4CAF50">{formatCurrency(campaign.totalSavings)}</Text>
                                            </Box>
                                            <Box textAlign="right">
                                                <Text fontSize="xs" color="#999999">Bitiş</Text>
                                                <Flex align="center" gap={1}>
                                                    <Icon as={LuCalendar} boxSize={3} color="#666666" />
                                                    <Text fontSize="xs" color="#666666">{new Date(campaign.endDate).toLocaleDateString('tr-TR')}</Text>
                                                </Flex>
                                            </Box>
                                        </Flex>
                                    </Box>
                                </GridItem>
                            );
                        })}
                    </Grid>
                </Box>
            </Box>
        </Box>
    );
}

export default CampaignsPage;
