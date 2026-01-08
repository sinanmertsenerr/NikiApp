// Utility Functions - Formatters
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

// Currency formatter (Turkish Lira)
export const formatCurrency = (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

// Short currency (₺45,250)
export const formatCurrencyShort = (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num >= 1000000) {
        return `₺${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
        return `₺${(num / 1000).toFixed(1)}K`;
    }
    return `₺${num.toFixed(2)}`;
};

// Date formatters
export const formatDate = (date: string | Date): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd.MM.yyyy', { locale: tr });
};

export const formatDateTime = (date: string | Date): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd.MM.yyyy HH:mm', { locale: tr });
};

export const formatDateShort = (date: string | Date): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd MMM', { locale: tr });
};

export const formatTimeAgo = (date: string | Date): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: tr });
};

// Number formatters
export const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('tr-TR').format(num);
};

export const formatPercent = (num: number): string => {
    return `%${num.toFixed(1)}`;
};

// Percentage change with arrow
export const formatPercentChange = (current: number, previous: number): { value: string; isPositive: boolean } => {
    if (previous === 0) return { value: '+0%', isPositive: true };
    const change = ((current - previous) / previous) * 100;
    const isPositive = change >= 0;
    return {
        value: `${isPositive ? '+' : ''}${change.toFixed(1)}%`,
        isPositive,
    };
};

// Transaction type labels
export const transactionTypeLabels: Record<string, string> = {
    topup: 'Yükleme',
    payment: 'Ödeme',
    refund: 'İade',
    reward: 'Ödül',
};

// Wallet type labels
export const walletTypeLabels: Record<string, string> = {
    IEU: 'IEU Card',
    NIKI: 'NIKI Card',
};

// Status labels
export const campaignStatusLabels: Record<string, string> = {
    active: 'Aktif',
    used: 'Kullanıldı',
    expired: 'Süresi Doldu',
};

export const raffleStatusLabels: Record<string, string> = {
    pending: 'Bekliyor',
    active: 'Aktif',
    completed: 'Tamamlandı',
    cancelled: 'İptal',
};
