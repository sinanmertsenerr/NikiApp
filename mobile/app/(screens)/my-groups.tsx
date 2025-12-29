import { View, Text, StyleSheet, FlatList, useColorScheme, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import { groupService, Group } from '../../src/services/groupService';

export default function MyGroupsScreen() {
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const { theme } = useSettingsStore();

    const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
    const colors = isDark ? DarkColors : Colors;

    const { data: groups, isLoading, refetch } = useQuery({
        queryKey: ['my-groups'],
        queryFn: groupService.getMyGroups,
    });

    const renderGroup = ({ item }: { item: Group }) => (
        <View style={[styles.groupCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <View style={[styles.groupIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="people" size={24} color={colors.primary} />
            </View>
            <View style={styles.groupInfo}>
                <Text style={[styles.groupName, { color: colors.text }]}>{item.name}</Text>
                {item.description ? (
                    <Text style={[styles.groupDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.description}
                    </Text>
                ) : null}
                <Text style={[styles.memberCount, { color: colors.textTertiary }]}>
                    {t('groups.memberCount', { count: item.memberCount })}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('groups.myGroups')}</Text>
                <View style={styles.backButton} />
            </View>

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
        paddingVertical: RSpacing.md,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: RFontSizes.lg,
        fontWeight: '600',
    },
    listContent: {
        padding: RSpacing.lg,
        paddingBottom: RSpacing.xxl,
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
    groupDesc: {
        fontSize: RFontSizes.sm,
        marginTop: 2,
    },
    memberCount: {
        fontSize: RFontSizes.xs,
        marginTop: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: RSpacing.xxl * 2,
    },
    emptyText: {
        fontSize: RFontSizes.md,
        marginTop: RSpacing.md,
    },
});
