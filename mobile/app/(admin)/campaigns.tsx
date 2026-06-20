import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useColorScheme,
  Pressable,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Alert } from '../../src/utils/alert';
import { getErrorMessage } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { WebDateTimeField } from '../../src/components/ui/WebDateTimeField';
import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import {
  campaignService,
  Campaign,
  CampaignType,
  RewardType,
} from '../../src/services/campaignService';
import { userService, AdminUser } from '../../src/services/userService';
import { groupService, Group } from '../../src/services/groupService';
import { getTranslatedContent } from '../../src/hooks/useTranslatedContent';
import { formatPhoneOrEmail } from '../../src/utils/phoneFormat';

const getCampaignTypes = (t: any): { value: CampaignType; label: string; icon: string; color: string }[] => [
  { value: 'auto', label: t('admin.campaignTypeAuto'), icon: 'flash', color: '#4CAF50' },
  { value: 'manual', label: t('admin.campaignTypeManual'), icon: 'hand-left', color: '#2196F3' },
];

const getRewardTypes = (t: any): { value: RewardType; label: string; icon: string; color: string }[] => [
  { value: 'manual', label: t('admin.rewardManual'), icon: 'create', color: '#9C27B0' },
  { value: 'discount_percent', label: t('admin.rewardDiscountPercent'), icon: 'pricetag', color: '#4CAF50' },
  { value: 'discount_fixed', label: t('admin.rewardDiscountFixed'), icon: 'cash', color: '#FF9800' },
  { value: 'bonus_points', label: t('admin.rewardBonusPoints'), icon: 'star', color: '#FFD700' },
  { value: 'free_coffee', label: t('admin.rewardFreeCoffee'), icon: 'cafe', color: '#8B4513' },
];

export default function AdminCampaignsScreen() {
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  // Helper for dynamic language content
  const getTitle = (item: Campaign) => getTranslatedContent(item, 'title', i18n.language);
  const getDesc = (item: Campaign) => getTranslatedContent(item, 'description', i18n.language);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Form states
  const [formTitleTr, setFormTitleTr] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescriptionTr, setFormDescriptionTr] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<CampaignType>('manual');
  const [formRewardType, setFormRewardType] = useState<RewardType>('free_coffee');
  const [formRewardValue, setFormRewardValue] = useState('');
  const [formRequiredPoints, setFormRequiredPoints] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formHasEndDate, setFormHasEndDate] = useState(false);

  // Target audience states (new - step 1)
  const [modalStep, setModalStep] = useState<1 | 2>(1); // 1: Target selection, 2: Campaign details
  const [targetAudience, setTargetAudience] = useState<'all' | 'selected' | 'groups'>('all');
  const [formSelectedUserIds, setFormSelectedUserIds] = useState<string[]>([]);
  const [formAvailableUsers, setFormAvailableUsers] = useState<AdminUser[]>([]);
  const [formLoadingUsers, setFormLoadingUsers] = useState(false);
  const [formUserSearchQuery, setFormUserSearchQuery] = useState('');

  // Group selection states
  const [formSelectedGroupIds, setFormSelectedGroupIds] = useState<string[]>([]);
  const [formAvailableGroups, setFormAvailableGroups] = useState<any[]>([]);
  const [formLoadingGroups, setFormLoadingGroups] = useState(false);


  // Date/Time states
  const [formStartDate, setFormStartDate] = useState(new Date());
  const [formEndDate, setFormEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Assign modal states (for existing campaigns)
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningCampaign, setAssigningCampaign] = useState<Campaign | null>(null);
  const [availableUsers, setAvailableUsers] = useState<AdminUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]); // Users already assigned to campaign
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Assign modal group states
  const [assignTarget, setAssignTarget] = useState<'users' | 'groups'>('users');
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');

  // Fetch campaigns from API
  const fetchCampaigns = useCallback(async () => {
    try {
      const data = await campaignService.adminGetCampaigns({ limit: 100 });
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      Alert.alert(t('common.error'), getErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCampaigns();
      setLoading(false);
    };
    loadData();
  }, [fetchCampaigns]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCampaigns();
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const resetPickerStates = () => {
    setShowStartDatePicker(false);
    setShowStartTimePicker(false);
    setShowEndDatePicker(false);
    setShowEndTimePicker(false);
  };

  const openCreateModal = async () => {
    setEditingCampaign(null);
    // Reset all form states
    setFormTitleTr('');
    setFormTitle('');
    setFormDescriptionTr('');
    setFormDescription('');
    setFormType('manual');
    setFormRewardType('free_coffee');
    setFormRewardValue('');
    setFormRequiredPoints('');
    setFormIsActive(true);
    setFormHasEndDate(false);
    setFormStartDate(new Date());
    setFormEndDate(new Date());
    resetPickerStates();

    // Reset target audience states
    setModalStep(1);
    setTargetAudience('all');
    setFormSelectedUserIds([]);
    setFormSelectedGroupIds([]);
    setFormAvailableGroups([]);
    setFormUserSearchQuery('');
    setShowModal(true);

    // Fetch users for selection
    setFormLoadingUsers(true);
    try {
      const data = await userService.adminGetUsers({ limit: 9999 });
      console.log('Users API response:', JSON.stringify(data, null, 2));
      if (data && data.users) {
        // Show all users for now (can filter for customers only later)
        setFormAvailableUsers(data.users);
      } else {
        console.warn('No users data returned from API, data:', data);
        setFormAvailableUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setFormAvailableUsers([]);
    } finally {
      setFormLoadingUsers(false);
    }
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormTitleTr(campaign.titleTr);
    setFormTitle(campaign.title);
    setFormDescriptionTr(campaign.descriptionTr || '');
    setFormDescription(campaign.description || '');
    setFormType(campaign.type);
    setFormRewardType(campaign.rewardType);
    setFormRewardValue(campaign.rewardValue?.toString() || '');
    setFormRequiredPoints(campaign.requiredPoints?.toString() || '');
    setFormIsActive(campaign.isActive);
    setFormHasEndDate(!!campaign.endDate);

    // Parse dates
    if (campaign.startDate) {
      setFormStartDate(new Date(campaign.startDate));
    } else {
      setFormStartDate(new Date());
    }

    if (campaign.endDate) {
      setFormEndDate(new Date(campaign.endDate));
    } else {
      setFormEndDate(new Date());
    }

    resetPickerStates();
    // Skip to step 2 when editing (target audience already set)
    setModalStep(2);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formTitleTr.trim()) {
      Alert.alert(t('common.error'), t('validation.enterCampaignName'));
      return;
    }

    // For new campaigns with selected users, validate selection
    if (!editingCampaign && targetAudience === 'selected' && formSelectedUserIds.length === 0) {
      Alert.alert(t('common.error'), t('admin.noUsersSelected'));
      return;
    }

    setSaving(true);
    try {
      const campaignData = {
        type: formType,
        targetType: targetAudience === 'groups' ? 'groups' : 'users' as 'users' | 'groups',
        title: formTitle || formTitleTr,
        titleTr: formTitleTr,
        description: formDescription,
        descriptionTr: formDescriptionTr || formDescription,
        rewardType: formRewardType,
        rewardValue: formRewardValue ? parseFloat(formRewardValue) : undefined,
        requiredPoints: formRequiredPoints ? parseInt(formRequiredPoints) : undefined,
        startDate: formStartDate.toISOString(),
        endDate: formHasEndDate ? formEndDate.toISOString() : undefined,
        isActive: formIsActive,
      };

      if (editingCampaign) {
        // Editing existing campaign - just update
        await campaignService.updateCampaign(editingCampaign.id, campaignData);
        Alert.alert(t('common.success'), t('admin.campaignUpdated'));
      } else {
        // Create new campaign
        const newCampaign = await campaignService.createCampaign(campaignData);

        // Assign to users based on target audience
        if (targetAudience === 'all') {
          // Assign to all users (empty userIds)
          const assignResult = await campaignService.assignCampaignBulk(newCampaign.id);
          Alert.alert(
            t('common.success'),
            `${t('admin.campaignCreated')} - ${t('admin.assignSuccess', { count: assignResult.assignedCount })}`
          );
        } else if (targetAudience === 'groups') {
          // Assign to groups
          const assignResult = await campaignService.assignCampaignBulk(newCampaign.id, undefined, formSelectedGroupIds);
          Alert.alert(
            t('common.success'),
            `${t('admin.campaignCreated')} - ${t('admin.assignSuccess', { count: assignResult.assignedCount })}`
          );
        } else {
          // Assign to selected users
          const assignResult = await campaignService.assignCampaignBulk(newCampaign.id, formSelectedUserIds);
          Alert.alert(
            t('common.success'),
            `${t('admin.campaignCreated')} - ${t('admin.assignSuccess', { count: assignResult.assignedCount })}`
          );
        }
      }

      setShowModal(false);
      await fetchCampaigns();
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (campaign: Campaign) => {
    Alert.alert(t('admin.deleteCampaignTitle'), t('admin.deleteCampaignConfirm', { name: campaign.titleTr }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          // Optimistic update
          const previousCampaigns = [...campaigns];
          setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));

          try {
            await campaignService.deleteCampaign(campaign.id);
            // Verify sync in background without blocking UI
            fetchCampaigns().catch(console.error);
            Alert.alert(t('common.success'), t('admin.campaignDeleted'));
          } catch (error: any) {
            // Rollback on error
            setCampaigns(previousCampaigns);
            Alert.alert(t('common.error'), getErrorMessage(error));
          }
        },
      },
    ]);
  };

  const handleToggleStatus = async (campaign: Campaign) => {
    try {
      await campaignService.updateCampaign(campaign.id, { isActive: !campaign.isActive });
      await fetchCampaigns();
    } catch (error: any) {
      Alert.alert(t('common.error'), getErrorMessage(error));
    }
  };

  // ==================== ASSIGN MODAL FUNCTIONS ====================

  const openAssignModal = async (campaign: Campaign) => {
    setAssigningCampaign(campaign);
    setSelectedUserIds([]);
    setAssignedUserIds([]);
    setUserSearchQuery('');

    // Determine target based on campaign configuration
    const isGroupCampaign = campaign.targetType === 'groups';
    setAssignTarget(isGroupCampaign ? 'groups' : 'users');

    setSelectedGroupIds([]);
    setGroupSearchQuery('');
    setShowAssignModal(true);

    if (isGroupCampaign) {
      // IF GROUP CAMPAIGN: Fetch groups and assigned groups
      setLoadingGroups(true);
      try {
        const [allGroups, assignedGroups] = await Promise.all([
          groupService.getAll(),
          campaignService.getCampaignAssignedGroups(campaign.id)
        ]);

        setAvailableGroups(allGroups);
        const assignedIds = assignedGroups.map(g => g.id);
        setSelectedGroupIds(assignedIds);
      } catch (error) {
        console.error('Error fetching groups:', error);
        Alert.alert(t('common.error'), getErrorMessage(error));
      } finally {
        setLoadingGroups(false);
      }
    } else {
      // IF USER CAMPAIGN: Fetch users
      setLoadingUsers(true);
      try {
        // Fetch all users
        const usersData = await userService.adminGetUsers({ limit: 9999 });

        // Try to fetch assigned users (don't fail if this errors)
        let assignedIds: string[] = [];
        try {
          const assignedData = await campaignService.getCampaignAssignedUsers(campaign.id, { limit: 100 });
          assignedIds = assignedData?.users?.map(u => u.userId) || [];
        } catch (assignedError) {
          console.warn('Could not fetch assigned users:', assignedError);
          // Continue without assigned info
        }

        setAssignedUserIds(assignedIds);

        if (usersData?.users) {
          // Sort users: assigned first, then unassigned
          const sortedUsers = [...usersData.users].sort((a, b) => {
            const aAssigned = assignedIds.includes(a.id);
            const bAssigned = assignedIds.includes(b.id);
            if (aAssigned && !bAssigned) return -1;
            if (!aAssigned && bAssigned) return 1;
            return 0;
          });
          setAvailableUsers(sortedUsers);
        } else {
          console.warn('No users data returned from API');
          setAvailableUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        Alert.alert(t('common.error'), getErrorMessage(error));
        setAvailableUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssignToAll = async () => {
    if (!assigningCampaign) return;

    Alert.alert(
      t('admin.assignToAll'),
      t('admin.assignToAll') + '?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            setAssigning(true);
            try {
              const result = await campaignService.assignCampaignBulk(assigningCampaign.id);
              Alert.alert(
                t('common.success'),
                t('admin.assignSuccess', { count: result.assignedCount })
              );
              setShowAssignModal(false);
            } catch (error: any) {
              Alert.alert(t('common.error'), getErrorMessage(error));
            } finally {
              setAssigning(false);
            }
          },
        },
      ]
    );
  };

  // Fetch groups logic moved to openAssignModal for better UX
  // Kept empty effect if needed for other side effects
  useEffect(() => {
  }, [showAssignModal, assignTarget]);

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleAssignToSelected = async () => {
    if (!assigningCampaign) return;

    if (assignTarget === 'users' && selectedUserIds.length === 0) {
      Alert.alert(t('common.error'), t('admin.noUsersSelected'));
      return;
    }

    if (assignTarget === 'groups' && selectedGroupIds.length === 0) {
      Alert.alert(t('common.error'), t('admin.noGroupsSelected'));
      return;
    }

    setAssigning(true);
    try {
      // Pass either userIds or groupIds based on mode
      const userIdsToAssign = assignTarget === 'users' ? selectedUserIds : undefined;
      const groupIdsToAssign = assignTarget === 'groups' ? selectedGroupIds : undefined;

      const result = await campaignService.assignCampaignBulk(
        assigningCampaign.id,
        userIdsToAssign,
        groupIdsToAssign
      );

      Alert.alert(
        t('common.success'),
        t('admin.assignSuccess', { count: result.assignedCount })
      );
      setShowAssignModal(false);
    } catch (error: any) {
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setAssigning(false);
    }
  };

  const filteredGroups = availableGroups.filter((group) => {
    const searchLower = groupSearchQuery.toLowerCase();
    return group.name.toLowerCase().includes(searchLower);
  });

  const filteredUsers = availableUsers.filter((user) => {
    if (!userSearchQuery) return true;
    const query = userSearchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query)
    );
  });

  // Filtered users for campaign creation form
  const filteredFormUsers = formAvailableUsers.filter((user) => {
    if (!formUserSearchQuery) return true;
    const query = formUserSearchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query)
    );
  });

  const toggleFormUserSelection = (userId: string) => {
    setFormSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const getCampaignTypeInfo = (type: CampaignType) => {
    const types = getCampaignTypes(t);
    return types.find((ct) => ct.value === type) || types[0];
  };

  const getRewardTypeInfo = (type: RewardType) => {
    const types = getRewardTypes(t);
    return types.find((rt) => rt.value === type) || types[0];
  };

  const formatCampaignDateRange = (campaign: Campaign) => {
    if (!campaign.startDate) return t('admin.noDateSpecified');

    const startDate = new Date(campaign.startDate);
    const startStr = startDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (campaign.endDate) {
      const endDate = new Date(campaign.endDate);
      const endStr = endDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${startStr} - ${endStr}`;
    }
    return `${startStr} - ${t('admin.noEndDate')}`;
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderCampaign = ({ item }: { item: Campaign }) => {
    const typeInfo = getCampaignTypeInfo(item.type);
    const rewardInfo = getRewardTypeInfo(item.rewardType);

    return (
      <View style={[styles.campaignCard, { backgroundColor: colors.card }, Shadows.sm]}>
        <View style={styles.campaignHeader}>
          <View style={[styles.typeIcon, { backgroundColor: rewardInfo.color + '20' }]}>
            <Ionicons name={rewardInfo.icon as any} size={24} color={rewardInfo.color} />
          </View>
          <View style={styles.campaignInfo}>
            <View style={styles.titleRow}>
              <Text style={[styles.campaignTitle, { color: colors.text }]} numberOfLines={1}>
                {getTitle(item)}
              </Text>
              <View
                style={[styles.statusBadge, { backgroundColor: item.isActive ? colors.success + '20' : colors.error + '20' }]}
              >
                <Text style={[styles.statusBadgeText, { color: item.isActive ? colors.success : colors.error }]}>
                  {item.isActive ? t('common.active') : t('common.inactive')}
                </Text>
              </View>
            </View>
            <Text style={[styles.campaignDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {getDesc(item) || t('admin.noDescription')}
            </Text>
            {/* Date Range */}
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
              <Text style={[styles.dateText, { color: colors.textTertiary }]}>
                {formatCampaignDateRange(item)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.campaignStats, { borderTopColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{rewardInfo.label}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('admin.reward')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{item.rewardValue || '-'}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('admin.value')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{typeInfo.label}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('admin.type')}</Text>
          </View>
        </View>

        <View style={styles.campaignActions}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: '#2196F3' + '20' }]}
            onPress={() => openAssignModal(item)}
          >
            <Ionicons name="people" size={18} color="#2196F3" />
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => handleToggleStatus(item)}
          >
            <Ionicons name={item.isActive ? 'pause' : 'play'} size={18} color={colors.text} />
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="pencil" size={18} color={colors.text} />
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.error + '15' }]}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash" size={18} color={colors.error} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Stats Summary */}
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          {t('admin.totalCampaigns', { count: campaigns.length })}
        </Text>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          {t('admin.activeCampaigns', { count: campaigns.filter((c) => c.isActive).length })}
        </Text>
      </View>

      {/* Campaigns List */}
      <FlatList
        data={campaigns}
        keyExtractor={(item) => item.id}
        renderItem={renderCampaign}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="gift-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('admin.noCampaigns')}</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('admin.noCampaignsDesc')}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: RSpacing.md }} />}
      />

      {/* FAB - Create Campaign */}
      <Pressable style={[styles.fab, { backgroundColor: colors.text }]} onPress={openCreateModal}>
        <Ionicons name="add" size={28} color={colors.card} />
      </Pressable>

      {/* Create/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          {/* Background is handled by styles.modalOverlay's background color, 
              but we need to make sure KAV doesn't inherit background if we split them.
              Actually, styles.modalOverlay has the background.
              We should create a container that has the alignment, 
              render a separate bg layer, 
              and then the KAV.
          */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />


          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, justifyContent: 'flex-end' }}
            keyboardVerticalOffset={0}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.background, maxHeight: '95%' }]}>
              <View style={styles.modalHeader}>
                <View style={{ width: 40 }} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editingCampaign
                    ? t('admin.editCampaign')
                    : modalStep === 1
                      ? t('admin.step1Title')
                      : t('admin.step2Title')}
                </Text>
                <Pressable onPress={() => {
                  resetPickerStates();
                  setShowModal(false);
                }} style={{ padding: RSpacing.xs }}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              {/* Step Indicator - only for new campaigns */}
              {!editingCampaign && (
                <View style={styles.stepIndicator}>
                  <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
                  <View style={[styles.stepLine, { backgroundColor: modalStep === 2 ? colors.primary : colors.border }]} />
                  <View style={[styles.stepDot, { backgroundColor: modalStep === 2 ? colors.primary : colors.border }]} />
                </View>
              )}

              {/* STEP 1: Target Audience Selection */}
              {modalStep === 1 && !editingCampaign && (
                <View style={styles.stepContent}>
                  <Text style={[styles.stepSubtitle, { color: colors.text }]}>
                    {t('admin.targetAudience')}
                  </Text>

                  {/* Option not selected yet - show all options */}
                  {targetAudience === 'all' && (
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {/* All Users Option */}
                      <Pressable
                        style={[
                          styles.audienceOption,
                          {
                            backgroundColor: colors.primary + '15',
                            borderColor: colors.primary,
                          },
                        ]}
                        onPress={() => setTargetAudience('all')}
                      >
                        <View style={[styles.audienceIconContainer, { backgroundColor: '#4CAF50' + '20' }]}>
                          <Ionicons name="globe-outline" size={28} color="#4CAF50" />
                        </View>
                        <View style={styles.audienceTextContainer}>
                          <Text style={[styles.audienceTitle, { color: colors.text }]}>
                            {t('admin.allUsers')}
                          </Text>
                          <Text style={[styles.audienceDesc, { color: colors.textSecondary }]}>
                            {t('admin.allUsersDesc')}
                          </Text>
                        </View>
                        <Ionicons
                          name="radio-button-on"
                          size={24}
                          color={colors.primary}
                        />
                      </Pressable>

                      {/* Selected Users Option */}
                      <Pressable
                        style={[
                          styles.audienceOption,
                          {
                            backgroundColor: colors.backgroundSecondary,
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() => setTargetAudience('selected')}
                      >
                        <View style={[styles.audienceIconContainer, { backgroundColor: '#2196F3' + '20' }]}>
                          <Ionicons name="person-circle-outline" size={28} color="#2196F3" />
                        </View>
                        <View style={styles.audienceTextContainer}>
                          <Text style={[styles.audienceTitle, { color: colors.text }]}>
                            {t('admin.selectedUsers')}
                          </Text>
                          <Text style={[styles.audienceDesc, { color: colors.textSecondary }]}>
                            {t('admin.selectedUsersDesc')}
                          </Text>
                        </View>
                        <Ionicons
                          name="radio-button-off"
                          size={24}
                          color={colors.textTertiary}
                        />
                      </Pressable>

                      {/* Groups Option */}
                      <Pressable
                        style={[
                          styles.audienceOption,
                          {
                            backgroundColor: colors.backgroundSecondary,
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={async () => {
                          setTargetAudience('groups');
                          if (formAvailableGroups.length === 0) {
                            setFormLoadingGroups(true);
                            try {
                              const data = await groupService.getAll();
                              setFormAvailableGroups(data || []);
                            } catch (error) {
                              console.error('Error fetching groups:', error);
                            } finally {
                              setFormLoadingGroups(false);
                            }
                          }
                        }}
                      >
                        <View style={[styles.audienceIconContainer, { backgroundColor: '#FF9800' + '20' }]}>
                          <Ionicons name="people-circle-outline" size={28} color="#FF9800" />
                        </View>
                        <View style={styles.audienceTextContainer}>
                          <Text style={[styles.audienceTitle, { color: colors.text }]}>
                            {t('admin.groupsOption')}
                          </Text>
                          <Text style={[styles.audienceDesc, { color: colors.textSecondary }]}>
                            {t('admin.groupsOptionDesc')}
                          </Text>
                        </View>
                        <Ionicons
                          name="radio-button-off"
                          size={24}
                          color={colors.textTertiary}
                        />
                      </Pressable>
                    </ScrollView>
                  )}

                  {/* Selected Users Mode - Collapsed Header */}
                  {targetAudience === 'selected' && (
                    <View style={styles.collapsedModeContainer}>
                      {/* Selected option header with back button */}
                      <Pressable
                        style={[styles.collapsedHeader, { backgroundColor: '#2196F3' + '15', borderColor: '#2196F3' }]}
                        onPress={() => {
                          setTargetAudience('all');
                          setFormSelectedUserIds([]);
                        }}
                      >
                        <Ionicons name="arrow-back" size={20} color="#2196F3" />
                        <View style={[styles.audienceIconContainer, { backgroundColor: '#2196F3' + '20', marginLeft: 8 }]}>
                          <Ionicons name="person-circle-outline" size={24} color="#2196F3" />
                        </View>
                        <Text style={[styles.collapsedTitle, { color: colors.text }]}>
                          {t('admin.selectedUsers')}
                        </Text>
                        {formSelectedUserIds.length > 0 && (
                          <View style={[styles.countBadge, { backgroundColor: '#2196F3' }]}>
                            <Text style={styles.countBadgeText}>{formSelectedUserIds.length}</Text>
                          </View>
                        )}
                      </Pressable>

                      {/* Search */}
                      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
                        <Ionicons name="search" size={18} color={colors.textTertiary} />
                        <TextInput
                          style={[styles.searchInput, { color: colors.text }]}
                          placeholder={t('admin.searchUsers')}
                          placeholderTextColor={colors.textTertiary}
                          value={formUserSearchQuery}
                          onChangeText={setFormUserSearchQuery}
                        />
                      </View>

                      {/* Users List - Scrollable with max height */}
                      <View style={styles.scrollableListContainer}>
                        {formLoadingUsers ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                          </View>
                        ) : (
                          <FlatList
                            data={filteredFormUsers}
                            keyExtractor={(item) => item.id}
                            style={styles.scrollableList}
                            nestedScrollEnabled
                            renderItem={({ item }) => {
                              const isSelected = formSelectedUserIds.includes(item.id);
                              return (
                                <Pressable
                                  style={[
                                    styles.userItem,
                                    { backgroundColor: isSelected ? colors.primary + '15' : 'transparent' },
                                  ]}
                                  onPress={() => toggleFormUserSelection(item.id)}
                                >
                                  <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.userAvatarText}>
                                      {item.firstName[0]}{item.lastName[0]}
                                    </Text>
                                  </View>
                                  <View style={styles.userInfo}>
                                    <Text style={[styles.userName, { color: colors.text }]}>
                                      {item.firstName} {item.lastName}
                                    </Text>
                                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                                      {formatPhoneOrEmail(item.phone, item.email)}
                                    </Text>
                                  </View>
                                  <Ionicons
                                    name={isSelected ? 'checkbox' : 'square-outline'}
                                    size={24}
                                    color={isSelected ? colors.primary : colors.textTertiary}
                                  />
                                </Pressable>
                              );
                            }}
                            ListEmptyComponent={() => (
                              <View style={styles.emptyUsers}>
                                <Text style={[styles.emptyUsersText, { color: colors.textSecondary }]}>
                                  {t('admin.noUsersDesc')}
                                </Text>
                              </View>
                            )}
                          />
                        )}
                      </View>
                    </View>
                  )}

                  {/* Groups Mode - Collapsed Header */}
                  {targetAudience === 'groups' && (
                    <View style={styles.collapsedModeContainer}>
                      {/* Selected option header with back button */}
                      <Pressable
                        style={[styles.collapsedHeader, { backgroundColor: '#FF9800' + '15', borderColor: '#FF9800' }]}
                        onPress={() => {
                          setTargetAudience('all');
                          setFormSelectedGroupIds([]);
                        }}
                      >
                        <Ionicons name="arrow-back" size={20} color="#FF9800" />
                        <View style={[styles.audienceIconContainer, { backgroundColor: '#FF9800' + '20', marginLeft: 8 }]}>
                          <Ionicons name="people-circle-outline" size={24} color="#FF9800" />
                        </View>
                        <Text style={[styles.collapsedTitle, { color: colors.text }]}>
                          {t('admin.groupsOption')}
                        </Text>
                        {formSelectedGroupIds.length > 0 && (
                          <View style={[styles.countBadge, { backgroundColor: '#FF9800' }]}>
                            <Text style={styles.countBadgeText}>{formSelectedGroupIds.length}</Text>
                          </View>
                        )}
                      </Pressable>

                      {/* Groups List - Scrollable with max height */}
                      <View style={styles.scrollableListContainer}>
                        {formLoadingGroups ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                          </View>
                        ) : (
                          <FlatList
                            data={formAvailableGroups}
                            keyExtractor={(item) => item.id}
                            style={styles.scrollableList}
                            nestedScrollEnabled
                            renderItem={({ item }) => {
                              const isSelected = formSelectedGroupIds.includes(item.id);
                              return (
                                <Pressable
                                  style={[
                                    styles.userItem,
                                    { backgroundColor: isSelected ? colors.primary + '15' : 'transparent' },
                                  ]}
                                  onPress={() => {
                                    setFormSelectedGroupIds((prev) =>
                                      prev.includes(item.id)
                                        ? prev.filter((id) => id !== item.id)
                                        : [...prev, item.id]
                                    );
                                  }}
                                >
                                  <View style={[styles.userAvatar, { backgroundColor: '#FF9800' }]}>
                                    <Ionicons name="people" size={16} color="#FFFFFF" />
                                  </View>
                                  <View style={styles.userInfo}>
                                    <Text style={[styles.userName, { color: colors.text }]}>
                                      {item.name}
                                    </Text>
                                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                                      {item.memberCount || 0} üye
                                    </Text>
                                  </View>
                                  <Ionicons
                                    name={isSelected ? 'checkbox' : 'square-outline'}
                                    size={24}
                                    color={isSelected ? colors.primary : colors.textTertiary}
                                  />
                                </Pressable>
                              );
                            }}
                            ListEmptyComponent={() => (
                              <View style={styles.emptyUsers}>
                                <Text style={[styles.emptyUsersText, { color: colors.textSecondary }]}>
                                  Henüz grup oluşturulmamış
                                </Text>
                              </View>
                            )}
                          />
                        )}
                      </View>
                    </View>
                  )}


                  {/* Next Button */}
                  <Pressable
                    style={[styles.nextButton, { backgroundColor: colors.text }]}
                    onPress={() => {
                      if (targetAudience === 'selected' && formSelectedUserIds.length === 0) {
                        Alert.alert(t('common.error'), t('admin.noUsersSelected'));
                        return;
                      }
                      if (targetAudience === 'groups' && formSelectedGroupIds.length === 0) {
                        Alert.alert(t('common.error'), t('admin.noGroupsSelected'));
                        return;
                      }
                      setModalStep(2);
                    }}
                  >
                    <Text style={[styles.nextButtonText, { color: colors.card }]}>{t('admin.nextStep')}</Text>
                    <Ionicons name="arrow-forward" size={20} color={colors.card} />
                  </Pressable>
                </View>
              )}

              {/* STEP 2: Campaign Details (existing form) */}
              {(modalStep === 2 || editingCampaign) && (
                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  {/* Title TR */}
                  <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.campaignNameTr')}</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                    value={formTitleTr}
                    onChangeText={setFormTitleTr}
                    placeholder={t('admin.campaignNamePlaceholderTr')}
                    placeholderTextColor={colors.textTertiary}
                  />

                  {/* Title EN */}
                  <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.campaignNameEn')}</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                    value={formTitle}
                    onChangeText={setFormTitle}
                    placeholder={t('admin.campaignNamePlaceholderEn')}
                    placeholderTextColor={colors.textTertiary}
                  />

                  {/* Description TR */}
                  <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.campaignDescTr')}</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.textArea,
                      { backgroundColor: colors.backgroundSecondary, color: colors.text },
                    ]}
                    value={formDescriptionTr}
                    onChangeText={setFormDescriptionTr}
                    placeholder={t('admin.campaignDescPlaceholderTr')}
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={3}
                  />

                  {/* Description EN */}
                  <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.campaignDescEn')}</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.textArea,
                      { backgroundColor: colors.backgroundSecondary, color: colors.text },
                    ]}
                    value={formDescription}
                    onChangeText={setFormDescription}
                    placeholder={t('admin.campaignDescPlaceholderEn')}
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={3}
                  />


                  {/* Reward Type Selection */}
                  <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.rewardType')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rewardTypeScroll}>
                    {getRewardTypes(t).map((type) => (
                      <Pressable
                        key={type.value}
                        style={[
                          styles.rewardTypeOption,
                          { backgroundColor: colors.backgroundSecondary },
                          formRewardType === type.value && { backgroundColor: type.color + '30', borderColor: type.color },
                        ]}
                        onPress={() => setFormRewardType(type.value)}
                      >
                        <Ionicons name={type.icon as any} size={18} color={formRewardType === type.value ? type.color : colors.textSecondary} />
                        <Text
                          style={[
                            styles.rewardTypeText,
                            { color: formRewardType === type.value ? type.color : colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {type.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  {/* Reward Value */}
                  {(formRewardType === 'manual' || formRewardType === 'discount_percent' || formRewardType === 'discount_fixed' || formRewardType === 'bonus_points') && (
                    <>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>
                        {formRewardType === 'manual' ? t('admin.manualRewardLabel') :
                          formRewardType === 'discount_percent' ? t('admin.discountPercent') :
                            formRewardType === 'discount_fixed' ? t('admin.discountFixed') :
                              t('admin.bonusPointsLabel')}
                      </Text>
                      <TextInput
                        style={[styles.textInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                        value={formRewardValue}
                        onChangeText={setFormRewardValue}
                        placeholder={formRewardType === 'manual' ? t('admin.manualRewardPlaceholder') :
                          formRewardType === 'discount_percent' ? t('admin.exampleDiscount') :
                            formRewardType === 'discount_fixed' ? t('admin.exampleAmount') :
                              t('admin.examplePoints')}
                        placeholderTextColor={colors.textTertiary}
                        keyboardType={formRewardType === 'manual' ? 'default' : 'number-pad'}
                      />
                    </>
                  )}

                  {/* Start Date & Time */}
                  <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.startDateTime')}</Text>
                  {Platform.OS === 'web' && (
                    <WebDateTimeField mode="datetime" value={formStartDate} onChange={setFormStartDate} />
                  )}
                  {Platform.OS !== 'web' && (
                  <View style={styles.dateTimeRow}>
                    <Pressable
                      style={[styles.dateTimeButton, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => {
                        setShowStartTimePicker(false);
                        setShowEndDatePicker(false);
                        setShowEndTimePicker(false);
                        setShowStartDatePicker(!showStartDatePicker);
                      }}
                    >
                      <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                      <Text style={[styles.dateTimeText, { color: colors.text }]}>{formatDate(formStartDate)}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.dateTimeButton, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => {
                        setShowStartDatePicker(false);
                        setShowEndDatePicker(false);
                        setShowEndTimePicker(false);
                        setShowStartTimePicker(!showStartTimePicker);
                      }}
                    >
                      <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                      <Text style={[styles.dateTimeText, { color: colors.text }]}>{formatTime(formStartDate)}</Text>
                    </Pressable>
                  </View>
                  )}

                  {/* Inline Start Date Picker for iOS */}
                  {Platform.OS === 'ios' && showStartDatePicker && (
                    <View style={[styles.inlineDatePicker, { backgroundColor: colors.backgroundSecondary }]}>
                      <DateTimePicker
                        value={formStartDate}
                        mode="date"
                        display="spinner"
                        themeVariant={isDark ? 'dark' : 'light'}
                        onChange={(_, date) => {
                          if (date) {
                            const newDate = new Date(formStartDate);
                            newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                            setFormStartDate(newDate);
                          }
                        }}
                        style={{ height: 180, width: '100%' }}
                      />
                      <Pressable
                        style={[styles.inlineDatePickerDone, { backgroundColor: colors.text }]}
                        onPress={() => setShowStartDatePicker(false)}
                      >
                        <Text style={{ color: colors.card, fontWeight: '600', fontSize: 16 }}>{t('common.done')}</Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Inline Start Time Picker for iOS */}
                  {Platform.OS === 'ios' && showStartTimePicker && (
                    <View style={[styles.inlineDatePicker, { backgroundColor: colors.backgroundSecondary }]}>
                      <DateTimePicker
                        value={formStartDate}
                        mode="time"
                        display="spinner"
                        themeVariant={isDark ? 'dark' : 'light'}
                        onChange={(_, date) => {
                          if (date) {
                            const newDate = new Date(formStartDate);
                            newDate.setHours(date.getHours(), date.getMinutes());
                            setFormStartDate(newDate);
                          }
                        }}
                        style={{ height: 180, width: '100%' }}
                      />
                      <Pressable
                        style={[styles.inlineDatePickerDone, { backgroundColor: colors.text }]}
                        onPress={() => setShowStartTimePicker(false)}
                      >
                        <Text style={{ color: colors.card, fontWeight: '600', fontSize: 16 }}>{t('common.done')}</Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Has End Date Toggle */}
                  <View style={styles.switchRow}>
                    <Text style={[styles.inputLabel, { color: colors.text, marginBottom: 0, marginTop: 0 }]}>{t('admin.hasEndDate')}</Text>
                    <Switch
                      value={formHasEndDate}
                      onValueChange={setFormHasEndDate}
                      trackColor={{ false: colors.border, true: colors.primary + '50' }}
                      thumbColor={formHasEndDate ? colors.primary : colors.backgroundSecondary}
                    />
                  </View>

                  {/* End Date & Time (conditional) */}
                  {formHasEndDate && (
                    <>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>{t('admin.endDateTime')}</Text>
                      {Platform.OS === 'web' && (
                        <WebDateTimeField mode="datetime" value={formEndDate} onChange={setFormEndDate} />
                      )}
                      {Platform.OS !== 'web' && (
                      <View style={styles.dateTimeRow}>
                        <Pressable
                          style={[styles.dateTimeButton, { backgroundColor: colors.backgroundSecondary }]}
                          onPress={() => {
                            setShowStartDatePicker(false);
                            setShowStartTimePicker(false);
                            setShowEndTimePicker(false);
                            setShowEndDatePicker(!showEndDatePicker);
                          }}
                        >
                          <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                          <Text style={[styles.dateTimeText, { color: colors.text }]}>{formatDate(formEndDate)}</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.dateTimeButton, { backgroundColor: colors.backgroundSecondary }]}
                          onPress={() => {
                            setShowStartDatePicker(false);
                            setShowStartTimePicker(false);
                            setShowEndDatePicker(false);
                            setShowEndTimePicker(!showEndTimePicker);
                          }}
                        >
                          <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                          <Text style={[styles.dateTimeText, { color: colors.text }]}>{formatTime(formEndDate)}</Text>
                        </Pressable>
                      </View>
                      )}

                      {/* Inline End Date Picker for iOS */}
                      {Platform.OS === 'ios' && showEndDatePicker && (
                        <View style={[styles.inlineDatePicker, { backgroundColor: colors.backgroundSecondary }]}>
                          <DateTimePicker
                            value={formEndDate}
                            mode="date"
                            display="spinner"
                            themeVariant={isDark ? 'dark' : 'light'}
                            onChange={(_, date) => {
                              if (date) {
                                const newDate = new Date(formEndDate);
                                newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                                setFormEndDate(newDate);
                              }
                            }}
                            style={{ height: 180, width: '100%' }}
                          />
                          <Pressable
                            style={[styles.inlineDatePickerDone, { backgroundColor: colors.text }]}
                            onPress={() => setShowEndDatePicker(false)}
                          >
                            <Text style={{ color: colors.card, fontWeight: '600', fontSize: 16 }}>{t('common.done')}</Text>
                          </Pressable>
                        </View>
                      )}

                      {/* Inline End Time Picker for iOS */}
                      {Platform.OS === 'ios' && showEndTimePicker && (
                        <View style={[styles.inlineDatePicker, { backgroundColor: colors.backgroundSecondary }]}>
                          <DateTimePicker
                            value={formEndDate}
                            mode="time"
                            display="spinner"
                            themeVariant={isDark ? 'dark' : 'light'}
                            onChange={(_, date) => {
                              if (date) {
                                const newDate = new Date(formEndDate);
                                newDate.setHours(date.getHours(), date.getMinutes());
                                setFormEndDate(newDate);
                              }
                            }}
                            style={{ height: 180, width: '100%' }}
                          />
                          <Pressable
                            style={[styles.inlineDatePickerDone, { backgroundColor: colors.text }]}
                            onPress={() => setShowEndTimePicker(false)}
                          >
                            <Text style={{ color: colors.card, fontWeight: '600', fontSize: 16 }}>{t('common.done')}</Text>
                          </Pressable>
                        </View>
                      )}
                    </>
                  )}

                  {/* Active Status */}
                  <View style={styles.switchRow}>
                    <Text style={[styles.inputLabel, { color: colors.text, marginBottom: 0, marginTop: 0 }]}>{t('common.active')}</Text>
                    <Switch
                      value={formIsActive}
                      onValueChange={setFormIsActive}
                      trackColor={{ false: colors.border, true: colors.primary + '50' }}
                      thumbColor={formIsActive ? colors.primary : colors.backgroundSecondary}
                    />
                  </View>

                  {/* Extra spacing at the bottom for keyboard */}
                  <View style={{ height: 20 }} />
                </ScrollView>
              )}

              {/* Action Buttons - different based on context */}
              {(modalStep === 2 || editingCampaign) && (
                <View style={[styles.modalActions, { backgroundColor: colors.background }]}>
                  {/* Back button - only for new campaigns in step 2 */}
                  {!editingCampaign && (
                    <Pressable
                      style={[styles.modalCancelButton, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => setModalStep(1)}
                      disabled={saving}
                    >
                      <Text style={[styles.modalCancelText, { color: colors.text }]}>{t('admin.previousStep')}</Text>
                    </Pressable>
                  )}
                  {editingCampaign && (
                    <Pressable
                      style={[styles.modalCancelButton, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => {
                        resetPickerStates();
                        setShowModal(false);
                      }}
                      disabled={saving}
                    >
                      <Text style={[styles.modalCancelText, { color: colors.text }]}>{t('common.cancel')}</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={[styles.modalSaveButton, { backgroundColor: colors.text, opacity: saving ? 0.6 : 1 }]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={colors.card} />
                    ) : (
                      <Text style={[styles.modalSaveText, { color: colors.card }]}>{editingCampaign ? t('admin.update') : t('admin.create')}</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Date/Time Pickers for Android */}
      {Platform.OS === 'android' && showStartDatePicker && (
        <DateTimePicker
          value={formStartDate}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setShowStartDatePicker(false);
            if (date) {
              const newDate = new Date(formStartDate);
              newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
              setFormStartDate(newDate);
            }
          }}
        />
      )}
      {Platform.OS === 'android' && showStartTimePicker && (
        <DateTimePicker
          value={formStartDate}
          mode="time"
          display="default"
          onChange={(_, date) => {
            setShowStartTimePicker(false);
            if (date) {
              const newDate = new Date(formStartDate);
              newDate.setHours(date.getHours(), date.getMinutes());
              setFormStartDate(newDate);
            }
          }}
        />
      )}
      {Platform.OS === 'android' && showEndDatePicker && (
        <DateTimePicker
          value={formEndDate}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setShowEndDatePicker(false);
            if (date) {
              const newDate = new Date(formEndDate);
              newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
              setFormEndDate(newDate);
            }
          }}
        />
      )}
      {Platform.OS === 'android' && showEndTimePicker && (
        <DateTimePicker
          value={formEndDate}
          mode="time"
          display="default"
          onChange={(_, date) => {
            setShowEndTimePicker(false);
            if (date) {
              const newDate = new Date(formEndDate);
              newDate.setHours(date.getHours(), date.getMinutes());
              setFormEndDate(newDate);
            }
          }}
        />
      )}

      {/* ==================== ASSIGN MODAL ==================== */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('admin.assignCampaign')}
              </Text>
              <Pressable onPress={() => setShowAssignModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {assigningCampaign && (
              <View style={[styles.assignCampaignInfo, { backgroundColor: colors.backgroundSecondary }]}>
                <Text style={[styles.assignCampaignTitle, { color: colors.text }]}>
                  {getTitle(assigningCampaign)}
                </Text>
              </View>
            )}

            {/* Assign to All Button - Always visible at top */}
            {/* Assign to All Button - Only visible for Users target */}
            {assignTarget === 'users' && (
              <>
                <Pressable
                  style={[styles.assignAllButton, { backgroundColor: '#4CAF50' }]}
                  onPress={handleAssignToAll}
                  disabled={assigning}
                >
                  <Ionicons name="people" size={20} color="#FFFFFF" />
                  <Text style={styles.assignAllButtonText}>{t('admin.assignToAll')}</Text>
                </Pressable>

                <View style={[styles.dividerWithText, { borderColor: colors.border }]}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
                    {t('common.or')}
                  </Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                </View>
              </>
            )}

            {/* Selection Type Toggle removed - using campaign.targetType instead */}



            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="search" size={18} color={colors.textTertiary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={assignTarget === 'users' ? t('admin.searchUsers') : t('admin.searchGroups')}
                placeholderTextColor={colors.textTertiary}
                value={assignTarget === 'users' ? userSearchQuery : groupSearchQuery}
                onChangeText={assignTarget === 'users' ? setUserSearchQuery : setGroupSearchQuery}
              />
            </View>

            {/* Selected Count */}
            {(assignTarget === 'users' ? selectedUserIds.length : selectedGroupIds.length) > 0 && (
              <Text style={[styles.selectedCount, { color: colors.primary }]}>
                {t('admin.selectedCount', { count: assignTarget === 'users' ? selectedUserIds.length : selectedGroupIds.length })}
              </Text>
            )}

            {/* Assigned Count */}
            {assignedUserIds.length > 0 && (
              <Text style={[styles.selectedCount, { color: colors.success, marginTop: 4 }]}>
                {t('admin.alreadyAssigned', { count: assignedUserIds.length })}
              </Text>
            )}

            {/* User or Group List */}
            {loadingUsers || loadingGroups ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              assignTarget === 'users' ? (
                /* USERS LIST */
                <FlatList
                  data={filteredUsers}
                  keyExtractor={(item) => item.id}
                  style={styles.usersList}
                  renderItem={({ item }) => {
                    const isSelected = selectedUserIds.includes(item.id);
                    const isAlreadyAssigned = assignedUserIds.includes(item.id);
                    return (
                      <Pressable
                        style={[
                          styles.userItem,
                          {
                            backgroundColor: isAlreadyAssigned
                              ? colors.success + '15'
                              : isSelected
                                ? colors.primary + '15'
                                : 'transparent'
                          },
                        ]}
                        onPress={() => !isAlreadyAssigned && toggleUserSelection(item.id)}
                        disabled={isAlreadyAssigned}
                      >
                        <View style={[styles.userAvatar, { backgroundColor: isAlreadyAssigned ? colors.success : colors.primary }]}>
                          <Text style={styles.userAvatarText}>
                            {item.firstName[0]}{item.lastName[0]}
                          </Text>
                        </View>
                        <View style={styles.userInfo}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.userName, { color: isAlreadyAssigned ? colors.success : colors.text }]}>
                              {item.firstName} {item.lastName}
                            </Text>
                            {isAlreadyAssigned && (
                              <View style={[styles.assignedBadge, { backgroundColor: colors.success }]}>
                                <Text style={styles.assignedBadgeText}>{t('admin.assigned')}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                            {formatPhoneOrEmail(item.phone, item.email)}
                          </Text>
                        </View>
                        {isAlreadyAssigned ? (
                          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                        ) : (
                          <Ionicons
                            name={isSelected ? 'checkbox' : 'square-outline'}
                            size={24}
                            color={isSelected ? colors.primary : colors.textTertiary}
                          />
                        )}
                      </Pressable>
                    );
                  }}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyUsers}>
                      <Text style={[styles.emptyUsersText, { color: colors.textSecondary }]}>
                        {t('admin.noUsersDesc')}
                      </Text>
                    </View>
                  )}
                />
              ) : (
                /* GROUPS LIST */
                <FlatList
                  data={filteredGroups}
                  keyExtractor={(item) => item.id}
                  style={styles.usersList}
                  renderItem={({ item }) => {
                    const isSelected = selectedGroupIds.includes(item.id);
                    return (
                      <Pressable
                        style={[
                          styles.userItem,
                          {
                            backgroundColor: isSelected
                              ? colors.primary + '15'
                              : 'transparent'
                          },
                        ]}
                        onPress={() => toggleGroupSelection(item.id)}
                      >
                        <View style={[styles.userAvatar, { backgroundColor: colors.secondary }]}>
                          <Ionicons name="people" size={20} color="#FFF" />
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={[styles.userName, { color: colors.text }]}>
                            {item.name}
                          </Text>
                          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                            {t('groups.memberCount', { count: item.memberCount || 0 })}
                          </Text>
                        </View>
                        <Ionicons
                          name={isSelected ? 'checkbox' : 'square-outline'}
                          size={24}
                          color={isSelected ? colors.primary : colors.textTertiary}
                        />
                      </Pressable>
                    );
                  }}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyUsers}>
                      <Text style={[styles.emptyUsersText, { color: colors.textSecondary }]}>
                        {t('admin.noGroupsDesc')}
                      </Text>
                    </View>
                  )}
                />
              )
            )}

            {/* Assign to Selected Button */}
            <Pressable
              style={[
                styles.assignSelectedButton,
                {
                  backgroundColor: selectedUserIds.length > 0 ? colors.text : colors.border,
                },
              ]}
              onPress={handleAssignToSelected}
              disabled={assigning || (assignTarget === 'users' ? selectedUserIds.length === 0 : selectedGroupIds.length === 0)}
            >
              {assigning ? (
                <ActivityIndicator size="small" color={colors.card} />
              ) : (
                <Text style={[styles.assignSelectedButtonText, { color: colors.card }]}>
                  {t('admin.assignToSelected')} ({assignTarget === 'users' ? selectedUserIds.length : selectedGroupIds.length})
                </Text>
              )}
            </Pressable>
          </View>
        </View>
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
  loadingText: {
    fontSize: RFontSizes.md,
    marginTop: RSpacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: RSpacing.lg,
    paddingVertical: RSpacing.sm,
  },
  summaryText: {
    fontSize: RFontSizes.sm,
  },
  listContent: {
    padding: RSpacing.md,
    paddingBottom: 100,
  },
  campaignCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  campaignHeader: {
    flexDirection: 'row',
    padding: RSpacing.md,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  campaignInfo: {
    flex: 1,
    marginLeft: RSpacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: RSpacing.sm,
  },
  campaignTitle: {
    flex: 1,
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: RFontSizes.xs,
    fontWeight: '500',
  },
  campaignDescription: {
    fontSize: RFontSizes.sm,
    marginTop: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  dateText: {
    fontSize: RFontSizes.xs,
  },
  campaignStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RSpacing.sm,
    borderTopWidth: 1,
    marginHorizontal: RSpacing.md,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: RSpacing.md,
    flex: 1,
  },
  statValue: {
    fontSize: RFontSizes.sm,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: RFontSizes.xs,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  campaignActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: RSpacing.sm,
    padding: RSpacing.md,
    paddingTop: 0,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: RFontSizes.xl,
    fontWeight: '600',
    marginTop: RSpacing.lg,
  },
  emptyText: {
    fontSize: RFontSizes.md,
    marginTop: RSpacing.xs,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: RSpacing.xl,
    right: RSpacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  modalOverlay: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.5)', // Removed bg from container to manage it separately
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '95%',
    paddingBottom: 0,
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: RSpacing.lg,
    paddingBottom: RSpacing.md,
  },
  modalTitle: {
    fontSize: RFontSizes.xl,
    fontWeight: '700',
  },
  modalScroll: {
    paddingHorizontal: RSpacing.lg,
    flex: 1,
    paddingBottom: RSpacing.md,
  },
  inputLabel: {
    fontSize: RFontSizes.sm,
    fontWeight: '500',
    marginBottom: RSpacing.xs,
    marginTop: RSpacing.md,
  },
  textInput: {
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    fontSize: RFontSizes.md,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: RSpacing.sm,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: RSpacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeOptionText: {
    fontSize: RFontSizes.sm,
    fontWeight: '500',
  },
  rewardTypeScroll: {
    flexDirection: 'row',
    marginTop: RSpacing.xs,
  },
  rewardTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: RSpacing.md,
    paddingVertical: RSpacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: RSpacing.sm,
  },
  rewardTypeText: {
    fontSize: RFontSizes.sm,
    fontWeight: '500',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: RSpacing.sm,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: RSpacing.sm,
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
  },
  dateTimeText: {
    fontSize: RFontSizes.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: RSpacing.lg,
    marginBottom: RSpacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: RSpacing.md,
    padding: RSpacing.lg,
    paddingTop: RSpacing.md,
    paddingBottom: RSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  modalCancelButton: {
    flex: 1,
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  inlineDatePicker: {
    marginTop: RSpacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: RSpacing.md,
    paddingHorizontal: RSpacing.sm,
  },
  inlineDatePickerDone: {
    paddingHorizontal: RSpacing.xxl,
    paddingVertical: RSpacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: RSpacing.sm,
  },
  // ==================== ASSIGN MODAL STYLES ====================
  assignCampaignInfo: {
    padding: RSpacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: RSpacing.md,
  },
  assignCampaignTitle: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  assignAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RSpacing.sm,
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: RSpacing.md,
  },
  assignAllButtonText: {
    color: '#FFFFFF',
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  dividerWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: RSpacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: RSpacing.md,
    fontSize: RFontSizes.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RSpacing.md,
    paddingVertical: RSpacing.sm,
    borderRadius: BorderRadius.lg,
    marginBottom: RSpacing.sm,
    gap: RSpacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: RFontSizes.md,
    paddingVertical: RSpacing.xs,
  },
  selectedCount: {
    fontSize: RFontSizes.sm,
    fontWeight: '600',
    marginBottom: RSpacing.sm,
    textAlign: 'center',
  },
  usersList: {
    maxHeight: 300,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RSpacing.sm,
    paddingHorizontal: RSpacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: RSpacing.xs,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: RFontSizes.sm,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    marginLeft: RSpacing.sm,
  },
  userName: {
    fontSize: RFontSizes.md,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: RFontSizes.xs,
  },
  emptyUsers: {
    padding: RSpacing.xl,
    alignItems: 'center',
  },
  emptyUsersText: {
    fontSize: RFontSizes.sm,
    textAlign: 'center',
  },
  assignSelectedButton: {
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: RSpacing.md,
  },
  assignSelectedButtonText: {
    color: '#FFFFFF',
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  // ==================== STEP MODAL STYLES ====================
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RSpacing.md,
    gap: RSpacing.xs,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLine: {
    width: 40,
    height: 2,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: RSpacing.md,
  },
  stepSubtitle: {
    fontSize: RFontSizes.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: RSpacing.lg,
  },
  audienceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    marginBottom: RSpacing.md,
  },
  audienceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audienceTextContainer: {
    flex: 1,
    marginLeft: RSpacing.md,
  },
  audienceTitle: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  audienceDesc: {
    fontSize: RFontSizes.sm,
    marginTop: 2,
  },
  userSelectionContainer: {
    marginTop: RSpacing.md,
  },
  selectUsersLabel: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
    marginBottom: RSpacing.sm,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RSpacing.sm,
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: 'auto',
    marginBottom: RSpacing.md,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  collapsedModeContainer: {
    flex: 1,
  },
  collapsedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: RSpacing.md,
  },
  collapsedTitle: {
    flex: 1,
    fontSize: RFontSizes.md,
    fontWeight: '600',
    marginLeft: RSpacing.sm,
  },
  countBadge: {
    paddingHorizontal: RSpacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    minWidth: 28,
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: RFontSizes.sm,
    fontWeight: '600',
  },
  scrollableListContainer: {
    flex: 1,
  },
  scrollableList: {
    flex: 1,
  },
  assignedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  assignedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});
