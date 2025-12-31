import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Pressable,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import { adminGetUser, adminUpdateUser, adminToggleIeuWallet, adminToggleNegativeBalance, AdminUser } from '../../src/services/userService';
import { walletService } from '../../src/services/walletService';
import { formatPhoneNumber } from '../../src/utils/phoneFormat';

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  ieuCredits: number;
  nikiCredits: number;
  totalOrders: number;
  totalSpent: number;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  ieuQrCode: string;
  nikiQrCode: string;
  role: 'customer' | 'admin' | 'super_admin';
  ieuWalletActive: boolean;
  // Negative balance settings
  ieuAllowNegative: boolean;
  ieuNegativeLimit: number;
  nikiAllowNegative: boolean;
  nikiNegativeLimit: number;
}

type WalletType = 'ieu' | 'niki';

export default function AdminUserDetailScreen() {
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();
  const { id } = useLocalSearchParams<{ id: string }>();

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;
  const { t } = useTranslation();

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showDeductModal, setShowDeductModal] = useState(false);
  const [showNegativeModal, setShowNegativeModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedWalletType, setSelectedWalletType] = useState<WalletType>('ieu');
  const [pointsAmount, setPointsAmount] = useState('');
  const [creditsAmount, setCreditsAmount] = useState('');
  const [deductAmount, setDeductAmount] = useState('');
  const [negativeLimit, setNegativeLimit] = useState('');

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      const userData = await adminGetUser(id!);
      setUser({
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone || '',
        loyaltyPoints: userData.loyaltyPoints?.availablePoints || 0,
        ieuCredits: parseFloat(userData.wallets?.ieu?.balance || userData.wallet?.balance || '0'),
        nikiCredits: parseFloat(userData.wallets?.niki?.balance || '0'),
        totalOrders: userData.stats?.orderCount || 0,
        totalSpent: 0, // Not tracked yet
        isActive: userData.isActive,
        emailVerified: userData.emailVerified,
        createdAt: userData.createdAt,
        ieuQrCode: userData.wallets?.ieu?.qrCode || userData.wallet?.qrCode || '',
        nikiQrCode: userData.wallets?.niki?.qrCode || '',
        role: userData.role,
        ieuWalletActive: (userData.wallets?.ieu as any)?.isActive ?? false,
        // Negative balance settings
        ieuAllowNegative: (userData.wallets?.ieu as any)?.allowNegative ?? false,
        ieuNegativeLimit: (userData.wallets?.ieu as any)?.negativeLimit ?? 0,
        nikiAllowNegative: (userData.wallets?.niki as any)?.allowNegative ?? false,
        nikiNegativeLimit: (userData.wallets?.niki as any)?.negativeLimit ?? 0,
      });
    } catch (error) {
      console.error('Failed to load user:', error);
      Alert.alert(t('common.error'), t('admin.userNotFound'));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = () => {
    if (!user) return;
    Alert.alert(
      user.isActive ? t('admin.deactivateUser') : t('admin.activateUser'),
      t('admin.toggleUserStatus', { name: `${user.firstName} ${user.lastName}`, action: user.isActive ? t('admin.deactivate') : t('admin.activate') }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: user.isActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const newStatus = !user.isActive;
              setUser((prev) => prev ? { ...prev, isActive: newStatus } : null);
              await adminUpdateUser(user.id, { isActive: newStatus });
              Alert.alert(t('common.success'), t('admin.statusUpdated', 'Kullanıcı durumu güncellendi'));
            } catch (error) {
              console.error('Failed to update user status:', error);
              setUser((prev) => prev ? { ...prev, isActive: !user.isActive } : null);
              Alert.alert(t('common.error'), t('admin.updateFailed', 'Güncelleme başarısız oldu'));
            }
          },
        },
      ]
    );
  };

  const handleToggleIeuWallet = () => {
    if (!user) return;
    const newStatus = !user.ieuWalletActive;
    Alert.alert(
      newStatus ? t('admin.activateIeuWallet', 'IEU Cüzdan Aktifleştir') : t('admin.deactivateIeuWallet', 'IEU Cüzdan Pasifleştir'),
      newStatus
        ? t('admin.confirmActivateIeuWallet', 'Bu kullanıcının IEU cüzdanını aktifleştirmek istiyor musunuz?')
        : t('admin.confirmDeactivateIeuWallet', 'Bu kullanıcının IEU cüzdanını pasifleştirmek istiyor musunuz?'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: newStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setUser((prev) => prev ? { ...prev, ieuWalletActive: newStatus } : null);
              await adminToggleIeuWallet(user.id, newStatus);
              Alert.alert(
                t('common.success'),
                newStatus
                  ? t('admin.ieuWalletActivated')
                  : t('admin.ieuWalletDeactivated')
              );
            } catch (error) {
              console.error('Failed to toggle IEU wallet:', error);
              setUser((prev) => prev ? { ...prev, ieuWalletActive: !newStatus } : null);
              Alert.alert(t('common.error'), t('admin.updateFailed', 'Güncelleme başarısız oldu'));
            }
          },
        },
      ]
    );
  };



  const handleAddPoints = () => {
    const amount = parseInt(pointsAmount);
    if (!amount || amount <= 0) {
      Alert.alert(t('common.error'), t('validation.enterValidPoints'));
      return;
    }
    // TODO: API call
    setUser((prev) => prev ? { ...prev, loyaltyPoints: prev.loyaltyPoints + amount } : null);
    setShowPointsModal(false);
    setPointsAmount('');
    Alert.alert(t('common.success'), t('admin.pointsAdded', { amount: amount }));
  };

  const handleAddCredits = async () => {
    const amount = parseFloat(creditsAmount);
    if (!amount || amount <= 0) {
      Alert.alert(t('common.error'), t('validation.enterValidAmount'));
      return;
    }

    const qrCode = selectedWalletType === 'ieu' ? user?.ieuQrCode : user?.nikiQrCode;
    if (!qrCode) {
      Alert.alert(t('common.error'), t('admin.qrCodeNotFound'));
      return;
    }

    const walletName = selectedWalletType === 'ieu' ? 'IUE' : 'Niki';

    try {
      const result = await walletService.topUp({
        qrCode: qrCode,
        amount: amount,
        description: t('admin.creditLoadedDesc', {
          amount,
          wallet: walletName,
          defaultValue: t('admin.creditLoadedDesc')
        }),
      });

      if (selectedWalletType === 'ieu') {
        setUser((prev) => prev ? { ...prev, ieuCredits: parseFloat(result.newBalance) } : null);
      } else {
        setUser((prev) => prev ? { ...prev, nikiCredits: parseFloat(result.newBalance) } : null);
      }
      setShowCreditsModal(false);
      setCreditsAmount('');
      Alert.alert(t('common.success'), t('admin.creditsAdded', { amount: amount, wallet: walletName }));
    } catch (error: any) {
      console.error('Failed to add credits:', error);
      Alert.alert(t('common.error'), error.response?.data?.message || t('admin.creditLoadError', 'Kredi yüklenirken bir hata oluştu'));
    }
  };

  const handleDeductCredits = async () => {
    const amount = parseFloat(deductAmount);
    if (!amount || amount <= 0) {
      Alert.alert(t('common.error'), t('validation.enterValidAmount'));
      return;
    }

    const qrCode = selectedWalletType === 'ieu' ? user?.ieuQrCode : user?.nikiQrCode;
    if (!qrCode) {
      Alert.alert(t('common.error'), t('admin.qrCodeNotFound'));
      return;
    }

    const walletName = selectedWalletType === 'ieu' ? 'IUE' : 'Niki';

    try {
      // Use processPayment as a deduction mechanism
      const result = await walletService.processPayment({
        qrCode: qrCode,
        amount: amount,
        useDiscount: false, // Deduct exact amount
        description: t('admin.creditDeductedDesc', { wallet: walletName, amount: amount }),
      });

      if (selectedWalletType === 'ieu') {
        setUser((prev) => prev ? { ...prev, ieuCredits: parseFloat(result.newBalance) } : null);
      } else {
        setUser((prev) => prev ? { ...prev, nikiCredits: parseFloat(result.newBalance) } : null);
      }
      setShowDeductModal(false);
      setDeductAmount('');
      Alert.alert(t('common.success'), t('admin.creditDeductedSuccess', { amount: amount }));
    } catch (error: any) {
      console.error('Failed to deduct credits:', error);
      Alert.alert(t('common.error'), error.response?.data?.message || t('admin.deductError'));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.text }}>{t('admin.userNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: colors.card }, Shadows.md]}>
          <View style={[styles.avatar, { backgroundColor: isDark ? '#444444' : colors.primary }]}>
            <Text style={styles.avatarText}>
              {user.firstName[0]}{user.lastName[0]}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: user.isActive ? colors.success + '20' : colors.error + '20' }]}>
              <Text style={[styles.badgeText, { color: user.isActive ? colors.success : colors.error }]}>
                {user.isActive ? t('common.active') : t('common.inactive')}
              </Text>
            </View>

            <View style={[styles.badge, { backgroundColor: user.role === 'customer' ? colors.primary + '20' : (isDark ? '#333333' : '#E0E0E0') }]}>
              <Ionicons
                name={user.role === 'customer' ? 'person-circle' : (user.role === 'admin' ? 'build' : 'shield-checkmark')}
                size={14}
                color={user.role === 'customer' ? colors.primary : colors.text}
              />
              <Text style={[styles.badgeText, { color: user.role === 'customer' ? colors.primary : colors.text }]}>
                {t(`admin.role_${user.role}`)}
              </Text>
            </View>

          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={[styles.statValue, { color: colors.text }]}>{user.loyaltyPoints}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('common.points')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <Ionicons name="school" size={24} color="#D97706" />
            <Text style={[styles.statValue, { color: colors.text }]}>₺{(user.ieuCredits || 0).toFixed(0)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('admin.iueCredits')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <Ionicons name="wallet" size={24} color="#2D2D2D" />
            <Text style={[styles.statValue, { color: colors.text }]}>₺{(user.nikiCredits || 0).toFixed(0)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('admin.nikiCredits')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <Ionicons name="receipt" size={24} color="#2196F3" />
            <Text style={[styles.statValue, { color: colors.text }]}>{user.totalOrders}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('admin.orders')}</Text>
          </View>
        </View>

        {/* Info Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('admin.info')}</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('profile.phone')}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{formatPhoneNumber(user.phone)}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('admin.ieuQr')}</Text>
            <Text style={[styles.infoValue, { color: colors.text }, styles.qrCodeText]}>{user.ieuQrCode || '-'}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('admin.nikiQr')}</Text>
            <Text style={[styles.infoValue, { color: colors.text }, styles.qrCodeText]}>{user.nikiQrCode || '-'}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('admin.registrationDate')}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{new Date(user.createdAt).toLocaleDateString('tr-TR')}</Text>
          </View>
        </View>

        {/* Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('admin.actions')}</Text>

        {/* Row 1: Add Points, Add Credits, Remove Credits */}
        <View style={styles.actionsGrid}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: '#4CAF50', flex: 1 }]}
            onPress={() => setShowPointsModal(true)}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>{t('admin.addPoints')}</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: '#2196F3', flex: 1 }]}
            onPress={() => setShowCreditsModal(true)}
          >
            <Ionicons name="wallet" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>{t('admin.addCredits')}</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.error, flex: 1 }]}
            onPress={() => setShowDeductModal(true)}
          >
            <Ionicons name="remove-circle" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>{t('admin.deductCredits')}</Text>
          </Pressable>
        </View>

        <View style={styles.actionsGrid}>
          <Pressable
            style={[styles.statusButton, { backgroundColor: '#FF9800' + '15', flex: 1, marginBottom: 0 }]}
            onPress={() => setShowRoleModal(true)}
          >
            <Ionicons
              name="shield-checkmark"
              size={20}
              color="#FF9800"
            />
            <Text style={[styles.statusButtonText, { color: '#FF9800' }]}>
              {t('admin.changeRole')}
            </Text>
          </Pressable>
        </View>



        {/* IEU Wallet Toggle */}
        <Pressable
          style={[styles.statusButton, { backgroundColor: user.ieuWalletActive ? colors.error + '15' : colors.success + '15', marginBottom: RSpacing.sm }]}
          onPress={handleToggleIeuWallet}
        >
          <Ionicons
            name={user.ieuWalletActive ? 'wallet' : 'wallet-outline'}
            size={20}
            color={user.ieuWalletActive ? colors.error : colors.success}
          />
          <Text style={[styles.statusButtonText, { color: user.ieuWalletActive ? colors.error : colors.success }]}>
            {user.ieuWalletActive ? t('admin.deactivateIeuWallet') : t('admin.activateIeuWallet')}
          </Text>
        </Pressable>

        {/* Negative Balance Toggle */}
        <Pressable
          style={[styles.statusButton, { backgroundColor: '#9C27B0' + '15', marginBottom: RSpacing.sm }]}
          onPress={() => setShowNegativeModal(true)}
        >
          <Ionicons
            name="trending-down"
            size={20}
            color="#9C27B0"
          />
          <Text style={[styles.statusButtonText, { color: '#9C27B0' }]}>
            {t('admin.negativeBalance')}
          </Text>
        </Pressable>

        {/* Row 3: User Active Toggle */}
        <Pressable
          style={[styles.statusButton, { backgroundColor: user.isActive ? colors.error + '15' : colors.success + '15' }]}
          onPress={handleToggleStatus}
        >
          <Ionicons
            name={user.isActive ? 'close-circle' : 'checkmark-circle'}
            size={20}
            color={user.isActive ? colors.error : colors.success}
          />
          <Text style={[styles.statusButtonText, { color: user.isActive ? colors.error : colors.success }]}>
            {user.isActive ? t('admin.deactivateUser') : t('admin.activateUser')}
          </Text>
        </Pressable>

      </ScrollView>

      {/* Add Points Modal */}
      <Modal visible={showPointsModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('admin.addPoints')}</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
              value={pointsAmount}
              onChangeText={setPointsAmount}
              keyboardType="number-pad"
              placeholder={t('admin.pointsAmount')}
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalCancelButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => {
                  setShowPointsModal(false);
                  setPointsAmount('');
                }}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={[styles.modalConfirmButton, { backgroundColor: '#4CAF50' }]} onPress={handleAddPoints}>
                <Text style={styles.modalConfirmText}>{t('common.add')}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Credits Modal */}
      <Modal visible={showCreditsModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('admin.addCredits')}</Text>
            <Text style={[styles.walletSelectLabel, { color: colors.textSecondary }]}>{t('selectWallet')}</Text>
            <View style={styles.walletSelectRow}>
              <Pressable
                style={[
                  styles.walletSelectButton,
                  { backgroundColor: selectedWalletType === 'ieu' ? '#D97706' : colors.backgroundSecondary }
                ]}
                onPress={() => setSelectedWalletType('ieu')}
              >
                <Ionicons name="school" size={20} color={selectedWalletType === 'ieu' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.walletSelectText, { color: selectedWalletType === 'ieu' ? '#FFFFFF' : colors.text }]}>IUE</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.walletSelectButton,
                  { backgroundColor: selectedWalletType === 'niki' ? '#2D2D2D' : colors.backgroundSecondary }
                ]}
                onPress={() => setSelectedWalletType('niki')}
              >
                <Ionicons name="wallet" size={20} color={selectedWalletType === 'niki' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.walletSelectText, { color: selectedWalletType === 'niki' ? '#FFFFFF' : colors.text }]}>Niki</Text>
              </Pressable>
            </View>
            <View style={[styles.creditInputContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>₺</Text>
              <TextInput
                style={[styles.creditInput, { color: colors.text }]}
                value={creditsAmount}
                onChangeText={(text) => setCreditsAmount(text.replace(',', '.'))}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalCancelButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => {
                  setShowCreditsModal(false);
                  setCreditsAmount('');
                }}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalConfirmButton,
                  { backgroundColor: selectedWalletType === 'ieu' ? '#D97706' : '#2D2D2D' }
                ]}
                onPress={handleAddCredits}
              >
                <Text style={styles.modalConfirmText}>{t('common.add')}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Deduct Credits Modal */}
      <Modal visible={showDeductModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('admin.deductCreditsTitle')}</Text>
            <Text style={[styles.walletSelectLabel, { color: colors.textSecondary }]}>{t('selectWallet')}</Text>
            <View style={styles.walletSelectRow}>
              <Pressable
                style={[
                  styles.walletSelectButton,
                  { backgroundColor: selectedWalletType === 'ieu' ? '#D97706' : colors.backgroundSecondary }
                ]}
                onPress={() => setSelectedWalletType('ieu')}
              >
                <Ionicons name="school" size={20} color={selectedWalletType === 'ieu' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.walletSelectText, { color: selectedWalletType === 'ieu' ? '#FFFFFF' : colors.text }]}>{t('admin.walletIeu')}</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.walletSelectButton,
                  { backgroundColor: selectedWalletType === 'niki' ? '#2D2D2D' : colors.backgroundSecondary }
                ]}
                onPress={() => setSelectedWalletType('niki')}
              >
                <Ionicons name="wallet" size={20} color={selectedWalletType === 'niki' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.walletSelectText, { color: selectedWalletType === 'niki' ? '#FFFFFF' : colors.text }]}>{t('admin.walletNiki')}</Text>
              </Pressable>
            </View>
            <View style={[styles.creditInputContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>₺</Text>
              <TextInput
                style={[styles.creditInput, { color: colors.text }]}
                value={deductAmount}
                onChangeText={(text) => setDeductAmount(text.replace(',', '.'))}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <Text style={{ color: colors.error, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
              {t('admin.cannotUndone')}
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalCancelButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => {
                  setShowDeductModal(false);
                  setDeductAmount('');
                }}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalConfirmButton,
                  { backgroundColor: colors.error }
                ]}
                onPress={handleDeductCredits}
              >
                <Text style={styles.modalConfirmText}>{t('common.delete')}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Negative Balance Modal - Same structure as Kredi Ekle */}
      <Modal visible={showNegativeModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('admin.negativeBalance')}
            </Text>
            <Text style={[styles.walletSelectLabel, { color: colors.textSecondary }]}>{t('selectWallet')}</Text>
            <View style={styles.walletSelectRow}>
              <Pressable
                style={[
                  styles.walletSelectButton,
                  { backgroundColor: selectedWalletType === 'ieu' ? '#D97706' : colors.backgroundSecondary }
                ]}
                onPress={() => setSelectedWalletType('ieu')}
              >
                <Ionicons name="school" size={20} color={selectedWalletType === 'ieu' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.walletSelectText, { color: selectedWalletType === 'ieu' ? '#FFFFFF' : colors.text }]}>IUE</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.walletSelectButton,
                  { backgroundColor: selectedWalletType === 'niki' ? '#2D2D2D' : colors.backgroundSecondary }
                ]}
                onPress={() => setSelectedWalletType('niki')}
              >
                <Ionicons name="wallet" size={20} color={selectedWalletType === 'niki' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.walletSelectText, { color: selectedWalletType === 'niki' ? '#FFFFFF' : colors.text }]}>Niki</Text>
              </Pressable>
            </View>

            {/* Current Limit Display */}
            <View style={[styles.currentLimitBox, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.currentLimitLabel, { color: colors.textSecondary }]}>
                {t('admin.currentLimit')}:
              </Text>
              <Text style={[styles.currentLimitValue, { color: selectedWalletType === 'ieu' ? '#D97706' : colors.text }]}>
                {selectedWalletType === 'ieu'
                  ? (user?.ieuAllowNegative ? `-${user?.ieuNegativeLimit} TL` : t('admin.noLimit'))
                  : (user?.nikiAllowNegative ? `-${user?.nikiNegativeLimit} TL` : t('admin.noLimit'))
                }
              </Text>
            </View>

            <View style={[styles.creditInputContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>₺</Text>
              <TextInput
                style={[styles.creditInput, { color: colors.text }]}
                value={negativeLimit}
                onChangeText={(text) => setNegativeLimit(text.replace(',', '.'))}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
              {t('admin.negativeLimitHint')}
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalCancelButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => {
                  setShowNegativeModal(false);
                  setNegativeLimit('');
                }}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalConfirmButton,
                  { backgroundColor: selectedWalletType === 'ieu' ? '#D97706' : '#2D2D2D' }
                ]}
                onPress={async () => {
                  if (!user) return;
                  const limit = parseFloat(negativeLimit);
                  if (isNaN(limit) || limit < 0) {
                    Alert.alert(t('common.error'), t('admin.invalidLimit'));
                    return;
                  }
                  try {
                    await adminToggleNegativeBalance(
                      user.id,
                      selectedWalletType.toUpperCase() as 'IEU' | 'NIKI',
                      limit > 0,
                      limit
                    );
                    Alert.alert(
                      t('common.success'),
                      limit > 0
                        ? t('admin.negativeEnabled', { wallet: selectedWalletType.toUpperCase(), limit: limit })
                        : t('admin.negativeDisabled')
                    );
                    setShowNegativeModal(false);
                    setNegativeLimit('');
                    loadUser();
                  } catch (error) {
                    console.error('Failed to toggle negative balance:', error);
                    Alert.alert(t('common.error'), t('admin.updateFailed'));
                  }
                }}
              >
                <Text style={styles.modalConfirmText}>{t('common.save')}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Role Selection Modal */}
      <Modal visible={showRoleModal} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowRoleModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('admin.selectRole')}
            </Text>

            {(['customer', 'admin', 'super_admin'] as const).map((role) => (
              <Pressable
                key={role}
                style={[
                  styles.roleOption,
                  {
                    backgroundColor: user?.role === role ? colors.primary + '20' : colors.backgroundSecondary,
                    borderColor: user?.role === role ? colors.primary : 'transparent',
                    borderWidth: 1
                  }
                ]}
                onPress={async () => {
                  if (!user) return;
                  if (user.role === role) {
                    setShowRoleModal(false);
                    return;
                  }

                  try {
                    console.log(`[Admin] Updating role for user ${user.id} to ${role}`);
                    await adminUpdateUser(user.id, { role });
                    console.log(`[Admin] Role updated successfully for user ${user.id}`);
                    setUser(prev => prev ? { ...prev, role } : null);
                    Alert.alert(t('common.success'), t('admin.roleUpdated'));
                    setShowRoleModal(false);
                  } catch (error) {
                    console.error('Failed to update role:', error);
                    Alert.alert(t('common.error'), t('admin.updateFailed'));
                  }
                }}
              >
                <View style={[
                  styles.roleIconContainer,
                  { backgroundColor: isDark ? '#333333' : '#E0E0E0' }
                ]}>
                  <Ionicons
                    name={role === 'customer' ? 'person-circle' : (role === 'admin' ? 'build' : 'shield-checkmark')}
                    size={24}
                    color={colors.text}
                  />
                </View>
                <Text style={[styles.roleOptionText, { color: colors.text }]}>
                  {t(`admin.role_${role}`)}
                </Text>
                {user?.role === role && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </Pressable>
            ))}

            <View style={[styles.modalActions, { marginTop: RSpacing.lg }]}>
              <Pressable
                style={[styles.modalCancelButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => setShowRoleModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>{t('common.close')}</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
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
  userCard: {
    padding: RSpacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginBottom: RSpacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RSpacing.md,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: RFontSizes.xxl,
    fontWeight: '700',
  },
  userName: {
    fontSize: RFontSizes.xl,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: RFontSizes.md,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: RSpacing.sm,
    marginTop: RSpacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: RSpacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: RFontSizes.xs,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: RSpacing.sm,
    marginBottom: RSpacing.lg,
  },
  statCard: {
    width: '48%',
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: RFontSizes.xl,
    fontWeight: '700',
    marginTop: RSpacing.xs,
  },
  statLabel: {
    fontSize: RFontSizes.xs,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: RFontSizes.lg,
    fontWeight: '700',
    marginTop: RSpacing.xl,
    marginBottom: RSpacing.md,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: RSpacing.sm,
  },
  roleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RSpacing.md,
  },
  roleOptionText: {
    flex: 1,
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: RSpacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: RSpacing.md,
  },
  infoLabel: {
    fontSize: RFontSizes.md,
  },
  infoValue: {
    fontSize: RFontSizes.md,
    fontWeight: '500',
  },
  qrCodeText: {
    fontSize: RFontSizes.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  infoDivider: {
    height: 1,
    marginHorizontal: RSpacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: RSpacing.sm,
    marginBottom: RSpacing.md,
  },
  walletSelectLabel: {
    fontSize: RFontSizes.sm,
    marginBottom: RSpacing.sm,
  },
  walletSelectRow: {
    flexDirection: 'row',
    gap: RSpacing.sm,
    marginBottom: RSpacing.lg,
  },
  walletSelectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RSpacing.xs,
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
  },
  walletSelectText: {
    fontSize: RFontSizes.sm,
    fontWeight: '600',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: RFontSizes.sm,
    fontWeight: '600',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RSpacing.sm,
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
  },
  statusButtonText: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: RSpacing.lg,
  },
  modalContent: {
    padding: RSpacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: RFontSizes.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: RSpacing.lg,
    width: '100%',
  },
  modalInput: {
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    fontSize: RFontSizes.lg,
    textAlign: 'center',
    width: '100%',
  },
  creditInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: RSpacing.md,
    width: '100%',
  },
  currencySymbol: {
    fontSize: RFontSizes.xl,
    fontWeight: '500',
  },
  creditInput: {
    flex: 1,
    padding: RSpacing.md,
    fontSize: RFontSizes.xl,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: RSpacing.md,
    marginTop: RSpacing.xl,
    width: '100%',
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
  modalConfirmButton: {
    flex: 1,
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  // Negative balance modal styles
  modalDescription: {
    fontSize: RFontSizes.sm,
    textAlign: 'center',
    marginBottom: RSpacing.lg,
  },
  walletTypeRow: {
    flexDirection: 'row',
    gap: RSpacing.md,
    marginBottom: RSpacing.lg,
    width: '100%',
  },
  walletTypeButton: {
    flex: 1,
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  walletTypeText: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: RSpacing.md,
    marginTop: RSpacing.lg,
    width: '100%',
  },
  // Current limit display styles
  currentLimitBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: RSpacing.md,
    width: '100%',
  },
  currentLimitLabel: {
    fontSize: RFontSizes.sm,
  },
  currentLimitValue: {
    fontSize: RFontSizes.lg,
    fontWeight: '700',
  },
});
