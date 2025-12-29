import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuthStore } from '../src/stores/authStore';
import { useSettingsStore } from '../src/stores/settingsStore';
import { Colors } from '../src/constants/theme';

export default function Index() {
    const { isAuthenticated, isInitialized: authInitialized } = useAuthStore();
    const { hasSelectedBrand, isInitialized: settingsInitialized } = useSettingsStore();

    // Show loading while auth/settings state is being determined
    if (!authInitialized || !settingsInitialized) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    // Not authenticated → go to login
    if (!isAuthenticated) {
        return <Redirect href="/(auth)/login" />;
    }

    // Authenticated but hasn't selected brand yet → go to brand select
    if (!hasSelectedBrand) {
        return <Redirect href="/(auth)/brand-select" />;
    }

    // Authenticated and has selected brand → go to home
    return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
});
