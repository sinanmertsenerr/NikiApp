import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useColorScheme,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import { userService, AdminUser } from '../../src/services/userService';
import { socketService } from '../../src/services/socketService';
import { formatPhoneOrEmail } from '../../src/utils/phoneFormat';

export default function AdminUsersScreen() {
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');

  // Fetch users from API
  const {
    data: usersData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const data = await userService.adminGetUsers({ limit: 9999 });
      return data || { users: [], total: 0, page: 1, limit: 9999, totalPages: 0 };
    },
  });

  const users = usersData?.users || [];

  // Listen for real-time user updates
  useEffect(() => {
    const socket = socketService.getSocket;
    if (socket) {
      socket.on('user_updated', () => {
        refetch();
      });
    }

    return () => {
      if (socket) {
        socket.off('user_updated');
      }
    };
  }, [refetch]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const renderUser = ({ item }: { item: AdminUser }) => (
    <Pressable
      style={[styles.userCard, { backgroundColor: colors.card }, Shadows.sm]}
      onPress={() => router.push({ pathname: '/(admin)/user-detail', params: { id: item.id } })}
    >
      <View style={styles.userHeader}>
        <View style={[styles.avatar, { backgroundColor: isDark ? '#444444' : colors.primary }]}>
          <Text style={styles.avatarText}>
            {item.firstName[0]}{item.lastName[0]}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {item.firstName} {item.lastName}
            </Text>
            {!item.isActive && (
              <View style={[styles.inactiveBadge, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.inactiveBadgeText, { color: colors.error }]}>{t('common.inactive')}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{formatPhoneOrEmail(item.phone, item.email)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </View>

      <View style={styles.userStats}>
        <View style={styles.statItem}>
          <Ionicons name="wallet" size={16} color="#2D2D2D" />
          <Text style={[styles.statValue, { color: colors.text }]}>
            ₺{parseFloat(item.wallets?.niki?.balance || '0').toFixed(0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('admin.nikiCredits')}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Ionicons name="wallet" size={16} color="#D97706" />
          <Text style={[styles.statValue, { color: colors.text }]}>
            ₺{parseFloat(item.wallets?.ieu?.balance || item.wallet?.balance || '0').toFixed(0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('admin.iueCredits')}</Text>
        </View>
      </View>
    </Pressable>
  );

  if (isLoading && !usersData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="search-outline" size={20} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('admin.searchUsers')}
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* Stats Summary */}
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          {t('admin.totalUsers', { count: users.length })}
        </Text>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          {t('admin.activeUsers', { count: users.filter((u) => u.isActive).length })}
        </Text>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('admin.noUsers')}</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('admin.noUsersDesc')}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: RSpacing.md }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: RSpacing.md,
    marginTop: RSpacing.md,
    paddingHorizontal: RSpacing.md,
    paddingVertical: RSpacing.sm,
    borderRadius: BorderRadius.lg,
    gap: RSpacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: RFontSizes.md,
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
    paddingBottom: RSpacing.xxl,
  },
  userCard: {
    borderRadius: BorderRadius.lg,
    padding: RSpacing.md,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RSpacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: RFontSizes.lg,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
    marginLeft: RSpacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RSpacing.xs,
  },
  userName: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  inactiveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveBadgeText: {
    fontSize: RFontSizes.xs,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: RFontSizes.sm,
    marginTop: 2,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: RSpacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: RSpacing.xl,
  },
  statValue: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: RFontSizes.xs,
  },
  statDivider: {
    width: 1,
    height: 24,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: RFontSizes.md,
    marginTop: RSpacing.md,
  },
});
