import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { Alert } from '../../src/utils/alert';
import { CameraView, useCameraPermissions } from '../../src/components/ui/nativeCamera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import { walletService, ScannedUserWallet } from '../../src/services/walletService';
import { campaignService } from '../../src/services/campaignService';
import { getErrorMessage } from '../../src/services/api';
import { WebQRScanner } from '../../src/components/ui/WebQRScanner';
import { ScannerErrorBoundary } from '../../src/components/ui/ScannerErrorBoundary';

type OperationType = 'payment' | 'topup' | null;

interface ScannedUserDisplay {
  id: string;
  fullName: string;
  email: string;
  nikiCredits: number;
  loyaltyPoints: number;
  qrCode: string;
  walletType: 'IEU' | 'NIKI';
  discountRate: number;
}

interface ScannedCampaignDisplay {
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  campaign: {
    id: string;
    title: string;
    titleTr: string;
    rewardType: string;
    rewardValue?: string;
  };
  redeemedAt: string;
}

interface TransactionResult {
  type: 'payment' | 'topup';
  user: {
    fullName: string;
    email: string;
  };
  details: {
    amount: number;
    walletType?: 'IEU' | 'NIKI';
    discountRate?: number;
    originalAmount?: number;
    discountAmount?: number;
    finalAmount?: number;
    isFullPayment?: boolean;
  };
}

const REWARD_ICONS: Record<string, string> = {
  'free_coffee': '☕',
  'discount_percent': '🏷️',
  'discount_fixed': '💰',
  'bonus_points': '⭐',
  'manual': '🎁',
};

export default function ScanQRScreen() {
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();
  const [permission, requestPermission] = useCameraPermissions();

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;
  const { t } = useTranslation();
  const { i18n } = useTranslation();

  // Installed web PWA: the scanner shows a photo-capture screen (live camera is
  // unusable in iOS standalone), so hide the live-scan frame/hint overlay there.
  const isWebStandalone =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (((window as any).matchMedia &&
      (window as any).matchMedia('(display-mode: standalone)').matches) ||
      (window.navigator as any).standalone === true);

  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scannedUser, setScannedUser] = useState<ScannedUserDisplay | null>(null);
  const [scannedCampaign, setScannedCampaign] = useState<ScannedCampaignDisplay | null>(null);
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null);

  const [operationType, setOperationType] = useState<OperationType>(null);
  const [amount, setAmount] = useState('');
  const [isFullPayment, setIsFullPayment] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isLoading) return;
    setScanned(true);
    setIsLoading(true);

    // Validate QR format
    if (data.startsWith('NIKI-') || data.startsWith('IEU-')) {
      // WALLET QR
      try {
        const result = await walletService.scanQrCode(data);
        setScannedUser({
          id: result.user.id,
          fullName: `${result.user.firstName} ${result.user.lastName}`,
          email: result.user.email,
          nikiCredits: parseFloat(result.balance) || 0,
          loyaltyPoints: result.loyaltyPoints?.availablePoints || 0,
          qrCode: result.qrCode,
          walletType: result.walletType,
          discountRate: result.discountRate,
        });
      } catch (error: any) {
        Alert.alert(t('common.error'), getErrorMessage(error), [
          { text: t('common.retry'), onPress: () => setScanned(false) },
        ]);
      } finally {
        setIsLoading(false);
      }
    } else if (data.startsWith('CAMPAIGN-')) {
      // CAMPAIGN QR
      try {
        const result = await campaignService.adminRedeemCampaignByQr(data);
        if (result.success) {
          setScannedCampaign({
            user: result.user,
            campaign: result.campaign,
            redeemedAt: result.redeemedAt,
          });
          Alert.alert(
            t('common.success'),
            t('admin.campaignRedeemedSuccess'),
            [{ text: t('common.ok') }]
          );
        }
      } catch (error: any) {
        Alert.alert(t('common.error'), getErrorMessage(error), [
          { text: t('common.retry'), onPress: () => setScanned(false) },
        ]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
      Alert.alert(t('common.error'), t('admin.invalidQrFormat'), [
        { text: t('common.retry'), onPress: () => setScanned(false) },
      ]);
    }
  };

  const calculateDiscount = () => {
    const numAmount = parseFloat(amount) || 0;
    if (isFullPayment && scannedUser) {
      const discountRate = scannedUser.discountRate / 100;
      const discount = numAmount * discountRate;
      return {
        original: numAmount,
        discount: discount,
        final: numAmount - discount,
        rate: scannedUser.discountRate,
      };
    }
    return {
      original: numAmount,
      discount: 0,
      final: numAmount,
      rate: 0,
    };
  };

  const handlePayment = async () => {
    if (!scannedUser) return;

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert(t('common.error'), t('validation.enterValidAmount'));
      return;
    }

    setIsProcessing(true);
    try {
      const result = await walletService.processPayment({
        qrCode: scannedUser.qrCode,
        amount: numAmount,
        useDiscount: isFullPayment,
      });

      const calculation = calculateDiscount();

      setTransactionResult({
        type: 'payment',
        user: {
          fullName: scannedUser.fullName,
          email: scannedUser.email,
        },
        details: {
          amount: numAmount,
          finalAmount: parseFloat(result.chargedAmount), // Use backend result
          originalAmount: calculation.original,
          discountAmount: calculation.discount,
          discountRate: isFullPayment ? scannedUser.discountRate : 0,
          walletType: scannedUser.walletType,
          isFullPayment: isFullPayment,
        }
      });

    } catch (error: any) {
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTopup = async () => {
    if (!scannedUser) return;

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert(t('common.error'), t('validation.enterValidAmount'));
      return;
    }

    setIsProcessing(true);
    try {
      await walletService.topUp({
        qrCode: scannedUser.qrCode,
        amount: numAmount,
      });

      setTransactionResult({
        type: 'topup',
        user: {
          fullName: scannedUser.fullName,
          email: scannedUser.email,
        },
        details: {
          amount: numAmount,
          walletType: scannedUser.walletType,
        }
      });

    } catch (error: any) {
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setScanned(false);
    setScannedUser(null);
    setScannedCampaign(null);
    setTransactionResult(null);
    setOperationType(null);
    setAmount('');
    setIsFullPayment(true);
  };

  if (Platform.OS !== 'web' && !permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (Platform.OS !== 'web' && !permission?.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>{t('admin.cameraPermission')}</Text>
          <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
            {t('admin.cameraPermissionDesc')}
          </Text>
          <Pressable
            style={[styles.permissionButton, { backgroundColor: isDark ? '#444444' : colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>{t('admin.grantPermission')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {!scannedUser && !scannedCampaign && !transactionResult ? (
        // Camera View
        <>
          {Platform.OS === 'web' ? (
            <ScannerErrorBoundary>
              <View style={StyleSheet.absoluteFillObject}>
                <WebQRScanner
                  onScan={(text) => {
                    if (scanned) return;
                    handleBarCodeScanned({ data: text });
                  }}
                  onError={() => {}}
                />
              </View>
            </ScannerErrorBoundary>
          ) : (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
          )}
          {!isWebStandalone && (
            <View style={styles.overlay} pointerEvents="none">
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              {isLoading ? (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.loadingText}>{t('common.loading')}</Text>
                </View>
              ) : (
                <Text style={styles.scanText}>{t('admin.scanQrHint')}</Text>
              )}
            </View>
          )}
        </>
      ) : scannedUser && !transactionResult ? (
        // User Found - Operation Selection
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.userContainer}>
                {/* User Info Card */}
                <View style={[styles.userCard, { backgroundColor: colors.card }, Shadows.md]}>
                  <View style={[styles.userAvatar, { backgroundColor: isDark ? '#444444' : colors.primary }]}>
                    <Text style={styles.userAvatarText}>
                      {scannedUser.fullName.split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </View>
                  <Text style={[styles.userName, { color: colors.text }]}>{scannedUser.fullName}</Text>
                  <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{scannedUser.email}</Text>
                  <View style={styles.userStats}>
                    <View style={styles.userStat}>
                      <Text style={[styles.userStatValue, { color: scannedUser.walletType === 'IEU' ? '#D97706' : '#2D2D2D' }]}>
                        ₺{(scannedUser.nikiCredits || 0).toFixed(2)}
                      </Text>
                      <Text style={[styles.userStatLabel, { color: colors.textSecondary }]}>
                        {scannedUser.walletType === 'IEU' ? t('admin.iueCredits') : t('admin.nikiCredits')}
                      </Text>
                    </View>
                    <View style={[styles.userStatDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.userStat}>
                      <Text style={[styles.userStatValue, { color: colors.text }]}>{scannedUser.loyaltyPoints}</Text>
                      <Text style={[styles.userStatLabel, { color: colors.textSecondary }]}>{t('common.points')}</Text>
                    </View>
                  </View>
                </View>

                {/* Operation Selection */}
                {!operationType ? (
                  <View style={styles.operationButtons}>
                    <Pressable
                      style={[styles.operationButton, { backgroundColor: '#4CAF50' }]}
                      onPress={() => setOperationType('payment')}
                    >
                      <Ionicons name="card-outline" size={32} color="#FFFFFF" />
                      <Text style={styles.operationButtonText}>{t('admin.takePayment')}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.operationButton, { backgroundColor: '#2196F3' }]}
                      onPress={() => setOperationType('topup')}
                    >
                      <Ionicons name="wallet-outline" size={32} color="#FFFFFF" />
                      <Text style={styles.operationButtonText}>{t('admin.topUpBalance')}</Text>
                    </Pressable>
                  </View>
                ) : (
                  // Amount Input
                  <View style={styles.amountContainer}>
                    <Text style={[styles.amountLabel, { color: colors.text }]}>
                      {operationType === 'payment' ? t('admin.paymentAmount') : t('admin.topUpAmount')}
                    </Text>
                    <View style={[styles.amountInputContainer, { backgroundColor: colors.backgroundSecondary }]}>
                      <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>₺</Text>
                      <TextInput
                        style={[styles.amountInput, { color: colors.text }]}
                        value={amount}
                        onChangeText={(text) => setAmount(text.replace(',', '.'))}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={colors.textTertiary}
                        autoFocus
                      />
                    </View>

                    {/* Payment Options - IEU has partial, NIKI is always full payment */}
                    {operationType === 'payment' && parseFloat(amount) > 0 && scannedUser.walletType === 'IEU' && (
                      <View style={styles.paymentOptions}>
                        <Pressable
                          style={[
                            styles.paymentOption,
                            {
                              backgroundColor: isFullPayment ? '#D97706' + '20' : colors.backgroundSecondary,
                              borderColor: isFullPayment ? '#D97706' : colors.border,
                            },
                          ]}
                          onPress={() => setIsFullPayment(true)}
                        >
                          <Ionicons
                            name="wallet"
                            size={20}
                            color={isFullPayment ? '#D97706' : colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.paymentOptionText,
                              { color: isFullPayment ? '#D97706' : colors.textSecondary },
                            ]}
                          >
                            {t('admin.payWithIue')}
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[
                            styles.paymentOption,
                            {
                              backgroundColor: !isFullPayment ? colors.primary + '20' : colors.backgroundSecondary,
                              borderColor: !isFullPayment ? colors.primary : colors.border,
                            },
                          ]}
                          onPress={() => setIsFullPayment(false)}
                        >
                          <Ionicons
                            name="cash"
                            size={20}
                            color={!isFullPayment ? colors.primary : colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.paymentOptionText,
                              { color: !isFullPayment ? colors.primary : colors.textSecondary },
                            ]}
                          >
                            {t('admin.partialPayment')}
                          </Text>
                        </Pressable>
                      </View>
                    )}

                    {/* Discount Preview */}
                    {operationType === 'payment' && parseFloat(amount) > 0 && isFullPayment && (
                      <View style={[styles.discountPreview, { backgroundColor: colors.success + '15' }]}>
                        <View style={styles.discountRow}>
                          <Text style={[styles.discountLabel, { color: colors.textSecondary }]}>{t('admin.amount')}:</Text>
                          <Text style={[styles.discountValue, { color: colors.text }]}>
                            ₺{calculateDiscount().original.toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.discountRow}>
                          <Text style={[styles.discountLabel, { color: colors.success }]}>
                            {t('admin.discountLabel')} (%{calculateDiscount().rate}):
                          </Text>
                          <Text style={[styles.discountValue, { color: colors.success }]}>
                            -₺{calculateDiscount().discount.toFixed(2)}
                          </Text>
                        </View>
                        <View style={[styles.discountDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.discountRow}>
                          <Text style={[styles.discountLabel, styles.finalLabel, { color: colors.text }]}>
                            {t('admin.toPay')}:
                          </Text>
                          <Text style={[styles.discountValue, styles.finalValue, { color: colors.text }]}>
                            ₺{calculateDiscount().final.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <Pressable
                        style={[styles.cancelButton, { backgroundColor: colors.backgroundSecondary }]}
                        onPress={() => {
                          setOperationType(null);
                          setAmount('');
                        }}
                      >
                        <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.confirmButton,
                          {
                            backgroundColor: operationType === 'payment' ? '#4CAF50' : '#2196F3',
                            opacity: parseFloat(amount) > 0 ? 1 : 0.5,
                          },
                        ]}
                        onPress={operationType === 'payment' ? handlePayment : handleTopup}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.confirmButtonText}>
                            {operationType === 'payment' ? t('admin.takePayment') : t('wallet.topUp')}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Cancel Button */}
                <Pressable style={styles.resetButton} onPress={resetState}>
                  <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                  <Text style={[styles.resetButtonText, { color: colors.error }]}>{t('admin.cancelOperation')}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      ) : transactionResult ? (
        // Wallet Transaction Success UI (New)
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.userContainer}>
              <View style={[styles.userCard, { backgroundColor: colors.card }, Shadows.md]}>
                <Ionicons name="checkmark-circle" size={64} color={colors.success} style={{ marginBottom: 16 }} />
                <Text style={[styles.userName, { color: colors.success, marginBottom: 8, textAlign: 'center' }]}>
                  {transactionResult.type === 'payment' ? t('admin.paymentReceivedSuccess') : t('admin.topUpReceivedSuccess')}
                </Text>

                {/* User Info */}
                <Text style={[styles.userStatLabel, { color: colors.textSecondary, marginTop: 16 }]}>
                  {t('common.user')}
                </Text>
                <Text style={[styles.amountLabel, { color: colors.text, textAlign: 'center' }]}>
                  {transactionResult.user.fullName}
                </Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                  {transactionResult.user.email}
                </Text>

                <View style={[styles.discountDivider, { backgroundColor: colors.border, width: '100%', marginVertical: 16 }]} />

                {/* Transaction Info */}
                {transactionResult.type === 'topup' ? (
                  // Top Up Details
                  <>
                    <Text style={[styles.userStatLabel, { color: colors.textSecondary }]}>
                      {t('admin.loadedAmount')}
                    </Text>
                    <Text style={[styles.amountLabel, { color: colors.text, fontSize: 32, marginTop: 4 }]}>
                      ₺{transactionResult.details.amount.toFixed(2)}
                    </Text>
                    <Text style={[styles.userStatLabel, { color: colors.textSecondary, marginTop: 16 }]}>
                      {t('admin.targetWallet')}
                    </Text>
                    <Text style={[styles.amountLabel, { color: transactionResult.details.walletType === 'IEU' ? '#D97706' : colors.text }]}>
                      {transactionResult.details.walletType === 'IEU' ? t('admin.walletIeu') : t('admin.walletNiki')}
                    </Text>
                  </>
                ) : (
                  // Payment Details
                  <>
                    <View style={styles.receiptContainer}>
                      {/* Row: Payment Method / Wallet */}
                      <View style={styles.receiptRow}>
                        <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>{t('admin.paymentMethod')}</Text>
                        <Text style={[styles.receiptValue, { color: colors.text }]}>
                          {!transactionResult.details.isFullPayment
                            ? `${t('admin.partialPayment')} (${transactionResult.details.walletType === 'IEU' ? t('admin.walletIeu') : t('admin.walletNiki')})`
                            : (transactionResult.details.walletType === 'IEU' ? t('admin.walletIeu') : t('admin.walletNiki'))
                          }
                        </Text>
                      </View>
                      {/* Row: Original Amount (if discounted) */}
                      {(transactionResult.details.discountRate || 0) > 0 && (
                        <View style={styles.receiptRow}>
                          <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>{t('admin.originalAmount')}</Text>
                          <Text style={[styles.receiptValue, { color: colors.text, textDecorationLine: 'line-through' }]}>
                            ₺{transactionResult.details.originalAmount?.toFixed(2)}
                          </Text>
                        </View>
                      )}

                      {/* Row: Discount (if exist) */}
                      {(transactionResult.details.discountAmount || 0) > 0 && (
                        <View style={styles.receiptRow}>
                          <Text style={[styles.receiptLabel, { color: colors.success }]}>
                            {t('admin.discountLabel')} (%{transactionResult.details.discountRate})
                          </Text>
                          <Text style={[styles.receiptValue, { color: colors.success }]}>
                            -₺{transactionResult.details.discountAmount?.toFixed(2)}
                          </Text>
                        </View>
                      )}

                      <View style={[styles.discountDivider, { backgroundColor: colors.border }]} />

                      {/* Row: Final Amount */}
                      <View style={styles.receiptRow}>
                        <Text style={[styles.receiptLabel, { color: colors.text, fontSize: 18, fontWeight: '700' }]}>
                          {t('admin.finalAmount')}
                        </Text>
                        <Text style={[styles.receiptValue, { color: colors.text, fontSize: 24, fontWeight: '700' }]}>
                          ₺{transactionResult.details.finalAmount?.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {/* Close Button */}
                <Pressable
                  style={[
                    styles.confirmButton,
                    {
                      backgroundColor: isDark ? '#FFFFFF' : '#000000',
                      marginTop: 32,
                      width: '100%'
                    }
                  ]}
                  onPress={resetState}
                >
                  <Text style={[
                    styles.confirmButtonText,
                    { color: isDark ? '#000000' : '#FFFFFF' }
                  ]}>
                    {t('common.done')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      ) : (
        // Campaign Found UI
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.userContainer}>
              <View style={[styles.userCard, { backgroundColor: colors.card }, Shadows.md]}>
                <Ionicons name="checkmark-circle" size={64} color={colors.success} style={{ marginBottom: 16 }} />
                <Text style={[styles.userName, { color: colors.success, marginBottom: 8, textAlign: 'center' }]}>
                  {t('admin.campaignRedeemedSuccess')}
                </Text>

                {/* User Info */}
                <Text style={[styles.userStatLabel, { color: colors.textSecondary, marginTop: 16 }]}>
                  {t('common.user')}
                </Text>
                <Text style={[styles.amountLabel, { color: colors.text, textAlign: 'center' }]}>
                  {scannedCampaign?.user.fullName}
                </Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                  {scannedCampaign?.user.email}
                </Text>

                <View style={[styles.discountDivider, { backgroundColor: colors.border, width: '100%', marginVertical: 16 }]} />

                {/* Campaign Info */}
                <Text style={[styles.userStatLabel, { color: colors.textSecondary }]}>
                  {t('common.campaign')}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <Text style={{ fontSize: 24 }}>
                    {scannedCampaign && (REWARD_ICONS[scannedCampaign.campaign.rewardType] || '🎁')}
                  </Text>
                  <Text style={[styles.amountLabel, { color: colors.text }]}>
                    {scannedCampaign && (i18n.language === 'tr' ? scannedCampaign.campaign.titleTr : scannedCampaign.campaign.title)}
                  </Text>
                </View>

                {/* Close Button */}
                <Pressable
                  style={[
                    styles.confirmButton, // Primary button style
                    {
                      backgroundColor: isDark ? '#FFFFFF' : '#000000', // High contrast
                      marginTop: 32,
                      width: '100%'
                    }
                  ]}
                  onPress={resetState}
                >
                  <Text style={[
                    styles.confirmButtonText,
                    { color: isDark ? '#000000' : '#FFFFFF' }
                  ]}>
                    {t('common.done')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: RFontSizes.lg,
    marginTop: RSpacing.xl,
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: RSpacing.xl,
  },
  permissionTitle: {
    fontSize: RFontSizes.xl,
    fontWeight: '700',
    marginTop: RSpacing.lg,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: RFontSizes.md,
    textAlign: 'center',
    marginTop: RSpacing.sm,
    marginBottom: RSpacing.xl,
    paddingHorizontal: RSpacing.xl,
  },
  permissionButton: {
    paddingVertical: RSpacing.md,
    paddingHorizontal: RSpacing.xxl,
    borderRadius: BorderRadius.lg,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: RFontSizes.lg,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: RSpacing.lg,
  },
  userContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  userCard: {
    borderRadius: BorderRadius.xl,
    padding: RSpacing.xl,
    alignItems: 'center',
    marginBottom: RSpacing.xl,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RSpacing.md,
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: RFontSizes.xl,
    fontWeight: '700',
  },
  userName: {
    fontSize: RFontSizes.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  userEmail: {
    fontSize: RFontSizes.sm,
    marginTop: 2,
  },
  userStats: {
    flexDirection: 'row',
    marginTop: RSpacing.lg,
    alignItems: 'center',
  },
  userStat: {
    alignItems: 'center',
    paddingHorizontal: RSpacing.xl,
  },
  userStatValue: {
    fontSize: RFontSizes.xxl,
    fontWeight: '700',
  },
  userStatLabel: {
    fontSize: RFontSizes.xs,
    marginTop: 2,
  },
  userStatDivider: {
    width: 1,
    height: 40,
  },
  operationButtons: {
    flexDirection: 'row',
    gap: RSpacing.md,
  },
  operationButton: {
    flex: 1,
    padding: RSpacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    gap: RSpacing.sm,
  },
  operationButtonText: {
    color: '#FFFFFF',
    fontSize: RFontSizes.lg,
    fontWeight: '600',
  },
  amountContainer: {
    flex: 1,
  },
  amountLabel: {
    fontSize: RFontSizes.md,
    fontWeight: '500',
    marginBottom: RSpacing.sm,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: RSpacing.md,
  },
  currencySymbol: {
    fontSize: RFontSizes.xxl,
    fontWeight: '500',
  },
  amountInput: {
    flex: 1,
    fontSize: RFontSizes.xxxl,
    fontWeight: '700',
    padding: RSpacing.md,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: RSpacing.sm,
    marginTop: RSpacing.lg,
  },
  paymentOption: {
    flex: 1,
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  paymentOptionTitle: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  paymentOptionSubtitle: {
    fontSize: RFontSizes.xs,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: RSpacing.md,
    marginTop: RSpacing.xl,
  },
  cancelButton: {
    flex: 1,
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RSpacing.lg,
    padding: RSpacing.md,
    gap: RSpacing.xs,
  },
  resetButtonText: {
    fontSize: RFontSizes.sm,
    fontWeight: '500',
  },
  discountPreview: {
    marginTop: RSpacing.lg,
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  discountLabel: {
    fontSize: RFontSizes.sm,
    fontWeight: '500',
  },
  discountValue: {
    fontSize: RFontSizes.sm,
    fontWeight: '600',
  },
  discountDivider: {
    height: 1,
    marginVertical: 8,
  },
  finalLabel: {
    fontSize: RFontSizes.md,
    fontWeight: '700',
  },
  finalValue: {
    fontSize: RFontSizes.md,
    fontWeight: '700',
  },
  paymentOptionText: {
    fontSize: RFontSizes.sm,
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: RSpacing.md,
    fontSize: RFontSizes.md,
  },
  receiptContainer: {
    width: '100%',
    padding: RSpacing.md,
    marginTop: RSpacing.md,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptLabel: {
    fontSize: RFontSizes.sm,
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: RFontSizes.sm,
    fontWeight: '600',
  },
});
