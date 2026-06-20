import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Pressable,
  Switch,
} from 'react-native';
import { Alert } from '../../src/utils/alert';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '../../src/stores/authStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { authService } from '../../src/services/authService';
import { userService, UserStats } from '../../src/services/userService';
import { BRANDS } from '../../src/constants/brands';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { getFullImageUrl } from '../../src/constants/api';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import { socketService } from '../../src/services/socketService';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { user, logout, tokens } = useAuthStore();
  const { theme, setTheme, language, setLanguage, selectedBrand } = useSettingsStore();

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;
  const brand = BRANDS[selectedBrand];

  // Fetch user stats from API
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    loadStats();

    // Listen for real-time user updates
    const socket = socketService.getSocket;
    if (socket) {
      // 'profile_updated' is emitted to the specific user's room
      socket.on('profile_updated', handleUserUpdate);
    }

    return () => {
      if (socket) {
        socket.off('profile_updated', handleUserUpdate);
      }
    };
  }, []);

  const handleUserUpdate = async () => {
    try {
      // Fetch latest profile data
      const updatedUser = await userService.getProfile();
      // Update auth store
      useAuthStore.getState().updateUser(updatedUser);
      // Also reload stats
      loadStats();
    } catch (error) {
      console.error('Failed to update profile from socket:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await userService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logoutConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            await authService.logout(tokens?.refreshToken);
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const toggleDarkMode = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    await setTheme(newTheme);
  };

  const toggleLanguage = async () => {
    const newLang = language === 'tr' ? 'en' : 'tr';
    // settingsStore is the single source of truth (syncs store + i18n + storage).
    await setLanguage(newLang);
    // Persist to the account so the preference survives re-login / new devices.
    userService.updateProfile({ language: newLang }).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t('profile.title')}</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card }, Shadows.md]}>
          <View style={[styles.avatar, { backgroundColor: isDark ? '#444444' : colors.primary }]}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: getFullImageUrl(user.avatarUrl)! }}
                style={styles.avatarImage}
                cachePolicy="none"
                accessible={false}
              />
            ) : (
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
              {user?.email}
            </Text>
          </View>
          <Pressable
            style={styles.editButton}
            onPress={() => router.push('/(screens)/profile-edit')}
            accessibilityRole="button"
            accessibilityLabel={t('common.edit')}
          >
            <Ionicons name="create-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>

        {/* Email Verification Banner */}
        {user && !user.emailVerified && (
          <Pressable
            style={[styles.emailBanner, { backgroundColor: colors.warning + '20' }]}
            onPress={() => router.push({
              pathname: '/(auth)/verify-email',
              params: { email: user.email },
            })}
          >
            <View style={styles.emailBannerContent}>
              <Ionicons name="mail-unread-outline" size={24} color={colors.warning} />
              <View style={styles.emailBannerText}>
                <Text style={[styles.emailBannerTitle, { color: colors.text }]}>
                  {t('profile.emailNotVerified', 'Email doğrulanmadı')}
                </Text>
                <Text style={[styles.emailBannerDesc, { color: colors.textSecondary }]}>
                  {t('profile.verifyEmailDesc', 'Email adresinizi doğrulamak için tıklayın')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.warning} />
          </Pressable>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatItem
            icon="cafe"
            value={String(stats?.totalCoffees || 0)}
            label={t('profile.coffee')}
            colors={colors}
          />
          <StatItem
            icon="star"
            value={String(stats?.totalPointsEarned || 0)}
            label={t('profile.points')}
            colors={colors}
          />
          <StatItem
            icon="gift"
            value={String(stats?.freeCoffeesEarned || 0)}
            label={t('profile.rewards')}
            colors={colors}
          />
        </View>

        {/* Brand Switch Button */}
        <Pressable
          style={({ pressed }) => [
            styles.brandSwitchButton,
            { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
            Shadows.sm
          ]}
          onPress={() => router.push('/(auth)/brand-select')}
        >
          <View style={styles.brandSwitchLeft}>
            <View style={[styles.brandLogoContainer, { backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5' }]}>
              <Image
                source={isDark ? brand.logoLight : brand.logo}
                style={styles.brandLogoSmall}
                contentFit="contain"
                accessible={false}
              />
            </View>
            <View>
              <Text style={[styles.brandSwitchLabel, { color: colors.textSecondary }]}>
                {t('brandSelect.currentBrand', 'Seçili Marka')}
              </Text>
              <Text style={[styles.brandSwitchValue, { color: colors.text }]}>
                {brand.name}
              </Text>
            </View>
          </View>
          <View style={styles.brandSwitchRight}>
            <Text style={[styles.brandSwitchAction, { color: colors.primary }]}>
              {t('brandSelect.change', 'Değiştir')}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </View>
        </Pressable>

        {/* Settings Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('profile.settings')}
        </Text>

        <View style={[styles.settingsCard, { backgroundColor: colors.card }, Shadows.sm]}>
          {/* Dark Mode */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={22} color={colors.text} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('profile.darkMode')}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleDarkMode}
              trackColor={{ false: colors.border, true: isDark ? '#4CAF50' : colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.settingDivider, { backgroundColor: colors.border }]} />

          {/* Language */}
          <Pressable style={styles.settingItem} onPress={toggleLanguage}>
            <View style={styles.settingLeft}>
              <Ionicons name="language-outline" size={22} color={colors.text} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('profile.language')}
              </Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                {language === 'tr' ? 'Türkçe' : 'English'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Pressable>

          <View style={[styles.settingDivider, { backgroundColor: colors.border }]} />

          {/* Groups */}
          <Pressable style={styles.settingItem} onPress={() => router.push('/(screens)/my-groups')}>
            <View style={styles.settingLeft}>
              <Ionicons name="people-outline" size={22} color={colors.text} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('groups.myGroups')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </Pressable>

          <View style={[styles.settingDivider, { backgroundColor: colors.border }]} />

          {/* Badges */}
          <Pressable style={styles.settingItem} onPress={() => router.push('/(screens)/badges')}>
            <View style={styles.settingLeft}>
              <Ionicons name="ribbon-outline" size={22} color={colors.text} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('profile.badges')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </Pressable>

          <View style={[styles.settingDivider, { backgroundColor: colors.border }]} />

          {/* About */}
          <Pressable style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={22} color={colors.text} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('profile.about')}
              </Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                v1.0.0
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Pressable>
        </View>

        {/* Logout Button */}
        <Pressable
          style={[styles.logoutButton, { backgroundColor: colors.error + '15' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>
            {t('auth.logout')}
          </Text>
        </Pressable>


      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({
  icon,
  value,
  label,
  colors,
}: {
  icon: string;
  value: string;
  label: string;
  colors: typeof Colors;
}) {
  return (
    <View style={[styles.statItem, { backgroundColor: colors.card }, Shadows.sm]}>
      <Ionicons name={icon as any} size={24} color={colors.primary} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
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
    paddingTop: RSpacing.md,
    paddingBottom: RSpacing.md,
  },
  title: {
    fontSize: RFontSizes.xxl,
    fontWeight: '700',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RSpacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: RSpacing.lg,
  },
  avatar: {
    width: isSmallDevice ? 56 : 64,
    height: isSmallDevice ? 56 : 64,
    borderRadius: isSmallDevice ? 28 : 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: isSmallDevice ? 56 : 64,
    height: isSmallDevice ? 56 : 64,
    borderRadius: isSmallDevice ? 28 : 32,
  },
  avatarText: {
    fontSize: RFontSizes.xl,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    marginLeft: RSpacing.md,
  },
  profileName: {
    fontSize: RFontSizes.xl,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: RFontSizes.sm,
    marginTop: 2,
  },
  editButton: {
    padding: RSpacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: RSpacing.md,
    marginBottom: RSpacing.xl,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
  },
  statValue: {
    fontSize: RFontSizes.xxl,
    fontWeight: '700',
    marginTop: RSpacing.xs,
  },
  statLabel: {
    fontSize: RFontSizes.sm,
  },
  sectionTitle: {
    fontSize: RFontSizes.lg,
    fontWeight: '600',
    marginBottom: RSpacing.sm,
  },
  settingsCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: RSpacing.lg,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: RSpacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RSpacing.md,
  },
  settingLabel: {
    fontSize: RFontSizes.md,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RSpacing.xs,
  },
  settingValue: {
    fontSize: RFontSizes.md,
  },
  settingDivider: {
    height: 1,
    marginLeft: 54,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    gap: RSpacing.sm,
    marginBottom: RSpacing.xl,
  },
  logoutText: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  brandSwitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: RSpacing.xl,
  },
  brandSwitchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RSpacing.md,
  },
  brandLogoContainer: {
    width: isSmallDevice ? 44 : 52,
    height: isSmallDevice ? 44 : 52,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogoSmall: {
    width: '65%',
    height: '65%',
  },
  brandSwitchLabel: {
    fontSize: RFontSizes.sm,
  },
  brandSwitchValue: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  brandSwitchRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RSpacing.xs,
  },
  brandSwitchAction: {
    fontSize: RFontSizes.md,
    fontWeight: '500',
  },
  emailBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: RSpacing.lg,
  },
  emailBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: RSpacing.md,
  },
  emailBannerText: {
    flex: 1,
  },
  emailBannerTitle: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  emailBannerDesc: {
    fontSize: RFontSizes.sm,
    marginTop: 2,
  },
});
