import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';

// Badges will be fetched from API
// Empty array - no mock data
const BADGES: Array<{
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  progress: number;
  current?: number;
  requirement: number;
}> = [];

export default function BadgesScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  const earnedBadges = BADGES.filter((b) => b.earned);
  const lockedBadges = BADGES.filter((b) => !b.earned);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('profile.myBadges')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.card }, Shadows.md]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{earnedBadges.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('badges.earned')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{lockedBadges.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('badges.locked')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{BADGES.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('common.total')}</Text>
          </View>
        </View>

        {/* Earned Badges */}
        {earnedBadges.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('badges.earnedBadges')}
            </Text>
            <View style={styles.badgesGrid}>
              {earnedBadges.map((badge) => (
                <View
                  key={badge.id}
                  style={[styles.badgeCard, { backgroundColor: colors.card }, Shadows.sm]}
                >
                  <View style={[styles.badgeIcon, { backgroundColor: colors.success + '20' }]}>
                    <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                  </View>
                  <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={1}>
                    {badge.name}
                  </Text>
                  <Text style={[styles.badgeDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                    {badge.description}
                  </Text>
                  <View style={styles.earnedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={[styles.earnedText, { color: colors.success }]}>{t('badges.earnedLabel')}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Locked Badges */}
        {lockedBadges.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('badges.lockedBadges')}
            </Text>
            <View style={styles.badgesGrid}>
              {lockedBadges.map((badge) => (
                <View
                  key={badge.id}
                  style={[styles.badgeCard, { backgroundColor: colors.card }, Shadows.sm]}
                >
                  <View style={[styles.badgeIcon, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.badgeEmoji, styles.lockedEmoji]}>{badge.icon}</Text>
                  </View>
                  <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={1}>
                    {badge.name}
                  </Text>
                  <Text style={[styles.badgeDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                    {badge.description}
                  </Text>
                  {/* Progress bar */}
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: isDark ? '#4CAF50' : colors.primary,
                            width: `${badge.progress}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressText, { color: colors.textTertiary }]}>
                      {badge.current}/{badge.requirement}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
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
    paddingHorizontal: RSpacing.lg,
    paddingVertical: RSpacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: RFontSizes.xl,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: RSpacing.lg,
    paddingBottom: RSpacing.xxl,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: RSpacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: RSpacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: RFontSizes.xxl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: RFontSizes.sm,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  sectionTitle: {
    fontSize: RFontSizes.lg,
    fontWeight: '600',
    marginBottom: RSpacing.md,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: RSpacing.lg,
  },
  badgeCard: {
    width: '48%',
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: RSpacing.md,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RSpacing.sm,
  },
  badgeEmoji: {
    fontSize: 28,
  },
  lockedEmoji: {
    opacity: 0.5,
  },
  badgeName: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: RFontSizes.xs,
    lineHeight: 16,
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RSpacing.sm,
    gap: 4,
  },
  earnedText: {
    fontSize: RFontSizes.xs,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: RSpacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: RFontSizes.xs,
    marginTop: 4,
    textAlign: 'right',
  },
});
