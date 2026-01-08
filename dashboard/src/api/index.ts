// API barrel export
export { default as apiClient } from './client';
export { default as authApi } from './auth';
export { default as walletApi } from './wallet';
export { default as dashboardApi } from './dashboard';
export { default as usersApi } from './users';
export { default as rafflesApi } from './raffles';

// Re-export query types
export type { TransactionsQuery, WalletStatsQuery } from './wallet';
export type { DashboardQuery, CampaignsQuery } from './dashboard';
export type { UsersQuery } from './users';
export type { RafflesQuery } from './raffles';
