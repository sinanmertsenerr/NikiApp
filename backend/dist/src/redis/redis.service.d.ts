import Redis from 'ioredis';
export interface VerificationData {
    code: string;
    attempts: number;
    createdAt: number;
}
export declare class RedisService {
    private readonly redis;
    constructor(redis: Redis);
    setVerificationCode(userId: string, code: string, ttlSeconds?: number): Promise<void>;
    getVerificationCode(userId: string): Promise<VerificationData | null>;
    incrementVerificationAttempts(userId: string, ttlSeconds?: number): Promise<number>;
    deleteVerificationCode(userId: string): Promise<void>;
    setResendCooldown(userId: string, ttlSeconds?: number): Promise<void>;
    getResendCooldown(userId: string): Promise<number>;
    hasResendCooldown(userId: string): Promise<boolean>;
    setPasswordResetCode(email: string, code: string, ttlSeconds?: number): Promise<void>;
    getPasswordResetCode(email: string): Promise<VerificationData | null>;
    incrementPasswordResetAttempts(email: string, ttlSeconds?: number): Promise<number>;
    deletePasswordResetCode(email: string): Promise<void>;
    setPasswordResetCooldown(email: string, ttlSeconds?: number): Promise<void>;
    getPasswordResetCooldown(email: string): Promise<number>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    ttl(key: string): Promise<number>;
    incrementFailedLogins(identifier: string): Promise<number>;
    getFailedLogins(identifier: string): Promise<number>;
    resetFailedLogins(identifier: string): Promise<void>;
    setAccountLockout(identifier: string, durationSeconds?: number): Promise<void>;
    isAccountLocked(identifier: string): Promise<boolean>;
    getLockoutRemaining(identifier: string): Promise<number>;
}
