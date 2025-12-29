import api from './api';

// Types
export type CampaignType = 'auto' | 'manual';
export type CampaignTargetType = 'users' | 'groups';
export type RewardType = 'manual' | 'discount_percent' | 'discount_fixed' | 'bonus_points' | 'free_coffee';

export interface Campaign {
  id: string;
  type: CampaignType;
  targetType?: CampaignTargetType;
  title: string;
  titleTr: string;
  description?: string;
  descriptionTr?: string;
  rewardType: RewardType;
  rewardValue?: number;
  requiredPoints?: number;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedCampaigns {
  campaigns: Campaign[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserCampaign {
  id: string;
  qrCode: string; // CAMPAIGN-{id} format
  campaign: Campaign;
  status: 'active' | 'used' | 'expired';
  assignedAt: string;
  usedAt?: string;
  redeemedAt?: string;
  expiresAt?: string;
}

// ==================== CUSTOMER ENDPOINTS ====================

export const getAvailableCampaigns = async (): Promise<Campaign[]> => {
  const response = await api.get('/campaigns/available');
  return response.data.campaigns;
};

export const getMyCampaigns = async (): Promise<UserCampaign[]> => {
  const response = await api.get('/campaigns/my');
  return response.data.campaigns;
};

// ==================== ADMIN ENDPOINTS ====================

export const adminGetCampaigns = async (params?: {
  page?: number;
  limit?: number;
  type?: CampaignType;
  targetType?: CampaignTargetType;
  isActive?: boolean;
}): Promise<PaginatedCampaigns> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.limit) searchParams.append('limit', String(params.limit));
  if (params?.type) searchParams.append('type', params.type);
  if (params?.targetType) searchParams.append('targetType', params.targetType);
  if (params?.isActive !== undefined) searchParams.append('isActive', String(params.isActive));

  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const response = await api.get(`/admin/campaigns${queryString}`);
  return response.data;
};

export const adminGetCampaign = async (id: string): Promise<Campaign> => {
  const response = await api.get(`/admin/campaigns/${id}`);
  return response.data;
};

export const createCampaign = async (data: {
  type: CampaignType;
  targetType?: CampaignTargetType;
  title: string;
  titleTr: string;
  description?: string;
  descriptionTr?: string;
  rewardType: RewardType;
  rewardValue?: number;
  requiredPoints?: number;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}): Promise<Campaign> => {
  const response = await api.post('/admin/campaigns', data);
  return response.data;
};

export const updateCampaign = async (id: string, data: Partial<{
  type: CampaignType;
  targetType?: CampaignTargetType;
  title: string;
  titleTr: string;
  description?: string;
  descriptionTr?: string;
  rewardType: RewardType;
  rewardValue?: number;
  requiredPoints?: number;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}>): Promise<Campaign> => {
  const response = await api.patch(`/admin/campaigns/${id}`, data);
  return response.data;
};

export const deleteCampaign = async (id: string): Promise<void> => {
  await api.delete(`/admin/campaigns/${id}`);
};

// Assign campaign to a single user
export const assignCampaignToUser = async (userId: string, campaignId: string): Promise<any> => {
  const response = await api.post('/admin/campaigns/assign', { userId, campaignId });
  return response.data;
};

// Assign campaign to multiple users, groups, or all users
// If userIds is empty/undefined and groupIds is empty/undefined, assigns to all active users
// If groupIds is provided, assigns to all members of those groups
export const assignCampaignBulk = async (
  campaignId: string,
  userIds?: string[],
  groupIds?: string[]
): Promise<{
  success: boolean;
  assignedCount: number;
  skippedCount: number;
  message: string;
}> => {
  const response = await api.post('/admin/campaigns/assign-bulk', { campaignId, userIds, groupIds });
  return response.data;
};

// Get users assigned to a campaign
export interface CampaignAssignedUser {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  status: 'active' | 'used' | 'expired';
  assignedAt: string;
  redeemedAt?: string;
}

export const getCampaignAssignedUsers = async (
  campaignId: string,
  params?: { limit?: number }
): Promise<{
  users: CampaignAssignedUser[];
  total: number;
}> => {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.append('limit', String(params.limit));
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const response = await api.get(`/admin/campaigns/users/${campaignId}${queryString}`);
  return response.data;
  return response.data;
};

// Get groups assigned to a campaign
export interface CampaignAssignedGroup {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
}

export const getCampaignAssignedGroups = async (campaignId: string): Promise<CampaignAssignedGroup[]> => {
  const response = await api.get(`/admin/campaigns/groups/${campaignId}`);
  return response.data;
};

// Get dashboard overview stats
export interface DashboardOverview {
  users: {
    totalUsers: number;
    verifiedUsers: number;
    activeUsers: number;
    newUsersInPeriod: number;
  };
  campaigns: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalAssignments: number;
    totalRedemptions: number;
    overallUsageRate: number;
  };
  points: {
    totalPointsEarned: number;
    totalPointsRedeemed: number;
    totalPointsAvailable: number;
    usersWithPoints: number;
    averagePointsPerUser: number;
  };
  wheel: {
    totalSpins: number;
    winningSpins: number;
    winRate: number;
  };
}

export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  const response = await api.get('/admin/campaigns/dashboard/overview');
  return response.data;
};

export const adminRedeemCampaignByQr = async (qrCode: string): Promise<{
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  campaign: {
    id: string;
    title: string;
    titleTr: string;
    rewardType: string;
    rewardValue?: string;
  };
  redeemedAt: string;
}> => {
  const response = await api.post('/admin/campaigns/redeem-qr', { qrCode });
  return response.data;
};

export const campaignService = {
  // Customer
  getAvailableCampaigns,
  getMyCampaigns,
  // Admin
  adminGetCampaigns,
  adminGetCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  assignCampaignToUser,
  assignCampaignBulk,
  getCampaignAssignedUsers,
  getCampaignAssignedGroups,
  getDashboardOverview,
  adminRedeemCampaignByQr,
};

