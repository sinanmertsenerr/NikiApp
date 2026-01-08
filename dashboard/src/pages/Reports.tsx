'use client';

import { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { tr } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import {
    Box,
    Flex,
    Text,
    Grid,
    GridItem,
    Icon,
    Button,
} from '@chakra-ui/react';
import {
    LuFileText,
    LuDownload,
    LuCalendar,
    LuUsers,
    LuWallet,
    LuGift,
    LuDices,
    LuFileSpreadsheet,
    LuFileJson,
    LuClock,
    LuLayoutDashboard,
} from 'react-icons/lu';
import { Header } from '../components/layout';
import { StatCard } from '../components/cards/StatCard';
import { PageHeader } from '../components/shared/PageHeader';
import { useColorMode } from '../components/ui/ColorModeProvider';
import {
    exportToExcel,
    exportToPDF,
    exportToCSV,
    exportExecutiveSummaryPDF,
    walletTransactionColumns,
    userListColumns,
    campaignColumns,
    raffleColumns,
    formatCurrency,
    type SummaryItem,
    type ExecutiveSummaryData,
} from '../utils/exportUtils';

// ==================== MOCK DATA FOR EXPORT ====================

// Mock wallet transactions
const mockWalletTransactions = [
    { date: '08.01.2026 14:32', userName: 'Ahmet Yılmaz', userEmail: 'ahmet.yilmaz@ieu.edu.tr', type: 'Yükleme', wallet: 'IEU', amount: '₺500,00', admin: 'Sinan Sener' },
    { date: '08.01.2026 10:15', userName: 'Ahmet Yılmaz', userEmail: 'ahmet.yilmaz@ieu.edu.tr', type: 'Harcama', wallet: 'IEU', amount: '₺45,50', admin: 'Can Öztürk' },
    { date: '07.01.2026 16:30', userName: 'Ahmet Yılmaz', userEmail: 'ahmet.yilmaz@ieu.edu.tr', type: 'Yükleme', wallet: 'NIKI', amount: '₺200,00', admin: 'Sinan Sener' },
    { date: '07.01.2026 12:00', userName: 'Ahmet Yılmaz', userEmail: 'ahmet.yilmaz@ieu.edu.tr', type: 'Harcama', wallet: 'NIKI', amount: '₺32,00', admin: 'Can Öztürk' },
    { date: '08.01.2026 11:00', userName: 'Zeynep Kaya', userEmail: 'zeynep.kaya@gmail.com', type: 'Yükleme', wallet: 'NIKI', amount: '₺340,00', admin: 'Sinan Sener' },
    { date: '07.01.2026 14:20', userName: 'Zeynep Kaya', userEmail: 'zeynep.kaya@gmail.com', type: 'Harcama', wallet: 'NIKI', amount: '₺25,00', admin: 'Can Öztürk' },
    { date: '08.01.2026 09:00', userName: 'Mehmet Demir', userEmail: 'mehmet.demir@ieu.edu.tr', type: 'Yükleme', wallet: 'IEU', amount: '₺1.000,00', admin: 'Sinan Sener' },
    { date: '07.01.2026 15:30', userName: 'Mehmet Demir', userEmail: 'mehmet.demir@ieu.edu.tr', type: 'Harcama', wallet: 'IEU', amount: '₺65,00', admin: 'Can Öztürk' },
    { date: '06.01.2026 09:45', userName: 'Burak Çelik', userEmail: 'burak.celik@ieu.edu.tr', type: 'Yükleme', wallet: 'IEU', amount: '₺750,00', admin: 'Sinan Sener' },
    { date: '05.01.2026 11:20', userName: 'Selin Arslan', userEmail: 'selin.arslan@gmail.com', type: 'Yükleme', wallet: 'NIKI', amount: '₺500,00', admin: 'Sinan Sener' },
];

// Mock users for export (matches Users.tsx mockUsers)
const mockUsersExport = [
    { fullName: 'Ahmet Yılmaz', email: 'ahmet.yilmaz@ieu.edu.tr', phone: '+90 532 123 4567', role: 'Müşteri', status: 'Aktif', ieuBalance: '₺1.250,50', nikiBalance: '₺340,00', totalBalance: '₺1.590,50', createdAt: '15.12.2025', lastLoginAt: '08.01.2026' },
    { fullName: 'Zeynep Kaya', email: 'zeynep.kaya@gmail.com', phone: '+90 533 234 5678', role: 'Müşteri', status: 'Aktif', ieuBalance: '₺0,00', nikiBalance: '₺340,00', totalBalance: '₺340,00', createdAt: '20.12.2025', lastLoginAt: '07.01.2026' },
    { fullName: 'Mehmet Demir', email: 'mehmet.demir@ieu.edu.tr', phone: '+90 534 345 6789', role: 'Müşteri', status: 'Aktif', ieuBalance: '₺890,25', nikiBalance: '₺125,00', totalBalance: '₺1.015,25', createdAt: '05.11.2025', lastLoginAt: '08.01.2026' },
    { fullName: 'Elif Şahin', email: 'elif.sahin@hotmail.com', phone: '+90 535 456 7890', role: 'Müşteri', status: 'Pasif', ieuBalance: '₺0,00', nikiBalance: '₺0,00', totalBalance: '₺0,00', createdAt: '22.10.2025', lastLoginAt: '28.12.2025' },
    { fullName: 'Can Öztürk', email: 'can.ozturk@ieu.edu.tr', phone: '+90 536 567 8901', role: 'Admin', status: 'Aktif', ieuBalance: '₺2.100,00', nikiBalance: '₺450,00', totalBalance: '₺2.550,00', createdAt: '10.09.2025', lastLoginAt: '08.01.2026' },
    { fullName: 'Selin Arslan', email: 'selin.arslan@gmail.com', phone: '+90 537 678 9012', role: 'Müşteri', status: 'Aktif', ieuBalance: '₺0,00', nikiBalance: '₺455,75', totalBalance: '₺455,75', createdAt: '01.12.2025', lastLoginAt: '06.01.2026' },
    { fullName: 'Burak Çelik', email: 'burak.celik@ieu.edu.tr', phone: '+90 538 789 0123', role: 'Müşteri', status: 'Aktif', ieuBalance: '₺678,50', nikiBalance: '₺220,00', totalBalance: '₺898,50', createdAt: '18.11.2025', lastLoginAt: '08.01.2026' },
    { fullName: 'Ayşe Koç', email: 'ayse.koc@outlook.com', phone: '+90 539 890 1234', role: 'Müşteri', status: 'Aktif', ieuBalance: '₺0,00', nikiBalance: '₺125,00', totalBalance: '₺125,00', createdAt: '28.12.2025', lastLoginAt: '07.01.2026' },
    { fullName: 'Emre Yıldız', email: 'emre.yildiz@ieu.edu.tr', phone: '+90 540 901 2345', role: 'Müşteri', status: 'Aktif', ieuBalance: '₺1.890,00', nikiBalance: '₺560,00', totalBalance: '₺2.450,00', createdAt: '25.08.2025', lastLoginAt: '08.01.2026' },
    { fullName: 'Deniz Aydın', email: 'deniz.aydin@gmail.com', phone: '+90 541 012 3456', role: 'Müşteri', status: 'Pasif', ieuBalance: '₺0,00', nikiBalance: '₺50,00', totalBalance: '₺50,00', createdAt: '15.07.2025', lastLoginAt: '20.11.2025' },
    { fullName: 'Sinan Sener', email: 'sinan@nikithecat.com', phone: '+90 542 123 4567', role: 'Süper Admin', status: 'Aktif', ieuBalance: '₺5.000,00', nikiBalance: '₺2.500,00', totalBalance: '₺7.500,00', createdAt: '01.01.2025', lastLoginAt: '08.01.2026' },
    { fullName: 'Merve Aksoy', email: 'merve.aksoy@ieu.edu.tr', phone: '+90 543 234 5678', role: 'Müşteri', status: 'Aktif', ieuBalance: '₺320,75', nikiBalance: '₺180,00', totalBalance: '₺500,75', createdAt: '02.01.2026', lastLoginAt: '08.01.2026' },
];

// Mock campaigns for export
const mockCampaignsExport = [
    { name: 'Yeni Üye Hoş Geldin', type: 'Manuel', discount: '%20', status: 'Aktif', totalAssigned: 156, totalUsed: 89, usageRate: '%57', totalSavings: '₺2.340,50', createdAt: '01.01.2026' },
    { name: 'Hafta Sonu Kahve', type: 'Manuel', discount: '%15', status: 'Aktif', totalAssigned: 412, totalUsed: 287, usageRate: '%70', totalSavings: '₺4.580,00', createdAt: '05.01.2026' },
    { name: 'Öğrenci İndirimi', type: 'Manuel', discount: '%25', status: 'Aktif', totalAssigned: 890, totalUsed: 654, usageRate: '%73', totalSavings: '₺12.450,00', createdAt: '07.01.2026' },
    { name: 'Doğum Günü Hediyesi', type: 'Otomatik', discount: '₺50', status: 'Aktif', totalAssigned: 45, totalUsed: 32, usageRate: '%71', totalSavings: '₺1.600,00', createdAt: '08.01.2026' },
    { name: 'Kış Kampanyası', type: 'Manuel', discount: '%10', status: 'Sona Erdi', totalAssigned: 320, totalUsed: 298, usageRate: '%93', totalSavings: '₺3.560,00', createdAt: '15.12.2025' },
];

// Mock raffles for export
const mockRafflesExport = [
    { title: 'Yılbaşı Özel Çekilişi', startDate: '25.12.2025', endDate: '01.01.2026', status: 'Tamamlandı', participantCount: 1250, winnerCount: 10, rewardType: 'Hediye Çeki', rewardValue: '₺500' },
    { title: 'Ocak Ayı Kahve Çekilişi', startDate: '01.01.2026', endDate: '15.01.2026', status: 'Devam Ediyor', participantCount: 856, winnerCount: 5, rewardType: 'Bedava Kahve', rewardValue: '1 Ay' },
    { title: 'iPhone 15 Çekilişi', startDate: '01.01.2026', endDate: '31.01.2026', status: 'Devam Ediyor', participantCount: 2340, winnerCount: 1, rewardType: 'Ürün', rewardValue: 'iPhone 15' },
    { title: 'Sadakat Puanı Çekilişi', startDate: '05.01.2026', endDate: '12.01.2026', status: 'Devam Ediyor', participantCount: 567, winnerCount: 20, rewardType: 'Puan', rewardValue: '1000 Puan' },
    { title: 'Kış Festivali Çekilişi', startDate: '15.12.2025', endDate: '25.12.2025', status: 'Tamamlandı', participantCount: 980, winnerCount: 15, rewardType: 'İndirim', rewardValue: '%50' },
    { title: 'VIP Üyelik Çekilişi', startDate: '20.12.2025', endDate: '05.01.2026', status: 'Tamamlandı', participantCount: 1450, winnerCount: 3, rewardType: 'Üyelik', rewardValue: '1 Yıl VIP' },
];

// ==================== REPORT STATS ====================

const mockReportStats = {
    totalReportsGenerated: 156,
    lastReportDate: '2026-01-08 14:30',
    scheduledReports: 3,
    exportedThisMonth: 42
};

const reportCategories = [
    { id: 'executive-summary', name: 'Yonetici Ozet Raporu', description: 'Finansal ozet, kampanya ve strateji analizi', icon: LuLayoutDashboard, color: '#FF9800', bgColor: '#FFF8E1', darkBgColor: '#3D3520', formats: ['PDF'] },
    { id: 'users', name: 'Kullanici Raporu', description: 'Kullanici kayitlari ve bakiyeler', icon: LuUsers, color: '#10B981', bgColor: '#D1FAE5', darkBgColor: '#1A3D2C', formats: ['PDF', 'Excel'] },
    { id: 'wallet-ieu', name: 'IEU Cuzdan Raporu', description: 'IEU kart yukleme ve harcama', icon: LuWallet, color: '#3B82F6', bgColor: '#E3F2FD', darkBgColor: '#1A2744', formats: ['PDF', 'Excel'] },
    { id: 'wallet-niki', name: 'NIKI Cuzdan Raporu', description: 'NIKI kart yukleme ve harcama', icon: LuWallet, color: '#FF9800', bgColor: '#FFF3E0', darkBgColor: '#3D2D1A', formats: ['PDF', 'Excel'] },
    { id: 'campaigns', name: 'Kampanya Raporu', description: 'Kampanya performansi', icon: LuGift, color: '#EC4899', bgColor: '#FCE7F3', darkBgColor: '#3D1A2E', formats: ['PDF', 'Excel'] },
    { id: 'raffles', name: 'Cekilis Raporu', description: 'Cekilis ve sans carki', icon: LuDices, color: '#8B5CF6', bgColor: '#F3E8FF', darkBgColor: '#2E1A44', formats: ['PDF', 'Excel'] },
];

const formatConfig: Record<string, { icon: typeof LuFileText; color: string }> = {
    PDF: { icon: LuFileText, color: '#EF4444' },
    Excel: { icon: LuFileSpreadsheet, color: '#4CAF50' },
    CSV: { icon: LuFileJson, color: '#3B82F6' },
};

// Register Turkish locale
registerLocale('tr', tr);

export function ReportsPage() {
    // Default to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [startDate, setStartDate] = useState<Date>(thirtyDaysAgo);
    const [endDate, setEndDate] = useState<Date>(today);
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    // Format date for display (Turkish format)
    const formatToTurkish = (d: Date) => {
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    };
    const dateRangeDisplay = `${formatToTurkish(startDate)} - ${formatToTurkish(endDate)}`;

    const handleExport = (reportId: string, format: string) => {
        // Turkish date format for filename: DD-MM-YYYY
        const now = new Date();
        const timestamp = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

        // Helper to parse Turkish date format (DD.MM.YYYY HH:MM) to Date
        const parseTurkishDate = (dateStr: string): Date => {
            const [datePart] = dateStr.split(' ');
            const [day, month, year] = datePart.split('.').map(Number);
            return new Date(year, month - 1, day);
        };

        // Helper to check if date is within range
        const isInDateRange = (dateStr: string): boolean => {
            const date = parseTurkishDate(dateStr);
            const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
            return date >= start && date <= end;
        };

        switch (reportId) {
            case 'executive-summary': {
                // Tüm işlemleri tarih aralığına göre filtrele
                const filteredTransactions = mockWalletTransactions.filter(t => isInDateRange(t.date));

                // Yükleme ve harcama toplamlarını hesapla
                const topupTransactions = filteredTransactions.filter(t => t.type === 'Yükleme');
                const paymentTransactions = filteredTransactions.filter(t => t.type === 'Harcama');

                const totalTopUps = topupTransactions.reduce((sum, t) =>
                    sum + parseFloat(t.amount.replace('₺', '').replace('.', '').replace(',', '.')), 0);
                const totalPayments = paymentTransactions.reduce((sum, t) =>
                    sum + parseFloat(t.amount.replace('₺', '').replace('.', '').replace(',', '.')), 0);

                // Dönem karşılaştırması
                const periodDuration = endDate.getTime() - startDate.getTime();
                const previousEndDate = new Date(startDate.getTime()); // Start date'in tam başlangıcı
                previousEndDate.setMilliseconds(-1); // Bir milisaniye öncesi
                const previousStartDate = new Date(previousEndDate.getTime() - periodDuration);

                const isInPreviousDateRange = (dateStr: string): boolean => {
                    const date = parseTurkishDate(dateStr);
                    return date >= previousStartDate && date <= previousEndDate;
                };

                const previousTransactions = mockWalletTransactions.filter(t => isInPreviousDateRange(t.date));

                const previousTopups = previousTransactions
                    .filter(t => t.type === 'Yükleme')
                    .reduce((sum, t) => sum + parseFloat(t.amount.replace('₺', '').replace('.', '').replace(',', '.')), 0);

                const previousPayments = previousTransactions
                    .filter(t => t.type === 'Harcama')
                    .reduce((sum, t) => sum + parseFloat(t.amount.replace('₺', '').replace('.', '').replace(',', '.')), 0);

                const previousActiveWallets = new Set(previousTransactions.map(t => t.userEmail)).size;

                // Günlük istatistikleri hazırla (Grafik için)
                const dailyStats: { date: string, topup: number, payment: number }[] = [];
                const currentDate = new Date(startDate);

                while (currentDate <= endDate) {
                    const dateStr = formatToTurkish(currentDate); // DD.MM.YYYY formatında

                    // O tarihteki işlemleri bul
                    // Mock data'da saat olduğu için startsWith kullanıyoruz
                    const dayTransactions = filteredTransactions.filter(t => t.date.startsWith(dateStr));

                    const dayTopup = dayTransactions
                        .filter(t => t.type === 'Yükleme')
                        .reduce((sum, t) => sum + parseFloat(t.amount.replace('₺', '').replace('.', '').replace(',', '.')), 0);

                    const dayPayment = dayTransactions
                        .filter(t => t.type === 'Harcama')
                        .reduce((sum, t) => sum + parseFloat(t.amount.replace('₺', '').replace('.', '').replace(',', '.')), 0);

                    dailyStats.push({
                        date: dateStr,
                        topup: dayTopup,
                        payment: dayPayment
                    });

                    currentDate.setDate(currentDate.getDate() + 1);
                }

                // Gün sayısını hesapla
                const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                // Kampanya verilerini hazırla (mock)
                const filteredCampaigns = mockCampaignsExport.filter(c => {
                    const [day, month, year] = c.createdAt.split('.').map(Number);
                    const campaignDate = new Date(year, month - 1, day);
                    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
                    return campaignDate >= start && campaignDate <= end;
                });

                const manualCampaigns = filteredCampaigns.filter(c => c.type === 'Manuel');
                const autoCampaigns = filteredCampaigns.filter(c => c.type === 'Otomatik');

                const totalAssigned = filteredCampaigns.reduce((sum, c) => sum + c.totalAssigned, 0);
                const totalUsed = filteredCampaigns.reduce((sum, c) => sum + c.totalUsed, 0);

                // En başarılı kampanyaları bul
                const topCampaigns = [...filteredCampaigns]
                    .map(c => ({
                        name: c.name,
                        usageRate: c.totalAssigned > 0 ? (c.totalUsed / c.totalAssigned) * 100 : 0,
                        savings: parseFloat(c.totalSavings.replace('₺', '').replace('.', '').replace(',', '.'))
                    }))
                    .sort((a, b) => b.usageRate - a.usageRate)
                    .slice(0, 3);

                // Executive summary verilerini hazırla
                const summaryData: ExecutiveSummaryData = {
                    totalTopUps,
                    totalPayments,
                    totalRefunds: 0,
                    totalDiscounts: 0,

                    transactionCounts: {
                        topup: topupTransactions.length,
                        payment: paymentTransactions.length,
                        refund: 0,
                        reward: 0
                    },

                    totalTransactions: filteredTransactions.length,
                    activeWallets: new Set(filteredTransactions.map(t => t.userEmail)).size,

                    // Kampanya verileri
                    campaigns: {
                        total: filteredCampaigns.length,
                        active: filteredCampaigns.filter(c => c.status === 'Aktif').length,
                        totalAssigned,
                        totalUsed,
                        usageRate: totalAssigned > 0 ? (totalUsed / totalAssigned) * 100 : 0,
                        byType: {
                            manual: {
                                count: manualCampaigns.length,
                                assigned: manualCampaigns.reduce((sum, c) => sum + c.totalAssigned, 0),
                                used: manualCampaigns.reduce((sum, c) => sum + c.totalUsed, 0)
                            },
                            auto: {
                                count: autoCampaigns.length,
                                assigned: autoCampaigns.reduce((sum, c) => sum + c.totalAssigned, 0),
                                used: autoCampaigns.reduce((sum, c) => sum + c.totalUsed, 0)
                            }
                        },
                        topCampaigns
                    },

                    // Şans çarkı verileri (mock)
                    wheel: {
                        totalSpins: 1250,
                        winningSpins: 875,
                        winRate: 70,
                        rewardBreakdown: {
                            points: 350,
                            discount: 200,
                            free_coffee: 150,
                            badge: 175,
                            nothing: 375
                        }
                    },

                    dateRange: dateRangeDisplay,
                    periodDays,

                    // Karşılaştırma verileri
                    previousPeriod: {
                        totalTopUps: previousTopups,
                        totalPayments: previousPayments,
                        activeWallets: previousActiveWallets
                    },

                    // Grafik verileri
                    dailyStats
                };

                exportExecutiveSummaryPDF(summaryData, `yonetici_ozet_raporu_${timestamp}`);
                break;
            }

            case 'wallet-ieu': {
                // Filter IEU transactions by wallet AND date range
                const ieuTransactions = mockWalletTransactions.filter(t =>
                    t.wallet === 'IEU' && isInDateRange(t.date)
                );

                // Calculate IEU wallet summary
                const ieuTopups = ieuTransactions.filter(t => t.type === 'Yükleme');
                const ieuSpends = ieuTransactions.filter(t => t.type === 'Harcama');

                const totalTopup = ieuTopups.reduce((sum, t) => sum + parseFloat(t.amount.replace('₺', '').replace('.', '').replace(',', '.')), 0);
                const totalSpend = ieuSpends.reduce((sum, t) => sum + parseFloat(t.amount.replace('₺', '').replace('.', '').replace(',', '.')), 0);
                const netBalance = totalTopup - totalSpend;

                const summary: SummaryItem[] = [
                    { label: 'Toplam Yukleme', value: formatCurrency(totalTopup) },
                    { label: 'Toplam Harcama', value: formatCurrency(totalSpend) },
                    { label: netBalance >= 0 ? 'Net Bakiye (+)' : 'Net Bakiye (-)', value: formatCurrency(Math.abs(netBalance)), isTotal: true },
                ];

                if (format === 'Excel') {
                    exportToExcel(ieuTransactions, walletTransactionColumns, `ieu_cuzdan_raporu_${timestamp}`, summary, 'IEU Islemleri');
                } else if (format === 'PDF') {
                    exportToPDF(ieuTransactions, walletTransactionColumns, `ieu_cuzdan_raporu_${timestamp}`, 'IEU Cuzdan Raporu', summary, dateRangeDisplay);
                } else if (format === 'CSV') {
                    exportToCSV(ieuTransactions, walletTransactionColumns, `ieu_cuzdan_raporu_${timestamp}`);
                }
                break;
            }

            case 'wallet-niki': {
                // Filter NIKI transactions by wallet AND date range
                const nikiTransactions = mockWalletTransactions.filter(t =>
                    t.wallet === 'NIKI' && isInDateRange(t.date)
                );

                // Calculate NIKI wallet summary
                const nikiTopups = nikiTransactions.filter(t => t.type === 'Yükleme');
                const nikiSpends = nikiTransactions.filter(t => t.type === 'Harcama');

                const totalTopup = nikiTopups.reduce((sum, t) => sum + parseFloat(t.amount.replace('₺', '').replace('.', '').replace(',', '.')), 0);
                const totalSpend = nikiSpends.reduce((sum, t) => sum + parseFloat(t.amount.replace('₺', '').replace('.', '').replace(',', '.')), 0);
                const netBalance = totalTopup - totalSpend;

                const summary: SummaryItem[] = [
                    { label: 'Toplam Yukleme', value: formatCurrency(totalTopup) },
                    { label: 'Toplam Harcama', value: formatCurrency(totalSpend) },
                    { label: netBalance >= 0 ? 'Net Bakiye (+)' : 'Net Bakiye (-)', value: formatCurrency(Math.abs(netBalance)), isTotal: true },
                ];

                if (format === 'Excel') {
                    exportToExcel(nikiTransactions, walletTransactionColumns, `niki_cuzdan_raporu_${timestamp}`, summary, 'NIKI Islemleri');
                } else if (format === 'PDF') {
                    exportToPDF(nikiTransactions, walletTransactionColumns, `niki_cuzdan_raporu_${timestamp}`, 'NIKI Cuzdan Raporu', summary, dateRangeDisplay);
                } else if (format === 'CSV') {
                    exportToCSV(nikiTransactions, walletTransactionColumns, `niki_cuzdan_raporu_${timestamp}`);
                }
                break;
            }

            case 'users': {
                // Filter users by createdAt date range
                const filteredUsers = mockUsersExport.filter(u => {
                    // Parse createdAt (format: DD.MM.YYYY)
                    const [day, month, year] = u.createdAt.split('.').map(Number);
                    const userDate = new Date(year, month - 1, day);
                    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
                    return userDate >= start && userDate <= end;
                });

                // Calculate user summary from filtered data
                const totalUsers = filteredUsers.length;
                const activeUsers = filteredUsers.filter(u => u.status === 'Aktif').length;
                const totalBalance = filteredUsers.reduce((sum, u) => {
                    return sum + parseFloat(u.totalBalance.replace('₺', '').replace('.', '').replace(',', '.'));
                }, 0);

                const summary: SummaryItem[] = [
                    { label: 'Toplam Kullanıcı', value: totalUsers },
                    { label: 'Aktif Kullanıcı', value: activeUsers },
                    { label: 'Toplam Bakiye', value: formatCurrency(totalBalance), isTotal: true },
                ];

                if (format === 'Excel') {
                    exportToExcel(filteredUsers, userListColumns, `kullanici_raporu_${timestamp}`, summary, 'Kullanıcılar');
                } else if (format === 'PDF') {
                    exportToPDF(filteredUsers, userListColumns, `kullanici_raporu_${timestamp}`, 'Kullanici Listesi Raporu', summary, dateRangeDisplay);
                } else if (format === 'CSV') {
                    exportToCSV(filteredUsers, userListColumns, `kullanici_raporu_${timestamp}`);
                }
                break;
            }

            case 'campaigns': {
                // Filter campaigns by createdAt date range
                const filteredCampaigns = mockCampaignsExport.filter(c => {
                    const [day, month, year] = c.createdAt.split('.').map(Number);
                    const campaignDate = new Date(year, month - 1, day);
                    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
                    return campaignDate >= start && campaignDate <= end;
                });

                // Calculate campaign summary from filtered data
                const totalCampaigns = filteredCampaigns.length;
                const activeCampaigns = filteredCampaigns.filter(c => c.status === 'Aktif').length;
                const totalSavings = filteredCampaigns.reduce((sum, c) => {
                    return sum + parseFloat(c.totalSavings.replace('₺', '').replace('.', '').replace(',', '.'));
                }, 0);

                const summary: SummaryItem[] = [
                    { label: 'Toplam Kampanya', value: totalCampaigns },
                    { label: 'Aktif Kampanya', value: activeCampaigns },
                    { label: 'Müşteri Tasarrufu', value: formatCurrency(totalSavings), isTotal: true },
                ];

                if (format === 'Excel') {
                    exportToExcel(filteredCampaigns, campaignColumns, `kampanya_raporu_${timestamp}`, summary, 'Kampanyalar');
                } else if (format === 'PDF') {
                    exportToPDF(filteredCampaigns, campaignColumns, `kampanya_raporu_${timestamp}`, 'Kampanya Performans Raporu', summary, dateRangeDisplay);
                }
                break;
            }

            case 'raffles': {
                // Filter raffles by startDate range
                const filteredRaffles = mockRafflesExport.filter(r => {
                    const [day, month, year] = r.startDate.split('.').map(Number);
                    const raffleDate = new Date(year, month - 1, day);
                    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
                    return raffleDate >= start && raffleDate <= end;
                });

                // Calculate raffle summary from filtered data
                const totalRaffles = filteredRaffles.length;
                const activeRaffles = filteredRaffles.filter(r => r.status === 'Devam Ediyor').length;
                const completedRaffles = filteredRaffles.filter(r => r.status === 'Tamamlandı').length;
                const totalParticipants = filteredRaffles.reduce((sum, r) => sum + r.participantCount, 0);
                const totalWinners = filteredRaffles.reduce((sum, r) => sum + r.winnerCount, 0);

                const raffleSummary: SummaryItem[] = [
                    { label: 'Toplam Çekiliş', value: totalRaffles },
                    { label: 'Devam Eden', value: activeRaffles },
                    { label: 'Tamamlanan', value: completedRaffles },
                    { label: 'Toplam Katılımcı', value: totalParticipants.toLocaleString('tr-TR'), isTotal: true },
                    { label: 'Toplam Kazanan', value: totalWinners },
                ];

                if (format === 'Excel') {
                    exportToExcel(filteredRaffles, raffleColumns, `cekilis_raporu_${timestamp}`, raffleSummary, 'Çekilişler');
                } else if (format === 'PDF') {
                    exportToPDF(filteredRaffles, raffleColumns, `cekilis_raporu_${timestamp}`, 'Cekilis Raporu', raffleSummary, dateRangeDisplay);
                }
                break;
            }

            default:
                alert(`${reportId} raporu yakında eklenecek!`);
        }
    };

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
                    title="Raporlar"
                    subtitle="Detaylı analiz ve veri export"
                />

                {/* Stats Grid */}
                <Grid templateColumns={{ base: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={3} mb={3}>
                    <GridItem>
                        <StatCard
                            label="Oluşturulan"
                            value={mockReportStats.totalReportsGenerated}
                            icon={LuFileText}
                            color="brand"
                            subtitle="Tüm zamanlar"
                        />
                    </GridItem>
                    <GridItem>
                        <StatCard
                            label="Bu Ay Export"
                            value={mockReportStats.exportedThisMonth}
                            icon={LuDownload}
                            color="green"
                            subtitle="Ocak 2026"
                        />
                    </GridItem>
                    <GridItem>
                        <StatCard
                            label="Zamanlanmış"
                            value={mockReportStats.scheduledReports}
                            icon={LuClock}
                            color="blue"
                            subtitle="Otomatik"
                        />
                    </GridItem>
                    <GridItem>
                        <StatCard
                            label="Son Rapor"
                            value="14:30"
                            icon={LuCalendar}
                            color="ieu"
                            subtitle="Bugün"
                        />
                    </GridItem>
                </Grid>

                {/* Date Range Filter */}
                <Box
                    bg={isDark ? '#1E1E1E' : 'white'}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={isDark ? '#333333' : '#E0E0E0'}
                    p={3}
                    mb={3}
                >
                    <Box position="relative">
                        <Flex align="center" justify="space-between">
                            <Flex align="center" gap={2}>
                                <Icon as={LuCalendar} color={isDark ? '#808080' : '#666666'} boxSize={4} />
                                <Text
                                    fontWeight="medium"
                                    color={isDark ? 'white' : '#1A1A1A'}
                                    fontSize="sm"
                                    whiteSpace="nowrap"
                                >
                                    Tarih Araligi
                                </Text>
                            </Flex>
                            <Flex align="center" gap={4} mr="50px">
                                <Flex align="center" gap={2}>
                                    <Text fontSize="sm" color={isDark ? '#808080' : '#666666'} whiteSpace="nowrap">
                                        Baslangic:
                                    </Text>
                                    <Box w="110px">
                                        <DatePicker
                                            selected={startDate}
                                            onChange={(date: Date | null) => date && setStartDate(date)}
                                            dateFormat="dd.MM.yyyy"
                                            locale="tr"
                                            maxDate={endDate}
                                            className={isDark ? 'dark-datepicker' : 'light-datepicker'}
                                        />
                                    </Box>
                                </Flex>
                                <Flex align="center" gap={2}>
                                    <Text fontSize="sm" color={isDark ? '#808080' : '#666666'} whiteSpace="nowrap">
                                        Bitis:
                                    </Text>
                                    <Box w="110px">
                                        <DatePicker
                                            selected={endDate}
                                            onChange={(date: Date | null) => date && setEndDate(date)}
                                            dateFormat="dd.MM.yyyy"
                                            locale="tr"
                                            minDate={startDate}
                                            maxDate={new Date()}
                                            className={isDark ? 'dark-datepicker' : 'light-datepicker'}
                                        />
                                    </Box>
                                </Flex>
                            </Flex>
                        </Flex>
                        <style>{`
                            .react-datepicker-wrapper {
                                width: 110px !important;
                            }
                            .react-datepicker__input-container {
                                width: 110px !important;
                            }
                            .react-datepicker__input-container input {
                                padding: 6px 12px;
                                border-radius: 8px;
                                font-size: 14px;
                                width: 110px !important;
                                text-align: center;
                                box-sizing: border-box;
                            }
                            .react-datepicker__input-container input:focus {
                                outline: none !important;
                                box-shadow: none !important;
                            }
                            .dark-datepicker {
                                background-color: #2D2D2D !important;
                                border: 1px solid #444 !important;
                                color: white !important;
                            }
                            .dark-datepicker:focus {
                                border: 1px solid #444 !important;
                            }
                            .light-datepicker {
                                background-color: white !important;
                                border: 1px solid #E0E0E0 !important;
                                color: #1A1A1A !important;
                            }
                            .light-datepicker:focus {
                                border: 1px solid #E0E0E0 !important;
                            }
                            .react-datepicker {
                                font-family: inherit;
                            }
                            .react-datepicker__header {
                                background-color: #424242;
                                color: white;
                            }
                            .react-datepicker__current-month,
                            .react-datepicker__day-name {
                                color: white;
                            }
                            .react-datepicker__day--selected {
                                background-color: #FF9800 !important;
                            }
                        `}</style>
                    </Box>
                </Box>

                {/* Content Grid */}
                <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={3} flex={1} overflow="hidden">
                    {/* Report Categories */}
                    <GridItem overflow="auto">
                        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
                            {reportCategories.map((report) => (
                                <GridItem key={report.id}>
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
                                        <Flex align="flex-start" gap={3} mb={3}>
                                            <Flex
                                                w={10}
                                                h={10}
                                                borderRadius="xl"
                                                bg={isDark ? report.darkBgColor : report.bgColor}
                                                align="center"
                                                justify="center"
                                                flexShrink={0}
                                            >
                                                <Icon as={report.icon} boxSize={5} color={report.color} />
                                            </Flex>
                                            <Box flex={1}>
                                                <Text
                                                    fontWeight="semibold"
                                                    color={isDark ? 'white' : '#1A1A1A'}
                                                    fontSize="sm"
                                                >
                                                    {report.name}
                                                </Text>
                                                <Text
                                                    fontSize="xs"
                                                    color={isDark ? '#808080' : '#666666'}
                                                >
                                                    {report.description}
                                                </Text>
                                            </Box>
                                        </Flex>
                                        <Flex gap={2}>
                                            {report.formats.map((format) => {
                                                const config = formatConfig[format];
                                                return (
                                                    <Button
                                                        key={format}
                                                        size="xs"
                                                        variant="outline"
                                                        borderColor={isDark ? '#333333' : '#E0E0E0'}
                                                        color={isDark ? '#B0B0B0' : '#666666'}
                                                        _hover={{
                                                            bg: isDark ? '#2D2D2D' : '#F5F5F5',
                                                            borderColor: config.color,
                                                            color: config.color
                                                        }}
                                                        onClick={() => handleExport(report.id, format)}
                                                        flex={1}
                                                    >
                                                        <Icon as={config.icon} mr={1} boxSize={3} />
                                                        {format}
                                                    </Button>
                                                );
                                            })}
                                        </Flex>
                                    </Box>
                                </GridItem>
                            ))}
                        </Grid>
                    </GridItem>

                    {/* Recent Exports - Empty State */}
                    <GridItem>
                        <Box
                            bg={isDark ? '#1E1E1E' : 'white'}
                            borderRadius="xl"
                            border="1px solid"
                            borderColor={isDark ? '#333333' : '#E0E0E0'}
                            overflow="hidden"
                            h="100%"
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
                                    Son Exportlar
                                </Text>
                            </Flex>
                            <Flex
                                direction="column"
                                align="center"
                                justify="center"
                                py={8}
                                px={4}
                            >
                                <Icon
                                    as={LuDownload}
                                    boxSize={10}
                                    color={isDark ? '#4A4A4A' : '#BDBDBD'}
                                    mb={3}
                                />
                                <Text
                                    color={isDark ? '#808080' : '#666666'}
                                    fontSize="sm"
                                    textAlign="center"
                                >
                                    Henüz export yapılmadı
                                </Text>
                                <Text
                                    color={isDark ? '#666666' : '#999999'}
                                    fontSize="xs"
                                    textAlign="center"
                                    mt={1}
                                >
                                    Rapor kartlarından Excel veya PDF indirebilirsiniz
                                </Text>
                            </Flex>
                        </Box>
                    </GridItem>
                </Grid>
            </Box>
        </Box>
    );
}

export default ReportsPage;
