import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    useColorScheme,
} from 'react-native';

import { useSettingsStore } from '../stores/settingsStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius } from '../constants/theme';

export interface CategoryTabItem {
    id: string;
    label: string;
    icon?: string;
}

interface CategoryTabsProps {
    items: CategoryTabItem[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    showAllOption?: boolean;
    allLabel?: string;
}

/**
 * Reusable CategoryTabs component with consistent styling
 * - Fixed height tabs with consistent padding
 * - Horizontal scroll
 * - No size jumping when selecting different items
 */
export function CategoryTabs({
    items,
    selectedId,
    onSelect,
    showAllOption = false,
    allLabel = 'Tümü',
}: CategoryTabsProps) {
    const colorScheme = useColorScheme();
    const { theme } = useSettingsStore();

    const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
    const colors = isDark ? DarkColors : Colors;

    const renderTab = (
        id: string | null,
        label: string,
        icon?: string,
        isSelected: boolean = false
    ) => (
        <Pressable
            key={id ?? 'all'}
            style={[
                styles.tab,
                {
                    backgroundColor: isSelected
                        ? colors.text
                        : colors.backgroundSecondary,
                    borderColor: isSelected ? colors.text : colors.border,
                },
            ]}
            onPress={() => onSelect(id)}
        >
            {icon && <Text style={styles.tabIcon}>{icon}</Text>}
            <Text
                style={[
                    styles.tabLabel,
                    {
                        color: isSelected ? colors.background : colors.text,
                    },
                ]}
                numberOfLines={1}
            >
                {label}
            </Text>
        </Pressable>
    );

    return (
        <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.container}
            >
                {showAllOption && renderTab(null, allLabel, undefined, selectedId === null)}
                {items.map((item) =>
                    renderTab(item.id, item.label, item.icon, selectedId === item.id)
                )}
            </ScrollView>
        </View>
    );
}

const TAB_HEIGHT = 40;
const TAB_MIN_WIDTH = 100;

const styles = StyleSheet.create({
    wrapper: {
        zIndex: 10,
        elevation: 10,
    },
    container: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: TAB_HEIGHT,
        minWidth: TAB_MIN_WIDTH,
        paddingHorizontal: Spacing.lg,
        borderRadius: TAB_HEIGHT / 2,
        borderWidth: 1,
        marginRight: Spacing.sm,
    },
    tabIcon: {
        fontSize: 16,
        marginRight: Spacing.xs,
    },
    tabLabel: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
});

export default CategoryTabs;
