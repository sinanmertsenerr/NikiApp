import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import { CategoryTabs } from '../../src/components/CategoryTabs';
import { ErrorState } from '../../src/components/ErrorState';
import { menuService, Category, Product } from '../../src/services/menuService';
import { getImageUrl } from '../../src/services/uploadService';
import { getTranslatedContent } from '../../src/hooks/useTranslatedContent';

// Category icons mapping
const CATEGORY_ICONS: Record<string, string> = {
  'cat-hot-coffees': '☕',
  'cat-cold-coffees': '🧊',
  'cat-desserts': '🍰',
  'cat-beverages': '🥤',
};

export default function MenuScreen() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const { theme, selectedBrand } = useSettingsStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  // Fetch categories
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['categories', selectedBrand],
    queryFn: () => menuService.getCategories(selectedBrand),
  });

  // Fetch products
  const {
    data: products = [],
    isLoading: productsLoading,
    isError: productsError,
    error: productsErrorObj,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['products', selectedBrand],
    queryFn: () => menuService.getProducts(undefined, selectedBrand),
  });

  // Set first category as default when categories load (only on initial mount)
  const hasInitialized = useState(false);
  useEffect(() => {
    if (categories.length > 0 && !hasInitialized[0]) {
      setSelectedCategory(categories[0].id);
      hasInitialized[1](true);
    }
  }, [categories]);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    const matchesSearch = product.nameTr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && (searchQuery === '' || matchesSearch);
  });

  const onRefresh = async () => {
    await Promise.all([refetchCategories(), refetchProducts()]);
  };

  const isLoading = categoriesLoading || productsLoading;

  if (isLoading && categories.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('menu.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('menu.title')}</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="search-outline" size={20} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('menu.search')}
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} accessibilityRole="button" accessibilityLabel={t('common.close')}>
            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* Categories */}
      <CategoryTabs
        items={categories.map((cat) => ({
          id: cat.id,
          label: getTranslatedContent(cat, 'name', i18n.language),
          icon: CATEGORY_ICONS[cat.id] || '📦',
        }))}
        selectedId={selectedCategory}
        onSelect={(id) => setSelectedCategory(id)}
        showAllOption
        allLabel={t('common.all')}
      />

      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsContainer}
        columnWrapperStyle={styles.productsRow}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.productCard, { backgroundColor: colors.card }, Shadows.sm]}
            onPress={() => router.push({
              pathname: '/(screens)/product-detail',
              params: { id: item.id, name: getTranslatedContent(item, 'name', i18n.language), price: item.price.toString() }
            })}
          >
            <View style={[styles.productImage, { backgroundColor: colors.backgroundSecondary }]}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: getImageUrl(item.imageUrl) || item.imageUrl }}
                  style={styles.productImageContent}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.productEmoji}>{item.isCoffee ? '☕' : '🍽️'}</Text>
              )}
            </View>
            <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
              {getTranslatedContent(item, 'name', i18n.language)}
            </Text>
            <Text style={[styles.productPrice, { color: colors.primary }]}>
              ₺{item.price}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          productsError && products.length === 0 ? (
            <ErrorState error={productsErrorObj} onRetry={() => refetchProducts()} />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="cafe-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('menu.noProducts')}
              </Text>
            </View>
          )
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
    paddingHorizontal: RSpacing.lg,
    paddingTop: RSpacing.md,
    paddingBottom: RSpacing.sm,
  },
  title: {
    fontSize: RFontSizes.xxl,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: RSpacing.lg,
    paddingHorizontal: RSpacing.md,
    paddingVertical: RSpacing.sm,
    borderRadius: BorderRadius.lg,
    marginBottom: RSpacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: RSpacing.sm,
    fontSize: RFontSizes.md,
  },
  productsContainer: {
    paddingHorizontal: RSpacing.lg,
    paddingTop: RSpacing.sm,
    paddingBottom: RSpacing.xxl,
  },
  productsRow: {
    justifyContent: 'space-between',
    marginBottom: RSpacing.md,
  },
  productCard: {
    width: (SCREEN_WIDTH - RSpacing.lg * 2 - RSpacing.md) / 2,
    borderRadius: BorderRadius.lg,
    padding: RSpacing.md,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RSpacing.sm,
    overflow: 'hidden',
  },
  productImageContent: {
    width: '100%',
    height: '100%',
  },
  productEmoji: {
    fontSize: isSmallDevice ? 40 : 48,
  },
  productName: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
    marginBottom: RSpacing.xs,
  },
  productPrice: {
    fontSize: RFontSizes.lg,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RSpacing.xxl,
  },
  emptyText: {
    fontSize: RFontSizes.md,
    marginTop: RSpacing.md,
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
