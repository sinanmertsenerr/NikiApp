import { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    useColorScheme,
    Pressable,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Alert } from '../../src/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import {
    Raffle,
    UserRaffleParticipation,
    getActiveRaffles,
    getMyRaffles,
    joinRaffle,
} from '../../src/services/raffleService';
import { getErrorMessage } from '../../src/services/api';

const getRewardLabel = (raffle: Raffle, t: any) => {
    // Show the custom reward text directly (new manual system)
    if (raffle.rewardValue) {
        return raffle.rewardValue;
    }
    // Fallback: generic prize label
    return t('raffles.prize');
};

const getTimeRemaining = (endDate: string, t: any) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return t('raffles.ended');

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} ${t('raffles.daysLeft')}`;
    if (hours > 0) return `${hours} ${t('raffles.hoursLeft')}`;
    return t('raffles.endingSoon');
};

export default function UserRafflesScreen() {
    const colorScheme = useColorScheme();
    const { theme, language } = useSettingsStore();
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();

    const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
    const colors = isDark ? DarkColors : Colors;

    const [activeTab, setActiveTab] = useState<'active' | 'my'>('active');

    // Fetch active raffles
    const { data: activeRaffles = [], isLoading: loadingActive, refetch: refetchActive } = useQuery({
        queryKey: ['active-raffles'],
        queryFn: getActiveRaffles,
    });

    // Fetch my raffles (participated)
    const { data: myRaffles = [], isLoading: loadingMy, refetch: refetchMy } = useQuery({
        queryKey: ['my-raffles'],
        queryFn: getMyRaffles,
    });

    // Join mutation
    const joinMutation = useMutation({
        mutationFn: (raffleId: string) => joinRaffle(raffleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['active-raffles'] });
            queryClient.invalidateQueries({ queryKey: ['my-raffles'] });
            Alert.alert(t('common.success'), t('raffles.joinedSuccess'));
        },
        onError: (error: any) => {
            Alert.alert(t('common.error'), getErrorMessage(error));
        },
    });

    const onRefresh = useCallback(() => {
        if (activeTab === 'active') {
            refetchActive();
        } else {
            refetchMy();
        }
    }, [activeTab]);

    const getTitle = (raffle: Raffle) => {
        return language === 'tr' ? raffle.titleTr : raffle.title;
    };

    const getDescription = (raffle: Raffle) => {
        return language === 'tr' ? raffle.descriptionTr : raffle.description;
    };

    const isParticipated = (raffleId: string) => {
        return myRaffles.some(p => p.raffle.id === raffleId);
    };

    const handleJoin = (raffle: Raffle) => {
        Alert.alert(
            t('raffles.joinRaffle'),
            t('raffles.joinRaffleConfirm', { title: getTitle(raffle) }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('raffles.join'),
                    onPress: () => joinMutation.mutate(raffle.id),
                },
            ]
        );
    };

    const renderActiveRaffle = ({ item }: { item: Raffle }) => {
        const participated = isParticipated(item.id);
        const isEnded = new Date(item.endDate) < new Date();

        return (
            <View style={[styles.raffleCard, { backgroundColor: colors.card }, Shadows.sm]}>
                <View style={styles.raffleHeader}>
                    <View style={[styles.rewardIcon, { backgroundColor: '#E91E63' + '20' }]}>
                        <Text style={styles.rewardEmoji}>🎰</Text>
                    </View>
                    <View style={styles.raffleInfo}>
                        <Text style={[styles.raffleTitle, { color: colors.text }]}>{getTitle(item)}</Text>
                        <Text style={[styles.raffleReward, { color: colors.primary }]}>
                            {getRewardLabel(item, t)}
                        </Text>
                    </View>
                </View>

                {getDescription(item) && (
                    <Text style={[styles.raffleDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                        {getDescription(item)}
                    </Text>
                )}

                <View style={styles.raffleMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {item.participantCount} {t('raffles.participants')}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={16} color={isEnded ? colors.error : colors.textSecondary} />
                        <Text style={[styles.metaText, { color: isEnded ? colors.error : colors.textSecondary }]}>
                            {getTimeRemaining(item.endDate, t)}
                        </Text>
                    </View>
                </View>

                {/* Action Button */}
                {participated ? (
                    <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' + '20' }]}>
                        <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                        <Text style={[styles.statusText, { color: '#4CAF50' }]}>{t('raffles.joined')}</Text>
                    </View>
                ) : isEnded ? (
                    <View style={[styles.statusBadge, { backgroundColor: colors.error + '20' }]}>
                        <Text style={[styles.statusText, { color: colors.error }]}>{t('raffles.ended')}</Text>
                    </View>
                ) : (
                    <Pressable
                        style={[styles.joinButton, { backgroundColor: colors.primary }]}
                        onPress={() => handleJoin(item)}
                        disabled={joinMutation.isPending}
                    >
                        {joinMutation.isPending ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={styles.joinButtonText}>{t('raffles.join')}</Text>
                        )}
                    </Pressable>
                )}
            </View>
        );
    };

    const renderMyRaffle = ({ item }: { item: UserRaffleParticipation }) => {
        const raffle = item.raffle;
        const isCompleted = raffle.status === 'completed';
        const isWinner = item.isWinner;
        const isUsed = !!item.usedAt;

        return (
            <View style={[
                styles.raffleCard,
                { backgroundColor: colors.card },
                isWinner && { borderColor: '#4CAF50', borderWidth: 2 },
                Shadows.sm
            ]}>
                <View style={styles.raffleHeader}>
                    <View style={[styles.rewardIcon, { backgroundColor: isWinner ? '#4CAF50' + '20' : '#E91E63' + '20' }]}>
                        <Text style={styles.rewardEmoji}>{isWinner ? '🏆' : '🎰'}</Text>
                    </View>
                    <View style={styles.raffleInfo}>
                        <Text style={[styles.raffleTitle, { color: colors.text }]}>{getTitle(raffle)}</Text>
                        <Text style={[styles.raffleReward, { color: colors.primary }]}>
                            {getRewardLabel(raffle, t)}
                        </Text>
                    </View>
                </View>

                {/* Status Badge */}
                {isCompleted ? (
                    isWinner ? (
                        isUsed ? (
                            <View style={[styles.resultBadge, { backgroundColor: '#9C27B0' + '20' }]}>
                                <Ionicons name="checkmark-done" size={20} color="#9C27B0" />
                                <Text style={[styles.resultText, { color: '#9C27B0' }]}>{t('raffles.prizeUsed')}</Text>
                            </View>
                        ) : (
                            <View>
                                <View style={[styles.resultBadge, { backgroundColor: '#4CAF50' + '20', marginBottom: RSpacing.sm }]}>
                                    <Text style={styles.winnerEmoji}>🎉</Text>
                                    <Text style={[styles.resultText, { color: '#4CAF50' }]}>{t('raffles.youWon')}</Text>
                                </View>
                                <Pressable
                                    style={styles.usePrizeButton}
                                    onPress={() => {
                                        Alert.alert(
                                            t('raffles.usePrize'),
                                            t('raffles.usePrizeDesc'),
                                            [
                                                { text: t('common.cancel'), style: 'cancel' },
                                                { text: t('raffles.goToWallet'), onPress: () => router.push('/(tabs)/wallet') },
                                            ]
                                        );
                                    }}
                                >
                                    <Ionicons name="gift" size={20} color="#FFF" />
                                    <Text style={styles.usePrizeText}>{t('raffles.usePrize')}</Text>
                                </Pressable>
                            </View>
                        )
                    ) : (
                        <View style={[styles.resultBadge, { backgroundColor: colors.textSecondary + '20' }]}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                            <Text style={[styles.resultText, { color: colors.textSecondary }]}>{t('raffles.tryAgain')}</Text>
                        </View>
                    )
                ) : (
                    <View style={[styles.statusBadge, { backgroundColor: '#FF9800' + '20' }]}>
                        <Ionicons name="hourglass-outline" size={18} color="#FF9800" />
                        <Text style={[styles.statusText, { color: '#FF9800' }]}>{t('raffles.waitingDraw')}</Text>
                    </View>
                )}

                <View style={styles.raffleMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {new Date(item.joinedAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}
                        </Text>
                    </View>
                    {isCompleted && (
                        <View style={styles.metaItem}>
                            <Ionicons name="trophy-outline" size={16} color={colors.textSecondary} />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                {raffle.winnerCount} {t('admin.winners')}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const loading = activeTab === 'active' ? loadingActive : loadingMy;
    const data = activeTab === 'active' ? activeRaffles : myRaffles;
    const renderItem = activeTab === 'active' ? renderActiveRaffle : renderMyRaffle;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{t('raffles.title')}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {t('raffles.subtitle')}
                </Text>
            </View>

            {/* Tabs */}
            <View style={[styles.tabContainer, { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border }]}>
                <Pressable
                    style={[styles.tab, activeTab === 'active' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('active')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'active' ? colors.primary : colors.textSecondary }]}>
                        {t('raffles.activeRaffles')}
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'my' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('my')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'my' ? colors.primary : colors.textSecondary }]}>
                        {t('raffles.myRaffles')}
                    </Text>
                </Pressable>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={data as any}
                    renderItem={renderItem as any}
                    keyExtractor={(item: any) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="ticket-outline" size={64} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                {activeTab === 'active' ? t('raffles.noActiveRaffles') : t('raffles.noParticipation')}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: RSpacing.lg,
        paddingTop: RSpacing.md,
        paddingBottom: RSpacing.md,
    },
    title: {
        fontSize: RFontSizes.xxl,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: RFontSizes.md,
        marginTop: RSpacing.xs,
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        paddingVertical: RSpacing.md,
        alignItems: 'center',
    },
    tabText: {
        fontSize: RFontSizes.md,
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: RSpacing.md,
        gap: RSpacing.md,
    },
    raffleCard: {
        borderRadius: BorderRadius.lg,
        padding: RSpacing.md,
    },
    raffleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: RSpacing.sm,
    },
    rewardIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: RSpacing.sm,
    },
    rewardEmoji: {
        fontSize: 24,
    },
    raffleInfo: {
        flex: 1,
    },
    raffleTitle: {
        fontSize: RFontSizes.md,
        fontWeight: '600',
    },
    raffleReward: {
        fontSize: RFontSizes.sm,
        fontWeight: '500',
        marginTop: 2,
    },
    raffleDesc: {
        fontSize: RFontSizes.sm,
        marginBottom: RSpacing.sm,
    },
    raffleMeta: {
        flexDirection: 'row',
        gap: RSpacing.lg,
        marginTop: RSpacing.md,
        marginBottom: RSpacing.sm,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: RFontSizes.xs,
    },
    joinButton: {
        paddingVertical: RSpacing.sm,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginTop: RSpacing.xs,
    },
    joinButtonText: {
        color: '#FFF',
        fontSize: RFontSizes.md,
        fontWeight: '600',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: RSpacing.xs,
        paddingVertical: RSpacing.sm,
        borderRadius: BorderRadius.md,
        marginTop: RSpacing.xs,
    },
    statusText: {
        fontSize: RFontSizes.sm,
        fontWeight: '600',
    },
    resultBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: RSpacing.sm,
        paddingVertical: RSpacing.md,
        borderRadius: BorderRadius.md,
        marginTop: RSpacing.xs,
    },
    resultText: {
        fontSize: RFontSizes.md,
        fontWeight: '600',
    },
    winnerEmoji: {
        fontSize: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: RSpacing.xxl,
    },
    emptyText: {
        fontSize: RFontSizes.md,
        marginTop: RSpacing.md,
        textAlign: 'center',
    },
    usePrizeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: RSpacing.sm,
        paddingVertical: RSpacing.md,
        paddingHorizontal: RSpacing.lg,
        borderRadius: BorderRadius.md,
        backgroundColor: '#4CAF50',
    },
    usePrizeText: {
        color: '#FFF',
        fontSize: RFontSizes.sm,
        fontWeight: '600',
    },
});
