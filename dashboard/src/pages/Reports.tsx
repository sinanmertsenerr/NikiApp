'use client';

import { useState } from 'react';
import {
    Box,
    Flex,
    Text,
    Grid,
    GridItem,
    Icon,
    Button,
    Badge,
} from '@chakra-ui/react';
import {
    LuFileText,
    LuDownload,
    LuCalendar,
    LuTrendingUp,
    LuUsers,
    LuWallet,
    LuGift,
    LuDices,
    LuFileSpreadsheet,
    LuFileJson,
    LuPrinter,
    LuClock,
    LuChartBar,
} from 'react-icons/lu';
import { Header } from '../components/layout';
import { StatCard } from '../components/cards/StatCard';

// Mock Data
const mockReportStats = { totalReportsGenerated: 156, lastReportDate: '2026-01-08 14:30', scheduledReports: 3, exportedThisMonth: 42 };

const reportCategories = [
    { id: 'sales', name: 'Satış Raporu', description: 'Günlük, haftalık ve aylık satış', icon: LuTrendingUp, color: '#4CAF50', bgColor: '#E8F5E9', formats: ['PDF', 'Excel', 'CSV'] },
    { id: 'users', name: 'Kullanıcı Raporu', description: 'Kullanıcı kayıtları ve aktivite', icon: LuUsers, color: '#3B82F6', bgColor: '#E3F2FD', formats: ['PDF', 'Excel', 'CSV'] },
    { id: 'wallet', name: 'Cüzdan Raporu', description: 'IEU ve NIKI kart işlemleri', icon: LuWallet, color: '#FF9800', bgColor: '#FFF3E0', formats: ['PDF', 'Excel'] },
    { id: 'campaigns', name: 'Kampanya Raporu', description: 'Kampanya performansı', icon: LuGift, color: '#000000', bgColor: '#F5F5F5', formats: ['PDF', 'Excel'] },
    { id: 'raffles', name: 'Çekiliş Raporu', description: 'Çekiliş ve şans çarkı', icon: LuDices, color: '#EC4899', bgColor: '#FCE7F3', formats: ['PDF', 'Excel'] },
    { id: 'analytics', name: 'Analitik Raporu', description: 'Genel performans analizleri', icon: LuChartBar, color: '#1A1A1A', bgColor: '#F5F5F5', formats: ['PDF'] },
];

const recentExports = [
    { id: 1, name: 'Satış Raporu - Ocak 2026', format: 'PDF', date: '14:30', size: '2.4 MB' },
    { id: 2, name: 'Kullanıcı Listesi', format: 'Excel', date: '12:15', size: '1.8 MB' },
    { id: 3, name: 'Cüzdan İşlemleri', format: 'CSV', date: 'Dün', size: '856 KB' },
    { id: 4, name: 'Kampanya Performans', format: 'PDF', date: '2 gün', size: '1.2 MB' },
];

type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year';

const formatConfig: Record<string, { icon: typeof LuFileText; color: string }> = {
    PDF: { icon: LuFileText, color: '#EF4444' },
    Excel: { icon: LuFileSpreadsheet, color: '#4CAF50' },
    CSV: { icon: LuFileJson, color: '#3B82F6' },
};

export function ReportsPage() {
    const [selectedRange, setSelectedRange] = useState<DateRange>('month');

    const handleExport = (reportId: string, format: string) => {
        alert(`${reportId} raporu ${format} formatında indiriliyor...`);
    };

    return (
        <Box h="100vh" overflow="hidden" display="flex" flexDirection="column">
            <Header />

            <Box p={4} flex={1} overflow="hidden" display="flex" flexDirection="column">
                {/* Page Title */}
                <Box mb={3}>
                    <Text fontSize="lg" fontWeight="bold" color="#1A1A1A">Raporlar</Text>
                    <Text fontSize="xs" color="#666666">Detaylı analiz ve veri export</Text>
                </Box>

                {/* Stats Grid */}
                <Grid templateColumns={{ base: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={3} mb={3}>
                    <GridItem><StatCard label="Oluşturulan" value={mockReportStats.totalReportsGenerated} icon={LuFileText} color="brand" subtitle="Tüm zamanlar" /></GridItem>
                    <GridItem><StatCard label="Bu Ay Export" value={mockReportStats.exportedThisMonth} icon={LuDownload} color="green" subtitle="Ocak 2026" /></GridItem>
                    <GridItem><StatCard label="Zamanlanmış" value={mockReportStats.scheduledReports} icon={LuClock} color="blue" subtitle="Otomatik" /></GridItem>
                    <GridItem><StatCard label="Son Rapor" value="14:30" icon={LuCalendar} color="ieu" subtitle="Bugün" /></GridItem>
                </Grid>

                {/* Date Range Filter */}
                <Box bg="white" borderRadius="xl" border="1px solid" borderColor="#E0E0E0" p={3} mb={3}>
                    <Flex justify="space-between" align="center">
                        <Flex align="center" gap={2}>
                            <Icon as={LuCalendar} color="#666666" boxSize={4} />
                            <Text fontWeight="medium" color="#1A1A1A" fontSize="sm">Tarih Aralığı</Text>
                        </Flex>
                        <Flex gap={1}>
                            {[{ key: 'today', label: 'Bugün' }, { key: 'week', label: 'Hafta' }, { key: 'month', label: 'Ay' }, { key: 'quarter', label: 'Çeyrek' }, { key: 'year', label: 'Yıl' }].map((range) => (
                                <Button key={range.key} size="xs" variant={selectedRange === range.key ? 'solid' : 'ghost'} bg={selectedRange === range.key ? '#1A1A1A' : 'transparent'} color={selectedRange === range.key ? 'white' : '#666666'} _hover={{ bg: selectedRange === range.key ? '#333' : '#F5F5F5' }} onClick={() => setSelectedRange(range.key as DateRange)}>
                                    {range.label}
                                </Button>
                            ))}
                        </Flex>
                    </Flex>
                </Box>

                {/* Content Grid */}
                <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={3} flex={1} overflow="hidden">
                    {/* Report Categories */}
                    <GridItem overflow="auto">
                        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
                            {reportCategories.map((report) => (
                                <GridItem key={report.id}>
                                    <Box bg="white" borderRadius="xl" border="1px solid" borderColor="#E0E0E0" p={4} _hover={{ borderColor: '#BDBDBD', shadow: 'sm' }} transition="all 0.2s">
                                        <Flex align="flex-start" gap={3} mb={3}>
                                            <Flex w={10} h={10} borderRadius="xl" bg={report.bgColor} align="center" justify="center" flexShrink={0}>
                                                <Icon as={report.icon} boxSize={5} color={report.color} />
                                            </Flex>
                                            <Box flex={1}>
                                                <Text fontWeight="semibold" color="#1A1A1A" fontSize="sm">{report.name}</Text>
                                                <Text fontSize="xs" color="#666666">{report.description}</Text>
                                            </Box>
                                        </Flex>
                                        <Flex gap={2}>
                                            {report.formats.map((format) => {
                                                const config = formatConfig[format];
                                                return (
                                                    <Button key={format} size="xs" variant="outline" borderColor="#E0E0E0" color="#666666" _hover={{ bg: '#F5F5F5', borderColor: config.color, color: config.color }} onClick={() => handleExport(report.id, format)} flex={1}>
                                                        <Icon as={config.icon} mr={1} boxSize={3} />{format}
                                                    </Button>
                                                );
                                            })}
                                        </Flex>
                                    </Box>
                                </GridItem>
                            ))}
                        </Grid>
                    </GridItem>

                    {/* Recent Exports */}
                    <GridItem>
                        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="#E0E0E0" overflow="hidden" h="100%">
                            <Flex justify="space-between" align="center" p={3} borderBottom="1px solid" borderColor="#E0E0E0">
                                <Text fontWeight="semibold" color="#1A1A1A" fontSize="sm">Son Exportlar</Text>
                            </Flex>
                            <Box overflow="auto">
                                {recentExports.map((item, index) => {
                                    const formatInfo = formatConfig[item.format];
                                    return (
                                        <Flex key={item.id} align="center" justify="space-between" p={3} borderBottom={index < recentExports.length - 1 ? '1px solid' : 'none'} borderColor="#F0F0F0" _hover={{ bg: '#FAFAFA' }} cursor="pointer">
                                            <Flex align="center" gap={2}>
                                                <Flex w={8} h={8} borderRadius="lg" bg="#F5F5F5" align="center" justify="center">
                                                    <Icon as={formatInfo.icon} color={formatInfo.color} boxSize={4} />
                                                </Flex>
                                                <Box>
                                                    <Text fontWeight="medium" color="#1A1A1A" fontSize="xs">{item.name}</Text>
                                                    <Flex align="center" gap={2}>
                                                        <Badge bg={formatInfo.color} color="white" fontSize="xs" px={1}>{item.format}</Badge>
                                                        <Text fontSize="xs" color="#999999">{item.size}</Text>
                                                    </Flex>
                                                </Box>
                                            </Flex>
                                            <Flex align="center" gap={2}>
                                                <Text fontSize="xs" color="#666666">{item.date}</Text>
                                                <Button size="xs" variant="ghost" color="#666666" _hover={{ color: '#1A1A1A', bg: '#F5F5F5' }}>
                                                    <Icon as={LuDownload} boxSize={4} />
                                                </Button>
                                            </Flex>
                                        </Flex>
                                    );
                                })}
                            </Box>
                        </Box>
                    </GridItem>
                </Grid>

                {/* Quick Actions */}
                <Grid templateColumns="repeat(3, 1fr)" gap={3} mt={3}>
                    <GridItem><Button w="100%" size="sm" bg="#1A1A1A" color="white" _hover={{ bg: '#333' }}><Icon as={LuPrinter} mr={2} />Hızlı Yazdır</Button></GridItem>
                    <GridItem><Button w="100%" size="sm" variant="outline" borderColor="#E0E0E0" color="#666666" _hover={{ bg: '#F5F5F5' }}><Icon as={LuClock} mr={2} />Zamanla</Button></GridItem>
                    <GridItem><Button w="100%" size="sm" variant="outline" borderColor="#E0E0E0" color="#666666" _hover={{ bg: '#F5F5F5' }}><Icon as={LuFileText} mr={2} />Özel Rapor</Button></GridItem>
                </Grid>
            </Box>
        </Box>
    );
}

export default ReportsPage;
