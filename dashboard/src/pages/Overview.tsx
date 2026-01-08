'use client';

import { Box, Grid, GridItem, Text, Flex, Spinner, Center } from '@chakra-ui/react';
import { LuUsers, LuCreditCard, LuGift, LuDices, LuCoins, LuTrendingUp } from 'react-icons/lu';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/layout';
import { StatCard } from '../components/cards/StatCard';
import { ActivitySection } from '../components/cards/ActivitySection';
import { dashboardApi, walletApi } from '../api';
import { formatCurrency, formatNumber } from '../utils';
import { useAuthStore } from '../store';

export function OverviewPage() {
    const user = useAuthStore((state) => state.user);

    // Fetch dashboard overview
    const { data: overview, isLoading: overviewLoading } = useQuery({
        queryKey: ['dashboard-overview'],
        queryFn: () => dashboardApi.getOverview(),
        retry: 1,
    });

    // Fetch wallet stats
    const { data: walletStats, isLoading: walletLoading } = useQuery({
        queryKey: ['wallet-stats'],
        queryFn: () => walletApi.getDashboardStats(),
        retry: 1,
    });

    const isLoading = overviewLoading || walletLoading;

    if (isLoading) {
        return (
            <Box h="100vh" overflow="hidden">
                <Header />
                <Center h="calc(100vh - 60px)" flexDir="column" gap={4}>
                    <Spinner size="xl" color="black" />
                    <Text color="gray.500">Veriler yükleniyor...</Text>
                </Center>
            </Box>
        );
    }

    return (
        <Box h="100vh" overflow="hidden" display="flex" flexDirection="column">
            <Header />

            <Box p={4} flex={1} overflow="hidden"> {/* Reduced padding from 5 to 4 */}
                {/* Welcome Banner */}
                <Flex
                    bg="#EEEEEE"
                    borderRadius="xl"
                    p={3} /* Reduced padding from 5 to 3 */
                    mb={3} /* Reduced margin from 4 to 3 */
                    align="center"
                    justify="space-between"
                    overflow="hidden"
                    position="relative"
                    border="1px solid"
                    borderColor="#E0E0E0"
                >
                    <Box zIndex={1}>
                        <Text fontSize="lg" fontWeight="bold" color="#1A1A1A"> {/* Reduced font from xl to lg */}
                            Hoş Geldin, {user?.firstName}! 👋
                        </Text>
                        <Text color="#666666" fontSize="xs"> {/* Reduced font from sm to xs */}
                            İşletme performansını tek bakışta görüntüle
                        </Text>
                    </Box>
                    <img
                        src="/images/brands/niki-logo.png"
                        alt="NikiTheCat"
                        style={{ height: '40px', opacity: 0.8, objectFit: 'contain' }} /* Reduced height from 50px */
                    />
                </Flex>

                {/* Top Stats Row */}
                <Grid
                    templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
                    gap={3} /* Reduced gap to 3 */
                    mb={3} /* Reduced margin from 4 to 3 */
                >
                    <GridItem>
                        <StatCard
                            label="Toplam Kullanıcı"
                            value={formatNumber(overview?.users?.totalUsers ?? 0)}
                            icon={LuUsers}
                            color="brand"
                            subtitle={`${overview?.users?.activeUsers ?? 0} aktif`}
                        />
                    </GridItem>
                    <GridItem>
                        <StatCard
                            label="Toplam Yükleme"
                            value={formatCurrency(walletStats?.totalTopUps ?? '0')}
                            icon={LuCreditCard}
                            color="ieu"
                            subtitle={`${walletStats?.transactionBreakdown?.topup ?? 0} işlem`}
                        />
                    </GridItem>
                    <GridItem>
                        <StatCard
                            label="Toplam Ödeme"
                            value={formatCurrency(walletStats?.totalPayments ?? '0')}
                            icon={LuTrendingUp}
                            color="niki"
                            subtitle={`${walletStats?.transactionBreakdown?.payment ?? 0} işlem`}
                        />
                    </GridItem>
                </Grid>

                {/* Weekly Activity Section - NikiCoffee & NikiSandwich */}
                <ActivitySection />

                {/* Performans Özeti */}
                <Text fontWeight="bold" fontSize="sm" mb={2} color="#1A1A1A"> {/* Reduced font to sm, margin to 2 */}
                    📊 Performans Özeti
                </Text>
                <Grid
                    templateColumns={{ base: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
                    gap={3} /* Reduced gap to 3 */
                >
                    <GridItem>
                        <StatCard
                            label="Verilen İndirim"
                            value={formatCurrency(walletStats?.totalDiscountsGiven ?? '0')}
                            icon={LuCoins}
                            color="niki"
                            subtitle="Müşteri tasarrufu"
                        />
                    </GridItem>
                    <GridItem>
                        <StatCard
                            label="Aktif Kampanya"
                            value={overview?.campaigns?.totalActive ?? 0}
                            icon={LuGift}
                            color="brand"
                            subtitle={overview?.campaigns?.usageRate ? `%${overview.campaigns.usageRate.toFixed(0)} kullanım` : 'Veri yok'}
                        />
                    </GridItem>
                    <GridItem>
                        <StatCard
                            label="Şans Çarkı"
                            value={formatNumber(overview?.wheel?.totalSpins ?? 0)}
                            icon={LuDices}
                            color="niki"
                            subtitle={overview?.wheel?.winRate ? `%${overview.wheel.winRate.toFixed(0)} kazanma` : 'Spin'}
                        />
                    </GridItem>
                    <GridItem>
                        <StatCard
                            label="Dağıtılan Puan"
                            value={formatNumber(overview?.points?.totalPointsEarned ?? 0)}
                            icon={LuCoins}
                            color="ieu"
                            subtitle={`${overview?.points?.usersWithPoints ?? 0} kullanıcı`}
                        />
                    </GridItem>
                </Grid>
            </Box>
        </Box>
    );
}

export default OverviewPage;
