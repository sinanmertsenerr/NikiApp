import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    useColorScheme,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuthStore } from '../../src/stores/authStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import { walletService, Transaction, WalletType } from '../../src/services/walletService';

// Card images
const nikiCardImage = require('../../assets/images/niki-card.png');
const iueCardImage = require('../../assets/images/iue-card.png');

export default function TransactionsScreen() {
    const { t, i18n } = useTranslation();
    const colorScheme = useColorScheme();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuthStore();
    const { theme } = useSettingsStore();

    // Get wallet type from params or default to 'ieu'
    const walletType = (params.walletType as string) || 'ieu';
    const selectedWallet = walletType as 'ieu' | 'niki';

    const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
    const colors = isDark ? DarkColors : Colors;

    // Wallet configurations
    const wallets = {
        ieu: {
            id: 'ieu',
            name: i18n.language === 'tr' ? 'İEÜ Cüzdan' : 'IUE Wallet',
            color: '#D97706',
            qrPrefix: 'IEU',
            discountRate: 15,
            creditsName: 'IUE Credits',
        },
        niki: {
            id: 'niki',
            name: i18n.language === 'tr' ? 'Niki Cüzdan' : 'Niki Wallet',
            color: isDark ? '#333333' : '#2D2D2D',
            qrPrefix: 'NIKI',
            discountRate: 10,
            creditsName: 'Niki Credits',
        },
    };

    const currentWallet = wallets[selectedWallet];
    const isAuthenticated = !!user;

    // Fetch wallet data
    const { data: walletData, isLoading: walletLoading, refetch: refetchWallet } = useQuery({
        queryKey: ['wallet'],
        queryFn: async () => {
            const data = await walletService.getMyWallet();
            return data || null;
        },
        enabled: isAuthenticated,
    });

    // Fetch ALL transactions
    const { data: transactionsData, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery({
        queryKey: ['transactions-all'],
        queryFn: async () => {
            const data = await walletService.getMyTransactions({ limit: 100 });
            return data || { transactions: [], total: 0, page: 1, limit: 100, totalPages: 0 };
        },
        enabled: isAuthenticated,
    });

    const onRefresh = async () => {
        await Promise.all([refetchWallet(), refetchTransactions()]);
    };

    const isLoading = walletLoading || transactionsLoading;

    // Get balance from selected wallet
    const activeWalletData = selectedWallet === 'ieu'
        ? walletData?.ieuWallet
        : walletData?.nikiWallet;

    const balance = parseFloat(activeWalletData?.balance || '0');

    // Filter transactions by wallet type
    const allTransactions = transactionsData?.transactions || [];
    const transactions = allTransactions.filter(tx => {
        if (tx.walletType) {
            return tx.walletType === (selectedWallet === 'ieu' ? 'IEU' : 'NIKI');
        }
        return selectedWallet === 'ieu';
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';
        return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'topup':
            case 'top_up':
                return 'swap-horizontal';
            case 'payment':
                return 'arrow-up';
            case 'refund':
                return 'arrow-down';
            case 'reward':
                return 'gift';
            default:
                return 'cash';
        }
    };

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'topup':
            case 'top_up':
            case 'refund':
            case 'reward':
                return colors.success;
            case 'payment':
                return colors.error;
            default:
                return colors.text;
        }
    };

    const getTransactionLabel = (type: string) => {
        switch (type) {
            case 'topup':
            case 'top_up':
                return t('wallet.topUp');
            case 'payment':
                return t('wallet.payment');
            case 'refund':
                return t('wallet.refund');
            case 'reward':
                return t('wallet.reward');
            default:
                return type;
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Fixed Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel={t('common.back')}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {t('wallet.transactions')}
                </Text>
                <View style={{ width: 28 }} />
            </View>

            {/* Fixed Wallet Card */}
            <View style={styles.fixedCardContainer}>
                <View style={[styles.balanceCardWrapper, Shadows.lg]}>
                    <ImageBackground
                        source={selectedWallet === 'niki' ? nikiCardImage : iueCardImage}
                        style={styles.balanceCardImage}
                        imageStyle={styles.cardImageStyle}
                        resizeMode="cover"
                        accessible={false}
                    >
                        {/* Futuristic shine overlay */}
                        <LinearGradient
                            colors={selectedWallet === 'niki'
                                ? ['rgba(255,255,255,0.15)', 'transparent', 'transparent', 'rgba(255,255,255,0.08)']
                                : ['rgba(255,215,0,0.1)', 'transparent', 'transparent', 'rgba(255,215,0,0.05)']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.shineOverlay}
                        />
                        <View style={styles.balanceOverlay}>
                            <Text style={styles.balanceAmount}>₺{balance.toFixed(2)}</Text>
                        </View>
                    </ImageBackground>
                </View>
            </View>

            {/* Transactions Section Title - Fixed */}
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t('wallet.transactions')} ({transactions.length})
                </Text>
            </View>

            {/* Scrollable Transactions List */}
            <ScrollView
                style={styles.transactionsList}
                contentContainerStyle={styles.transactionsContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : transactions.length > 0 ? (
                    transactions.map((transaction) => (
                        <View
                            key={transaction.id}
                            style={[styles.transactionItem, { backgroundColor: colors.card }, Shadows.sm]}
                        >
                            <View
                                style={[
                                    styles.transactionIcon,
                                    {
                                        backgroundColor: getTransactionColor(transaction.type) + '20',
                                    },
                                ]}
                            >
                                <Ionicons
                                    name={getTransactionIcon(transaction.type) as any}
                                    size={20}
                                    color={getTransactionColor(transaction.type)}
                                />
                            </View>
                            <View style={styles.transactionInfo}>
                                <Text style={[styles.transactionType, { color: colors.text }]}>
                                    {(() => {
                                        const desc = transaction.description;
                                        // Handle "Top up" / "Top Up" case-insensitively
                                        if (desc && desc.toLowerCase() === 'top up') {
                                            return t('wallet.topUp');
                                        }
                                        // Handle "Payment" - translate all payment variants
                                        if (desc && (desc.toLowerCase().startsWith('payment') || desc === 'Payment')) {
                                            return t('wallet.payment');
                                        }
                                        // Handle raw translation key fallback (if previously saved incorrectly)
                                        if (desc === 'admin.creditLoadedDesc') {
                                            return t('admin.creditLoadedDesc', { amount: transaction.amount });
                                        }

                                        // Parse English format "X TL credits loaded by Admin" to localized text
                                        if (desc?.includes('credits loaded by Admin')) {
                                            const match = desc.match(/(\d+(?:[.,]?\d+)?) TL credits loaded/);
                                            if (match && match[1]) {
                                                return t('admin.creditLoadedDesc', {
                                                    amount: match[1],
                                                    wallet: transaction.walletType === 'NIKI' ? 'Niki' : 'IEU'
                                                });
                                            }
                                        }

                                        // Parse Turkish format "Admin tarafından X TL kredi yüklendi" 
                                        if (desc?.includes('kredi yüklendi')) {
                                            const match = desc.match(/Admin tarafından (\d+(?:[.,]\d+)?) TL/);
                                            if (match && match[1]) {
                                                return t('admin.creditLoadedDesc', {
                                                    amount: match[1],
                                                    wallet: transaction.walletType === 'NIKI' ? 'Niki' : 'IEU'
                                                });
                                            }
                                            return desc;
                                        }

                                        // Parse Turkish format "Admin tarafından X cüzdanından Y TL kredi silindi"
                                        if (desc?.includes('kredi silindi')) {
                                            const match = desc.match(/Admin tarafından (.+?) cüzdanından (\d+(?:[.,]\d+)?) TL kredi silindi/);
                                            if (match && match[1] && match[2]) {
                                                return t('admin.creditDeductedDesc', { wallet: match[1], amount: match[2] });
                                            }
                                            return desc;
                                        }

                                        // Default fallback
                                        return desc || getTransactionLabel(transaction.type);
                                    })()}
                                </Text>
                                <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                                    {formatDate(transaction.createdAt)}
                                </Text>
                            </View>
                            <Text
                                style={[
                                    styles.transactionAmount,
                                    { color: getTransactionColor(transaction.type) },
                                ]}
                            >
                                {transaction.type === 'payment' ? '-' : '+'}₺{Math.abs(Number(transaction.amount)).toFixed(2)}
                            </Text>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {t('wallet.noTransactions')}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: RSpacing.md,
        paddingVertical: RSpacing.sm,
    },
    backButton: {
        padding: RSpacing.xs,
    },
    headerTitle: {
        fontSize: RFontSizes.lg,
        fontWeight: '600',
    },
    fixedCardContainer: {
        paddingHorizontal: RSpacing.md,
        paddingBottom: RSpacing.md,
    },
    walletCard: {
        borderRadius: BorderRadius.xl,
        padding: RSpacing.lg,
    },
    // New card styles
    balanceCardWrapper: {
        width: '100%',
        aspectRatio: 1.586, // Credit card aspect ratio
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },
    balanceCardImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-start',
    },
    cardImageStyle: {
        borderRadius: BorderRadius.xl,
    },
    shineOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: BorderRadius.xl,
    },
    balanceOverlay: {
        padding: RSpacing.lg,
        paddingTop: RSpacing.md,
    },
    walletName: {
        fontSize: RFontSizes.md,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: RSpacing.xs,
    },
    balanceLabel: {
        fontSize: RFontSizes.sm,
        color: 'rgba(255,255,255,0.8)',
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: RSpacing.xs,
    },
    discountInfo: {
        fontSize: RFontSizes.sm,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    sectionHeader: {
        paddingHorizontal: RSpacing.md,
        paddingBottom: RSpacing.sm,
    },
    sectionTitle: {
        fontSize: RFontSizes.lg,
        fontWeight: '600',
    },
    transactionsList: {
        flex: 1,
    },
    transactionsContent: {
        paddingHorizontal: RSpacing.md,
        paddingBottom: RSpacing.xl,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: RSpacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: RSpacing.sm,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    transactionInfo: {
        flex: 1,
        marginLeft: RSpacing.md,
    },
    transactionType: {
        fontSize: RFontSizes.md,
        fontWeight: '500',
    },
    transactionDate: {
        fontSize: RFontSizes.sm,
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: RFontSizes.md,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: RSpacing.xxl,
    },
    emptyText: {
        fontSize: RFontSizes.md,
        marginTop: RSpacing.md,
    },
});
