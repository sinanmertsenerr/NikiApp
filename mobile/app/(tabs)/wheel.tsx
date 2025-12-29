import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Pressable,
  Animated,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { wheelService } from '../../src/services/wheelService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Images
const BLACK_CAT = require('../../assets/images/black-cat.png');
const WHITE_CAT = require('../../assets/images/white-cat.png');
const MYSTERY_BOX = require('../../assets/images/mystery-box.png');

// Mystery Box Prizes - prize keys for translation
const PRIZE_KEYS = [
  { id: 2, key: 'prizeDiscount', icon: '🏷️', prize: 'discount', value: '10' },
  { id: 3, key: 'prizeRetry', icon: '🔄', prize: 'retry' },
  { id: 4, key: 'prizeSecondDrink', icon: '🥤', prize: 'second_drink_discount' },
  { id: 5, key: 'prizeDiscount', icon: '🎉', prize: 'discount', value: '20' },
  { id: 6, key: 'prizeFreeCookie', icon: '🍪', prize: 'free_cookie' },
  { id: 7, key: 'prizeDiscount', icon: '💰', prize: 'discount', value: '30' },
  { id: 8, key: 'prizeFreeCoffee', icon: '☕', prize: 'free_coffee' },
  { id: 9, key: 'prizeCoffeeAndCookie', icon: '☕🍪', prize: 'coffee_and_cookie' },
  { id: 10, key: 'prizePoints', icon: '⭐', prize: 'points', value: '1' },
  { id: 1, key: 'prizeNothing', icon: '😢', prize: 'nothing' },
];

// Map reward type to display info using translations
const getRewardDisplayWithT = (t: any, rewardType: string, rewardValue?: string) => {
  switch (rewardType) {
    case 'nothing': return { label: t('mysteryBox.prizeNothing'), icon: '😢' };
    case 'discount': return { label: t('mysteryBox.prizeDiscount', { value: rewardValue }), icon: '🏷️' };
    case 'retry': return { label: t('mysteryBox.prizeRetry'), icon: '🔄' };
    case 'second_drink_discount': return { label: t('mysteryBox.prizeSecondDrink'), icon: '🥤' };
    case 'free_cookie': return { label: t('mysteryBox.prizeFreeCookie'), icon: '🍪' };
    case 'free_coffee': return { label: t('mysteryBox.prizeFreeCoffee'), icon: '☕' };
    case 'coffee_and_cookie': return { label: t('mysteryBox.prizeCoffeeAndCookie'), icon: '☕🍪' };
    case 'points': return { label: t('mysteryBox.prizePoints', { value: rewardValue }), icon: '⭐' };
    default: return { label: t('wallet.reward'), icon: '🎁' };
  }
};

const BOX_SIZE = isSmallDevice ? 180 : 220;
const CAT_SIZE = isSmallDevice ? 90 : 110;

// Calculate positions
const BOX_RIGHT_EDGE = (SCREEN_WIDTH + BOX_SIZE) / 2;
const CAT_STOP_X = BOX_RIGHT_EDGE + 5; // Cat stops just to the right of box
const CAT_START_X = SCREEN_WIDTH + CAT_SIZE; // Cat starts off-screen right

export default function WheelScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();
  const queryClient = useQueryClient();

  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [currentPrize, setCurrentPrize] = useState<{ label: string; icon: string } | null>(null);
  const [showCat, setShowCat] = useState(false);
  const [showPaw, setShowPaw] = useState(false);

  // Animations
  const boxScale = useRef(new Animated.Value(1)).current;
  const boxOpacity = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prizeOpacity = useRef(new Animated.Value(0)).current;
  const prizeScale = useRef(new Animated.Value(0.3)).current;
  const catTranslateX = useRef(new Animated.Value(CAT_START_X)).current;
  const catOpacity = useRef(new Animated.Value(0)).current;
  const pawScale = useRef(new Animated.Value(0)).current;
  const pawOpacity = useRef(new Animated.Value(0)).current;

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;
  const catImage = isDark ? WHITE_CAT : BLACK_CAT;

  // Fetch wheel status from backend
  const { data: wheelStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['wheel-status'],
    queryFn: wheelService.getStatus,
  });

  const opensLeft = wheelStatus?.spinRights ?? 1; // Default to 1 for testing
  const canSpin = true; // TODO: Re-enable: wheelStatus?.canSpin ?? false;

  // Spin mutation
  const spinMutation = useMutation({
    mutationFn: wheelService.spin,
    onSuccess: (result) => {
      // Get reward display info
      const display = getRewardDisplayWithT(t, result.rewardType, result.rewardValue);

      // Show prize animation
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(prizeOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(prizeScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        ]).start();

        setCurrentPrize(display);
        setIsOpened(true);
        setIsOpening(false);

        setTimeout(() => {
          // Show alert with result
          const isWin = result.rewardType !== 'nothing';
          Alert.alert(
            isWin ? t('mysteryBox.congratulations') : t('mysteryBox.betterLuck'),
            result.message,
            [{
              text: isWin ? t('mysteryBox.goToCampaigns') : t('common.ok'),
              onPress: () => {
                resetBox();
                // Invalidate campaigns to show new reward
                queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
                // Refetch wheel status
                refetchStatus();
              }
            }]
          );
        }, 500);
      }, 1600);
    },
    onError: (error: any) => {
      setIsOpening(false);
      resetBox();
      Alert.alert(
        'Hata',
        error?.response?.data?.message || 'Bir hata oluştu, tekrar dene.',
        [{ text: t('common.ok') }]
      );
    },
  });

  // Pulse effect
  useEffect(() => {
    if (canSpin && !isOpened && !isOpening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [canSpin, isOpened, isOpening]);

  const openBox = () => {
    if (isOpening || !canSpin || isOpened) return;
    setIsOpening(true);
    pulseAnim.setValue(1);

    // Call backend API to spin
    spinMutation.mutate();

    // ===== ANIMATION SEQUENCE (runs while API call is happening) =====

    // ===== ANIMATION SEQUENCE =====

    // STEP 1: Cat enters from right (0-600ms)
    setShowCat(true);
    catOpacity.setValue(1);

    Animated.timing(catTranslateX, {
      toValue: CAT_STOP_X,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // STEP 2: Cat touches box, paw appears (600-1000ms)
    setTimeout(() => {
      setShowPaw(true);

      // Paw pop in
      Animated.parallel([
        Animated.spring(pawScale, { toValue: 1.3, tension: 200, friction: 6, useNativeDriver: true }),
        Animated.timing(pawOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();

      // Box reacts
      Animated.timing(boxScale, { toValue: 1.06, duration: 150, useNativeDriver: true }).start();
    }, 600);

    // STEP 3: Paw fades out (1000-1200ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(pawOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(pawScale, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start(() => setShowPaw(false));
    }, 1000);

    // STEP 4: Cat exits right (1100-1600ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(catTranslateX, { toValue: CAT_START_X, duration: 500, useNativeDriver: true }),
        Animated.timing(catOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => {
        setShowCat(false);
        catTranslateX.setValue(CAT_START_X);
      });
    }, 1100);

    // STEP 5: Box opens smoothly (1300-1800ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(boxOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(boxScale, { toValue: 1.15, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 1300);

    // STEP 6: Prize animation is handled in spinMutation.onSuccess
  };

  const resetBox = () => {
    boxScale.setValue(1);
    boxOpacity.setValue(1);
    prizeOpacity.setValue(0);
    prizeScale.setValue(0.3);
    catTranslateX.setValue(CAT_START_X);
    catOpacity.setValue(0);
    pawScale.setValue(0);
    pawOpacity.setValue(0);
    setIsOpened(false);
    setCurrentPrize(null);
    setShowCat(false);
    setShowPaw(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('mysteryBox.title')}</Text>
        <View style={[styles.badge, { backgroundColor: isDark ? '#333' : colors.primary }]}>
          <Text style={styles.badgeText}>{t('mysteryBox.opensLeft', { count: opensLeft })}</Text>
        </View>
      </View>

      {/* Main Area */}
      <View style={styles.main}>
        {/* CAT: positioned absolutely, comes from right */}
        {showCat && (
          <Animated.Image
            source={catImage}
            style={{
              position: 'absolute',
              width: CAT_SIZE,
              height: CAT_SIZE,
              left: 0,
              top: '35%',
              opacity: catOpacity,
              transform: [
                { translateX: catTranslateX },
              ],
            }}
            resizeMode="contain"
          />
        )}

        {/* PAW: appears above box when cat touches */}
        {showPaw && (
          <Animated.View
            style={{
              position: 'absolute',
              top: '25%',
              zIndex: 20,
              backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
              borderRadius: 50,
              padding: 10,
              opacity: pawOpacity,
              transform: [{ scale: pawScale }],
            }}
          >
            <Text style={{ fontSize: 90 }}>🐾</Text>
          </Animated.View>
        )}

        {/* BOX */}
        <Pressable onPress={openBox} disabled={isOpening || opensLeft <= 0 || isOpened}>
          <Animated.View style={{ transform: [{ scale: Animated.multiply(boxScale, pulseAnim) }] }}>
            <Animated.Image
              source={MYSTERY_BOX}
              style={{ width: BOX_SIZE, height: BOX_SIZE, opacity: boxOpacity }}
              resizeMode="contain"
            />

            {/* Prize */}
            {currentPrize && (
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: prizeOpacity,
                  transform: [{ scale: prizeScale }],
                }}
              >
                <Text style={{ fontSize: isSmallDevice ? 60 : 80 }}>{currentPrize.icon}</Text>
                <Text style={{ marginTop: 8, fontSize: 22, fontWeight: '700', color: colors.text }}>
                  {currentPrize.label}
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        </Pressable>

        {/* Button */}
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: opensLeft > 0 && !isOpened && !isOpening ? (isDark ? '#FFF' : colors.primary) : colors.backgroundTertiary },
            pressed && opensLeft > 0 && !isOpened && !isOpening && { transform: [{ scale: 0.95 }] },
          ]}
          onPress={openBox}
          disabled={isOpening || opensLeft <= 0 || isOpened}
        >
          <Text style={[styles.btnText, { color: opensLeft > 0 && !isOpened && !isOpening ? (isDark ? '#000' : '#FFF') : colors.textTertiary }]}>
            {isOpening ? t('mysteryBox.open') + '...' : isOpened ? '✓' : t('mysteryBox.open')}
          </Text>
        </Pressable>
      </View>

      {/* No spins info */}
      {opensLeft <= 0 && !isOpened && (
        <View style={[styles.info, { backgroundColor: isDark ? '#2A2A2A' : '#FFF3CD', borderColor: isDark ? '#444' : '#FFE69C' }]}>
          <Ionicons name="alert-circle" size={20} color={isDark ? '#D4AF37' : '#856404'} />
          <Text style={[styles.infoText, { color: isDark ? '#D4AF37' : '#856404' }]}>
            {t('mysteryBox.noOpens')}
          </Text>
        </View>
      )}

      {/* Prizes */}
      <View style={styles.prizes}>
        <Text style={[styles.prizesTitle, { color: colors.text }]}>{t('mysteryBox.prizes')}</Text>
        <View style={styles.prizesGrid}>
          {PRIZE_KEYS.map((p) => (
            <View key={p.id} style={[styles.prizeCard, { backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5', borderColor: isDark ? '#333' : '#E0E0E0' }]}>
              <Text style={{ fontSize: 18 }}>{p.icon}</Text>
              <Text style={[styles.prizeCardText, { color: colors.text }]}>
                {t(`mysteryBox.${p.key}`, { value: p.value })}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RSpacing.lg,
    paddingTop: RSpacing.md,
    paddingBottom: RSpacing.sm,
  },
  title: { fontSize: RFontSizes.xxl, fontWeight: '700' },
  badge: { paddingHorizontal: RSpacing.md, paddingVertical: RSpacing.xs, borderRadius: BorderRadius.full },
  badgeText: { color: '#FFF', fontSize: RFontSizes.sm, fontWeight: '600' },
  main: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  btn: { marginTop: RSpacing.xl, paddingHorizontal: RSpacing.xxl * 1.5, paddingVertical: RSpacing.md, borderRadius: BorderRadius.full, ...Shadows.lg },
  btnText: { fontSize: RFontSizes.xl, fontWeight: '800' },
  info: { flexDirection: 'row', alignItems: 'center', marginVertical: RSpacing.lg, marginHorizontal: RSpacing.lg, padding: RSpacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, gap: RSpacing.sm },
  infoText: { flex: 1, fontSize: RFontSizes.sm, fontWeight: '600' },
  prizes: { paddingHorizontal: RSpacing.lg, paddingBottom: RSpacing.xl },
  prizesTitle: { fontSize: RFontSizes.lg, fontWeight: '600', marginBottom: RSpacing.sm },
  prizesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: RSpacing.sm },
  prizeCard: { width: '48%', flexDirection: 'row', alignItems: 'center', padding: RSpacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, gap: RSpacing.sm },
  prizeCardText: { fontSize: RFontSizes.sm, fontWeight: '500' },
});
