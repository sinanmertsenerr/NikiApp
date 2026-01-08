'use client';

import { useState } from 'react';
import { Box, Grid, GridItem } from '@chakra-ui/react';
import { LuGift, LuUsers, LuPercent, LuTrendingUp } from 'react-icons/lu';
import { Header } from '../components/layout';
import { StatCard } from '../components/cards/StatCard';
import { CampaignCard } from '../components/cards/CampaignCard';
import { PageHeader } from '../components/shared/PageHeader';
import { FilterTabs } from '../components/shared/FilterTabs';
import { useColorMode } from '../components/ui/ColorModeProvider';

// Mock Data
const mockCampaigns = [
    { id: 1, name: 'Yeni Üye Hoş Geldin', description: 'İlk kayıt yapan kullanıcılara özel', type: 'welcome', discount: 20, discountType: 'percent' as const, status: 'active' as const, endDate: '2026-01-31', totalAssigned: 156, totalUsed: 89, totalSavings: 2340.50 },
    { id: 2, name: 'Hafta Sonu Kahve', description: 'Cumartesi-Pazar kahve siparişlerinde', type: 'weekend', discount: 15, discountType: 'percent' as const, status: 'active' as const, endDate: '2026-03-31', totalAssigned: 412, totalUsed: 287, totalSavings: 4580.00 },
    { id: 3, name: 'Öğrenci İndirimi', description: 'IEU öğrencilerine özel', type: 'student', discount: 25, discountType: 'percent' as const, status: 'active' as const, endDate: '2026-06-30', totalAssigned: 890, totalUsed: 654, totalSavings: 12450.00 },
    { id: 4, name: 'Doğum Günü Hediyesi', description: 'Doğum gününde ücretsiz içecek', type: 'birthday', discount: 50, discountType: 'fixed' as const, status: 'active' as const, endDate: '2026-12-31', totalAssigned: 45, totalUsed: 32, totalSavings: 1600.00 },
    { id: 5, name: 'Kış Kampanyası', description: 'Sıcak içeceklerde özel indirim', type: 'seasonal', discount: 10, discountType: 'percent' as const, status: 'ended' as const, endDate: '2025-12-31', totalAssigned: 320, totalUsed: 298, totalSavings: 3560.00 },
    { id: 6, name: 'Happy Hour', description: '14:00-16:00 arası tüm içecekler', type: 'timebased', discount: 30, discountType: 'percent' as const, status: 'paused' as const, endDate: '2026-02-28', totalAssigned: 0, totalUsed: 0, totalSavings: 0 },
];

const mockStats = {
    totalCampaigns: 6,
    activeCampaigns: 4,
    totalAssignments: 1823,
    totalUsage: 1360,
    usageRate: 74.6,
    totalSavings: 24530.50
};

type FilterType = 'all' | 'active' | 'ended' | 'paused';

const filterOptions = [
    { key: 'all', label: 'Tümü' },
    { key: 'active', label: 'Aktif' },
    { key: 'paused', label: 'Duraklatılmış' },
    { key: 'ended', label: 'Sona Eren' },
];

export function CampaignsPage() {
    const [filter, setFilter] = useState<FilterType>('all');
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    const filteredCampaigns = filter === 'all'
        ? mockCampaigns
        : mockCampaigns.filter(c => c.status === filter);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2
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
                    title="Kampanyalar"
                    subtitle="Aktif ve geçmiş kampanya performansları"
                />

                {/* Stats Grid */}
                <Grid
                    templateColumns={{ base: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
                    gap={3}
                    mb={3}
                >
                    <GridItem>
                        <StatCard
                            label="Toplam"
                            value={mockStats.totalCampaigns}
                            icon={LuGift}
                            color="brand"
                            subtitle={`${mockStats.activeCampaigns} aktif`}
                        />
                    </GridItem>
                    <GridItem>
                        <StatCard
                            label="Atama"
                            value={mockStats.totalAssignments.toLocaleString('tr-TR')}
                            icon={LuUsers}
                            color="blue"
                            subtitle="Kullanıcılara"
                        />
                    </GridItem>
                    <GridItem>
                        <StatCard
                            label="Kullanım"
                            value={`%${mockStats.usageRate.toFixed(1)}`}
                            icon={LuTrendingUp}
                            color="green"
                            subtitle={`${mockStats.totalUsage}`}
                        />
                    </GridItem>
                    <GridItem>
                        <StatCard
                            label="Tasarruf"
                            value={formatCurrency(mockStats.totalSavings)}
                            icon={LuPercent}
                            color="ieu"
                            subtitle="Müşteri"
                        />
                    </GridItem>
                </Grid>

                {/* Filter Tabs */}
                <Box mb={3}>
                    <FilterTabs
                        options={filterOptions}
                        activeFilter={filter}
                        onChange={(key: string) => setFilter(key as FilterType)}
                    />
                </Box>

                {/* Campaign Cards Grid */}
                <Box flex={1} overflow="auto">
                    <Grid
                        templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }}
                        gap={3}
                    >
                        {filteredCampaigns.map((campaign) => (
                            <GridItem key={campaign.id}>
                                <CampaignCard
                                    campaign={campaign}
                                    onClick={() => console.log('Campaign clicked:', campaign.id)}
                                />
                            </GridItem>
                        ))}
                    </Grid>
                </Box>
            </Box>
        </Box>
    );
}

export default CampaignsPage;
