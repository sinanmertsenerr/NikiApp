import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Animated,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuthStore } from '../../src/stores/authStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, IconSizes, isSmallDevice } from '../../src/constants/theme';
import { walletService, Transaction } from '../../src/services/walletService';
import { socketService, BalanceUpdateEvent } from '../../src/services/socketService';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import { ErrorState } from '../../src/components/ErrorState';

// Card images
const nikiCardImage = require('../../assets/images/niki-card.png');
const iueCardImage = require('../../assets/images/iue-card.png');

export default function WalletScreen() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme } = useSettingsStore();
  const [qrModalVisible, setQrModalVisible] = useState(false);
  // Default to NIKI since IEU may be inactive
  const [selectedWallet, setSelectedWallet] = useState<'ieu' | 'niki'>('niki');

  // Payment success notification state
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState<BalanceUpdateEvent | null>(null);

  // Animation for success overlay
  const successScaleAnim = useRef(new Animated.Value(0)).current;
  const successOpacityAnim = useRef(new Animated.Value(0)).current;
  // Entrance animation for the QR card overlay (replaces the flaky RN Modal,
  // whose slide content failed to render on web — only the backdrop showed).
  const qrAnim = useRef(new Animated.Value(0)).current;

  // Close success modal handler
  const closeSuccessModal = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(successScaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setQrModalVisible(false);
      setPaymentSuccess(false);
      setPaymentData(null);
      // Reset animations
      successScaleAnim.setValue(0);
      successOpacityAnim.setValue(0);
    });
  };

  // Listen for balance updates when QR modal is open
  useEffect(() => {
    if (!qrModalVisible) return;

    const handleBalanceUpdate = (data: BalanceUpdateEvent) => {
      console.log('[Wallet] Balance update received while QR modal open:', data);

      // Show success notification
      setPaymentData(data);
      setPaymentSuccess(true);

      // Animate success overlay in
      Animated.parallel([
        Animated.spring(successScaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    };

    socketService.onBalanceUpdate(handleBalanceUpdate);

    return () => {
      socketService.offBalanceUpdate(handleBalanceUpdate);
    };
  }, [qrModalVisible, successScaleAnim, successOpacityAnim]);

  // Animate the QR card in when the overlay opens.
  useEffect(() => {
    if (qrModalVisible) {
      qrAnim.setValue(0);
      Animated.spring(qrAnim, { toValue: 1, tension: 65, friction: 9, useNativeDriver: true }).start();
    }
  }, [qrModalVisible, qrAnim]);

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  // Wallet configurations
  const wallets = {
    ieu: {
      id: 'ieu',
      name: i18n.language === 'tr' ? 'İEÜ Cüzdan' : 'IUE Wallet',
      color: '#D97706', // Warm amber/orange - softer on eyes
      qrPrefix: 'IEU',
      discountRate: 15,
      creditsName: i18n.language === 'tr' ? 'IUE Credits' : 'IUE Credits',
    },
    niki: {
      id: 'niki',
      name: i18n.language === 'tr' ? 'Niki Cüzdan' : 'Niki Wallet',
      color: isDark ? '#333333' : '#2D2D2D', // Gray
      qrPrefix: 'NIKI',
      discountRate: 10,
      creditsName: i18n.language === 'tr' ? 'Niki Credits' : 'Niki Credits',
    },
  };

  const currentWallet = wallets[selectedWallet];

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Fetch wallet data
  const {
    data: walletData,
    isLoading: walletLoading,
    refetch: refetchWallet,
    isError: walletError,
    error: walletErrorObj,
  } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const data = await walletService.getMyWallet();
      return data || null;
    },
    enabled: isAuthenticated,
  });



  // Fetch transactions
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
    isError: transactionsError,
  } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const data = await walletService.getMyTransactions({ limit: 10 });
      return data || { transactions: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    },
    enabled: isAuthenticated,
  });

  // Auto-switch wallet based on IEU active status
  useEffect(() => {
    const ieuActive = walletData?.ieuWallet?.isActive ?? false;
    // If user is viewing IEU but it became inactive, switch to NIKI
    if (selectedWallet === 'ieu' && !ieuActive) {
      setSelectedWallet('niki');
    }
  }, [walletData?.ieuWallet?.isActive, selectedWallet]);

  const onRefresh = async () => {
    await Promise.all([refetchWallet(), refetchTransactions()]);
  };

  const isLoading = walletLoading || transactionsLoading;

  const activeWalletData = selectedWallet === 'ieu'
    ? walletData?.ieuWallet
    : walletData?.nikiWallet;

  // Check if IEU wallet is active (from backend, updated via socket)
  const isIeuActive = walletData?.ieuWallet?.isActive ?? false;

  const balance = parseFloat(activeWalletData?.balance || '0');
  const qrCode = activeWalletData?.qrCode || `${currentWallet.qrPrefix}-${user?.id?.substring(0, 8).toUpperCase() || 'USER'}-XXXX`;

  // Filter transactions by wallet type
  const allTransactions = transactionsData?.transactions || [];
  const transactions = allTransactions.filter(tx => {
    // If transaction has walletType, filter by it
    if (tx.walletType) {
      return tx.walletType === (selectedWallet === 'ieu' ? 'IEU' : 'NIKI');
    }
    // Legacy transactions (before dual wallet) show in IEU wallet
    return selectedWallet === 'ieu';
  });

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateCardTransition = (direction: 'prev' | 'next') => {
    const slideDirection = direction === 'next' ? -1 : 1;

    // Animate out
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: slideDirection * 30,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Switch wallet
      setSelectedWallet(selectedWallet === 'ieu' ? 'niki' : 'ieu');

      // Reset position for slide in from opposite direction
      slideAnim.setValue(-slideDirection * 30);

      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleArrowPress = (direction: 'prev' | 'next') => {
    // Only allow switching if IEU is active
    if (!isIeuActive) return;
    animateCardTransition(direction);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'top_up': return 'arrow-down';
      case 'payment': return 'arrow-up';
      case 'refund': return 'refresh';
      case 'reward': return 'gift';
      default: return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (type === 'payment') return colors.error;
    if (amount > 0) return colors.success;
    return colors.text;
  };

  if (walletLoading && !walletData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (walletError && !walletData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ErrorState error={walletErrorObj} onRetry={() => refetchWallet()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{currentWallet.name}</Text>
        </View>

        {/* Wallet Selector with Arrows */}
        <View style={styles.walletSelectorContainer}>
          {/* Left Arrow */}
          {isIeuActive && (
            <Pressable
              style={styles.walletArrow}
              onPress={() => handleArrowPress('prev')}
              accessibilityRole="button"
              accessibilityLabel="Önceki cüzdan"
            >
              <Ionicons name="chevron-back" size={32} color={colors.text} />
            </Pressable>
          )}

          {/* Balance Card - Animated */}
          <Animated.View
            style={[
              styles.balanceCardWrapper,
              Shadows.lg,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateX: slideAnim },
                ],
                opacity: opacityAnim,
              }
            ]}
          >
            {selectedWallet === 'niki' ? (
              <ImageBackground
                source={nikiCardImage}
                style={styles.balanceCardImage}
                imageStyle={styles.cardImageStyle}
                resizeMode="cover"
                accessible={false}
              >
                {/* Futuristic shine overlay */}
                <LinearGradient
                  colors={['rgba(255,255,255,0.15)', 'transparent', 'transparent', 'rgba(255,255,255,0.08)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.shineOverlay}
                />
                <View style={styles.balanceOverlay}>
                  <Text style={styles.balanceAmountLight}>₺{balance.toFixed(2)}</Text>
                </View>
              </ImageBackground>
            ) : (
              <ImageBackground
                source={iueCardImage}
                style={styles.balanceCardImage}
                imageStyle={styles.cardImageStyle}
                resizeMode="cover"
                accessible={false}
              >
                {/* Futuristic shine overlay */}
                <LinearGradient
                  colors={['rgba(255,215,0,0.1)', 'transparent', 'transparent', 'rgba(255,215,0,0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.shineOverlay}
                />
                <View style={styles.balanceOverlay}>
                  <Text style={styles.balanceAmountLight}>₺{balance.toFixed(2)}</Text>
                </View>
              </ImageBackground>
            )}
          </Animated.View>

          {/* Right Arrow */}
          {isIeuActive && (
            <Pressable
              style={styles.walletArrow}
              onPress={() => handleArrowPress('next')}
              accessibilityRole="button"
              accessibilityLabel="Sonraki cüzdan"
            >
              <Ionicons name="chevron-forward" size={32} color={colors.text} />
            </Pressable>
          )}
        </View>

        {/* Wallet Indicator Dots */}
        {isIeuActive && (
          <View style={styles.walletIndicator}>
            <View style={[styles.indicatorDot, selectedWallet === 'ieu' && styles.indicatorDotActive, selectedWallet === 'ieu' && { backgroundColor: '#D97706' }]} />
            <View style={[styles.indicatorDot, selectedWallet === 'niki' && styles.indicatorDotActive, selectedWallet === 'niki' && { backgroundColor: colors.text }]} />
          </View>
        )}

        {/* Action Buttons - Outside Card */}
        <View style={styles.actionButtonsRow}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={() => setQrModalVisible(true)}
          >
            <Ionicons name="qr-code" size={24} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>{t('wallet.showQR')}</Text>
          </Pressable>

          {selectedWallet === 'niki' && (
            <Pressable style={[styles.actionButton, { backgroundColor: colors.card }]}>
              <Ionicons name="add-circle" size={24} color={colors.text} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>{t('wallet.topUp')}</Text>
            </Pressable>
          )}
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {i18n.language === 'tr'
              ? `${currentWallet.creditsName} ile ödeme yaptığınızda %${currentWallet.discountRate} indirim kazanın!`
              : `Get ${currentWallet.discountRate}% discount when you pay with ${currentWallet.creditsName}!`}
          </Text>
        </View>

        {/* Transactions */}
        <View style={styles.transactionsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('wallet.transactions')}
          </Text>
          {transactions.length > 5 && (
            <Pressable onPress={() => router.push({ pathname: '/(screens)/transactions', params: { walletType: selectedWallet } } as any)}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>{t('wallet.seeAll')}</Text>
            </Pressable>
          )}
        </View>

        {
          transactions.length > 0 ? (
            transactions.slice(0, 5).map((transaction) => (
              <View
                key={transaction.id}
                style={[styles.transactionItem, { backgroundColor: colors.card }, Shadows.sm]}
              >
                <View
                  style={[
                    styles.transactionIcon,
                    {
                      backgroundColor: `${getTransactionColor(transaction.type, transaction.amount)}20`,
                    },
                  ]}
                >
                  <Ionicons
                    name={getTransactionIcon(transaction.type) as any}
                    size={20}
                    color={getTransactionColor(transaction.type, transaction.amount)}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionDesc, { color: colors.text }]}>
                    {(() => {
                      const desc = transaction.description;
                      // Handle "Top up" / "Top Up" case-insensitively
                      if (desc && desc.toLowerCase() === 'top up') {
                        return t('wallet.topUp');
                      }
                      // Handle "Payment" - translate all payment variants
                      if (desc && (desc.toLowerCase().startsWith('payment') || desc === 'Payment')) {
                        return t('wallet.payment');
                      }
                      // Handle raw translation key fallback (if previously saved incorrectly)
                      if (desc === 'admin.creditLoadedDesc') {
                        return t('admin.creditLoadedDesc', { amount: transaction.amount });
                      }

                      // Parse English format "X TL credits loaded by Admin" to localized text
                      if (desc?.includes('credits loaded by Admin')) {
                        const match = desc.match(/(\d+(?:[.,]?\d+)?) TL credits loaded/);
                        if (match && match[1]) {
                          return t('admin.creditLoadedDesc', {
                            amount: match[1],
                            wallet: transaction.walletType === 'NIKI' ? 'Niki' : 'IEU'
                          });
                        }
                      }

                      // Parse Turkish format "Admin tarafından X TL kredi yüklendi" 
                      if (desc?.includes('kredi yüklendi')) {
                        const match = desc.match(/Admin tarafından (\d+(?:[.,]\d+)?) TL/);
                        if (match && match[1]) {
                          return t('admin.creditLoadedDesc', {
                            amount: match[1],
                            wallet: transaction.walletType === 'NIKI' ? 'Niki' : 'IEU'
                          });
                        }
                        return desc;
                      }

                      // Parse Turkish format "Admin tarafından X cüzdanından Y TL kredi silindi"
                      if (desc?.includes('kredi silindi')) {
                        const match = desc.match(/Admin tarafından (.+?) cüzdanından (\d+(?:[.,]\d+)?) TL kredi silindi/);
                        if (match && match[1] && match[2]) {
                          return t('admin.creditDeductedDesc', { wallet: match[1], amount: match[2] });
                        }
                        return desc;
                      }

                      // Default fallback
                      return desc || t(`wallet.${transaction.type}`, transaction.type);
                    })()}
                  </Text>
                  <Text style={[styles.transactionDate, { color: colors.textTertiary }]}>
                    {formatDate(transaction.createdAt)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: getTransactionColor(transaction.type, transaction.amount) },
                  ]}>
                  {transaction.type === 'payment' ? '-' : (parseFloat(String(transaction.amount)) > 0 ? '+' : '')}₺{Math.abs(parseFloat(String(transaction.amount))).toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('wallet.noTransactions')}
              </Text>
            </View>
          )
        }
      </ScrollView >

      {/* QR Code overlay (controlled Animated overlay — not RN Modal) */}
      {qrModalVisible && (
        <Animated.View style={[styles.qrOverlay, { opacity: qrAnim }]}>
          {/* Tap the scrim to dismiss */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => (paymentSuccess ? closeSuccessModal() : setQrModalVisible(false))}
          />

          <Animated.View
            style={[
              styles.qrCard,
              { backgroundColor: colors.card },
              Shadows.lg,
              { transform: [{ scale: qrAnim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] },
            ]}
          >
            <Pressable
              style={styles.qrClose}
              onPress={() => setQrModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              hitSlop={8}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>

            {/* Wallet chip — lets staff confirm which wallet at a glance */}
            <View style={[styles.qrChip, { backgroundColor: currentWallet.color + '1A' }]}>
              <View style={[styles.qrChipDot, { backgroundColor: currentWallet.color }]} />
              <Text style={[styles.qrChipText, { color: colors.text }]}>{currentWallet.name}</Text>
            </View>

            <Text style={[styles.qrTitle, { color: colors.text }]}>{t('wallet.qrCode')}</Text>
            <Text style={[styles.qrSubtitle, { color: colors.textSecondary }]}>
              {t('wallet.showToStaff')}
            </Text>

            <View style={styles.qrPanel}>
              <QRCode
                value={qrCode}
                size={Math.round(SCREEN_WIDTH * 0.56)}
                backgroundColor="#FFFFFF"
                color="#000000"
              />
            </View>

            <View style={[styles.qrCodePill, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.qrCodeText, { color: colors.textSecondary }]}>{qrCode}</Text>
            </View>

            <Text style={[styles.qrName, { color: colors.text }]}>
              {user?.firstName} {user?.lastName}
            </Text>

            {/* Live payment result — crossfades in place over the card */}
            {paymentSuccess && paymentData && (
              <Animated.View
                style={[
                  styles.successOverlay,
                  {
                    backgroundColor: isDark ? 'rgba(18,18,18,0.97)' : 'rgba(255,255,255,0.98)',
                    opacity: successOpacityAnim,
                    transform: [{ scale: successScaleAnim }],
                  },
                ]}
              >
                <View style={[styles.successIconContainer, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                </View>

                <Text style={[styles.successTitle, { color: colors.success }]}>
                  {paymentData.transactionType === 'payment'
                    ? (i18n.language === 'tr' ? 'Ödeme Başarılı!' : 'Payment Successful!')
                    : paymentData.transactionType === 'topup'
                      ? (i18n.language === 'tr' ? 'Bakiye Yüklendi!' : 'Balance Loaded!')
                      : (i18n.language === 'tr' ? 'İade Yapıldı!' : 'Refund Completed!')}
                </Text>

                {paymentData.transactionType === 'payment' && paymentData.discountAmount && parseFloat(paymentData.discountAmount) > 0 && (
                  <View style={[styles.discountBadge, { backgroundColor: colors.success + '20' }]}>
                    <Ionicons name="pricetag" size={16} color={colors.success} />
                    <Text style={[styles.discountBadgeText, { color: colors.success }]}>
                      {i18n.language === 'tr'
                        ? `%${paymentData.discountPercentage || 0} indirim uygulandı!`
                        : `${paymentData.discountPercentage || 0}% discount applied!`}
                    </Text>
                  </View>
                )}

                <View style={styles.successAmountContainer}>
                  <Text style={[styles.successAmountLabel, { color: colors.textSecondary }]}>
                    {paymentData.transactionType === 'payment'
                      ? (i18n.language === 'tr' ? 'Ödenen Tutar' : 'Amount Paid')
                      : (i18n.language === 'tr' ? 'Yüklenen Tutar' : 'Amount Added')}
                  </Text>
                  <Text style={[
                    styles.successAmount,
                    { color: paymentData.transactionType === 'payment' ? colors.error : colors.success },
                  ]}>
                    {paymentData.transactionType === 'payment' ? '-' : '+'}₺{parseFloat(paymentData.amount).toFixed(2)}
                  </Text>
                  {paymentData.transactionType === 'payment' && paymentData.originalAmount && paymentData.discountAmount && parseFloat(paymentData.discountAmount) > 0 && (
                    <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>
                      {i18n.language === 'tr' ? 'Orijinal: ' : 'Original: '}₺{parseFloat(paymentData.originalAmount).toFixed(2)}
                    </Text>
                  )}
                </View>

                <View style={[styles.successDivider, { backgroundColor: colors.border }]} />

                <View style={styles.successBalanceContainer}>
                  <Text style={[styles.successBalanceLabel, { color: colors.textSecondary }]}>
                    {i18n.language === 'tr' ? 'Yeni Bakiye' : 'New Balance'}
                  </Text>
                  <Text style={[styles.successBalance, { color: colors.text }]}>
                    ₺{parseFloat(paymentData.newBalance).toFixed(2)}
                  </Text>
                </View>

                <Pressable
                  style={[styles.successButton, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]}
                  onPress={closeSuccessModal}
                >
                  <Text style={[styles.successButtonText, { color: isDark ? '#000000' : '#FFFFFF' }]}>
                    {i18n.language === 'tr' ? 'Tamam' : 'OK'}
                  </Text>
                </Pressable>
              </Animated.View>
            )}
          </Animated.View>
        </Animated.View>
      )}
    </SafeAreaView >
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
  walletSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RSpacing.sm,
    paddingHorizontal: RSpacing.md,
  },
  walletArrow: {
    padding: RSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: RSpacing.sm,
    marginBottom: RSpacing.md,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  indicatorDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // New card wrapper for image background
  balanceCardWrapper: {
    width: SCREEN_WIDTH - 80,
    aspectRatio: 1.586, // Credit card aspect ratio
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  balanceCardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
  },
  cardImageStyle: {
    borderRadius: BorderRadius.xl,
  },
  shineOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xl,
  },
  balanceOverlay: {
    padding: RSpacing.lg,
    paddingTop: RSpacing.md,
  },
  balanceLabelLight: {
    fontSize: RFontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: RSpacing.xs,
  },
  balanceAmountLight: {
    fontSize: isSmallDevice ? 28 : 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  balanceCardSolid: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.xl,
    padding: RSpacing.lg,
    paddingTop: RSpacing.md,
    justifyContent: 'flex-start',
  },
  // Action buttons outside card
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: RSpacing.md,
    marginBottom: RSpacing.lg,
    paddingHorizontal: RSpacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RSpacing.sm,
    paddingVertical: RSpacing.md,
    paddingHorizontal: RSpacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  actionButtonText: {
    fontSize: RFontSizes.sm,
    fontWeight: '600',
  },
  itemsCard: {
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: RSpacing.sm,
    gap: RSpacing.md,
  },
  pointsInfo: {
    flex: 1,
  },
  pointsTitle: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  pointsValue: {
    fontSize: RFontSizes.sm,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: RSpacing.lg,
    gap: RSpacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: RFontSizes.sm,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RSpacing.md,
  },
  sectionTitle: {
    fontSize: RFontSizes.xl,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: RFontSizes.md,
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: RSpacing.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RSpacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: RFontSizes.md,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: RFontSizes.sm,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: RFontSizes.lg,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: RSpacing.xxl,
    alignItems: 'center',
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
  qrOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: RSpacing.lg,
    zIndex: 1000,
  },
  qrCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: BorderRadius.xxl,
    paddingHorizontal: RSpacing.lg,
    paddingTop: RSpacing.xl,
    paddingBottom: RSpacing.lg,
    alignItems: 'center',
    overflow: 'hidden',
  },
  qrClose: {
    position: 'absolute',
    top: RSpacing.md,
    right: RSpacing.md,
    padding: RSpacing.xs,
    zIndex: 2,
  },
  qrChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RSpacing.xs,
    paddingHorizontal: RSpacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginBottom: RSpacing.md,
  },
  qrChipDot: { width: 8, height: 8, borderRadius: 4 },
  qrChipText: { fontSize: RFontSizes.sm, fontWeight: '600' },
  qrTitle: { fontSize: RFontSizes.xl, fontWeight: '700', marginBottom: 2 },
  qrSubtitle: { fontSize: RFontSizes.sm, marginBottom: RSpacing.lg, textAlign: 'center' },
  qrPanel: {
    padding: RSpacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    marginBottom: RSpacing.lg,
    ...Shadows.md,
  },
  qrCodePill: {
    paddingHorizontal: RSpacing.md,
    paddingVertical: RSpacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: RSpacing.md,
  },
  qrCodeText: {
    fontSize: RFontSizes.sm,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  qrName: {
    fontSize: RFontSizes.lg,
    fontWeight: '700',
  },
  // Payment success overlay styles
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RSpacing.xl,
    paddingVertical: RSpacing.xl,
    zIndex: 100,
  },
  successIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RSpacing.md,
  },
  successTitle: {
    fontSize: RFontSizes.xl,
    fontWeight: '700',
    marginBottom: RSpacing.lg,
    textAlign: 'center',
  },
  successAmountContainer: {
    alignItems: 'center',
    marginBottom: RSpacing.md,
  },
  successAmountLabel: {
    fontSize: RFontSizes.sm,
    marginBottom: RSpacing.xs,
  },
  successAmount: {
    fontSize: isSmallDevice ? 32 : 42,
    fontWeight: '700',
  },
  successDivider: {
    width: '60%',
    height: 1,
    marginVertical: RSpacing.md,
  },
  successBalanceContainer: {
    alignItems: 'center',
    marginBottom: RSpacing.lg,
  },
  successBalanceLabel: {
    fontSize: RFontSizes.sm,
    marginBottom: RSpacing.xs,
  },
  successBalance: {
    fontSize: RFontSizes.xxl,
    fontWeight: '600',
  },
  successHint: {
    fontSize: RFontSizes.sm,
    marginTop: RSpacing.md,
  },
  // Discount badge styles
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RSpacing.md,
    paddingVertical: RSpacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: RSpacing.lg,
    gap: RSpacing.xs,
  },
  discountBadgeText: {
    fontSize: RFontSizes.sm,
    fontWeight: '600',
  },
  originalPrice: {
    fontSize: RFontSizes.sm,
    textDecorationLine: 'line-through',
    marginTop: RSpacing.xs,
  },
  // Success modal OK button styles
  successButton: {
    paddingVertical: RSpacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: RSpacing.lg,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successButtonText: {
    fontSize: RFontSizes.lg,
    fontWeight: '700',
  },
});
