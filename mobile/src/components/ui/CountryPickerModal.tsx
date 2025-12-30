import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    FlatList,
    TextInput,
    TouchableWithoutFeedback,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../stores/settingsStore';
import { Colors, DarkColors, BorderRadius, RSpacing, RFontSizes, isSmallDevice } from '../../constants/theme';
import { COUNTRIES, Country } from '../../constants/countries';

interface CountryPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (country: Country) => void;
    selectedCountryCode: string;
}

export function CountryPickerModal({
    visible,
    onClose,
    onSelect,
    selectedCountryCode,
}: CountryPickerModalProps) {
    const { theme } = useSettingsStore();
    const isDark = theme === 'dark' || (theme === 'system' && false); // Simplified system check for modal
    const colors = isDark ? DarkColors : Colors;

    const [search, setSearch] = useState('');

    const filteredCountries = COUNTRIES.filter(
        (country) =>
            country.name.toLowerCase().includes(search.toLowerCase()) ||
            country.dialCode.includes(search)
    );

    const renderItem = ({ item }: { item: Country }) => (
        <Pressable
            style={[
                styles.item,
                { borderBottomColor: colors.border },
                item.code === selectedCountryCode && { backgroundColor: isDark ? '#333' : '#f0f0f0' }
            ]}
            onPress={() => {
                onSelect(item);
                onClose();
                setSearch(''); // Reset search on close
            }}
        >
            <Text style={styles.flag}>{item.flag}</Text>
            <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.dialCode, { color: colors.textSecondary }]}>{item.dialCode}</Text>
            {item.code === selectedCountryCode && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
            )}
        </Pressable>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
                            {/* Header */}
                            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.title, { color: colors.text }]}>Ülke Seçin</Text>
                                <Pressable onPress={onClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </Pressable>
                            </View>

                            {/* Search */}
                            <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                <Ionicons name="search" size={20} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.searchInput, { color: colors.text }]}
                                    placeholder="Ülke ara..."
                                    placeholderTextColor={colors.textTertiary}
                                    value={search}
                                    onChangeText={setSearch}
                                />
                            </View>

                            {/* List */}
                            <FlatList
                                data={filteredCountries}
                                renderItem={renderItem}
                                keyExtractor={(item) => item.code}
                                contentContainerStyle={styles.listContent}
                                keyboardShouldPersistTaps="handled"
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        height: '70%',
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        paddingTop: RSpacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: RSpacing.lg,
        paddingBottom: RSpacing.md,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: RFontSizes.lg,
        fontWeight: '700',
    },
    closeButton: {
        padding: RSpacing.xs,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: RSpacing.md,
        paddingHorizontal: RSpacing.md,
        paddingVertical: Platform.OS === 'ios' ? RSpacing.md : RSpacing.xs,
        borderRadius: BorderRadius.lg,
    },
    searchInput: {
        flex: 1,
        marginLeft: RSpacing.sm,
        fontSize: RFontSizes.md,
    },
    listContent: {
        paddingBottom: RSpacing.xl,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: RSpacing.md,
        paddingHorizontal: RSpacing.lg,
        borderBottomWidth: 1,
    },
    flag: {
        fontSize: isSmallDevice ? 20 : 24,
        marginRight: RSpacing.md,
    },
    name: {
        flex: 1,
        fontSize: RFontSizes.md,
    },
    dialCode: {
        fontSize: RFontSizes.md,
        marginRight: RSpacing.md,
    },
});
