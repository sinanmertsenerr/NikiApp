import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { useAuthStore } from '../../src/stores/authStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { authService } from '../../src/services/authService';
import { campaignService } from '../../src/services/campaignService';
import { notificationService } from '../../src/services/notificationService';
import { BRANDS } from '../../src/constants/brands';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { getTranslatedContent } from '../../src/hooks/useTranslatedContent';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import { ErrorState } from '../../src/components/ErrorState';

const POINTS_FOR_FREE_COFFEE = 10;

export default function HomeScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { user, updateUser } = useAuthStore();
  const { theme, selectedBrand } = useSettingsStore();

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;
  const brand = BRANDS[selectedBrand];

  // Fetch current user data
  const { data: userData, refetch, isFetching, isError, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    enabled: !!user,
  });

  // Fetch unread notification count from API
  const { data: notificationCount = 0 } = useQuery({
    queryKey: ['notification-count'],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update user in store when data changes (preserve local changes like avatarUrl)
  useEffect(() => {
    if (userData) {
      // Don't overwrite local avatarUrl if backend returns null
      const updates = { ...userData };
      if (updates.avatarUrl === null && user?.avatarUrl) {
        delete updates.avatarUrl;
      }
      updateUser(updates);
    }
  }, [userData]);

  const loyaltyPoints = (userData as any)?.availablePoints || 0;
  const pointsToFree = Math.max(0, POINTS_FOR_FREE_COFFEE - (loyaltyPoints % POINTS_FOR_FREE_COFFEE));
  const progress = ((loyaltyPoints % POINTS_FOR_FREE_COFFEE) / POINTS_FOR_FREE_COFFEE) * 100;

  // Main data failed to load and there's nothing usable to show: surface the
  // error with a Retry button instead of a stuck/empty loyalty screen.
  if (isError && !userData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ErrorState error={error} onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => refetch()}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {t('home.welcome')},
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.firstName || t('common.user')} 👋
            </Text>
          </View>
          <Pressable
            style={styles.notificationContainer}
            onPress={() => router.push('/(screens)/notifications')}
            accessibilityRole="button"
            accessibilityLabel="Bildirimler"
          >
            <Image
              source={isDark ? brand.logoLight : brand.logo}
              style={styles.headerLogo}
              contentFit="contain"
              accessible={false}
            />
            {notificationCount > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.notificationBadgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Loyalty Card */}
        <View style={[styles.loyaltyCard, { backgroundColor: '#2D2D2D' }, Shadows.lg]}>
          <View style={styles.loyaltyHeader}>
            <Text style={styles.loyaltyTitle}>{t('home.loyaltyPoints')}</Text>
            <Text style={styles.loyaltyPoints}>{loyaltyPoints}</Text>
          </View>

          {/* Coffee cups progress - using app icon */}
          <View style={styles.cupsContainer}>
            {Array.from({ length: POINTS_FOR_FREE_COFFEE }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.cupIcon,
                  {
                    backgroundColor:
                      index < (loyaltyPoints % POINTS_FOR_FREE_COFFEE)
                        ? '#FFD700'
                        : 'rgba(255,255,255,0.2)',
                  },
                ]}
              >
                <Image
                  source={require('../../assets/images/brands/niki-logo.png')}
                  style={styles.cupImage}
                  tintColor="#FFFFFF"
                  contentFit="contain"
                  accessible={false}
                />
              </View>
            ))}
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {pointsToFree === 0
                ? t('home.freeCoffeeReady')
                : t('home.pointsToFree', { count: pointsToFree })}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('quickActions.title', 'Hızlı İşlemler')}
        </Text>
        <View style={styles.actionsGrid}>
          <ActionCard
            icon="🎡"
            title={t('quickActions.spinWheel')}
            subtitle={t('quickActions.weeklySpin')}
            colors={colors}
            onPress={() => router.push('/(tabs)/wheel')}
          />
          <ActionCard
            icon="🎁"
            title={t('quickActions.campaigns')}
            subtitle={t('quickActions.seeCampaigns')}
            colors={colors}
            onPress={() => router.push('/(tabs)/campaigns')}
          />
          <ActionCard
            icon="🎰"
            title={t('quickActions.raffles')}
            subtitle={t('quickActions.joinRaffles')}
            colors={colors}
            onPress={() => router.push('/(tabs)/raffles')}
          />
        </View>

        {/* Admin Panel Button - Only for admin/super_admin */}
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('admin.management')}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.adminPanelButton,
                { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
                Shadows.sm
              ]}
              onPress={() => router.push('/(admin)/dashboard')}
            >
              <View style={styles.adminPanelContent}>
                <View style={styles.adminPanelText}>
                  <Text style={[styles.adminPanelTitle, { color: colors.text }]}>{t('admin.title')}</Text>
                  <Text style={[styles.adminPanelSubtitle, { color: colors.textSecondary }]}>{t('admin.managementActions')}</Text>
                </View>
              </View>
              <View style={[styles.adminPanelArrowContainer, { backgroundColor: colors.text }]}>
                <Text style={[styles.adminPanelArrow, { color: colors.card }]}>›</Text>
              </View>
            </Pressable>
          </>
        )}

        {/* Active Campaigns Preview - Only for non-admin users */}
        {user?.role !== 'admin' && user?.role !== 'super_admin' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('home.activeCampaigns', 'Aktif Kampanyalar')}
            </Text>

            <ActiveCampaignsList colors={colors} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActiveCampaignsList({ colors }: { colors: typeof Colors }) {
  const { t, i18n } = useTranslation();

  const { data: userCampaigns } = useQuery({
    queryKey: ['my-campaigns'],
    queryFn: () => campaignService.getMyCampaigns(),
  });

  // Filter active and globally active campaigns, keep userCampaign id for unique keys
  const activeCampaigns = userCampaigns
    ?.filter(uc => uc.status === 'active' && uc.campaign.isActive)
    .map(uc => ({ ...uc.campaign, userCampaignId: uc.id }))
    .slice(0, 3) || [];

  if (activeCampaigns.length === 0) {
    return (
      <View style={[styles.emptyCampaignCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.emptyCampaignText, { color: colors.textSecondary }]}>
          {t('campaigns.noCampaigns', 'Şu an aktif kampanya bulunmuyor.')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: Spacing.md }}>
      {activeCampaigns.map((campaign) => (
        <Pressable
          key={campaign.userCampaignId}
          style={({ pressed }) => [
            styles.campaignCard,
            { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
            Shadows.sm
          ]}
          onPress={() => router.push('/(tabs)/campaigns')}
        >
          <View style={[styles.campaignBadge, { backgroundColor: colors.success }]}>
            <Text style={styles.campaignBadgeText}>{t('campaigns.active', 'Aktif')}</Text>
          </View>
          <Text style={[styles.campaignTitle, { color: colors.text }]} numberOfLines={1}>
            {getTranslatedContent(campaign, 'title', i18n.language)}
          </Text>
          <Text style={[styles.campaignDesc, { color: colors.textSecondary }]} numberOfLines={2}>
            {getTranslatedContent(campaign, 'description', i18n.language)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}


function ActionCard({
  icon,
  title,
  subtitle,
  colors,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  colors: typeof Colors;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionCard,
        { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
        Shadows.sm
      ]}
      onPress={onPress}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={[styles.actionTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.actionSubtitle, { color: colors.textTertiary }]}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: RSpacing.lg,
    paddingBottom: RSpacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RSpacing.lg,
    marginTop: RSpacing.md,
  },
  greeting: {
    fontSize: RFontSizes.md,
  },
  userName: {
    fontSize: RFontSizes.xxl,
    fontWeight: '700',
  },
  headerLogo: {
    width: isSmallDevice ? 40 : 48,
    height: isSmallDevice ? 40 : 48,
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  loyaltyCard: {
    borderRadius: BorderRadius.xl,
    padding: RSpacing.lg,
    marginBottom: RSpacing.xl,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RSpacing.md,
  },
  loyaltyTitle: {
    fontSize: RFontSizes.lg,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loyaltyPoints: {
    fontSize: RFontSizes.xxxl,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cupsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: RSpacing.md,
    gap: isSmallDevice ? 4 : 6,
  },
  cupIcon: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: isSmallDevice ? 28 : 34,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cupImage: {
    width: '65%',
    height: '65%',
  },
  progressContainer: {
    marginTop: RSpacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: BorderRadius.full,
  },
  progressText: {
    fontSize: RFontSizes.sm,
    color: 'rgba(255,255,255,0.9)',
    marginTop: RSpacing.xs,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: RFontSizes.xl,
    fontWeight: '700',
    marginBottom: RSpacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: RSpacing.sm,
    marginBottom: RSpacing.xl,
  },
  actionCard: {
    width: (SCREEN_WIDTH - RSpacing.lg * 2 - RSpacing.sm * 2) / 3,
    padding: RSpacing.sm,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: isSmallDevice ? 28 : 32,
    marginBottom: RSpacing.xs,
  },
  actionTitle: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  actionSubtitle: {
    fontSize: RFontSizes.sm,
  },
  campaignCard: {
    padding: RSpacing.lg,
    borderRadius: BorderRadius.lg,
    position: 'relative',
  },
  campaignBadge: {
    position: 'absolute',
    top: RSpacing.md,
    right: RSpacing.md,
    paddingHorizontal: RSpacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  campaignBadgeText: {
    color: '#FFFFFF',
    fontSize: RFontSizes.xs,
    fontWeight: '600',
  },
  campaignTitle: {
    fontSize: RFontSizes.lg,
    fontWeight: '600',
    marginBottom: RSpacing.xs,
  },
  campaignDesc: {
    fontSize: RFontSizes.md,
  },
  adminPanelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: RSpacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: RSpacing.lg,
  },
  adminPanelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  adminPanelText: {
    flex: 1,
  },
  adminPanelTitle: {
    fontSize: RFontSizes.lg,
    fontWeight: '600',
  },
  adminPanelSubtitle: {
    fontSize: RFontSizes.sm,
    marginTop: 2,
  },
  adminPanelArrowContainer: {
    width: isSmallDevice ? 28 : 32,
    height: isSmallDevice ? 28 : 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminPanelArrow: {
    fontSize: isSmallDevice ? 18 : 22,
    fontWeight: '300',
    marginTop: -2,
  },
  emptyCampaignCard: {
    padding: RSpacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCampaignText: {
    fontSize: RFontSizes.md,
  },
});
