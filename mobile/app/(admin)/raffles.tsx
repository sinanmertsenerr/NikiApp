import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    useColorScheme,
    Pressable,
    RefreshControl,
    Modal,
    TextInput,
    ScrollView,
    Platform,
    ActivityIndicator,
    KeyboardAvoidingView,
} from 'react-native';
import { Alert } from '../../src/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { WebDateTimeField } from '../../src/components/ui/WebDateTimeField';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import { getTranslatedContent } from '../../src/hooks/useTranslatedContent';
import { getErrorMessage } from '../../src/services/api';
import {
    Raffle,
    RaffleParticipant,
    RaffleStatus,
    RewardType,
    adminGetRaffles,
    adminGetRaffle,
    createRaffle,
    updateRaffle,
    deleteRaffle,
    getRaffleParticipants,
    drawRaffle,
} from '../../src/services/raffleService';

const getRewardTypes = (t: any): { value: RewardType; label: string; icon: string; color: string }[] => [
    { value: 'free_coffee', label: t('campaigns.freeCoffee'), icon: 'cafe', color: '#4CAF50' },
    { value: 'discount_percent', label: t('campaigns.discountPercent'), icon: 'pricetag', color: '#2196F3' },
    { value: 'discount_fixed', label: t('campaigns.discountFixed'), icon: 'cash', color: '#9C27B0' },
    { value: 'bonus_points', label: t('campaigns.bonusPoints'), icon: 'star', color: '#FF9800' },
];

export default function AdminRafflesScreen() {
    const colorScheme = useColorScheme();
    const { theme, language } = useSettingsStore();
    const { t, i18n } = useTranslation();

    const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
    const colors = isDark ? DarkColors : Colors;

    // Helper for dynamic language content
    const getTitle = (item: Raffle) => getTranslatedContent(item, 'title', i18n.language);
    const getDesc = (item: Raffle) => getTranslatedContent(item, 'description', i18n.language);

    // State
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal states
    const [modalVisible, setModalVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null);
    const [saving, setSaving] = useState(false);

    // Participants modal
    const [participantsModalVisible, setParticipantsModalVisible] = useState(false);
    const [participants, setParticipants] = useState<RaffleParticipant[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [drawing, setDrawing] = useState(false);

    // Form states
    const [title, setTitle] = useState('');
    const [titleTr, setTitleTr] = useState('');
    const [description, setDescription] = useState('');
    const [descriptionTr, setDescriptionTr] = useState('');
    const [rewardType, setRewardType] = useState<RewardType>('free_coffee');
    const [rewardValue, setRewardValue] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const [winnerCount, setWinnerCount] = useState('1');
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    const loadData = async () => {
        try {
            const response = await adminGetRaffles({ limit: 100 });
            setRaffles(response.raffles);
        } catch (error) {
            console.error('Error loading raffles:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, []);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US');
    };

    const getStatusColor = (status: RaffleStatus) => {
        switch (status) {
            case 'active': return '#4CAF50';
            case 'pending': return '#FF9800';
            case 'completed': return '#2196F3';
            case 'cancelled': return '#F44336';
            default: return colors.textSecondary;
        }
    };

    const getStatusLabel = (status: RaffleStatus) => {
        switch (status) {
            case 'active': return t('admin.active');
            case 'pending': return t('admin.pending');
            case 'completed': return t('admin.completed');
            case 'cancelled': return t('admin.cancelled');
            default: return status;
        }
    };

    const resetForm = () => {
        setTitle('');
        setTitleTr('');
        setDescription('');
        setDescriptionTr('');
        setRewardType('free_coffee');
        setRewardValue('');
        setStartDate(new Date());
        setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        setWinnerCount('1');
        setEditMode(false);
        setSelectedRaffle(null);
    };

    const openCreateModal = () => {
        resetForm();
        setModalVisible(true);
    };

    const openEditModal = (raffle: Raffle) => {
        setEditMode(true);
        setSelectedRaffle(raffle);
        setTitle(raffle.title);
        setTitleTr(raffle.titleTr);
        setDescription(raffle.description || '');
        setDescriptionTr(raffle.descriptionTr || '');
        setRewardType(raffle.rewardType);
        setRewardValue(raffle.rewardValue?.toString() || '');
        setStartDate(new Date(raffle.startDate));
        setEndDate(new Date(raffle.endDate));
        setWinnerCount(raffle.winnerCount.toString());
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!title.trim() || !titleTr.trim()) {
            Alert.alert(t('common.error'), t('admin.fillRequiredFields'));
            return;
        }

        setSaving(true);
        try {
            const data = {
                title: title.trim(),
                titleTr: titleTr.trim(),
                description: description.trim() || undefined,
                descriptionTr: descriptionTr.trim() || undefined,
                rewardType,
                rewardValue: rewardValue.trim() || undefined,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                winnerCount: parseInt(winnerCount) || 1,
            };

            if (editMode && selectedRaffle) {
                await updateRaffle(selectedRaffle.id, data);
            } else {
                await createRaffle(data);
            }

            setModalVisible(false);
            resetForm();
            loadData();
        } catch (error: any) {
            Alert.alert(t('common.error'), getErrorMessage(error));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (raffle: Raffle) => {
        Alert.alert(
            t('admin.deleteRaffle'),
            t('admin.deleteRaffleConfirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteRaffle(raffle.id);
                            loadData();
                        } catch (error: any) {
                            Alert.alert(t('common.error'), getErrorMessage(error));
                        }
                    },
                },
            ]
        );
    };

    const openParticipantsModal = async (raffle: Raffle) => {
        setSelectedRaffle(raffle);
        setParticipantsModalVisible(true);
        setLoadingParticipants(true);

        try {
            const response = await getRaffleParticipants(raffle.id);
            setParticipants(response.participants);
        } catch (error) {
            console.error('Error loading participants:', error);
        } finally {
            setLoadingParticipants(false);
        }
    };

    const handleDraw = async () => {
        if (!selectedRaffle) return;

        Alert.alert(
            t('admin.drawRaffle'),
            t('admin.drawRaffleConfirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('admin.draw'),
                    onPress: async () => {
                        setDrawing(true);
                        try {
                            const response = await drawRaffle(selectedRaffle.id);
                            setParticipants(response.participants);
                            Alert.alert(t('common.success'), response.message);
                            loadData();
                        } catch (error: any) {
                            Alert.alert(t('common.error'), getErrorMessage(error));
                        } finally {
                            setDrawing(false);
                        }
                    },
                },
            ]
        );
    };

    const renderRaffle = ({ item }: { item: Raffle }) => {
        const now = new Date();
        const endDate = new Date(item.endDate);
        const startDate = new Date(item.startDate);
        const isExpired = endDate < now;
        const isNotStarted = startDate > now;
        const canDraw = item.status === 'active' && isExpired && item.participantCount > 0;
        const isDrawn = item.status === 'completed';

        // Calculate time remaining or elapsed
        const getTimeInfo = () => {
            if (isDrawn) {
                return { text: t('admin.drawn'), color: '#4CAF50', icon: 'checkmark-circle' as const };
            }
            if (isNotStarted) {
                const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return { text: `${daysUntilStart} ${t('admin.daysToStart')}`, color: colors.primary, icon: 'time-outline' as const };
            }
            if (isExpired) {
                const daysAgo = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
                return { text: `${daysAgo} ${t('admin.daysAgo')}`, color: colors.error, icon: 'alert-circle-outline' as const };
            }
            const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 1) {
                const hoursLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60));
                return { text: `${hoursLeft} ${t('admin.hoursLeft')}`, color: '#FF9800', icon: 'time-outline' as const };
            }
            return { text: `${daysLeft} ${t('admin.daysLeft')}`, color: '#4CAF50', icon: 'time-outline' as const };
        };

        const timeInfo = getTimeInfo();

        return (
            <View style={[styles.campaignCard, { backgroundColor: colors.card }, Shadows.sm]}>
                <View style={styles.campaignHeader}>
                    <View style={[styles.typeIcon, { backgroundColor: '#E91E63' + '20' }]}>
                        <Ionicons name="gift" size={24} color="#E91E63" />
                    </View>
                    <View style={styles.campaignInfo}>
                        <View style={styles.titleRow}>
                            <Text style={[styles.campaignTitle, { color: colors.text }]} numberOfLines={1}>
                                {getTitle(item)}
                            </Text>
                            <View
                                style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}
                            >
                                <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
                                    {getStatusLabel(item.status)}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.campaignDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                            {getDesc(item) || t('admin.noDescription')}
                        </Text>
                        {/* Date Range with Time Badge */}
                        <View style={styles.dateRow}>
                            <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
                            <Text style={[styles.dateText, { color: colors.textTertiary }]}>
                                {formatDate(new Date(item.startDate))} - {formatDate(new Date(item.endDate))}
                            </Text>
                            <View style={[styles.timeBadge, { backgroundColor: timeInfo.color + '20' }]}>
                                <Ionicons name={timeInfo.icon} size={10} color={timeInfo.color} />
                                <Text style={[styles.timeBadgeText, { color: timeInfo.color }]}>
                                    {timeInfo.text}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={[styles.campaignStats, { borderTopColor: colors.border }]}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.text }]}>{item.participantCount}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('admin.participants')}</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.text }]}>{item.winnerCount}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('admin.winners')}</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>{item.rewardValue || '-'}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('admin.reward')}</Text>
                    </View>
                </View>

                <View style={styles.campaignActions}>
                    {/* People Button with Participant Badge */}
                    <View>
                        <Pressable
                            style={[styles.actionButton, { backgroundColor: '#2196F3' + '20' }]}
                            onPress={() => openParticipantsModal(item)}
                        >
                            <Ionicons name="people" size={18} color="#2196F3" />
                        </Pressable>
                        {item.participantCount > 0 && (
                            <View style={styles.actionBadge}>
                                <Text style={styles.actionBadgeText}>
                                    {item.participantCount > 99 ? '99+' : item.participantCount}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Draw Button - only if can draw */}
                    {canDraw && (
                        <Pressable
                            style={[styles.actionButton, { backgroundColor: '#4CAF50' + '20' }]}
                            onPress={() => openParticipantsModal(item)}
                        >
                            <Ionicons name="shuffle" size={18} color="#4CAF50" />
                        </Pressable>
                    )}

                    {/* Drawn checkmark - if completed */}
                    {isDrawn && (
                        <View style={[styles.actionButton, { backgroundColor: '#4CAF50' + '20' }]}>
                            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                        </View>
                    )}

                    <Pressable
                        style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                        onPress={() => openEditModal(item)}
                    >
                        <Ionicons name="pencil" size={18} color={colors.text} />
                    </Pressable>
                    <Pressable
                        style={[styles.actionButton, { backgroundColor: colors.error + '15' }]}
                        onPress={() => handleDelete(item)}
                    >
                        <Ionicons name="trash" size={18} color={colors.error} />
                    </Pressable>
                </View>
            </View>
        );
    };

    const renderParticipant = ({ item }: { item: RaffleParticipant }) => (
        <View style={[
            styles.participantItem,
            { backgroundColor: item.isWinner ? '#4CAF5020' : colors.backgroundSecondary },
            item.isWinner && { borderColor: '#4CAF50', borderWidth: 2 }
        ]}>
            <View style={styles.participantInfo}>
                <Text style={[styles.participantName, { color: item.isWinner ? '#4CAF50' : colors.text }]}>
                    {item.isWinner && '🏆 '}{item.user?.firstName} {item.user?.lastName}
                </Text>
                <Text style={[styles.participantEmail, { color: colors.textSecondary }]}>{item.user?.email}</Text>
            </View>
            {item.isWinner && (
                <View style={[styles.winnerBadge, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.winnerBadgeText}>{t('admin.winner')}</Text>
                </View>
            )}
            {item.usedAt && (
                <View style={[styles.usedBadge, { backgroundColor: '#9C27B0' }]}>
                    <Text style={styles.usedBadgeText}>{t('campaigns.used')}</Text>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            {/* Stats Summary - same as campaigns */}
            <View style={styles.summaryRow}>
                <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                    {t('admin.totalRaffles', { count: raffles.length })}
                </Text>
                <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                    {t('admin.activeRaffles', { count: raffles.filter((r) => r.status === 'active').length })}
                </Text>
            </View>

            {/* Raffles List */}
            <FlatList
                data={raffles}
                keyExtractor={(item) => item.id}
                renderItem={renderRaffle}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="ticket-outline" size={64} color={colors.textTertiary} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('admin.noRaffles')}</Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {t('admin.noRafflesDesc')}
                        </Text>
                    </View>
                }
                ItemSeparatorComponent={() => <View style={{ height: RSpacing.md }} />}
            />

            {/* FAB - Create Raffle */}
            <Pressable style={[styles.fab, { backgroundColor: colors.text }]} onPress={openCreateModal}>
                <Ionicons name="add" size={28} color={colors.card} />
            </Pressable>

            {/* Create/Edit Modal */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={{ flex: 1, backgroundColor: colors.background }}>
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={0}
                    >
                        <View style={{ flex: 1 }}>
                            {/* Modal Header */}
                            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                <View style={{ width: 40 }} />
                                <Text style={[styles.modalTitle, { color: colors.text }]}>
                                    {editMode ? t('admin.editRaffle') : t('admin.createRaffle')}
                                </Text>
                                <Pressable onPress={() => { setModalVisible(false); resetForm(); }} style={{ padding: RSpacing.xs }}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </Pressable>
                            </View>

                            {/* Form Content */}
                            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                                {/* Title TR */}
                                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.campaignNameTr')}</Text>
                                <TextInput
                                    style={[styles.textInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                                    value={titleTr}
                                    onChangeText={setTitleTr}
                                    placeholder={t('admin.campaignNamePlaceholderTr')}
                                    placeholderTextColor={colors.textTertiary}
                                />

                                {/* Title EN */}
                                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.campaignNameEn')}</Text>
                                <TextInput
                                    style={[styles.textInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder={t('admin.campaignNamePlaceholderEn')}
                                    placeholderTextColor={colors.textTertiary}
                                />

                                {/* Description TR */}
                                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.campaignDescTr')}</Text>
                                <TextInput
                                    style={[styles.textInput, styles.textArea, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                                    value={descriptionTr}
                                    onChangeText={setDescriptionTr}
                                    placeholder={t('admin.campaignDescPlaceholderTr')}
                                    placeholderTextColor={colors.textTertiary}
                                    multiline
                                    numberOfLines={3}
                                />

                                {/* Description EN */}
                                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.campaignDescEn')}</Text>
                                <TextInput
                                    style={[styles.textInput, styles.textArea, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder={t('admin.campaignDescPlaceholderEn')}
                                    placeholderTextColor={colors.textTertiary}
                                    multiline
                                    numberOfLines={3}
                                />

                                {/* Reward (Free Text) */}
                                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.raffleReward')}</Text>
                                <TextInput
                                    style={[styles.textInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                                    value={rewardValue}
                                    onChangeText={setRewardValue}
                                    placeholder={t('admin.raffleRewardPlaceholder')}
                                    placeholderTextColor={colors.textTertiary}
                                />

                                {/* Winner Count */}
                                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.winnerCount')}</Text>
                                <TextInput
                                    style={[styles.textInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                                    value={winnerCount}
                                    onChangeText={setWinnerCount}
                                    placeholder="1"
                                    placeholderTextColor={colors.textTertiary}
                                    keyboardType="number-pad"
                                />

                                {/* Start Date & Time */}
                                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.startDateTime')}</Text>
                                {Platform.OS === 'web' && (
                                    <WebDateTimeField mode="datetime" value={startDate} onChange={setStartDate} />
                                )}
                                {Platform.OS !== 'web' && (
                                <View style={styles.dateTimeRow}>
                                    <Pressable
                                        style={[styles.dateTimeButton, { backgroundColor: colors.backgroundSecondary, flex: 1 }]}
                                        onPress={() => {
                                            setShowEndPicker(false);
                                            setShowEndTimePicker(false);
                                            setShowStartTimePicker(false);
                                            setShowStartPicker(!showStartPicker);
                                        }}
                                    >
                                        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                                        <Text style={[styles.dateTimeText, { color: colors.text }]}>{formatDate(startDate)}</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.dateTimeButton, { backgroundColor: colors.backgroundSecondary, flex: 1, marginLeft: RSpacing.sm }]}
                                        onPress={() => {
                                            setShowStartPicker(false);
                                            setShowEndPicker(false);
                                            setShowEndTimePicker(false);
                                            setShowStartTimePicker(!showStartTimePicker);
                                        }}
                                    >
                                        <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                                        <Text style={[styles.dateTimeText, { color: colors.text }]}>
                                            {startDate.toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </Pressable>
                                </View>
                                )}

                                {/* Inline Start Date Picker for iOS */}
                                {Platform.OS === 'ios' && showStartPicker && (
                                    <View style={[styles.inlineDatePicker, { backgroundColor: colors.backgroundSecondary }]}>
                                        <DateTimePicker
                                            value={startDate}
                                            mode="date"
                                            display="spinner"
                                            themeVariant={isDark ? 'dark' : 'light'}
                                            onChange={(_, date) => {
                                                if (date) {
                                                    const newDate = new Date(startDate);
                                                    newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                                                    setStartDate(newDate);
                                                }
                                            }}
                                            style={{ height: 180, width: '100%' }}
                                        />
                                        <Pressable
                                            style={[styles.inlineDatePickerDone, { backgroundColor: colors.text }]}
                                            onPress={() => setShowStartPicker(false)}
                                        >
                                            <Text style={{ color: colors.card, fontWeight: '600', fontSize: 16 }}>{t('common.done')}</Text>
                                        </Pressable>
                                    </View>
                                )}

                                {/* Inline Start Time Picker for iOS */}
                                {Platform.OS === 'ios' && showStartTimePicker && (
                                    <View style={[styles.inlineDatePicker, { backgroundColor: colors.backgroundSecondary }]}>
                                        <DateTimePicker
                                            value={startDate}
                                            mode="time"
                                            display="spinner"
                                            themeVariant={isDark ? 'dark' : 'light'}
                                            onChange={(_, date) => {
                                                if (date) {
                                                    const newDate = new Date(startDate);
                                                    newDate.setHours(date.getHours(), date.getMinutes());
                                                    setStartDate(newDate);
                                                }
                                            }}
                                            style={{ height: 180, width: '100%' }}
                                        />
                                        <Pressable
                                            style={[styles.inlineDatePickerDone, { backgroundColor: colors.text }]}
                                            onPress={() => setShowStartTimePicker(false)}
                                        >
                                            <Text style={{ color: colors.card, fontWeight: '600', fontSize: 16 }}>{t('common.done')}</Text>
                                        </Pressable>
                                    </View>
                                )}

                                {/* End Date & Time */}
                                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.endDateTime')}</Text>
                                {Platform.OS === 'web' && (
                                    <WebDateTimeField mode="datetime" value={endDate} onChange={setEndDate} />
                                )}
                                {Platform.OS !== 'web' && (
                                <View style={styles.dateTimeRow}>
                                    <Pressable
                                        style={[styles.dateTimeButton, { backgroundColor: colors.backgroundSecondary, flex: 1 }]}
                                        onPress={() => {
                                            setShowStartPicker(false);
                                            setShowStartTimePicker(false);
                                            setShowEndTimePicker(false);
                                            setShowEndPicker(!showEndPicker);
                                        }}
                                    >
                                        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                                        <Text style={[styles.dateTimeText, { color: colors.text }]}>{formatDate(endDate)}</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.dateTimeButton, { backgroundColor: colors.backgroundSecondary, flex: 1, marginLeft: RSpacing.sm }]}
                                        onPress={() => {
                                            setShowStartPicker(false);
                                            setShowStartTimePicker(false);
                                            setShowEndPicker(false);
                                            setShowEndTimePicker(!showEndTimePicker);
                                        }}
                                    >
                                        <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                                        <Text style={[styles.dateTimeText, { color: colors.text }]}>
                                            {endDate.toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </Pressable>
                                </View>
                                )}

                                {/* Inline End Date Picker for iOS */}
                                {Platform.OS === 'ios' && showEndPicker && (
                                    <View style={[styles.inlineDatePicker, { backgroundColor: colors.backgroundSecondary }]}>
                                        <DateTimePicker
                                            value={endDate}
                                            mode="date"
                                            display="spinner"
                                            themeVariant={isDark ? 'dark' : 'light'}
                                            onChange={(_, date) => {
                                                if (date) {
                                                    const newDate = new Date(endDate);
                                                    newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                                                    setEndDate(newDate);
                                                }
                                            }}
                                            style={{ height: 180, width: '100%' }}
                                        />
                                        <Pressable
                                            style={[styles.inlineDatePickerDone, { backgroundColor: colors.text }]}
                                            onPress={() => setShowEndPicker(false)}
                                        >
                                            <Text style={{ color: colors.card, fontWeight: '600', fontSize: 16 }}>{t('common.done')}</Text>
                                        </Pressable>
                                    </View>
                                )}

                                {/* Inline End Time Picker for iOS */}
                                {Platform.OS === 'ios' && showEndTimePicker && (
                                    <View style={[styles.inlineDatePicker, { backgroundColor: colors.backgroundSecondary }]}>
                                        <DateTimePicker
                                            value={endDate}
                                            mode="time"
                                            display="spinner"
                                            themeVariant={isDark ? 'dark' : 'light'}
                                            onChange={(_, date) => {
                                                if (date) {
                                                    const newDate = new Date(endDate);
                                                    newDate.setHours(date.getHours(), date.getMinutes());
                                                    setEndDate(newDate);
                                                }
                                            }}
                                            style={{ height: 180, width: '100%' }}
                                        />
                                        <Pressable
                                            style={[styles.inlineDatePickerDone, { backgroundColor: colors.text }]}
                                            onPress={() => setShowEndTimePicker(false)}
                                        >
                                            <Text style={{ color: colors.card, fontWeight: '600', fontSize: 16 }}>{t('common.done')}</Text>
                                        </Pressable>
                                    </View>
                                )}

                                {/* Extra spacing at the bottom */}
                                <View style={{ height: 20 }} />
                            </ScrollView>

                            {/* Action Buttons */}
                            <View style={[styles.modalActions, { backgroundColor: colors.card }]}>
                                <Pressable
                                    style={[styles.modalCancelButton, { backgroundColor: colors.backgroundSecondary }]}
                                    onPress={() => { setModalVisible(false); resetForm(); }}
                                    disabled={saving}
                                >
                                    <Text style={[styles.modalCancelText, { color: colors.text }]}>{t('common.cancel')}</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.modalSaveButton, { backgroundColor: colors.text, opacity: saving ? 0.6 : 1 }]}
                                    onPress={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator size="small" color={colors.card} />
                                    ) : (
                                        <Text style={[styles.modalSaveText, { color: colors.card }]}>{editMode ? t('admin.update') : t('admin.create')}</Text>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* Android Date/Time Pickers */}
            {Platform.OS === 'android' && showStartPicker && (
                <DateTimePicker
                    value={startDate}
                    mode="date"
                    onChange={(_, date) => {
                        setShowStartPicker(false);
                        if (date) {
                            const newDate = new Date(startDate);
                            newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                            setStartDate(newDate);
                        }
                    }}
                />
            )}
            {Platform.OS === 'android' && showStartTimePicker && (
                <DateTimePicker
                    value={startDate}
                    mode="time"
                    onChange={(_, date) => {
                        setShowStartTimePicker(false);
                        if (date) {
                            const newDate = new Date(startDate);
                            newDate.setHours(date.getHours(), date.getMinutes());
                            setStartDate(newDate);
                        }
                    }}
                />
            )}
            {Platform.OS === 'android' && showEndPicker && (
                <DateTimePicker
                    value={endDate}
                    mode="date"
                    onChange={(_, date) => {
                        setShowEndPicker(false);
                        if (date) {
                            const newDate = new Date(endDate);
                            newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                            setEndDate(newDate);
                        }
                    }}
                />
            )}
            {Platform.OS === 'android' && showEndTimePicker && (
                <DateTimePicker
                    value={endDate}
                    mode="time"
                    onChange={(_, date) => {
                        setShowEndTimePicker(false);
                        if (date) {
                            const newDate = new Date(endDate);
                            newDate.setHours(date.getHours(), date.getMinutes());
                            setEndDate(newDate);
                        }
                    }}
                />
            )}

            {/* Participants Modal */}
            <Modal visible={participantsModalVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Pressable onPress={() => setParticipantsModalVisible(false)}>
                            <Text style={[styles.modalCancel, { color: colors.primary }]}>{t('common.close')}</Text>
                        </Pressable>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('admin.participants')}</Text>
                        {selectedRaffle?.status === 'active' && new Date(selectedRaffle.endDate) < new Date() && (
                            <Pressable onPress={handleDraw} disabled={drawing}>
                                {drawing ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                ) : (
                                    <Text style={[styles.modalSave, { color: '#4CAF50' }]}>{t('admin.draw')}</Text>
                                )}
                            </Pressable>
                        )}
                        {selectedRaffle?.status !== 'active' && <View style={{ width: 50 }} />}
                    </View>

                    {loadingParticipants ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={participants}
                            renderItem={renderParticipant}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
                                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('admin.noParticipants')}</Text>
                                </View>
                            }
                        />
                    )}
                </SafeAreaView>
            </Modal>
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
        borderBottomWidth: 1,
    },
    backButton: {
        padding: RSpacing.xs,
    },
    headerTitle: {
        fontSize: RFontSizes.lg,
        fontWeight: '600',
    },
    addButton: {
        padding: RSpacing.xs,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: RSpacing.lg,
        paddingVertical: RSpacing.sm,
    },
    summaryText: {
        fontSize: RFontSizes.sm,
    },
    listContent: {
        padding: RSpacing.md,
        paddingBottom: 100,
    },
    raffleCard: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
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
    raffleInfo: {
        flex: 1,
    },
    raffleTitle: {
        fontSize: RFontSizes.md,
        fontWeight: '600',
    },
    raffleSubtitle: {
        fontSize: RFontSizes.sm,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: RSpacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    statusText: {
        fontSize: RFontSizes.xs,
        fontWeight: '600',
    },
    raffleMeta: {
        flexDirection: 'row',
        gap: RSpacing.md,
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
    raffleActions: {
        flexDirection: 'row',
        gap: RSpacing.sm,
        marginTop: RSpacing.xs,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: RSpacing.sm,
        paddingVertical: RSpacing.xs,
        borderRadius: BorderRadius.sm,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: RFontSizes.xs,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyTitle: {
        fontSize: RFontSizes.xl,
        fontWeight: '600',
        marginTop: RSpacing.lg,
    },
    emptyText: {
        fontSize: RFontSizes.md,
        marginTop: RSpacing.xs,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: RSpacing.xl,
        right: RSpacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: RSpacing.md,
        paddingVertical: RSpacing.sm,
        borderBottomWidth: 1,
    },
    modalCancel: {
        fontSize: RFontSizes.md,
    },
    modalTitle: {
        fontSize: RFontSizes.lg,
        fontWeight: '600',
    },
    modalSave: {
        fontSize: RFontSizes.md,
        fontWeight: '600',
    },
    modalContent: {
        flex: 1,
    },
    formContent: {
        padding: RSpacing.md,
        paddingBottom: RSpacing.xxl,
    },
    label: {
        fontSize: RFontSizes.sm,
        fontWeight: '500',
        marginBottom: RSpacing.xs,
        marginTop: RSpacing.md,
    },
    input: {
        padding: RSpacing.md,
        borderRadius: BorderRadius.lg,
        fontSize: RFontSizes.md,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    rewardTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: RSpacing.sm,
    },
    rewardTypeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.xs,
        paddingHorizontal: RSpacing.sm,
        paddingVertical: RSpacing.xs,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    rewardTypeText: {
        fontSize: RFontSizes.sm,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.sm,
        paddingHorizontal: RSpacing.md,
        paddingVertical: RSpacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    dateButtonText: {
        fontSize: RFontSizes.md,
    },
    // Campaigns-style card styles
    campaignCard: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        marginBottom: RSpacing.md,
    },
    campaignHeader: {
        flexDirection: 'row',
        padding: RSpacing.md,
    },
    typeIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    campaignInfo: {
        flex: 1,
        marginLeft: RSpacing.md,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: RSpacing.sm,
    },
    campaignTitle: {
        flex: 1,
        fontSize: RFontSizes.md,
        fontWeight: '600',
    },
    statusBadgeText: {
        fontSize: RFontSizes.xs,
        fontWeight: '500',
    },
    campaignDescription: {
        fontSize: RFontSizes.sm,
        marginTop: 4,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },
    dateText: {
        fontSize: RFontSizes.xs,
    },
    campaignStats: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: RSpacing.sm,
        borderTopWidth: 1,
        marginHorizontal: RSpacing.md,
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: RSpacing.md,
        flex: 1,
    },
    statValue: {
        fontSize: RFontSizes.sm,
        fontWeight: '600',
    },
    statLabel: {
        fontSize: RFontSizes.xs,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 24,
    },
    campaignActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: RSpacing.sm,
        padding: RSpacing.md,
        paddingTop: 0,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: RSpacing.sm,
    },
    timeBadgeText: {
        fontSize: 9,
        fontWeight: '600',
    },
    actionBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#2196F3',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    actionBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    // Campaigns-style modal styles
    modalScroll: {
        flex: 1,
        paddingHorizontal: RSpacing.lg,
    },
    inputLabel: {
        fontSize: RFontSizes.sm,
        fontWeight: '500',
        marginBottom: RSpacing.xs,
        marginTop: RSpacing.md,
    },
    textInput: {
        padding: RSpacing.md,
        borderRadius: BorderRadius.lg,
        fontSize: RFontSizes.md,
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: RSpacing.sm,
    },
    dateTimeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.sm,
        padding: RSpacing.md,
        borderRadius: BorderRadius.lg,
    },
    dateTimeText: {
        fontSize: RFontSizes.md,
    },
    inlineDatePicker: {
        marginTop: RSpacing.sm,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        alignItems: 'center',
        paddingVertical: RSpacing.md,
        paddingHorizontal: RSpacing.sm,
    },
    inlineDatePickerDone: {
        paddingHorizontal: RSpacing.xxl,
        paddingVertical: RSpacing.sm,
        borderRadius: BorderRadius.md,
        marginTop: RSpacing.sm,
    },
    modalActions: {
        flexDirection: 'row',
        gap: RSpacing.md,
        padding: RSpacing.lg,
        paddingTop: RSpacing.md,
        paddingBottom: RSpacing.lg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    modalCancelButton: {
        flex: 1,
        padding: RSpacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: RFontSizes.md,
        fontWeight: '600',
    },
    modalSaveButton: {
        flex: 1,
        padding: RSpacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    modalSaveText: {
        fontSize: RFontSizes.md,
        fontWeight: '600',
    },
    participantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: RSpacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: RSpacing.sm,
    },
    participantInfo: {
        flex: 1,
    },
    participantName: {
        fontSize: RFontSizes.md,
        fontWeight: '500',
    },
    participantEmail: {
        fontSize: RFontSizes.sm,
    },
    winnerBadge: {
        paddingHorizontal: RSpacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    winnerBadgeText: {
        color: '#FFF',
        fontSize: RFontSizes.xs,
        fontWeight: '600',
    },
    usedBadge: {
        paddingHorizontal: RSpacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
        marginLeft: RSpacing.xs,
    },
    usedBadgeText: {
        color: '#FFF',
        fontSize: RFontSizes.xs,
        fontWeight: '600',
    },
});
