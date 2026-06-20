import { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    useColorScheme,
    RefreshControl,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Alert } from '../../src/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import { groupService, Group } from '../../src/services/groupService';
import { getErrorMessage } from '../../src/services/api';

export default function AdminGroupsScreen() {
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const { theme } = useSettingsStore();
    const queryClient = useQueryClient();

    const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
    const colors = isDark ? DarkColors : Colors;

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupDesc, setGroupDesc] = useState('');

    const { data: groups, isLoading, refetch } = useQuery({
        queryKey: ['admin-groups'],
        queryFn: groupService.getAll,
    });

    const createMutation = useMutation({
        mutationFn: (data: { name: string; description?: string }) => groupService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
            setShowCreateModal(false);
            setGroupName('');
            setGroupDesc('');
            Alert.alert(t('common.success'), t('groups.groupCreated'));
        },
        onError: (error: any) => {
            Alert.alert(t('common.error'), getErrorMessage(error));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => groupService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
            Alert.alert(t('common.success'), t('groups.groupDeleted'));
        },
        onError: (error: any) => {
            Alert.alert(t('common.error'), getErrorMessage(error));
        },
    });

    const handleCreate = () => {
        if (!groupName.trim()) {
            Alert.alert(t('common.error'), t('validation.enterCategoryName'));
            return;
        }
        createMutation.mutate({ name: groupName.trim(), description: groupDesc.trim() || undefined });
    };

    const handleDelete = (group: Group) => {
        Alert.alert(
            t('groups.deleteGroupTitle'),
            t('groups.deleteGroupConfirm', { name: group.name }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate(group.id) },
            ]
        );
    };

    const renderGroup = useCallback(({ item }: { item: Group }) => (
        <Pressable
            style={[styles.groupCard, { backgroundColor: colors.card }, Shadows.sm]}
            onPress={() => router.push(`/(admin)/group-detail?id=${item.id}`)}
        >
            <View style={[styles.groupIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="people" size={24} color={colors.primary} />
            </View>
            <View style={styles.groupInfo}>
                <Text style={[styles.groupName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
                    {t('groups.memberCount', { count: item.memberCount })}
                </Text>
            </View>
            <Pressable
                style={styles.deleteButton}
                onPress={() => handleDelete(item)}
                hitSlop={8}
            >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
            </Pressable>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </Pressable>
    ), [colors, t]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <FlatList
                data={groups || []}
                keyExtractor={(item) => item.id}
                renderItem={renderGroup}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                {t('groups.noGroups')}
                            </Text>
                        </View>
                    ) : null
                }
            />

            {/* Floating Add Button */}
            <Pressable
                style={[styles.fab, { backgroundColor: colors.text }]}
                onPress={() => setShowCreateModal(true)}
            >
                <Ionicons name="add" size={28} color={colors.card} />
            </Pressable>

            {/* Create Group Modal */}
            <Modal visible={showCreateModal} transparent animationType="slide">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('groups.newGroup')}</Text>

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                            value={groupName}
                            onChangeText={setGroupName}
                            placeholder={t('groups.groupNamePlaceholder')}
                            placeholderTextColor={colors.textTertiary}
                            autoFocus
                        />

                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                            value={groupDesc}
                            onChangeText={setGroupDesc}
                            placeholder={t('groups.groupDescPlaceholder')}
                            placeholderTextColor={colors.textTertiary}
                            multiline
                            numberOfLines={3}
                        />

                        <View style={styles.modalActions}>
                            <Pressable
                                style={[styles.modalButton, { backgroundColor: colors.backgroundSecondary }]}
                                onPress={() => {
                                    setShowCreateModal(false);
                                    setGroupName('');
                                    setGroupDesc('');
                                }}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, { backgroundColor: colors.text }]}
                                onPress={handleCreate}
                                disabled={createMutation.isPending}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.card }]}>
                                    {createMutation.isPending ? t('common.loading') : t('common.create')}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: RSpacing.lg,
        paddingBottom: 100,
    },
    groupCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: RSpacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: RSpacing.sm,
    },
    groupIcon: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: RSpacing.md,
    },
    groupInfo: {
        flex: 1,
    },
    groupName: {
        fontSize: RFontSizes.md,
        fontWeight: '600',
    },
    memberCount: {
        fontSize: RFontSizes.sm,
        marginTop: 2,
    },
    deleteButton: {
        padding: RSpacing.sm,
        marginRight: RSpacing.xs,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: RSpacing.xxl * 2,
    },
    emptyText: {
        fontSize: RFontSizes.md,
        marginTop: RSpacing.md,
    },
    fab: {
        position: 'absolute',
        right: RSpacing.lg,
        bottom: RSpacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: RSpacing.lg,
    },
    modalContent: {
        padding: RSpacing.xl,
        borderRadius: BorderRadius.xl,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: RFontSizes.xl,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: RSpacing.lg,
    },
    input: {
        padding: RSpacing.md,
        borderRadius: BorderRadius.lg,
        fontSize: RFontSizes.md,
        marginBottom: RSpacing.md,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        gap: RSpacing.md,
        marginTop: RSpacing.md,
    },
    modalButton: {
        flex: 1,
        padding: RSpacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: RFontSizes.md,
        fontWeight: '600',
    },
});
