import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useColorScheme,
  Pressable,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import { getImageUrl } from '../../src/services/uploadService';
import {
  menuService,
  Category as ApiCategory,
  Product as ApiProduct
} from '../../src/services/menuService';
import { uploadService } from '../../src/services/uploadService';
import { CategoryTabs } from '../../src/components/CategoryTabs';
import { getTranslatedContent } from '../../src/hooks/useTranslatedContent';

// Types for UI
type Category = {
  id: string;
  name: string;
  nameTr: string;
  icon: string;
  productCount: number;
  brand: 'coffee' | 'sandwich';
  isActive: boolean;
};

type Product = {
  id: string;
  name: string;
  nameTr: string;
  description: string;
  descriptionTr: string;
  price: number;
  categoryId: string;
  isAvailable: boolean;
  image: string | null;
  isCoffee: boolean;
};

type TabType = 'products' | 'categories';

export default function AdminMenuManagementScreen() {
  const colorScheme = useColorScheme();
  const { theme, selectedBrand } = useSettingsStore();

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;
  const { t, i18n } = useTranslation();

  // Helper for dynamic language content
  const getName = (item: { name: string; nameTr: string }) => getTranslatedContent(item, 'name', i18n.language);
  const getDescription = (item: { description: string; descriptionTr: string }) => getTranslatedContent(item, 'description', i18n.language);

  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Product Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productNameTr, setProductNameTr] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productDescriptionTr, setProductDescriptionTr] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productAvailable, setProductAvailable] = useState(true);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [newProductImageUri, setNewProductImageUri] = useState<string | null>(null);
  const [productIsCoffee, setProductIsCoffee] = useState(false);

  // Category Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryNameTr, setCategoryNameTr] = useState('');

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      const [categoriesData, productsData] = await Promise.all([
        menuService.adminGetCategories(selectedBrand),
        menuService.adminGetProducts(),
      ]);

      // Transform API data to UI format - filter only active categories
      const transformedCategories: Category[] = categoriesData
        .filter((cat: ApiCategory) => cat.isActive)
        .map((cat: ApiCategory) => ({
          id: cat.id,
          name: cat.name,
          nameTr: cat.nameTr,
          icon: 'cafe', // Default icon
          productCount: productsData.filter((p: ApiProduct) => p.categoryId === cat.id).length,
          brand: cat.brand,
          isActive: cat.isActive,
        }));

      const transformedProducts: Product[] = productsData.map((prod: ApiProduct) => ({
        id: prod.id,
        name: prod.name,
        nameTr: prod.nameTr,
        description: prod.description || '',
        descriptionTr: prod.descriptionTr || '',
        price: prod.price,
        categoryId: prod.categoryId,
        isAvailable: prod.isActive,
        image: prod.imageUrl || null,
        isCoffee: prod.isCoffee,
      }));

      setCategories(transformedCategories);
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching menu data:', error);
      Alert.alert(t('common.error'), t('admin.loadError'));
    }
  }, [selectedBrand]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    loadData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory)
    : products;

  // Product handlers
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewProductImageUri(result.assets[0].uri);
    }
  };

  const openCreateProductModal = () => {
    setEditingProduct(null);
    setProductName('');
    setProductNameTr('');
    setProductDescription('');
    setProductDescriptionTr('');
    setProductPrice('');
    setProductCategory(categories[0]?.id || '');
    setProductAvailable(true);
    setProductImage(null);
    setNewProductImageUri(null);
    setProductIsCoffee(false);
    setShowProductModal(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductNameTr(product.nameTr);
    setProductDescription(product.description);
    setProductDescriptionTr(product.descriptionTr);
    setProductPrice(product.price.toString());
    setProductImage(product.image);
    setNewProductImageUri(null);
    setProductCategory(product.categoryId);
    setProductAvailable(product.isAvailable);
    setProductIsCoffee(product.isCoffee);
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    if (!productNameTr.trim()) {
      Alert.alert(t('common.error'), t('validation.enterProductName'));
      return;
    }
    if (!productPrice || parseFloat(productPrice) <= 0) {
      Alert.alert(t('common.error'), t('validation.enterValidPrice'));
      return;
    }
    if (!productCategory) {
      Alert.alert(t('common.error'), t('validation.selectCategory'));
      return;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        // Update existing product
        const updatedProduct = await menuService.updateProduct(editingProduct.id, {
          name: productName || productNameTr,
          nameTr: productNameTr,
          description: productDescription,
          descriptionTr: productDescriptionTr || productDescription,
          price: parseFloat(productPrice),
          categoryId: productCategory,
          isActive: productAvailable,
          isCoffee: productIsCoffee,
        });

        // Upload new image if selected
        if (newProductImageUri) {
          await uploadService.uploadProductImage(editingProduct.id, newProductImageUri);
        }

        Alert.alert(t('common.success'), t('admin.productUpdated'));
      } else {
        // Create new product
        const newProduct = await menuService.createProduct({
          name: productName || productNameTr,
          nameTr: productNameTr,
          description: productDescription,
          descriptionTr: productDescriptionTr || productDescription,
          price: parseFloat(productPrice),
          categoryId: productCategory,
          isCoffee: productIsCoffee,
        });

        // Upload image if selected
        if (newProductImageUri) {
          await uploadService.uploadProductImage(newProduct.id, newProductImageUri);
        }

        Alert.alert(t('common.success'), t('admin.productCreated'));
      }

      setShowProductModal(false);
      await fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error saving product:', error);
      Alert.alert(t('common.error'), error.response?.data?.message || t('admin.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(t('admin.deleteProductTitle'), t('admin.deleteProductConfirm', { name: product.nameTr }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await menuService.deleteProduct(product.id);
            await fetchData();
            Alert.alert(t('common.success'), t('admin.productDeleted'));
          } catch (error: any) {
            Alert.alert(t('common.error'), error.response?.data?.message || t('admin.deleteError'));
          }
        },
      },
    ]);
  };

  const handleToggleAvailability = async (product: Product) => {
    try {
      await menuService.toggleProductStatus(product.id, !product.isAvailable);
      await fetchData();
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('admin.statusChangeError'));
    }
  };

  // Category handlers
  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryNameTr('');
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryNameTr(category.nameTr);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryNameTr.trim()) {
      Alert.alert(t('common.error'), t('validation.enterCategoryName'));
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await menuService.updateCategory(editingCategory.id, {
          name: categoryName || categoryNameTr,
          nameTr: categoryNameTr,
        });
        Alert.alert(t('common.success'), t('admin.categoryUpdated'));
      } else {
        await menuService.createCategory({
          name: categoryName || categoryNameTr,
          nameTr: categoryNameTr,
          brand: selectedBrand as 'coffee' | 'sandwich',
        });
        Alert.alert(t('common.success'), t('admin.categoryCreated'));
      }

      setShowCategoryModal(false);
      await fetchData();
    } catch (error: any) {
      console.error('Error saving category:', error);
      Alert.alert(t('common.error'), error.response?.data?.message || t('admin.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = (category: Category) => {
    const hasProducts = products.some((p) => p.categoryId === category.id);
    if (hasProducts) {
      Alert.alert(t('common.error'), t('admin.categoryHasProducts'));
      return;
    }

    Alert.alert(t('admin.deleteCategoryTitle'), t('admin.deleteCategoryConfirm', { name: category.nameTr || category.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('Deleting category:', category.id);
            await menuService.deleteCategory(category.id);
            console.log('Category deleted successfully');
            await fetchData();
            Alert.alert(t('common.success'), t('admin.categoryDeleted'));
          } catch (error: any) {
            console.log('Delete error:', error?.response?.status, error?.response?.data, error?.message);
            const errorMessage = error?.response?.data?.message || error?.message || t('admin.deleteError');
            Alert.alert(t('common.error'), errorMessage);
          }
        },
      },
    ]);
  };

  const getCategoryName = (categoryId: string) => {
    return getName(categories.find((c) => c.id === categoryId) || { name: '', nameTr: '' }) || t('common.unknown');
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={[styles.productCard, { backgroundColor: colors.card }, Shadows.sm]}>
      <View style={styles.productHeader}>
        <View style={[styles.productImage, { backgroundColor: colors.backgroundSecondary }]}>
          {item.image ? (
            <Image source={{ uri: getImageUrl(item.image) || item.image }} style={styles.productImagePreview} contentFit="cover" />
          ) : (
            <Ionicons name="cafe" size={24} color={colors.textTertiary} />
          )}
        </View>
        <View style={styles.productInfo}>
          <View style={styles.productTitleRow}>
            <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
              {getName(item)}
            </Text>
            {!item.isAvailable && (
              <View style={[styles.unavailableBadge, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.unavailableBadgeText, { color: colors.error }]}>{t('admin.outOfStock')}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.productDescription, { color: colors.textSecondary }]} numberOfLines={1}>
            {getDescription(item)}
          </Text>
          <View style={styles.productMeta}>
            <Text style={[styles.productPrice, { color: colors.primary }]}>₺{item.price}</Text>
            <Text style={[styles.productCategory, { color: colors.textTertiary }]}>
              {getCategoryName(item.categoryId)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.productActions}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
          onPress={() => handleToggleAvailability(item)}
        >
          <Ionicons
            name={item.isAvailable ? 'eye-off' : 'eye'}
            size={18}
            color={colors.text}
          />
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
          onPress={() => openEditProductModal(item)}
        >
          <Ionicons name="pencil" size={18} color={colors.text} />
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.error + '15' }]}
          onPress={() => handleDeleteProduct(item)}
        >
          <Ionicons name="trash" size={18} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );

  // Category reorder handler
  const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex((c) => c.id === categoryId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // Check bounds
    if (newIndex < 0 || newIndex >= categories.length) return;

    // Swap positions locally
    const newCategories = [...categories];
    [newCategories[currentIndex], newCategories[newIndex]] = [newCategories[newIndex], newCategories[currentIndex]];
    setCategories(newCategories);

    // Send to backend
    try {
      const orderedIds = newCategories.map((cat) => cat.id);
      await menuService.reorderCategories(orderedIds);
    } catch (error: any) {
      console.error('Error reordering categories:', error);
      Alert.alert(t('common.error'), error?.response?.data?.message || 'Kategoriler sıralanırken hata oluştu');
      // Revert on error
      await fetchData();
    }
  };

  const renderCategory = ({ item, index }: { item: Category; index: number }) => (
    <View style={[styles.categoryCard, { backgroundColor: colors.card }, Shadows.sm]}>
      <View style={styles.categoryHeader}>
        {/* Reorder buttons */}
        <View style={styles.reorderButtons}>
          <Pressable
            onPress={() => handleMoveCategory(item.id, 'up')}
            disabled={index === 0}
            style={({ pressed }) => [
              styles.reorderButton,
              { backgroundColor: colors.backgroundSecondary },
              index === 0 && { opacity: 0.3 },
              pressed && { opacity: 0.6, backgroundColor: colors.primary + '30' },
            ]}
          >
            <Ionicons name="chevron-up" size={22} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => handleMoveCategory(item.id, 'down')}
            disabled={index === categories.length - 1}
            style={({ pressed }) => [
              styles.reorderButton,
              { backgroundColor: colors.backgroundSecondary },
              index === categories.length - 1 && { opacity: 0.3 },
              pressed && { opacity: 0.6, backgroundColor: colors.primary + '30' },
            ]}
          >
            <Ionicons name="chevron-down" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
        <View style={[styles.categoryIcon, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name={item.icon as any} size={24} color={colors.primary} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryName, { color: colors.text }]}>{getName(item)}</Text>
          <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
            {t('admin.nProducts', { count: products.filter((p) => p.categoryId === item.id).length })}
          </Text>
        </View>
      </View>

      <View style={styles.categoryActions}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
          onPress={() => openEditCategoryModal(item)}
        >
          <Ionicons name="pencil" size={18} color={colors.text} />
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.error + '15' }]}
          onPress={() => handleDeleteCategory(item)}
        >
          <Ionicons name="trash" size={18} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Pressable
          style={[styles.tab, activeTab === 'products' && { backgroundColor: colors.card }]}
          onPress={() => setActiveTab('products')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'products' ? colors.primary : colors.textSecondary },
            ]}
          >
            {t('admin.products')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'categories' && { backgroundColor: colors.card }]}
          onPress={() => setActiveTab('categories')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'categories' ? colors.primary : colors.textSecondary },
            ]}
          >
            {t('admin.categories')}
          </Text>
        </Pressable>
      </View>

      {/* Category Filter (only for products tab) */}
      {activeTab === 'products' && (
        <CategoryTabs
          items={categories.map((cat) => ({
            id: cat.id,
            label: getName(cat),
          }))}
          selectedId={selectedCategory}
          onSelect={(id) => setSelectedCategory(id)}
          showAllOption
          allLabel={t('admin.allFilter')}
        />
      )}

      {/* Content */}
      {activeTab === 'products' ? (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cafe-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('admin.noProducts')}</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('admin.noProductsDesc')}
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: RSpacing.md }} />}
        />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategory}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('admin.noCategoriesFound')}</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('admin.noCategoriesDesc')}
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: RSpacing.md }} />}
        />
      )}

      {/* FAB */}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.text }]}
        onPress={activeTab === 'products' ? openCreateProductModal : openCreateCategoryModal}
      >
        <Ionicons name="add" size={28} color={colors.card} />
      </Pressable>

      {/* Product Modal */}
      <Modal visible={showProductModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingProduct ? t('admin.editProduct') : t('admin.newProduct')}
              </Text>
              <Pressable onPress={() => setShowProductModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.productNameTr')}</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                value={productNameTr}
                onChangeText={setProductNameTr}
                placeholder={t('admin.productNamePlaceholderTr')}
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.productNameEn')}</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                value={productName}
                onChangeText={setProductName}
                placeholder={t('admin.productNamePlaceholderEn')}
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.productDescTr')}</Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.textArea,
                  { backgroundColor: colors.backgroundSecondary, color: colors.text },
                ]}
                value={productDescriptionTr}
                onChangeText={setProductDescriptionTr}
                placeholder={t('admin.productDescPlaceholderTr')}
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.productDescEn')}</Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.textArea,
                  { backgroundColor: colors.backgroundSecondary, color: colors.text },
                ]}
                value={productDescription}
                onChangeText={setProductDescription}
                placeholder={t('admin.productDescPlaceholderEn')}
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.priceCurrency')}</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                value={productPrice}
                onChangeText={setProductPrice}
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
              />

              {/* Product Image */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.productImage')}</Text>
              <Pressable
                style={[styles.imagePickerButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={pickImage}
              >
                {newProductImageUri ? (
                  <Image source={{ uri: newProductImageUri }} style={styles.imagePreview} contentFit="cover" />
                ) : productImage ? (
                  <Image source={{ uri: getImageUrl(productImage) || productImage }} style={styles.imagePreview} contentFit="cover" />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <Ionicons name="camera-outline" size={32} color={colors.textTertiary} />
                    <Text style={[styles.imagePickerText, { color: colors.textSecondary }]}>{t('admin.selectImage')}</Text>
                  </View>
                )}
              </Pressable>
              {(newProductImageUri || productImage) && (
                <Pressable
                  style={[styles.removeImageButton, { backgroundColor: colors.error + '15' }]}
                  onPress={() => {
                    setProductImage(null);
                    setNewProductImageUri(null);
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <Text style={[styles.removeImageText, { color: colors.error }]}>{t('admin.removeImage')}</Text>
                </Pressable>
              )}

              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.category')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.categorySelectorItem,
                      { backgroundColor: colors.backgroundSecondary },
                      productCategory === cat.id && { backgroundColor: colors.primary + '30', borderColor: colors.primary },
                    ]}
                    onPress={() => setProductCategory(cat.id)}
                  >
                    <Text
                      style={[
                        styles.categorySelectorText,
                        { color: productCategory === cat.id ? colors.primary : colors.text },
                      ]}
                    >
                      {getName(cat)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.switchRow}>
                <Text style={[styles.inputLabel, { color: colors.text, marginBottom: 0, marginTop: 0 }]}>
                  {t('admin.inStock')}
                </Text>
                <Switch
                  value={productAvailable}
                  onValueChange={setProductAvailable}
                  trackColor={{ false: colors.border, true: colors.primary + '50' }}
                  thumbColor={productAvailable ? colors.primary : colors.backgroundSecondary}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={[styles.inputLabel, { color: colors.text, marginBottom: 0, marginTop: 0 }]}>
                  {t('admin.isCoffee')}
                </Text>
                <Switch
                  value={productIsCoffee}
                  onValueChange={setProductIsCoffee}
                  trackColor={{ false: colors.border, true: colors.primary + '50' }}
                  thumbColor={productIsCoffee ? colors.primary : colors.backgroundSecondary}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalCancelButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => setShowProductModal(false)}
                disabled={saving}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSaveButton, { backgroundColor: colors.text, opacity: saving ? 0.6 : 1 }]}
                onPress={handleSaveProduct}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.card} />
                ) : (
                  <Text style={[styles.modalSaveText, { color: colors.card }]}>{editingProduct ? t('admin.update') : t('admin.create')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingCategory ? t('admin.editCategory') : t('admin.newCategory')}
              </Text>
              <Pressable onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalScroll}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.categoryNameTr')}</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                value={categoryNameTr}
                onChangeText={setCategoryNameTr}
                placeholder={t('admin.categoryNamePlaceholderTr')}
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.categoryNameEn')}</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder={t('admin.categoryNamePlaceholderEn')}
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalCancelButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => setShowCategoryModal(false)}
                disabled={saving}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSaveButton, { backgroundColor: colors.text, opacity: saving ? 0.6 : 1 }]}
                onPress={handleSaveCategory}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.card} />
                ) : (
                  <Text style={[styles.modalSaveText, { color: colors.card }]}>{editingCategory ? t('common.update') : t('common.create')}</Text>
                )}
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: RSpacing.md,
    marginTop: RSpacing.md,
    padding: 4,
    borderRadius: BorderRadius.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: RSpacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  tabText: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  listContent: {
    padding: RSpacing.md,
    paddingBottom: 100,
  },
  productCard: {
    borderRadius: BorderRadius.lg,
    padding: RSpacing.md,
  },
  productHeader: {
    flexDirection: 'row',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  productImagePreview: {
    width: 60,
    height: 60,
  },
  productInfo: {
    flex: 1,
    marginLeft: RSpacing.md,
  },
  productTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RSpacing.sm,
  },
  productName: {
    flex: 1,
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  unavailableBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unavailableBadgeText: {
    fontSize: RFontSizes.xs,
    fontWeight: '500',
  },
  productDescription: {
    fontSize: RFontSizes.sm,
    marginTop: 2,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: RSpacing.xs,
  },
  productPrice: {
    fontSize: RFontSizes.md,
    fontWeight: '700',
  },
  productCategory: {
    fontSize: RFontSizes.xs,
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: RSpacing.sm,
    marginTop: RSpacing.md,
    paddingTop: RSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  categoryCard: {
    borderRadius: BorderRadius.lg,
    padding: RSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    marginLeft: RSpacing.md,
  },
  categoryName: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  categoryCount: {
    fontSize: RFontSizes.sm,
    marginTop: 2,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: RSpacing.sm,
  },
  reorderButtons: {
    flexDirection: 'column',
    marginRight: RSpacing.sm,
    gap: 2,
  },
  reorderButton: {
    padding: 6,
    borderRadius: BorderRadius.md,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
  fab: {
    position: 'absolute',
    bottom: RSpacing.xl,
    right: RSpacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: RSpacing.lg,
    paddingBottom: RSpacing.md,
  },
  modalTitle: {
    fontSize: RFontSizes.xl,
    fontWeight: '700',
  },
  modalScroll: {
    paddingHorizontal: RSpacing.lg,
  },
  inputLabel: {
    fontSize: RFontSizes.sm,
    fontWeight: '500',
    marginBottom: RSpacing.xs,
    marginTop: RSpacing.md,
  },
  textInput: {
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    fontSize: RFontSizes.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imagePickerButton: {
    height: 150,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePickerPlaceholder: {
    alignItems: 'center',
    gap: RSpacing.sm,
  },
  imagePickerText: {
    fontSize: RFontSizes.sm,
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RSpacing.xs,
    padding: RSpacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: RSpacing.xs,
  },
  removeImageText: {
    fontSize: RFontSizes.sm,
    fontWeight: '500',
  },
  categorySelector: {
    flexDirection: 'row',
    marginTop: RSpacing.xs,
  },
  categorySelectorItem: {
    paddingHorizontal: RSpacing.md,
    paddingVertical: RSpacing.sm,
    borderRadius: BorderRadius.md,
    marginRight: RSpacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categorySelectorText: {
    fontSize: RFontSizes.sm,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: RSpacing.lg,
    marginBottom: RSpacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: RSpacing.md,
    padding: RSpacing.lg,
    paddingBottom: RSpacing.xl,
  },
  modalCancelButton: {
    flex: 1,
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
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
