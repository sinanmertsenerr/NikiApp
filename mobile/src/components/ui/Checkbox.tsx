import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, DarkColors, RSpacing, RFontSizes, BorderRadius, isSmallDevice } from '../../constants/theme';
import { useSettingsStore } from '../../stores/settingsStore';
import { useColorScheme } from 'react-native';

interface CheckboxProps {
    label?: string | React.ReactNode;
    checked: boolean;
    onChange: (checked: boolean) => void;
    error?: string;
    style?: any;
}

export const Checkbox: React.FC<CheckboxProps> = ({
    label,
    checked,
    onChange,
    error,
    style,
}) => {
    const colorScheme = useColorScheme();
    const { theme } = useSettingsStore();

    const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
    const colors = isDark ? DarkColors : Colors;

    return (
        <View style={[styles.container, style]}>
            <Pressable
                onPress={() => onChange(!checked)}
                style={[styles.row]}
            >
                <View
                    style={[
                        styles.checkbox,
                        {
                            borderColor: error ? colors.error : '#FFFFFF',
                            backgroundColor: checked ? '#FFFFFF' : 'transparent',
                        },
                    ]}
                >
                    {checked && (
                        <Ionicons name="checkmark" size={16} color="#000000" />
                    )}
                </View>
                {(typeof label === 'string' && label) ? (
                    <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
                ) : (
                    label
                )}
            </Pressable>
            {error && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                    {error}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: RSpacing.md,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Align to top for multi-line text
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: BorderRadius.sm,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: RSpacing.sm,
        marginTop: 2, // Slight offset to align with text line height
    },
    label: {
        flex: 1,
        fontSize: RFontSizes.sm,
        lineHeight: 20,
    },
    errorText: {
        fontSize: RFontSizes.xs,
        marginTop: RSpacing.xs,
        marginLeft: 32, // Align with text
    },
});
