import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';

// Product data comes from params (passed from menu screen)
// No mock data - relies on actual product info

export default function ProductDetailScreen() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const { theme } = useSettingsStore();
  const params = useLocalSearchParams<{ id: string; name?: string; price?: string; description?: string }>();

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  const [isFavorite, setIsFavorite] = useState(false);

  // Use params from navigation
  const product = {
    id: params.id || '',
    name: params.name || t('admin.defaultProductName', 'Ürün'),
    price: params.price ? parseInt(params.price) : 0,
    description: params.description || t('admin.defaultProductDesc', 'Ürün açıklaması'),
    category: 'hot',
    calories: 0,
    preparationTime: '5-7 dk',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton} accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Pressable
          onPress={() => setIsFavorite(!isFavorite)}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? colors.error : colors.text}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Product Image */}
        <View style={[styles.imageContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={styles.productEmoji}>☕</Text>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>

          {/* Price */}
          <Text style={[styles.price, { color: isDark ? '#4CAF50' : colors.primary }]}>
            ₺{product.price}
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {product.description}
          </Text>

          {/* Quick Info */}
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={styles.infoItem}>
              <Ionicons name="flame-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.infoValue, { color: colors.text }]}>{product.calories}</Text>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{t('admin.calories', 'kcal')}</Text>
            </View>
            <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.infoValue, { color: colors.text }]}>{product.preparationTime}</Text>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{t('admin.preparation', 'hazırlık')}</Text>
            </View>
            <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
            <View style={styles.infoItem}>
              <Ionicons name="cafe-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {product.category === 'hot' ? t('admin.hot', 'Sıcak') : t('admin.cold', 'Soğuk')}
              </Text>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{t('admin.serving', 'servis')}</Text>
            </View>
          </View>

        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: RSpacing.lg,
    paddingVertical: RSpacing.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: RSpacing.xxl,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productEmoji: {
    fontSize: 120,
  },
  productInfo: {
    padding: RSpacing.lg,
  },
  productName: {
    fontSize: RFontSizes.xxl,
    fontWeight: '700',
    marginBottom: RSpacing.xs,
  },
  price: {
    fontSize: RFontSizes.xxl,
    fontWeight: '700',
    marginBottom: RSpacing.md,
  },
  description: {
    fontSize: RFontSizes.md,
    lineHeight: 22,
    marginBottom: RSpacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: RSpacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: RSpacing.lg,
  },
  infoItem: {
    alignItems: 'center',
    gap: 4,
  },
  infoValue: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  infoLabel: {
    fontSize: RFontSizes.xs,
  },
  infoDivider: {
    width: 1,
    height: 40,
  },
});
