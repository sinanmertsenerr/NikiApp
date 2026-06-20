import { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import { notificationService, Notification } from '../../src/services/notificationService';
import i18n from '../../src/i18n';

// Notification types
type NotificationType = 'reward' | 'campaign' | 'order' | 'system' | 'badge' | 'balance';

// Format relative time (localized)
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return i18n.t('notifications.time.justNow');
  if (diffMins < 60) return i18n.t('notifications.time.minutesAgo', { count: diffMins });
  if (diffHours < 24) return i18n.t('notifications.time.hoursAgo', { count: diffHours });
  if (diffDays < 7) return i18n.t('notifications.time.daysAgo', { count: diffDays });
  return date.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' });
};

const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case 'reward':
      return 'gift';
    case 'campaign':
      return 'megaphone';
    case 'order':
      return 'cafe';
    case 'badge':
      return 'ribbon';
    case 'balance':
      return 'wallet';
    case 'system':
      return 'information-circle';
    default:
      return 'notifications';
  }
};

const getNotificationColor = (type: NotificationType, colors: typeof Colors) => {
  switch (type) {
    case 'reward':
      return colors.success;
    case 'campaign':
      return colors.warning;
    case 'order':
      return colors.info;
    case 'badge':
      return '#9C27B0';
    case 'balance':
      return colors.primary;
    case 'system':
      return colors.textSecondary;
    default:
      return colors.primary;
  }
};

export default function NotificationsScreen() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();
  const queryClient = useQueryClient();

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  // Fetch notifications from API
  const { data: notifications = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getNotifications,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl as any);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Get translated content based on language
  const getTitle = (notification: Notification) => {
    return i18n.language === 'tr' ? notification.titleTr : notification.title;
  };

  const getMessage = (notification: Notification) => {
    return i18n.language === 'tr' ? notification.messageTr : notification.message;
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const iconColor = getNotificationColor(item.type as NotificationType, colors);

    return (
      <Pressable
        style={[
          styles.notificationItem,
          { backgroundColor: item.isRead ? colors.card : colors.backgroundSecondary },
          Shadows.sm,
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={getNotificationIcon(item.type as NotificationType) as any} size={22} color={iconColor} accessible={false} />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, { color: colors.text }]} numberOfLines={1}>
              {getTitle(item)}
            </Text>
            {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
          </View>
          <Text style={[styles.notificationMessage, { color: colors.textSecondary }]} numberOfLines={2}>
            {getMessage(item)}
          </Text>
          <Text style={[styles.timestamp, { color: colors.textTertiary }]}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
        {item.actionUrl && (
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} accessible={false} />
        )}
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.text }]}>{t('profile.notifications')}</Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <Pressable
            onPress={handleMarkAllAsRead}
            style={styles.markAllButton}
            disabled={markAllAsReadMutation.isPending}
          >
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              {markAllAsReadMutation.isPending ? '...' : t('notifications.markAllRead')}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textTertiary} accessible={false} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('notifications.noNotifications')}</Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
              {t('notifications.noNotificationsDesc')}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: RSpacing.sm }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RSpacing.xs,
  },
  title: {
    fontSize: RFontSizes.xl,
    fontWeight: '600',
  },
  badge: {
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
  markAllButton: {
    paddingHorizontal: RSpacing.sm,
    paddingVertical: RSpacing.xs,
  },
  markAllText: {
    fontSize: RFontSizes.sm,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: RSpacing.lg,
    paddingBottom: RSpacing.xxl,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    gap: RSpacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RSpacing.xs,
  },
  notificationTitle: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationMessage: {
    fontSize: RFontSizes.sm,
    lineHeight: 18,
    marginTop: 2,
  },
  timestamp: {
    fontSize: RFontSizes.xs,
    marginTop: 4,
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
  emptyMessage: {
    fontSize: RFontSizes.md,
    marginTop: RSpacing.xs,
    textAlign: 'center',
  },
});
