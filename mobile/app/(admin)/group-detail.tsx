import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    FlatList,
    Pressable,
    useColorScheme,
    TextInput,
    Modal,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Alert } from '../../src/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import { groupService, GroupMember } from '../../src/services/groupService';
import { adminGetUsers } from '../../src/services/userService';
import { getErrorMessage } from '../../src/services/api';
import { formatPhoneOrEmail, formatPhoneNumber } from '../../src/utils/phoneFormat';

// Types for import wizard
type PartialMatch = {
    excelName: string;
    excelPhone?: string;
    userId: string;
    userName: string;
    userPhone?: string;
    selected: boolean;
    matchReason: 'phone' | 'name' | 'fuzzy';
};

type UnmatchedRecord = {
    excelName: string;
    excelPhone?: string;
    selectedUserId?: string;
    selectedUserName?: string;
};

export default function AdminGroupDetailScreen() {
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const colorScheme = useColorScheme();
    const { theme } = useSettingsStore();
    const queryClient = useQueryClient();

    const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
    const colors = isDark ? DarkColors : Colors;

    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupDesc, setGroupDesc] = useState('');

    // Multi-select state
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);

    // Wizard state (0: normal list, 1: summary, 2: partial matches, 3: unmatched, 4: final confirmation)
    const [importStep, setImportStep] = useState<0 | 1 | 2 | 3 | 4>(0);
    const [exactMatches, setExactMatches] = useState<string[]>([]);
    const [partialMatches, setPartialMatches] = useState<PartialMatch[]>([]);
    const [unmatchedRecords, setUnmatchedRecords] = useState<UnmatchedRecord[]>([]);

    // For unmatched record user selection (2-level navigation)
    const [activeUnmatchedIndex, setActiveUnmatchedIndex] = useState<number | null>(null);
    const [unmatchedSearchQuery, setUnmatchedSearchQuery] = useState('');
    const [tempSelectedUser, setTempSelectedUser] = useState<{ id: string; name: string } | null>(null);

    const { data: group, isLoading, refetch } = useQuery({
        queryKey: ['admin-group', id],
        queryFn: () => groupService.getById(id!),
        enabled: !!id,
    });

    const { data: allUsers } = useQuery({
        queryKey: ['admin-users-for-groups'],
        queryFn: () => adminGetUsers({ limit: 9999 }),
    });

    useEffect(() => {
        if (group) {
            setGroupName(group.name);
            setGroupDesc(group.description || '');
        }
    }, [group]);

    const updateMutation = useMutation({
        mutationFn: (data: { name: string; description?: string }) => groupService.update(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-group', id] });
            queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
            setIsEditing(false);
            Alert.alert(t('common.success'), t('groups.groupUpdated'));
        },
        onError: (error: any) => {
            Alert.alert(t('common.error'), getErrorMessage(error));
        },
    });

    const addMemberMutation = useMutation({
        mutationFn: (userId: string) => groupService.addMember(id!, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-group', id] });
            queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
            setShowAddModal(false);
            setSearchQuery('');
            Alert.alert(t('common.success'), t('groups.memberAdded'));
        },
        onError: (error: any) => {
            Alert.alert(t('common.error'), getErrorMessage(error));
        },
    });

    const removeMemberMutation = useMutation({
        mutationFn: (userId: string) => groupService.removeMember(id!, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-group', id] });
            queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
            Alert.alert(t('common.success'), t('groups.memberRemoved'));
        },
        onError: (error: any) => {
            Alert.alert(t('common.error'), getErrorMessage(error));
        },
    });

    // Filter users not in group for add modal
    const memberIds = new Set(group?.members.map((m) => m.id) || []);
    const usersArray = (allUsers as any)?.users || allUsers || [];
    const availableUsers = usersArray.filter(
        (u: any) => !memberIds.has(u.id) && u.isActive
    );
    const filteredUsers = availableUsers.filter((u: any) =>
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Normalize text for comparison
    const normalizeText = (text: string): string => {
        return text?.toLowerCase().replace(/\s+/g, '').replace(/[ığüşöç]/g, (char) => {
            const map: any = { 'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c' };
            return map[char] || char;
        }) || '';
    };

    // Normalize phone number
    // Normalize phone number (handles number type from Excel)
    const normalizePhone = (phone: any): string => {
        if (!phone) return '';
        // Remove all non-numeric characters and take last 10 digits
        return String(phone).replace(/\D/g, '').slice(-10);
    };

    // Normalize text keeping spaces for fuzzy matching
    const normalizeNameWithSpaces = (text: string): string => {
        return text?.toLowerCase().replace(/[ığüşöç]/g, (char) => {
            const map: any = { 'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c' };
            return map[char] || char;
        }).trim() || '';
    };

    // Check if all parts of the excel name exist in user name
    const isFuzzyNameMatch = (excelName: string, userName: string): boolean => {
        if (!excelName || !userName) return false;

        const excelParts = normalizeNameWithSpaces(excelName).split(/\s+/).filter(p => p.length > 0);
        const userParts = normalizeNameWithSpaces(userName).split(/\s+/).filter(p => p.length > 0);

        if (excelParts.length === 0) return false;

        // Check if every part of excel name exists in user name
        return excelParts.every(part => userParts.includes(part));
    };

    // Handle Excel import with wizard
    const handleExcelImport = async () => {
        try {
            setIsImporting(true);
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets?.[0]) {
                setIsImporting(false);
                return;
            }

            const fileUri = result.assets[0].uri;
            const fileContent = await FileSystem.readAsStringAsync(fileUri, {
                encoding: 'base64',
            });

            // Lazy-load xlsx (heavy, admin-only) so it isn't in the main bundle.
            const XLSX = await import('xlsx');
            const workbook = XLSX.read(fileContent, { type: 'base64' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data: any[] = XLSX.utils.sheet_to_json(worksheet);

            const newExactMatches: string[] = [];
            const newPartialMatches: PartialMatch[] = [];
            const newUnmatchedRecords: UnmatchedRecord[] = [];

            for (const row of data) {
                const excelNameRaw = `${row['Ad'] || row['Name'] || ''} ${row['Soyad'] || row['Surname'] || ''}`.trim();
                const excelNameStrict = normalizeText(excelNameRaw);
                const excelPhone = normalizePhone(row['Telefon'] || row['Telefon Numarası'] || row['Phone'] || row['Tel'] || row['Phone Number'] || '');

                let matchedUser: any = null;
                let matchType: 'exact' | 'partial' | 'none' = 'none';
                let matchReason = '';

                for (const user of availableUsers) {
                    const userNameRaw = `${user.firstName} ${user.lastName}`;
                    const userNameStrict = normalizeText(userNameRaw);
                    const userPhone = normalizePhone(user.phone || '');

                    const phoneMatches = excelPhone && userPhone && excelPhone === userPhone;
                    const nameMatches = excelNameStrict && userNameStrict && excelNameStrict === userNameStrict;
                    const fuzzyNameMatches = isFuzzyNameMatch(excelNameRaw, userNameRaw);

                    // EXACT MATCH: Both phone AND name must match
                    if (phoneMatches && nameMatches) {
                        matchedUser = user;
                        matchType = 'exact';
                        break;
                    }

                    // PARTIAL MATCH: Only phone matches (name different - could be wrong person!)
                    if (phoneMatches && !nameMatches && matchType === 'none') {
                        matchedUser = user;
                        matchType = 'partial';
                        matchReason = 'phone';
                        // Don't break - keep looking for better match
                    }

                    // PARTIAL MATCH: Only exact name matches (phone different or missing)
                    if (nameMatches && !phoneMatches && matchType === 'none') {
                        matchedUser = user;
                        matchType = 'partial';
                        matchReason = 'name';
                        // Don't break - keep looking for phone+name match
                    }

                    // PARTIAL MATCH: Fuzzy name match
                    if (fuzzyNameMatches && !nameMatches && matchType === 'none') {
                        matchedUser = user;
                        matchType = 'partial';
                        matchReason = 'fuzzy';
                        // Don't break - keep looking for better match
                    }
                }

                if (matchType === 'exact' && matchedUser) {
                    newExactMatches.push(matchedUser.id);
                } else if (matchType === 'partial' && matchedUser) {
                    newPartialMatches.push({
                        excelName: excelNameRaw,
                        excelPhone: excelPhone || undefined,
                        userId: matchedUser.id,
                        userName: `${matchedUser.firstName} ${matchedUser.lastName}`,
                        userPhone: matchedUser.phone ? normalizePhone(matchedUser.phone) : undefined,
                        selected: true,
                        matchReason: matchReason as 'phone' | 'name' | 'fuzzy',
                    });
                } else if (excelNameRaw || excelPhone) {
                    newUnmatchedRecords.push({
                        excelName: excelNameRaw || 'Bilinmeyen',
                        excelPhone: excelPhone || undefined,
                    });
                }
            }

            // Remove duplicates from exact matches
            const uniqueExactMatches = [...new Set(newExactMatches)];

            setExactMatches(uniqueExactMatches);
            setPartialMatches(newPartialMatches);
            setUnmatchedRecords(newUnmatchedRecords);
            setIsImporting(false);

            // Go to step 1 (summary)
            setImportStep(1);
        } catch (error: any) {
            setIsImporting(false);
            console.error('Excel import error:', error);
            Alert.alert(t('common.error'), getErrorMessage(error));
        }
    };

    // Handle final bulk add
    const handleFinalBulkAdd = async () => {
        // Collect all user IDs to add
        const idsToAdd: string[] = [
            ...exactMatches,
            ...partialMatches.filter(p => p.selected).map(p => p.userId),
            ...unmatchedRecords.filter(u => u.selectedUserId).map(u => u.selectedUserId!),
        ];

        const uniqueIds = [...new Set(idsToAdd)];

        if (uniqueIds.length === 0) {
            Alert.alert(t('common.error'), t('groups.noUsersToAdd'));
            return;
        }

        try {
            let successCount = 0;
            for (const userId of uniqueIds) {
                try {
                    await groupService.addMember(id!, userId);
                    successCount++;
                } catch (error) {
                    console.error('Error adding member:', userId, error);
                }
            }
            queryClient.invalidateQueries({ queryKey: ['admin-group', id] });
            queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
            resetWizard();
            setShowAddModal(false);
            Alert.alert(t('common.success'), t('groups.membersAdded', { count: successCount }));
        } catch (error: any) {
            Alert.alert(t('common.error'), getErrorMessage(error));
        }
    };

    // Reset wizard state
    const resetWizard = () => {
        setImportStep(0);
        setExactMatches([]);
        setPartialMatches([]);
        setUnmatchedRecords([]);
        setSelectedUserIds([]);
        setActiveUnmatchedIndex(null);
        setUnmatchedSearchQuery('');
    };

    // Toggle user selection
    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // Clear selection
    const clearSelection = () => {
        setSelectedUserIds([]);
        resetWizard();
    };

    // Toggle partial match selection
    const togglePartialMatch = (index: number) => {
        setPartialMatches(prev => prev.map((p, i) =>
            i === index ? { ...p, selected: !p.selected } : p
        ));
    };

    // Accept all partial matches
    const acceptAllPartialMatches = () => {
        setPartialMatches(prev => prev.map(p => ({ ...p, selected: true })));
    };

    // Select user for unmatched record
    const selectUserForUnmatched = (unmatchedIndex: number, user: any) => {
        setUnmatchedRecords(prev => prev.map((u, i) =>
            i === unmatchedIndex
                ? { ...u, selectedUserId: user.id, selectedUserName: `${user.firstName} ${user.lastName}` }
                : u
        ));
        setActiveUnmatchedIndex(null);
        setUnmatchedSearchQuery('');
    };

    // Skip unmatched record
    const skipUnmatched = (index: number) => {
        setUnmatchedRecords(prev => prev.map((u, i) =>
            i === index ? { ...u, selectedUserId: undefined, selectedUserName: undefined } : u
        ));
    };

    // Skip all unmatched
    const skipAllUnmatched = () => {
        setUnmatchedRecords(prev => prev.map(u => ({ ...u, selectedUserId: undefined, selectedUserName: undefined })));
    };

    // Calculate totals for final step
    const getTotals = () => {
        const exactCount = exactMatches.length;
        const partialCount = partialMatches.filter(p => p.selected).length;
        const manualCount = unmatchedRecords.filter(u => u.selectedUserId).length;
        return { exactCount, partialCount, manualCount, total: exactCount + partialCount + manualCount };
    };

    // Proceed to next step
    const nextStep = () => {
        if (importStep === 1) {
            // From summary, go to partial matches if any, otherwise unmatched, otherwise final
            if (partialMatches.length > 0) {
                setImportStep(2);
            } else if (unmatchedRecords.length > 0) {
                setImportStep(3);
            } else {
                setImportStep(4);
            }
        } else if (importStep === 2) {
            // From partial matches, go to unmatched if any, otherwise final
            if (unmatchedRecords.length > 0) {
                setImportStep(3);
            } else {
                setImportStep(4);
            }
        } else if (importStep === 3) {
            // From unmatched, go to final
            setImportStep(4);
        }
    };

    // Go to previous step
    const previousStep = () => {
        if (importStep === 4) {
            // From final, go back to unmatched if any, otherwise partial, otherwise summary
            if (unmatchedRecords.length > 0) {
                setImportStep(3);
            } else if (partialMatches.length > 0) {
                setImportStep(2);
            } else {
                setImportStep(1);
            }
        } else if (importStep === 3) {
            // From unmatched, go back to partial if any, otherwise summary
            if (partialMatches.length > 0) {
                setImportStep(2);
            } else {
                setImportStep(1);
            }
        } else if (importStep === 2) {
            // From partial, go back to summary
            setImportStep(1);
        }
    };

    const handleSave = () => {
        if (!groupName.trim()) {
            Alert.alert(t('common.error'), t('validation.enterCategoryName'));
            return;
        }
        updateMutation.mutate({ name: groupName.trim(), description: groupDesc.trim() || undefined });
    };

    const handleRemoveMember = (member: GroupMember) => {
        Alert.alert(
            t('groups.removeMember'),
            `${member.firstName} ${member.lastName}?`,
            [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.confirm'), style: 'destructive', onPress: () => removeMemberMutation.mutate(member.id) },
            ]
        );
    };

    // Handle manual add from list
    const handleManualBulkAdd = async () => {
        if (selectedUserIds.length === 0) return;

        try {
            let successCount = 0;
            for (const userId of selectedUserIds) {
                try {
                    await groupService.addMember(id!, userId);
                    successCount++;
                } catch (error) {
                    console.error('Error adding member:', userId, error);
                }
            }
            queryClient.invalidateQueries({ queryKey: ['admin-group', id] });
            queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
            setSelectedUserIds([]);
            setShowAddModal(false);
            Alert.alert(t('common.success'), t('groups.membersAdded', { count: successCount }));
        } catch (error: any) {
            Alert.alert(t('common.error'), getErrorMessage(error));
        }
    };

    // Render wizard content based on step
    const renderWizardContent = () => {
        switch (importStep) {
            case 1:
                return renderSummaryStep();
            case 2:
                return renderPartialMatchesStep();
            case 3:
                return renderUnmatchedStep();
            case 4:
                return renderFinalStep();
            default:
                return renderNormalList();
        }
    };

    // Step 1: Summary
    const renderSummaryStep = () => (
        <View style={styles.wizardContainer}>
            <View style={styles.summaryCards}>
                {/* Exact Matches */}
                <View style={[styles.summaryCard, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
                    <View style={styles.summaryCardIcon}>
                        <Ionicons name="checkmark-circle" size={28} color={colors.success} />
                    </View>
                    <View style={styles.summaryCardContent}>
                        <Text style={[styles.summaryCardCount, { color: colors.success }]}>
                            {exactMatches.length}
                        </Text>
                        <Text style={[styles.summaryCardLabel, { color: colors.text }]}>
                            {t('groups.exactMatchCount', { count: exactMatches.length })}
                        </Text>
                        <Text style={[styles.summaryCardHint, { color: colors.textSecondary }]}>
                            {t('groups.willBeAddedAuto')}
                        </Text>
                    </View>
                </View>

                {/* Partial Matches */}
                <View style={[styles.summaryCard, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
                    <View style={styles.summaryCardIcon}>
                        <Ionicons name="help-circle" size={28} color={colors.warning} />
                    </View>
                    <View style={styles.summaryCardContent}>
                        <Text style={[styles.summaryCardCount, { color: colors.warning }]}>
                            {partialMatches.length}
                        </Text>
                        <Text style={[styles.summaryCardLabel, { color: colors.text }]}>
                            {t('groups.partialMatchCount', { count: partialMatches.length })}
                        </Text>
                        <Text style={[styles.summaryCardHint, { color: colors.textSecondary }]}>
                            {t('groups.needsReview')}
                        </Text>
                    </View>
                </View>

                {/* Unmatched */}
                <View style={[styles.summaryCard, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
                    <View style={styles.summaryCardIcon}>
                        <Ionicons name="close-circle" size={28} color={colors.error} />
                    </View>
                    <View style={styles.summaryCardContent}>
                        <Text style={[styles.summaryCardCount, { color: colors.error }]}>
                            {unmatchedRecords.length}
                        </Text>
                        <Text style={[styles.summaryCardLabel, { color: colors.text }]}>
                            {t('groups.unmatchedCount', { count: unmatchedRecords.length })}
                        </Text>
                        <Text style={[styles.summaryCardHint, { color: colors.textSecondary }]}>
                            {t('groups.needsManualSelect')}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.wizardActions}>
                <Pressable
                    style={[styles.wizardButton, styles.wizardButtonSecondary, { borderColor: colors.border }]}
                    onPress={resetWizard}
                >
                    <Text style={[styles.wizardButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable
                    style={[styles.wizardButton, styles.wizardButtonPrimary, { backgroundColor: colors.text }]}
                    onPress={nextStep}
                >
                    <Text style={[styles.wizardButtonText, { color: colors.card }]}>{t('groups.continueBtn')}</Text>
                    <Ionicons name="arrow-forward" size={18} color={colors.card} />
                </Pressable>
            </View>
        </View>
    );

    // Step 2: Partial Matches - render item for FlatList
    const renderPartialMatchItem = useCallback(({ item: match, index }: { item: PartialMatch; index: number }) => {
        const phoneMatches = match.excelPhone && match.userPhone && match.excelPhone === match.userPhone;
        const hasPhoneInfo = match.excelPhone || match.userPhone;

        return (
            <Pressable
                style={[
                    styles.matchCard,
                    { backgroundColor: match.selected ? colors.primary + '10' : colors.backgroundSecondary }
                ]}
                onPress={() => togglePartialMatch(index)}
            >
                <View style={styles.matchCardContent}>
                    {/* Names in one line with arrow */}
                    <View style={styles.matchNamesRow}>
                        <Text style={[styles.matchNameText, { color: colors.text }]} numberOfLines={1}>
                            {match.excelName}
                        </Text>
                        <Ionicons name="arrow-forward" size={14} color={colors.textTertiary} />
                        <Text style={[styles.matchNameText, { color: colors.primary, flex: 1 }]} numberOfLines={1}>
                            {match.userName}
                        </Text>
                    </View>

                    {/* Badges Row */}
                    <View style={styles.matchBadgesRow}>
                        {/* Match Reason Badge */}
                        <View style={[
                            styles.matchReasonBadge,
                            {
                                backgroundColor: match.matchReason === 'phone'
                                    ? colors.success + '15'
                                    : match.matchReason === 'name'
                                        ? colors.primary + '15'
                                        : colors.warning + '15'
                            }
                        ]}>
                            <Ionicons
                                name={match.matchReason === 'phone' ? 'checkmark-circle' : match.matchReason === 'name' ? 'person' : 'git-compare'}
                                size={11}
                                color={
                                    match.matchReason === 'phone'
                                        ? colors.success
                                        : match.matchReason === 'name'
                                            ? colors.primary
                                            : colors.warning
                                }
                            />
                            <Text style={[
                                styles.matchReasonText,
                                {
                                    color: match.matchReason === 'phone'
                                        ? colors.success
                                        : match.matchReason === 'name'
                                            ? colors.primary
                                            : colors.warning
                                }
                            ]}>
                                {match.matchReason === 'phone'
                                    ? t('groups.phoneMatched')
                                    : match.matchReason === 'name'
                                        ? t('groups.nameMatched')
                                        : t('groups.partialNameMatched')}
                            </Text>
                        </View>

                        {/* Phone Status Badge - Always show */}
                        <View style={[
                            styles.matchReasonBadge,
                            {
                                backgroundColor: phoneMatches
                                    ? colors.success + '15'
                                    : hasPhoneInfo
                                        ? colors.error + '10'
                                        : colors.textTertiary + '20'
                            }
                        ]}>
                            <Ionicons
                                name={phoneMatches ? 'checkmark-circle' : hasPhoneInfo ? 'close-circle' : 'call-outline'}
                                size={11}
                                color={phoneMatches ? colors.success : hasPhoneInfo ? colors.error : colors.textTertiary}
                            />
                            <Text style={[
                                styles.matchReasonText,
                                { color: phoneMatches ? colors.success : hasPhoneInfo ? colors.error : colors.textTertiary }
                            ]}>
                                {phoneMatches
                                    ? t('groups.phoneMatch')
                                    : hasPhoneInfo
                                        ? t('groups.phoneMismatch')
                                        : t('groups.noPhone')}
                            </Text>
                        </View>
                    </View>


                </View>
                <Ionicons
                    name={match.selected ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={match.selected ? colors.primary : colors.textTertiary}
                />
            </Pressable>
        );
    }, [colors, t, togglePartialMatch]);

    // Step 2: Partial Matches
    const renderPartialMatchesStep = () => (
        <View style={styles.wizardContainer}>
            <FlatList
                data={partialMatches}
                renderItem={renderPartialMatchItem}
                keyExtractor={(_, index) => `partial-${index}`}
                style={styles.wizardScrollContent}
                initialNumToRender={15}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                getItemLayout={(_, index) => ({ length: 100, offset: 100 * index, index })}
            />

            <View style={styles.wizardActions}>
                <Pressable
                    style={[styles.wizardButton, styles.wizardButtonSecondary, { borderColor: colors.border }]}
                    onPress={acceptAllPartialMatches}
                >
                    <Ionicons name="checkmark-done" size={18} color={colors.text} />
                    <Text style={[styles.wizardButtonText, { color: colors.text }]}>{t('groups.acceptAll')}</Text>
                </Pressable>
                <Pressable
                    style={[styles.wizardButton, styles.wizardButtonPrimary, { backgroundColor: colors.text }]}
                    onPress={nextStep}
                >
                    <Text style={[styles.wizardButtonText, { color: colors.card }]}>{t('groups.continueBtn')}</Text>
                    <Ionicons name="arrow-forward" size={18} color={colors.card} />
                </Pressable>
            </View>
        </View>
    );

    // Step 3: Unmatched Records - 2 Level Navigation
    const renderUnmatchedStep = () => {
        // Collect already used user IDs
        const usedUserIds = new Set([
            ...exactMatches,
            ...partialMatches.filter(p => p.selected).map(p => p.userId),
            ...unmatchedRecords.filter(u => u.selectedUserId).map(u => u.selectedUserId!),
        ]);

        // Filter users for search - exclude already used
        const unmatchedFilteredUsers = availableUsers.filter((u: any) =>
            !usedUserIds.has(u.id) &&
            `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(unmatchedSearchQuery.toLowerCase())
        );

        // LEVEL 2: Detail View - Single unmatched record
        if (activeUnmatchedIndex !== null) {
            const record = unmatchedRecords[activeUnmatchedIndex];
            const currentSelection = tempSelectedUser || (record.selectedUserId ? { id: record.selectedUserId, name: record.selectedUserName || '' } : null);

            return (
                <View style={styles.wizardContainer}>
                    {/* Detail Header */}
                    <View style={styles.unmatchedDetailHeader}>
                        <Pressable
                            style={styles.unmatchedDetailBack}
                            onPress={() => {
                                setActiveUnmatchedIndex(null);
                                setTempSelectedUser(null);
                                setUnmatchedSearchQuery('');
                            }}
                        >
                            <Ionicons name="arrow-back" size={20} color={colors.text} />
                        </Pressable>
                        <View style={styles.unmatchedDetailInfo}>
                            <Text style={[styles.unmatchedDetailTitle, { color: colors.text }]} numberOfLines={1}>
                                {record.excelName}
                            </Text>
                            {record.excelPhone && (
                                <Text style={[styles.unmatchedDetailPhone, { color: colors.textSecondary }]}>
                                    {formatPhoneNumber(record.excelPhone)}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Search Bar */}
                    <View style={[styles.unmatchedDetailSearch, { backgroundColor: colors.backgroundSecondary }]}>
                        <Ionicons name="search" size={18} color={colors.textTertiary} />
                        <TextInput
                            style={[styles.unmatchedDetailSearchInput, { color: colors.text }]}
                            value={unmatchedSearchQuery}
                            onChangeText={setUnmatchedSearchQuery}
                            placeholder={t('groups.searchAndSelect')}
                            placeholderTextColor={colors.textTertiary}
                        />
                        {unmatchedSearchQuery.length > 0 && (
                            <Pressable onPress={() => setUnmatchedSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                            </Pressable>
                        )}
                    </View>

                    {/* Selected User Display */}
                    {currentSelection && (
                        <View style={[styles.unmatchedDetailSelected, { backgroundColor: colors.success + '15' }]}>
                            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                            <Text style={[styles.unmatchedDetailSelectedText, { color: colors.text }]}>
                                {currentSelection.name}
                            </Text>
                            <Pressable onPress={() => setTempSelectedUser(null)}>
                                <Ionicons name="close-circle" size={20} color={colors.error} />
                            </Pressable>
                        </View>
                    )}

                    {/* User List */}
                    <FlatList
                        data={unmatchedFilteredUsers}
                        keyExtractor={(item: any) => item.id}
                        style={styles.unmatchedDetailUserList}
                        keyboardShouldPersistTaps="handled"
                        initialNumToRender={15}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        removeClippedSubviews={true}
                        getItemLayout={(_, index) => ({ length: 60, offset: 60 * index, index })}
                        renderItem={({ item: user }: { item: any }) => {
                            const isSelected = currentSelection?.id === user.id;
                            return (
                                <Pressable
                                    style={[
                                        styles.unmatchedDetailUserItem,
                                        { borderBottomColor: colors.border },
                                        isSelected && { backgroundColor: colors.primary + '10' }
                                    ]}
                                    onPress={() => setTempSelectedUser({ id: user.id, name: `${user.firstName} ${user.lastName}` })}
                                >
                                    <View style={[styles.unmatchedDetailUserAvatar, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.unmatchedDetailUserAvatarText}>
                                            {user.firstName[0]}{user.lastName[0]}
                                        </Text>
                                    </View>
                                    <View style={styles.unmatchedDetailUserInfo}>
                                        <Text style={[styles.unmatchedDetailUserName, { color: colors.text }]} numberOfLines={1}>
                                            {user.firstName} {user.lastName}
                                        </Text>
                                        <Text style={[styles.unmatchedDetailUserEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                                            {formatPhoneOrEmail(user.phone, user.email)}
                                        </Text>
                                    </View>
                                    {isSelected ? (
                                        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                                    ) : (
                                        <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                                    )}
                                </Pressable>
                            );
                        }}
                        ListEmptyComponent={
                            <Text style={[styles.unmatchedNoResult, { color: colors.textTertiary }]}>
                                {t('common.noResults')}
                            </Text>
                        }
                    />

                    {/* Action Buttons */}
                    <View style={styles.wizardActions}>
                        <Pressable
                            style={[styles.wizardButton, styles.wizardButtonSecondary, { borderColor: colors.border }]}
                            onPress={() => {
                                setActiveUnmatchedIndex(null);
                                setTempSelectedUser(null);
                                setUnmatchedSearchQuery('');
                            }}
                        >
                            <Text style={[styles.wizardButtonText, { color: colors.text }]}>{t('groups.skip')}</Text>
                        </Pressable>
                        <Pressable
                            style={[
                                styles.wizardButton,
                                styles.wizardButtonPrimary,
                                { backgroundColor: currentSelection ? colors.success : colors.textTertiary }
                            ]}
                            onPress={() => {
                                if (currentSelection) {
                                    selectUserForUnmatched(activeUnmatchedIndex, { id: currentSelection.id, firstName: currentSelection.name.split(' ')[0], lastName: currentSelection.name.split(' ').slice(1).join(' ') });
                                }
                                setActiveUnmatchedIndex(null);
                                setTempSelectedUser(null);
                                setUnmatchedSearchQuery('');
                            }}
                            disabled={!currentSelection}
                        >
                            <Ionicons name="checkmark" size={18} color="#fff" />
                            <Text style={[styles.wizardButtonText, { color: '#fff' }]}>{t('admin.match')}</Text>
                        </Pressable>
                    </View>
                </View>
            );
        }

        // LEVEL 1: List View - All unmatched records
        const renderUnmatchedListItem = ({ item: record, index }: { item: UnmatchedRecord; index: number }) => (
            <Pressable
                style={[
                    styles.unmatchedListItem,
                    { backgroundColor: colors.backgroundSecondary },
                    record.selectedUserId && { borderLeftColor: colors.success, borderLeftWidth: 3 }
                ]}
                onPress={() => {
                    setActiveUnmatchedIndex(index);
                    setTempSelectedUser(null);
                    setUnmatchedSearchQuery('');
                }}
            >
                <View style={styles.unmatchedListContent}>
                    <Text style={[styles.unmatchedListName, { color: colors.text }]} numberOfLines={1}>
                        {record.excelName}
                    </Text>
                    {record.selectedUserId ? (
                        <View style={styles.unmatchedListMatchedRow}>
                            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                            <Text style={[styles.unmatchedListMatchedText, { color: colors.success }]} numberOfLines={1}>
                                {record.selectedUserName}
                            </Text>
                        </View>
                    ) : (
                        <Text style={[styles.unmatchedListHint, { color: colors.textTertiary }]}>
                            {t('groups.selectUser')}
                        </Text>
                    )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </Pressable>
        );

        return (
            <View style={styles.wizardContainer}>
                <FlatList
                    data={unmatchedRecords}
                    renderItem={renderUnmatchedListItem}
                    keyExtractor={(_, index) => `unmatched-${index}`}
                    style={styles.wizardScrollContent}
                    initialNumToRender={15}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    getItemLayout={(_, index) => ({ length: 60, offset: 60 * index, index })}
                />

                <View style={styles.wizardActions}>
                    <Pressable
                        style={[styles.wizardButton, styles.wizardButtonSecondary, { borderColor: colors.border }]}
                        onPress={skipAllUnmatched}
                    >
                        <Text style={[styles.wizardButtonText, { color: colors.text }]}>{t('groups.skipAll')}</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.wizardButton, styles.wizardButtonPrimary, { backgroundColor: colors.text }]}
                        onPress={nextStep}
                    >
                        <Text style={[styles.wizardButtonText, { color: colors.card }]}>{t('groups.complete')}</Text>
                        <Ionicons name="arrow-forward" size={18} color={colors.card} />
                    </Pressable>
                </View>
            </View>
        );
    };

    // Step 4: Final Confirmation
    const renderFinalStep = () => {
        const { exactCount, partialCount, manualCount, total } = getTotals();

        return (
            <View style={styles.wizardContainer}>
                <View style={styles.wizardIconContainer}>
                    <Ionicons name="checkmark-done-circle" size={48} color={colors.success} />
                    <Text style={[styles.wizardTitle, { color: colors.text }]}>
                        {t('groups.totalToAdd', { count: total })}
                    </Text>
                </View>

                <View style={styles.finalSummary}>
                    <View style={styles.finalSummaryRow}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        <Text style={[styles.finalSummaryText, { color: colors.text }]}>
                            {exactCount} {t('groups.fromExact')}
                        </Text>
                    </View>
                    <View style={styles.finalSummaryRow}>
                        <Ionicons name="help-circle" size={20} color={colors.warning} />
                        <Text style={[styles.finalSummaryText, { color: colors.text }]}>
                            {partialCount} {t('groups.fromPartial')}
                        </Text>
                    </View>
                    <View style={styles.finalSummaryRow}>
                        <Ionicons name="person-add" size={20} color={colors.primary} />
                        <Text style={[styles.finalSummaryText, { color: colors.text }]}>
                            {manualCount} {t('groups.fromManual')}
                        </Text>
                    </View>
                </View>

                <View style={styles.wizardActions}>
                    <Pressable
                        style={[styles.wizardButton, styles.wizardButtonSecondary, { borderColor: colors.border }]}
                        onPress={resetWizard}
                    >
                        <Text style={[styles.wizardButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.wizardButton, styles.wizardButtonPrimary, { backgroundColor: colors.success }]}
                        onPress={handleFinalBulkAdd}
                        disabled={total === 0}
                    >
                        <Ionicons name="people-outline" size={18} color="#fff" />
                        <Text style={[styles.wizardButtonText, { color: '#fff' }]}>{t('groups.addToGroup')}</Text>
                    </Pressable>
                </View>
            </View>
        );
    };

    // Normal user list (step 0)
    const renderNormalList = () => (
        <>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('groups.addMember')}</Text>
                <View style={styles.headerButtons}>
                    {selectedUserIds.length > 0 ? (
                        <>
                            {/* Ekle Button */}
                            <Pressable
                                style={[styles.headerActionBtn, { backgroundColor: colors.text }]}
                                onPress={handleManualBulkAdd}
                            >
                                <Text style={[styles.headerActionBtnText, { color: colors.card }]}>
                                    {t('groups.addSelected', { count: selectedUserIds.length })}
                                </Text>
                            </Pressable>
                            {/* İptal Button */}
                            <Pressable
                                style={[styles.headerActionBtn, { backgroundColor: colors.backgroundSecondary }]}
                                onPress={clearSelection}
                            >
                                <Text style={[styles.headerActionBtnText, { color: colors.text }]}>
                                    {t('groups.cancelSelection')}
                                </Text>
                            </Pressable>
                        </>
                    ) : (
                        /* Import Button */
                        <Pressable
                            style={[styles.importButton, { backgroundColor: colors.primary + '20' }]}
                            onPress={handleExcelImport}
                            disabled={isImporting}
                        >
                            {isImporting ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <>
                                    <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
                                    <Text style={[styles.importButtonText, { color: colors.primary }]}>
                                        {t('groups.import')}
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    )}
                    <Pressable onPress={() => { setShowAddModal(false); setSearchQuery(''); clearSelection(); }}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </Pressable>
                </View>
            </View>

            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="search" size={20} color={colors.textTertiary} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={t('groups.searchUser')}
                    placeholderTextColor={colors.textTertiary}
                />
            </View>

            {/* User List with Checkboxes */}
            <FlatList
                data={filteredUsers.slice(0, 50)}
                keyExtractor={(item: any) => item.id}
                style={styles.userList}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }: { item: any }) => {
                    const isSelected = selectedUserIds.includes(item.id);
                    return (
                        <Pressable
                            style={[
                                styles.userItem,
                                { borderBottomColor: colors.border },
                                isSelected && { backgroundColor: colors.primary + '10' }
                            ]}
                            onPress={() => toggleUserSelection(item.id)}
                        >
                            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                                <Text style={styles.avatarText}>
                                    {item.firstName[0]}{item.lastName[0]}
                                </Text>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={[styles.userName, { color: colors.text }]}>
                                    {item.firstName} {item.lastName}
                                </Text>
                                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
                            </View>
                            <Ionicons
                                name={isSelected ? 'checkbox' : 'square-outline'}
                                size={24}
                                color={isSelected ? colors.primary : colors.textTertiary}
                            />
                        </Pressable>
                    );
                }}
                ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: colors.textSecondary, padding: RSpacing.lg }]}>
                        {t('common.noResults')}
                    </Text>
                }
            />
        </>
    );

    if (isLoading || !group) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Group Info Card */}
                <View style={[styles.card, { backgroundColor: colors.card }, Shadows.md]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.groupIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="people" size={32} color={colors.primary} />
                        </View>
                        {!isEditing ? (
                            <Pressable style={styles.editButton} onPress={() => setIsEditing(true)}>
                                <Ionicons name="pencil" size={20} color={colors.primary} />
                            </Pressable>
                        ) : null}
                    </View>

                    {isEditing ? (
                        <>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                                value={groupName}
                                onChangeText={setGroupName}
                                placeholder={t('groups.groupNamePlaceholder')}
                                placeholderTextColor={colors.textTertiary}
                            />
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                                value={groupDesc}
                                onChangeText={setGroupDesc}
                                placeholder={t('groups.groupDescPlaceholder')}
                                placeholderTextColor={colors.textTertiary}
                                multiline
                            />
                            <View style={styles.editActions}>
                                <Pressable
                                    style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                                    onPress={() => {
                                        setIsEditing(false);
                                        setGroupName(group.name);
                                        setGroupDesc(group.description || '');
                                    }}
                                >
                                    <Text style={[styles.actionButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.actionButton, { backgroundColor: colors.text }]}
                                    onPress={handleSave}
                                    disabled={updateMutation.isPending}
                                >
                                    <Text style={[styles.actionButtonText, { color: colors.card }]}>
                                        {updateMutation.isPending ? t('common.loading') : t('common.save')}
                                    </Text>
                                </Pressable>
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={[styles.groupName, { color: colors.text }]}>{group.name}</Text>
                            {group.description ? (
                                <Text style={[styles.groupDesc, { color: colors.textSecondary }]}>{group.description}</Text>
                            ) : null}
                        </>
                    )}
                </View>

                {/* Members Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {t('groups.members')} ({group.members.length})
                    </Text>
                    <Pressable
                        style={[styles.addButton, { backgroundColor: colors.text }]}
                        onPress={() => setShowAddModal(true)}
                    >
                        <Ionicons name="add" size={20} color={colors.card} />
                        <Text style={[styles.addButtonText, { color: colors.card }]}>{t('groups.addMember')}</Text>
                    </Pressable>
                </View>

                {group.members.length === 0 ? (
                    <View style={styles.emptyMembers}>
                        <Ionicons name="person-outline" size={48} color={colors.textTertiary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('groups.noMembers')}</Text>
                    </View>
                ) : (
                    group.members.map((member) => (
                        <View key={member.id} style={[styles.memberCard, { backgroundColor: colors.card }, Shadows.sm]}>
                            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                                <Text style={styles.avatarText}>
                                    {member.firstName[0]}{member.lastName[0]}
                                </Text>
                            </View>
                            <View style={styles.memberInfo}>
                                <Text style={[styles.memberName, { color: colors.text }]}>
                                    {member.firstName} {member.lastName}
                                </Text>
                                <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>{member.email}</Text>
                            </View>
                            <Pressable
                                style={styles.removeButton}
                                onPress={() => handleRemoveMember(member)}
                                disabled={removeMemberMutation.isPending}
                            >
                                <Ionicons name="close-circle" size={24} color={colors.error} />
                            </Pressable>
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal visible={showAddModal} transparent animationType="slide">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.card, minHeight: importStep > 0 ? '70%' : undefined }]}>
                        {/* Wizard Header with Back/Close Buttons */}
                        {importStep > 0 && (
                            <View style={styles.wizardModalHeader}>
                                {/* Left: Back button (for step 2+) or empty space */}
                                {importStep > 1 ? (
                                    <Pressable
                                        style={styles.wizardBackButton}
                                        onPress={previousStep}
                                    >
                                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                                    </Pressable>
                                ) : (
                                    <View style={{ width: 32 }} />
                                )}

                                {/* Center: Title */}
                                <Text style={[styles.wizardModalTitle, { color: colors.text }]}>
                                    {importStep === 1 && t('groups.importResult')}
                                    {importStep === 2 && t('groups.partialMatchesTitle')}
                                    {importStep === 3 && t('groups.unmatchedTitle')}
                                    {importStep === 4 && t('groups.addToGroup')}
                                </Text>

                                {/* Right: Close button */}
                                <Pressable
                                    style={styles.wizardBackButton}
                                    onPress={resetWizard}
                                >
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </Pressable>
                            </View>
                        )}
                        {renderWizardContent()}
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: RSpacing.lg,
        paddingBottom: RSpacing.xxl,
    },
    card: {
        padding: RSpacing.lg,
        borderRadius: BorderRadius.xl,
        marginBottom: RSpacing.lg,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: RSpacing.md,
    },
    groupIcon: {
        width: 64,
        height: 64,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButton: {
        padding: RSpacing.sm,
    },
    groupName: {
        fontSize: RFontSizes.xl,
        fontWeight: '700',
    },
    groupDesc: {
        fontSize: RFontSizes.md,
        marginTop: RSpacing.xs,
    },
    input: {
        padding: RSpacing.md,
        borderRadius: BorderRadius.lg,
        fontSize: RFontSizes.md,
        marginBottom: RSpacing.sm,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    editActions: {
        flexDirection: 'row',
        gap: RSpacing.md,
        marginTop: RSpacing.sm,
    },
    actionButton: {
        flex: 1,
        padding: RSpacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: RFontSizes.md,
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: RSpacing.md,
    },
    sectionTitle: {
        fontSize: RFontSizes.lg,
        fontWeight: '600',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: RSpacing.md,
        paddingVertical: RSpacing.sm,
        borderRadius: BorderRadius.full,
    },
    addButtonText: {
        fontSize: RFontSizes.sm,
        fontWeight: '600',
    },
    emptyMembers: {
        alignItems: 'center',
        padding: RSpacing.xxl,
    },
    emptyText: {
        fontSize: RFontSizes.md,
        marginTop: RSpacing.sm,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: RSpacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: RSpacing.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: RSpacing.md,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: RFontSizes.md,
        fontWeight: '600',
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: RFontSizes.md,
        fontWeight: '500',
    },
    memberEmail: {
        fontSize: RFontSizes.sm,
    },
    removeButton: {
        padding: RSpacing.xs,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        maxHeight: '90%',
        minHeight: 300,
        paddingBottom: Platform.OS === 'ios' ? RSpacing.xl : RSpacing.lg,
    },
    wizardModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: RSpacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    wizardModalTitle: {
        fontSize: RFontSizes.lg,
        fontWeight: '700',
        textAlign: 'center',
        flex: 1,
    },
    wizardBackButton: {
        padding: RSpacing.xs,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: RSpacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    modalTitle: {
        fontSize: RFontSizes.lg,
        fontWeight: '700',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: RSpacing.lg,
        padding: RSpacing.md,
        borderRadius: BorderRadius.lg,
        gap: RSpacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: RFontSizes.md,
    },
    userList: {
        flex: 1,
        marginTop: RSpacing.sm,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: RSpacing.md,
        paddingHorizontal: RSpacing.lg,
        borderBottomWidth: 1,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: RFontSizes.md,
        fontWeight: '500',
    },
    userEmail: {
        fontSize: RFontSizes.sm,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.md,
    },
    importButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.xs,
        paddingHorizontal: RSpacing.md,
        paddingVertical: RSpacing.sm,
        borderRadius: BorderRadius.md,
    },
    importButtonText: {
        fontSize: RFontSizes.sm,
        fontWeight: '600',
    },
    headerActionBtn: {
        paddingHorizontal: RSpacing.md,
        paddingVertical: RSpacing.sm,
        borderRadius: BorderRadius.md,
    },
    headerActionBtnText: {
        fontSize: RFontSizes.sm,
        fontWeight: '600',
    },
    // Wizard styles
    wizardContainer: {
        flex: 1,
        padding: RSpacing.lg,
    },
    wizardIconContainer: {
        alignItems: 'center',
        paddingVertical: RSpacing.lg,
    },
    wizardHeader: {
        alignItems: 'center',
        paddingVertical: RSpacing.xl,
    },
    wizardHeaderSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.sm,
        paddingVertical: RSpacing.md,
    },
    wizardTitle: {
        fontSize: RFontSizes.xl,
        fontWeight: '700',
        marginTop: RSpacing.md,
    },
    wizardTitleSmall: {
        fontSize: RFontSizes.lg,
        fontWeight: '600',
    },
    wizardScrollContent: {
        flex: 1,
        marginVertical: RSpacing.md,
    },
    wizardActions: {
        flexDirection: 'row',
        gap: RSpacing.md,
        paddingTop: RSpacing.lg,
    },
    wizardButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: RSpacing.xs,
        paddingVertical: RSpacing.md,
        borderRadius: BorderRadius.lg,
    },
    wizardButtonPrimary: {},
    wizardButtonSecondary: {
        borderWidth: 1,
    },
    wizardButtonText: {
        fontSize: RFontSizes.md,
        fontWeight: '600',
    },
    summaryCards: {
        gap: RSpacing.md,
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: RSpacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
    },
    summaryCardIcon: {
        marginRight: RSpacing.md,
    },
    summaryCardContent: {
        flex: 1,
    },
    summaryCardCount: {
        fontSize: RFontSizes.xxl,
        fontWeight: '700',
    },
    summaryCardLabel: {
        fontSize: RFontSizes.md,
        fontWeight: '500',
    },
    summaryCardHint: {
        fontSize: RFontSizes.sm,
        marginTop: 2,
    },
    matchCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: RSpacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: RSpacing.sm,
    },
    matchCardContent: {
        flex: 1,
    },
    matchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.xs,
    },
    matchLabel: {
        fontSize: RFontSizes.sm,
    },
    matchValue: {
        fontSize: RFontSizes.md,
        fontWeight: '500',
    },
    matchNamesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: RSpacing.xs,
    },
    matchNameText: {
        fontSize: RFontSizes.md,
        fontWeight: '500',
    },
    matchBadgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    matchReasonBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: BorderRadius.full,
    },
    matchReasonText: {
        fontSize: 10,
        fontWeight: '500',
    },
    unmatchedCard: {
        padding: RSpacing.sm,
        borderRadius: BorderRadius.lg,
        marginBottom: RSpacing.sm,
    },
    unmatchedRecordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.sm,
        marginBottom: RSpacing.xs,
    },
    unmatchedBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unmatchedBadgeText: {
        fontSize: RFontSizes.sm,
        fontWeight: '600',
    },
    unmatchedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.xs,
        marginBottom: RSpacing.sm,
    },
    unmatchedIndex: {
        fontSize: RFontSizes.sm,
    },
    unmatchedName: {
        fontSize: RFontSizes.md,
        fontWeight: '500',
        flex: 1,
    },
    unmatchedPhone: {
        fontSize: RFontSizes.xs,
    },
    unmatchedSelectedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.sm,
        padding: RSpacing.sm,
        borderRadius: BorderRadius.md,
    },
    unmatchedSelectedName: {
        flex: 1,
        fontSize: RFontSizes.sm,
        fontWeight: '500',
    },
    unmatchedRemoveBtn: {
        padding: 2,
    },
    unmatchedSearchArea: {
        marginTop: RSpacing.xs,
    },
    unmatchedSearchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.sm,
        padding: RSpacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    unmatchedSearchInput: {
        flex: 1,
        fontSize: RFontSizes.sm,
        padding: 0,
    },
    unmatchedResultsContainer: {
        marginTop: RSpacing.xs,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    unmatchedResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: RSpacing.sm,
        gap: RSpacing.sm,
        borderBottomWidth: 1,
    },
    unmatchedResultAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unmatchedResultAvatarText: {
        color: '#fff',
        fontSize: RFontSizes.xs,
        fontWeight: '600',
    },
    unmatchedResultInfo: {
        flex: 1,
    },
    unmatchedResultName: {
        fontSize: RFontSizes.sm,
        fontWeight: '500',
    },
    unmatchedResultEmail: {
        fontSize: RFontSizes.xs,
    },
    unmatchedNoResult: {
        padding: RSpacing.md,
        textAlign: 'center',
        fontSize: RFontSizes.sm,
    },
    unmatchedActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.sm,
    },
    unmatchedSelectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.xs,
        paddingHorizontal: RSpacing.md,
        paddingVertical: RSpacing.sm,
        borderRadius: BorderRadius.md,
    },
    unmatchedSelectBtnText: {
        fontSize: RFontSizes.sm,
        fontWeight: '500',
    },
    unmatchedSkipBtn: {
        paddingHorizontal: RSpacing.sm,
        paddingVertical: RSpacing.sm,
    },
    unmatchedSkipBtnText: {
        fontSize: RFontSizes.sm,
    },
    unmatchedActions: {
        flexDirection: 'row',
        gap: RSpacing.sm,
    },
    unmatchedActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.xs,
        paddingHorizontal: RSpacing.md,
        paddingVertical: RSpacing.sm,
        borderRadius: BorderRadius.md,
    },
    unmatchedActionText: {
        fontSize: RFontSizes.sm,
        fontWeight: '500',
    },
    unmatchedSearch: {
        marginTop: RSpacing.sm,
    },
    unmatchedUserList: {
        maxHeight: 150,
        marginTop: RSpacing.sm,
    },
    unmatchedUserItem: {
        paddingVertical: RSpacing.sm,
        paddingHorizontal: RSpacing.md,
        borderBottomWidth: 1,
    },
    unmatchedUserName: {
        fontSize: RFontSizes.md,
        fontWeight: '500',
    },
    unmatchedUserEmail: {
        fontSize: RFontSizes.sm,
    },
    selectedUserBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.xs,
        paddingHorizontal: RSpacing.md,
        paddingVertical: RSpacing.sm,
        borderRadius: BorderRadius.md,
    },
    selectedUserText: {
        fontSize: RFontSizes.sm,
        fontWeight: '500',
        flex: 1,
    },
    finalSummary: {
        gap: RSpacing.md,
        paddingVertical: RSpacing.xl,
    },
    finalSummaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.sm,
    },
    finalSummaryText: {
        fontSize: RFontSizes.md,
    },
    // Unmatched Detail View (Level 2) styles
    unmatchedDetailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.md,
        paddingBottom: RSpacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    unmatchedDetailBack: {
        padding: RSpacing.xs,
    },
    unmatchedDetailInfo: {
        flex: 1,
    },
    unmatchedDetailTitle: {
        fontSize: RFontSizes.lg,
        fontWeight: '600',
    },
    unmatchedDetailPhone: {
        fontSize: RFontSizes.sm,
    },
    unmatchedDetailSearch: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.sm,
        padding: RSpacing.md,
        marginTop: RSpacing.md,
        borderRadius: BorderRadius.lg,
    },
    unmatchedDetailSearchInput: {
        flex: 1,
        fontSize: RFontSizes.md,
        padding: 0,
    },
    unmatchedDetailSelected: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RSpacing.sm,
        padding: RSpacing.md,
        marginTop: RSpacing.sm,
        borderRadius: BorderRadius.md,
    },
    unmatchedDetailSelectedText: {
        flex: 1,
        fontSize: RFontSizes.md,
        fontWeight: '500',
    },
    unmatchedDetailUserList: {
        flex: 1,
        marginTop: RSpacing.sm,
    },
    unmatchedDetailUserItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: RSpacing.md,
        gap: RSpacing.md,
        borderBottomWidth: 1,
    },
    unmatchedDetailUserAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unmatchedDetailUserAvatarText: {
        color: '#fff',
        fontSize: RFontSizes.sm,
        fontWeight: '600',
    },
    unmatchedDetailUserInfo: {
        flex: 1,
    },
    unmatchedDetailUserName: {
        fontSize: RFontSizes.md,
        fontWeight: '500',
    },
    unmatchedDetailUserEmail: {
        fontSize: RFontSizes.sm,
    },
    // Unmatched List View (Level 1) styles
    unmatchedListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: RSpacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: RSpacing.sm,
    },
    unmatchedListContent: {
        flex: 1,
    },
    unmatchedListName: {
        fontSize: RFontSizes.md,
        fontWeight: '500',
        marginBottom: 2,
    },
    unmatchedListMatchedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    unmatchedListMatchedText: {
        fontSize: RFontSizes.sm,
    },
    unmatchedListHint: {
        fontSize: RFontSizes.sm,
    },
});
