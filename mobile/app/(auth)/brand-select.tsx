import { View, Text, StyleSheet, useColorScheme, Pressable, Alert } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { useAuthStore } from '../../src/stores/authStore';
import { BRANDS, BrandType } from '../../src/constants/brands';
import { Colors, DarkColors, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';

export default function BrandSelectScreen() {
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const { theme, setSelectedBrand } = useSettingsStore();
    const { user } = useAuthStore();

    const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
    const colors = isDark ? DarkColors : Colors;

    const handleBrandSelect = async (brandId: BrandType) => {
        // Sandwich is coming soon
        if (brandId === 'sandwich') {
            Alert.alert(
                t('brandSelect.comingSoon', 'Çok Yakında!'),
                t('brandSelect.comingSoonDesc', 'Niki Sandwich çok yakında sizlerle! Şimdilik Niki Coffee ile devam edebilirsiniz.'),
                [{ text: t('common.ok', 'Tamam') }]
            );
            return;
        }

        await setSelectedBrand(brandId);
        router.replace('/(tabs)/home');
    };

    const brandOptions = Object.values(BRANDS);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                        {t('home.welcome')}, {user?.firstName || t('common.user')} 👋
                    </Text>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {t('brandSelect.title', 'Marka Seçin')}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {t('brandSelect.subtitle', 'Hangi markayı kullanmak istiyorsunuz?')}
                    </Text>
                </View>

                {/* Brand Cards */}
                <View style={styles.brandsContainer}>
                    {brandOptions.map((brand) => {
                        const isComingSoon = brand.id === 'sandwich';

                        return (
                            <Pressable
                                key={brand.id}
                                style={({ pressed }) => [
                                    styles.brandCard,
                                    {
                                        backgroundColor: colors.card,
                                        opacity: pressed ? 0.8 : (isComingSoon ? 0.6 : 1),
                                        borderColor: colors.border,
                                        borderWidth: 1,
                                    },
                                    Shadows.md,
                                ]}
                                onPress={() => handleBrandSelect(brand.id)}
                            >
                                <View style={[styles.logoContainer, { backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5' }]}>
                                    <Image
                                        source={brand.logo}
                                        style={[styles.brandLogo, isDark && { tintColor: '#FFFFFF' }]}
                                        contentFit="contain"
                                    />
                                </View>
                                <Text style={[styles.brandName, { color: colors.text }]}>
                                    {brand.name}
                                </Text>
                                <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>
                                    {brand.tagline}
                                </Text>

                                {isComingSoon ? (
                                    <View style={[styles.comingSoonButton, { backgroundColor: isDark ? '#404040' : '#CCCCCC' }]}>
                                        <Text style={[styles.comingSoonButtonText, { color: isDark ? '#AAAAAA' : '#666666' }]}>
                                            {t('brandSelect.comingSoon', 'Çok Yakında')}
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={[styles.selectButton, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]}>
                                        <Text style={[styles.selectButtonText, { color: isDark ? '#000000' : '#FFFFFF' }]}>
                                            {t('brandSelect.select', 'Seç')}
                                        </Text>
                                    </View>
                                )}
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: RSpacing.lg,
        paddingTop: RSpacing.xl,
    },
    header: {
        marginBottom: RSpacing.xxl,
        alignItems: 'center',
    },
    greeting: {
        fontSize: RFontSizes.lg,
        marginBottom: RSpacing.sm,
    },
    title: {
        fontSize: RFontSizes.xxxl,
        fontWeight: '700',
        marginBottom: RSpacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: RFontSizes.lg,
        textAlign: 'center',
    },
    brandsContainer: {
        flex: 1,
        gap: RSpacing.lg,
        justifyContent: 'center',
    },
    brandCard: {
        borderRadius: BorderRadius.xl,
        padding: RSpacing.lg,
        alignItems: 'center',
    },
    logoContainer: {
        width: isSmallDevice ? 80 : 100,
        height: isSmallDevice ? 80 : 100,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: RSpacing.md,
    },
    brandLogo: {
        width: '70%',
        height: '70%',
    },
    brandName: {
        fontSize: RFontSizes.xl,
        fontWeight: '700',
        marginBottom: RSpacing.xs,
    },
    brandTagline: {
        fontSize: RFontSizes.md,
        marginBottom: RSpacing.md,
    },
    selectButton: {
        paddingHorizontal: RSpacing.xl,
        paddingVertical: RSpacing.sm,
        borderRadius: BorderRadius.full,
    },
    selectButtonText: {
        color: '#FFFFFF',
        fontSize: RFontSizes.md,
        fontWeight: '600',
    },
    comingSoonButton: {
        paddingHorizontal: RSpacing.xl,
        paddingVertical: RSpacing.sm,
        borderRadius: BorderRadius.full,
    },
    comingSoonButtonText: {
        color: '#FFFFFF',
        fontSize: RFontSizes.md,
        fontWeight: '600',
    },
});
