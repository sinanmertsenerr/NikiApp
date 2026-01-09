'use client';

import { useState } from 'react';
import { Box, Grid, GridItem, Flex, IconButton, Icon } from '@chakra-ui/react';
import { LuGift, LuUsers, LuPercent, LuTrendingUp, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { Header } from '../components/layout';
import { StatCard } from '../components/cards/StatCard';
import { CampaignCard } from '../components/cards/CampaignCard';
import { PageHeader } from '../components/shared/PageHeader';
import { FilterTabs } from '../components/shared/FilterTabs';
import { useColorMode } from '../components/ui/ColorModeProvider';

// Mock Data - Extended for Slider Testing
const mockCampaigns = [
    { id: 1, name: 'Yeni Üye Hoş Geldin', description: 'İlk kayıt yapan kullanıcılara özel', type: 'welcome', discount: 20, discountType: 'percent' as const, status: 'active' as const, endDate: '2026-01-31', totalAssigned: 156, totalUsed: 89, totalSavings: 2340.50 },
    { id: 2, name: 'Hafta Sonu Kahve', description: 'Cumartesi-Pazar kahve siparişlerinde', type: 'weekend', discount: 15, discountType: 'percent' as const, status: 'active' as const, endDate: '2026-03-31', totalAssigned: 412, totalUsed: 287, totalSavings: 4580.00 },
    { id: 3, name: 'Öğrenci İndirimi', description: 'IEU öğrencilerine özel', type: 'student', discount: 25, discountType: 'percent' as const, status: 'active' as const, endDate: '2026-06-30', totalAssigned: 890, totalUsed: 654, totalSavings: 12450.00 },
    { id: 4, name: 'Doğum Günü Hediyesi', description: 'Doğum gününde ücretsiz içecek', type: 'birthday', discount: 50, discountType: 'fixed' as const, status: 'active' as const, endDate: '2026-12-31', totalAssigned: 45, totalUsed: 32, totalSavings: 1600.00 },
    { id: 5, name: 'Kış Kampanyası', description: 'Sıcak içeceklerde özel indirim', type: 'seasonal', discount: 10, discountType: 'percent' as const, status: 'ended' as const, endDate: '2025-12-31', totalAssigned: 320, totalUsed: 298, totalSavings: 3560.00 },
    { id: 6, name: 'Happy Hour', description: '14:00-16:00 arası tüm içecekler', type: 'timebased', discount: 30, discountType: 'percent' as const, status: 'paused' as const, endDate: '2026-02-28', totalAssigned: 0, totalUsed: 0, totalSavings: 0 },
    // Duplicates for testing slider
    { id: 7, name: 'Yaz Fırsatı', description: 'Soğuk içeceklerde %20', type: 'seasonal', discount: 20, discountType: 'percent' as const, status: 'active' as const, endDate: '2026-08-31', totalAssigned: 500, totalUsed: 120, totalSavings: 5600.00 },
    { id: 8, name: 'Arkadaşını Getir', description: '2. kahve %50 indirimli', type: 'referral', discount: 50, discountType: 'percent' as const, status: 'active' as const, endDate: '2026-12-31', totalAssigned: 150, totalUsed: 40, totalSavings: 800.00 },
    { id: 9, name: 'Sabah Kahvesi', description: '08:00-10:00 arası', type: 'timebased', discount: 10, discountType: 'percent' as const, status: 'active' as const, endDate: '2026-05-15', totalAssigned: 300, totalUsed: 180, totalSavings: 1200.00 },
    { id: 10, name: 'Bitki Çayı Şenliği', description: 'Tüm bitki çaylarında', type: 'product', discount: 15, discountType: 'percent' as const, status: 'paused' as const, endDate: '2026-04-01', totalAssigned: 80, totalUsed: 10, totalSavings: 150.00 },
];

const mockStats = {
    totalCampaigns: 10,
    activeCampaigns: 8,
    totalAssignments: 2823,
    totalUsage: 1760,
    usageRate: 62.3,
    totalSavings: 28530.50
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
    const [currentPage, setCurrentPage] = useState(0);
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    const itemsPerPage = 6;

    const filteredCampaigns = filter === 'all'
        ? mockCampaigns
        : mockCampaigns.filter(c => c.status === filter);

    const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);

    // Reset page on filter change
    if (currentPage >= totalPages && totalPages > 0) {
        setCurrentPage(0);
    }

    const currentCampaigns = filteredCampaigns.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    );

    const handleNext = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(p => p + 1);
        }
    };

    const handlePrev = () => {
        if (currentPage > 0) {
            setCurrentPage(p => p - 1);
        }
    };

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
                        onChange={(key: string) => {
                            setFilter(key as FilterType);
                            setCurrentPage(0);
                        }}
                    />
                </Box>

                {/* Campaign Cards Carousel */}
                <Box flex={1} position="relative" display="flex" flexDirection="column" justifyContent="center">
                    <Box position="relative">
                        {/* Prev Button */}
                        <IconButton
                            aria-label="Previous"
                            position="absolute"
                            left={4}
                            top="50%"
                            transform="translateY(-50%)"
                            zIndex={20}
                            rounded="full"
                            bg={isDark ? "whiteAlpha.200" : "blackAlpha.100"}
                            backdropFilter="blur(10px)"
                            shadow="lg"
                            size="lg"
                            disabled={currentPage === 0}
                            opacity={currentPage === 0 ? 0 : 1}
                            _hover={{ transform: 'translateY(-50%) scale(1.1)', bg: isDark ? "whiteAlpha.300" : "blackAlpha.200" }}
                            transition="all 0.2s"
                            onClick={handlePrev}
                            display={{ base: 'none', md: 'flex' }}
                        >
                            <Icon as={LuChevronLeft} boxSize={6} />
                        </IconButton>

                        <Box
                            mx={0}
                            h="auto"
                            overflowY="hidden"
                            overflowX="auto"
                            px={20}
                            css={{
                                '&::-webkit-scrollbar': { display: 'none' },
                                scrollbarWidth: 'none',
                                '-ms-overflow-style': 'none',
                            }}
                        >
                            <Grid
                                templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }}
                                gap={6}
                            >
                                {currentCampaigns.map((campaign) => (
                                    <GridItem key={campaign.id}>
                                        <CampaignCard
                                            campaign={campaign}
                                            onClick={() => console.log('Campaign clicked:', campaign.id)}
                                        />
                                    </GridItem>
                                ))}
                            </Grid>
                        </Box>

                        {/* Next Button */}
                        <IconButton
                            aria-label="Next"
                            position="absolute"
                            right={4}
                            top="50%"
                            transform="translateY(-50%)"
                            zIndex={20}
                            rounded="full"
                            bg={isDark ? "whiteAlpha.200" : "blackAlpha.100"}
                            backdropFilter="blur(10px)"
                            shadow="lg"
                            size="lg"
                            disabled={currentPage >= totalPages - 1}
                            opacity={currentPage >= totalPages - 1 ? 0 : 1}
                            _hover={{ transform: 'translateY(-50%) scale(1.1)', bg: isDark ? "whiteAlpha.300" : "blackAlpha.200" }}
                            transition="all 0.2s"
                            onClick={handleNext}
                            display={{ base: 'none', md: 'flex' }}
                        >
                            <Icon as={LuChevronRight} boxSize={6} />
                        </IconButton>
                    </Box>

                    {/* Pagination Dots (Optional, for visual cue) */}
                    {totalPages > 1 && (
                        <Flex justify="center" gap={2} mt={2}>
                            {Array.from({ length: totalPages }).map((_, idx) => (
                                <Box
                                    key={idx}
                                    w={2}
                                    h={2}
                                    borderRadius="full"
                                    bg={idx === currentPage ? 'brand.500' : 'gray.300'}
                                    cursor="pointer"
                                    onClick={() => setCurrentPage(idx)}
                                />
                            ))}
                        </Flex>
                    )}
                </Box>
            </Box>
        </Box>
    );
}

export default CampaignsPage;
