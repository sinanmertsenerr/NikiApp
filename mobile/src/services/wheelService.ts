import api from './api';

// Types matching backend response
export type WheelRewardType = 'nothing' | 'points' | 'discount' | 'free_coffee' | 'free_cookie' | 'retry' | 'second_drink_discount' | 'coffee_and_cookie' | 'badge';

export interface WheelStatus {
    canSpin: boolean;
    spinRights: number;
    weekNumber: number;
    year: number;
    lastSpin?: {
        rewardType: WheelRewardType;
        rewardValue: string;
        spunAt: string;
    };
    nextSpinAvailable?: string;
}

export interface SpinResult {
    rewardType: WheelRewardType;
    rewardValue: string;
    message: string;
    spunAt: string;
}

export interface SpinHistory {
    id: string;
    rewardType: WheelRewardType;
    rewardValue: string | null;
    weekNumber: number;
    year: number;
    spunAt: string;
}

// ==================== ENDPOINTS ====================

export const getStatus = async (): Promise<WheelStatus> => {
    const response = await api.get('/wheel/status');
    return response.data.data;
};

export const spin = async (): Promise<SpinResult> => {
    const response = await api.post('/wheel/spin');
    return response.data.data;
};

export const getHistory = async (limit: number = 10): Promise<SpinHistory[]> => {
    const response = await api.get(`/wheel/history?limit=${limit}`);
    return response.data.data.spins;
};

export const wheelService = {
    getStatus,
    spin,
    getHistory,
};
