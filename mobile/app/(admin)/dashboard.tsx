import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '../../src/stores/authStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import { getDashboardOverview, DashboardOverview } from '../../src/services/campaignService';

export default function AdminDashboard() {
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  const { data: stats, isLoading: loading, refetch } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: getDashboardOverview,
  });

  const MENU_ITEMS = [
    {
      id: 'scan-qr',
      title: t('admin.scanQr'),
      subtitle: t('admin.scanQrDesc'),
      icon: 'qr-code',
      route: '/(admin)/scan-qr',
      color: '#4CAF50',
    },
    {
      id: 'users',
      title: t('admin.users'),
      subtitle: t('admin.usersDesc'),
      icon: 'people',
      route: '/(admin)/users',
      color: '#2196F3',
    },
    {
      id: 'campaigns',
      title: t('admin.campaigns'),
      subtitle: t('admin.campaignsDesc'),
      icon: 'gift',
      route: '/(admin)/campaigns',
      color: '#9C27B0',
    },
    {
      id: 'raffles',
      title: t('admin.raffles'),
      subtitle: t('admin.rafflesDesc'),
      icon: 'ticket',
      route: '/(admin)/raffles',
      color: '#E91E63',
    },
    {
      id: 'groups',
      title: t('groups.title'),
      subtitle: t('groups.myGroups'),
      icon: 'people-circle',
      route: '/(admin)/groups',
      color: '#FF5722',
    },
    {
      id: 'menu-management',
      title: t('admin.menuManagement'),
      subtitle: t('admin.menuManagementDesc'),
      icon: 'cafe',
      route: '/(admin)/menu-management',
      color: '#795548',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => refetch()}
            tintColor={colors.primary}
          />
        }
      >
        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>{t('admin.welcome')}</Text>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.firstName} {user?.lastName}</Text>
        </View>

        {/* Stats Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
              <Ionicons name="gift-outline" size={24} color="#4CAF50" />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats?.campaigns.totalAssignments || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('admin.campaignsAssigned')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
              <Ionicons name="sync-outline" size={24} color="#FF9800" />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats?.wheel.totalSpins || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('admin.wheelSpins')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
              <Ionicons name="people-outline" size={24} color="#2196F3" />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats?.users.totalUsers || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('admin.totalUsersLabel')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#9C27B0" />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats?.campaigns.totalRedemptions || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('admin.campaignsRedeemed')}</Text>
            </View>
          </View>
        )}

        {/* Menu Items */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('admin.actions')}</Text>
        <View style={styles.menuGrid}>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.menuItem, { backgroundColor: colors.card }, Shadows.sm]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: RSpacing.lg,
    paddingBottom: RSpacing.xxl,
  },
  welcomeSection: {
    marginBottom: RSpacing.lg,
  },
  welcomeText: {
    fontSize: RFontSizes.md,
  },
  userName: {
    fontSize: RFontSizes.xxl,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: RSpacing.sm,
    marginBottom: RSpacing.xl,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statCard: {
    width: '48%',
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: RFontSizes.xxl,
    fontWeight: '700',
    marginTop: RSpacing.xs,
  },
  statLabel: {
    fontSize: RFontSizes.xs,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: RFontSizes.lg,
    fontWeight: '600',
    marginBottom: RSpacing.md,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: RSpacing.md,
    marginBottom: RSpacing.xl,
  },
  menuItem: {
    width: '47%',
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    position: 'relative',
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RSpacing.sm,
  },
  menuTitle: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: RFontSizes.xs,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: RSpacing.sm,
    right: RSpacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: RFontSizes.xs,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    gap: RSpacing.sm,
  },
  backButtonText: {
    fontSize: RFontSizes.md,
    fontWeight: '500',
  },
});
