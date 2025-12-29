import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useColorScheme,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Image,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'react-native-qrcode-svg';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { campaignService, Campaign, UserCampaign } from '../../src/services/campaignService';
import { getTranslatedContent } from '../../src/hooks/useTranslatedContent';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';

// Niki logo for Mystery Box campaigns
const NIKI_LOGO = require('../../assets/images/brands/niki-logo.png');

// Icon mapping for campaign reward types
const REWARD_ICONS: Record<string, string> = {
  'free_coffee': '☕',
  'discount_percent': '🏷️',
  'discount_fixed': '💰',
  'bonus_points': '⭐',
  'manual': '🎁',
};

export default function CampaignsScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;
  const { i18n } = useTranslation();

  // Tab state - like Raffles screen
  const [activeTab, setActiveTab] = useState<'active' | 'used'>('active');

  // QR Modal state
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<{
    userCampaignId: string; // Needed for tracking
    qrCode: string;
    title: string;
    titleTr: string;
    rewardType: string;
    rewardValue: any;
  } | null>(null);

  // Success state
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  // Animation for success overlay
  const successScaleAnim = useRef(new Animated.Value(0)).current;
  const successOpacityAnim = useRef(new Animated.Value(0)).current;

  // Fetch user's campaigns from API (campaigns assigned to user)
  const { data: userCampaigns, refetch, isLoading, isFetching, error } = useQuery({
    queryKey: ['my-campaigns'],
    queryFn: async () => {
      const result = await campaignService.getMyCampaigns();
      return result;
    },
  });

  // Watch for campaign status change to trigger success
  useEffect(() => {
    if (qrModalVisible && selectedCampaign && !redeemSuccess && userCampaigns) {
      const latestCampaign = userCampaigns.find(uc => uc.id === selectedCampaign.userCampaignId);

      // If found and status changed to 'used', trigger success.
      if (latestCampaign && latestCampaign.status === 'used') {
        handleRedemptionSuccess();
      }
    }
  }, [userCampaigns, qrModalVisible, selectedCampaign, redeemSuccess]);

  const handleRedemptionSuccess = () => {
    setRedeemSuccess(true);
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
      setRedeemSuccess(false);
      // Reset animations
      successScaleAnim.setValue(0);
      successOpacityAnim.setValue(0);
    });
  };

  // Helper to check if a campaign is a raffle winner
  const isRaffleWinner = (campaign: Campaign) => {
    return campaign.title?.startsWith('Raffle Winner:') || campaign.titleTr?.startsWith('Çekiliş Kazananı:');
  };

  // Filter campaigns: exclude raffle winners, keep userCampaign id for unique keys
  const allCampaigns = userCampaigns?.filter(uc => !isRaffleWinner(uc.campaign)).map(uc => ({
    ...uc.campaign,
    userCampaignId: uc.id,
    userCampaignStatus: uc.status,
    usedAt: uc.usedAt || uc.redeemedAt, // Use redeemedAt if usedAt is missing (backend uses redeemedAt)
    expiresAt: uc.expiresAt, // Individual expiry for this user-campaign
    qrCode: uc.qrCode, // Include QR code for each user-campaign
  })) || [];

  // Split into active and used campaigns
  const activeCampaigns = allCampaigns.filter(c => c.userCampaignStatus === 'active' && c.isActive);
  const usedCampaigns = allCampaigns
    .filter(c => c.userCampaignStatus === 'used' || c.userCampaignStatus === 'expired')
    .sort((a, b) => {
      const dateA = a.usedAt ? new Date(a.usedAt).getTime() : 0;
      const dateB = b.usedAt ? new Date(b.usedAt).getTime() : 0;
      return dateB - dateA; // Descending (Newest first)
    });

  // Current data based on tab
  const campaigns = activeTab === 'active' ? activeCampaigns : usedCampaigns;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return t('campaigns.ongoing');
    const date = new Date(dateString);
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  };

  const getCampaignIcon = (campaign: Campaign) => {
    return REWARD_ICONS[campaign.rewardType] || '🎉';
  };

  const isNewCampaign = (campaign: Campaign) => {
    const createdAt = new Date(campaign.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdAt > weekAgo;
  };

  const renderCampaign = ({ item: campaign }: { item: any }) => (
    <Pressable
      style={({ pressed }) => [
        styles.campaignCard,
        { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
        Shadows.sm
      ]}
    >
      {/* Campaign Icon - Show Niki logo for Mystery Box (auto) campaigns */}
      <View style={[styles.campaignImage, { backgroundColor: isDark ? '#333333' : colors.backgroundSecondary }]}>
        {campaign.type === 'auto' ? (
          <Image
            source={NIKI_LOGO}
            style={[styles.nikiLogo, { tintColor: isDark ? '#FFFFFF' : '#000000' }]}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.campaignIcon}>{getCampaignIcon(campaign)}</Text>
        )}
      </View>

      {/* Campaign Content */}
      <View style={styles.campaignContent}>
        <View style={styles.campaignHeader}>
          <Text style={[styles.campaignTitle, { color: colors.text }]} numberOfLines={1}>
            {getTranslatedContent(campaign, 'title', i18n.language)}
          </Text>
          {activeTab === 'active' && isNewCampaign(campaign) && (
            <View style={[styles.newBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.newBadgeText}>{t('campaigns.new')}</Text>
            </View>
          )}
          {activeTab === 'used' && (
            <View style={[styles.usedBadge, { backgroundColor: colors.textTertiary + '30' }]}>
              <Text style={[styles.usedBadgeText, { color: colors.textSecondary }]}>
                {campaign.userCampaignStatus === 'used' ? t('campaigns.used') : t('campaigns.expired')}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.campaignDesc, { color: colors.textSecondary }]} numberOfLines={2}>
          {getTranslatedContent(campaign, 'description', i18n.language)}
        </Text>
        <View style={styles.campaignFooter}>
          <Text style={[styles.expiryText, { color: colors.textTertiary }]}>
            {activeTab === 'active'
              ? `${t('campaigns.validUntil')}: ${formatDate(campaign.expiresAt || campaign.endDate)}`
              : campaign.usedAt
                ? `${t('campaigns.usedOn')}: ${new Date(campaign.usedAt).toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US')} ${new Date(campaign.usedAt).toLocaleTimeString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`
                : t('campaigns.expired')
            }
          </Text>
          {/* Use Button - only for active campaigns */}
          {activeTab === 'active' && (
            <Pressable
              style={styles.useButton}
              onPress={() => {
                setSelectedCampaign({
                  userCampaignId: campaign.userCampaignId,
                  qrCode: campaign.qrCode,
                  title: campaign.title,
                  titleTr: campaign.titleTr,
                  rewardType: campaign.rewardType,
                  rewardValue: campaign.rewardValue,
                });
                setQrModalVisible(true);
              }}
            >
              <Ionicons name="gift-outline" size={16} color="#FFFFFF" />
              <Text style={styles.useButtonText}>{t('campaigns.use')}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );

  // Show full-screen loading only on initial load (no data yet)
  if (isLoading && !userCampaigns) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('campaigns.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('campaigns.subtitle')}
        </Text>
      </View>

      {/* Tabs - matching Raffles screen style */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.tab, activeTab === 'active' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'active' ? colors.primary : colors.textSecondary }]}>
            {t('campaigns.activeCampaigns')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'used' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('used')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'used' ? colors.primary : colors.textSecondary }]}>
            {t('campaigns.myCampaigns')}
          </Text>
        </Pressable>
      </View>

      {/* Campaigns List */}
      <FlatList
        data={campaigns}
        renderItem={renderCampaign}
        keyExtractor={(item) => item.userCampaignId}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => refetch()}
            tintColor={isDark ? '#FFFFFF' : colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={activeTab === 'active' ? 'gift-outline' : 'checkmark-done-outline'}
              size={64}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeTab === 'active' ? t('campaigns.noCampaigns') : t('campaigns.noUsedCampaigns')}
            </Text>
          </View>
        }
      />

      {/* QR Code Modal */}
      <Modal
        visible={qrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => redeemSuccess ? closeSuccessModal() : setQrModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => redeemSuccess ? closeSuccessModal() : setQrModalVisible(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('campaigns.showQrToStaff')}
              </Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setQrModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Campaign Info */}
            {selectedCampaign && (
              <View style={styles.qrCampaignInfo}>
                <Text style={styles.qrCampaignIcon}>
                  {REWARD_ICONS[selectedCampaign.rewardType] || '🎁'}
                </Text>
                <Text style={[styles.qrCampaignTitle, { color: colors.text }]}>
                  {i18n.language === 'tr' ? selectedCampaign.titleTr : selectedCampaign.title}
                </Text>
              </View>
            )}

            {/* QR Code */}
            {selectedCampaign?.qrCode && (
              <View style={[styles.qrCodeContainer, { backgroundColor: '#FFFFFF' }]}>
                <QRCode
                  value={selectedCampaign.qrCode}
                  size={SCREEN_WIDTH * 0.5}
                  backgroundColor="#FFFFFF"
                  color="#000000"
                />
              </View>
            )}

            {/* Instructions */}
            <Text style={[styles.qrInstructions, { color: colors.textSecondary }]}>
              {t('campaigns.qrInstructions')}
            </Text>

            {/* Redemption Success Overlay */}
            {redeemSuccess && selectedCampaign && (
              <Animated.View
                style={[
                  styles.successOverlay,
                  {
                    backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.98)',
                    opacity: successOpacityAnim,
                    transform: [{ scale: successScaleAnim }],
                  }
                ]}
              >
                <View style={[styles.successIconContainer, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={72} color={colors.success} />
                </View>

                <Text style={[styles.successTitle, { color: colors.success }]}>
                  {t('admin.campaignRedeemedSuccess')}
                </Text>

                <View style={styles.successAmountContainer}>
                  <Text style={[styles.successAmountLabel, { color: colors.textSecondary }]}>
                    {t('campaigns.rewardType')}
                  </Text>
                  <Text style={[styles.successAmount, { color: colors.success, fontSize: 24, textAlign: 'center' }]}>
                    {i18n.language === 'tr' ? selectedCampaign.titleTr : selectedCampaign.title}
                  </Text>
                </View>

                <View style={[styles.successDivider, { backgroundColor: colors.border }]} />

                <View style={styles.successBalanceContainer}>
                  <Text style={[styles.successBalanceLabel, { color: colors.textSecondary }]}>
                    {t('campaigns.status')}
                  </Text>
                  <Text style={[styles.successBalance, { color: colors.text }]}>
                    {t('campaigns.used')}
                  </Text>
                </View>

                {/* OK Button */}
                <Pressable
                  style={[styles.successButton, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]}
                  onPress={closeSuccessModal}
                >
                  <Text style={[styles.successButtonText, { color: colors.success }]}>
                    {t('common.ok')}
                  </Text>
                </Pressable>
              </Animated.View>
            )}

          </Pressable>
        </Pressable>
      </Modal>
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
    paddingBottom: RSpacing.md,
  },
  title: {
    fontSize: RFontSizes.xxl,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: RFontSizes.md,
    marginTop: RSpacing.xs,
  },
  // Tab styles matching Raffles
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: RSpacing.md,
    alignItems: 'center',
  },
  tabText: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: RSpacing.lg,
    paddingTop: RSpacing.md,
    paddingBottom: RSpacing.xxl,
  },
  campaignCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    marginBottom: RSpacing.md,
    overflow: 'hidden',
  },
  campaignImage: {
    width: isSmallDevice ? 70 : 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  campaignIcon: {
    fontSize: isSmallDevice ? 28 : 32,
  },
  nikiLogo: {
    width: isSmallDevice ? 45 : 55,
    height: isSmallDevice ? 45 : 55,
  },
  campaignContent: {
    flex: 1,
    padding: RSpacing.md,
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RSpacing.xs,
  },
  campaignTitle: {
    fontSize: RFontSizes.lg,
    fontWeight: '600',
    flex: 1,
  },
  newBadge: {
    paddingHorizontal: RSpacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: RSpacing.sm,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: RFontSizes.xs,
    fontWeight: '600',
  },
  usedBadge: {
    paddingHorizontal: RSpacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: RSpacing.sm,
  },
  usedBadgeText: {
    fontSize: RFontSizes.xs,
    fontWeight: '600',
  },
  campaignDesc: {
    fontSize: RFontSizes.sm,
    lineHeight: 20,
    marginBottom: RSpacing.sm,
  },
  campaignFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expiryText: {
    fontSize: RFontSizes.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: RSpacing.xxl,
  },
  emptyText: {
    fontSize: RFontSizes.md,
    marginTop: RSpacing.md,
    textAlign: 'center',
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
  // Use Button - Updated to match Raffles Use Prize Button
  useButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RSpacing.sm,
    paddingVertical: 6, // Reduced padding
    paddingHorizontal: RSpacing.md, // Reduced padding
    borderRadius: BorderRadius.md,
    backgroundColor: '#4CAF50',
  },
  useButtonText: {
    color: '#FFF',
    fontSize: RFontSizes.sm,
    fontWeight: '600',
  },
  // QR Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: RSpacing.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    padding: RSpacing.lg,
    alignItems: 'center',
    ...Shadows.lg,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RSpacing.lg,
  },
  modalTitle: {
    fontSize: RFontSizes.lg,
    fontWeight: '700',
  },
  closeButton: {
    padding: RSpacing.xs,
  },
  qrCampaignInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RSpacing.lg,
    padding: RSpacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  qrCampaignIcon: {
    fontSize: 24,
    marginRight: RSpacing.sm,
  },
  qrCampaignTitle: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  qrCodeContainer: {
    padding: RSpacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: RSpacing.lg,
    ...Shadows.sm,
  },
  qrInstructions: {
    fontSize: RFontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Success Overlay Styles (Copied and adapted from Wallet)
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.xl,
    padding: RSpacing.lg,
    paddingTop: RSpacing.xl,
    alignItems: 'center',
    zIndex: 10,
    justifyContent: 'center', // Added to vertically center content
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RSpacing.lg,
  },
  successTitle: {
    fontSize: RFontSizes.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: RSpacing.lg,
  },
  successAmountContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: RSpacing.lg,
  },
  successAmountLabel: {
    fontSize: RFontSizes.sm,
    marginBottom: RSpacing.xs,
  },
  successAmount: {
    fontSize: RFontSizes.xxl,
    fontWeight: '700',
  },
  successDivider: {
    width: '100%',
    height: 1,
    marginBottom: RSpacing.lg,
  },
  successBalanceContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RSpacing.xl,
  },
  successBalanceLabel: {
    fontSize: RFontSizes.md,
  },
  successBalance: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  successButton: {
    width: '100%',
    paddingVertical: RSpacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  successButtonText: {
    fontSize: RFontSizes.md,
    fontWeight: '700',
  },
});
