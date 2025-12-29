import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

export interface VerificationData {
  code: string;
  attempts: number;
  createdAt: number;
}

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) { }

  // ==================== VERIFICATION CODE OPERATIONS ====================

  /**
   * Store email verification code
   * Key: email_verify:{userId}
   * TTL: 15 minutes (900 seconds)
   */
  async setVerificationCode(
    userId: string,
    code: string,
    ttlSeconds: number = 900,
  ): Promise<void> {
    const key = `email_verify:${userId}`;
    const data: VerificationData = {
      code,
      attempts: 0,
      createdAt: Date.now(),
    };
    await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
  }

  /**
   * Get verification data for a user
   */
  async getVerificationCode(userId: string): Promise<VerificationData | null> {
    const key = `email_verify:${userId}`;
    const data = await this.redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as VerificationData;
  }

  /**
   * Increment verification attempts
   */
  async incrementVerificationAttempts(
    userId: string,
    ttlSeconds: number = 900,
  ): Promise<number> {
    const key = `email_verify:${userId}`;
    const data = await this.getVerificationCode(userId);
    if (!data) return -1;

    data.attempts += 1;
    await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
    return data.attempts;
  }

  /**
   * Delete verification code (after successful verification)
   */
  async deleteVerificationCode(userId: string): Promise<void> {
    const key = `email_verify:${userId}`;
    await this.redis.del(key);
  }

  // ==================== RESEND COOLDOWN OPERATIONS ====================

  /**
   * Set resend cooldown (prevents spam)
   * Key: email_resend_cooldown:{userId}
   * TTL: 60 seconds
   */
  async setResendCooldown(
    userId: string,
    ttlSeconds: number = 60,
  ): Promise<void> {
    const key = `email_resend_cooldown:${userId}`;
    await this.redis.setex(key, ttlSeconds, '1');
  }

  /**
   * Check if user is in resend cooldown
   */
  async getResendCooldown(userId: string): Promise<number> {
    const key = `email_resend_cooldown:${userId}`;
    const ttl = await this.redis.ttl(key);
    return ttl > 0 ? ttl : 0;
  }

  /**
   * Check if resend cooldown exists
   */
  async hasResendCooldown(userId: string): Promise<boolean> {
    const key = `email_resend_cooldown:${userId}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  // ==================== PASSWORD RESET OPERATIONS ====================

  /**
   * Store password reset code
   * Key: password_reset:{email}
   * TTL: 15 minutes (900 seconds)
   */
  async setPasswordResetCode(
    email: string,
    code: string,
    ttlSeconds: number = 900,
  ): Promise<void> {
    const key = `password_reset:${email.toLowerCase()}`;
    const data: VerificationData = {
      code,
      attempts: 0,
      createdAt: Date.now(),
    };
    await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
  }

  /**
   * Get password reset data for an email
   */
  async getPasswordResetCode(email: string): Promise<VerificationData | null> {
    const key = `password_reset:${email.toLowerCase()}`;
    const data = await this.redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as VerificationData;
  }

  /**
   * Increment password reset attempts
   */
  async incrementPasswordResetAttempts(
    email: string,
    ttlSeconds: number = 900,
  ): Promise<number> {
    const key = `password_reset:${email.toLowerCase()}`;
    const data = await this.getPasswordResetCode(email);
    if (!data) return -1;

    data.attempts += 1;
    await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
    return data.attempts;
  }

  /**
   * Delete password reset code (after successful reset)
   */
  async deletePasswordResetCode(email: string): Promise<void> {
    const key = `password_reset:${email.toLowerCase()}`;
    await this.redis.del(key);
  }

  /**
   * Set password reset cooldown (prevents spam)
   * Key: password_reset_cooldown:{email}
   * TTL: 60 seconds
   */
  async setPasswordResetCooldown(
    email: string,
    ttlSeconds: number = 60,
  ): Promise<void> {
    const key = `password_reset_cooldown:${email.toLowerCase()}`;
    await this.redis.setex(key, ttlSeconds, '1');
  }

  /**
   * Get password reset cooldown remaining time
   */
  async getPasswordResetCooldown(email: string): Promise<number> {
    const key = `password_reset_cooldown:${email.toLowerCase()}`;
    const ttl = await this.redis.ttl(key);
    return ttl > 0 ? ttl : 0;
  }

  // ==================== GENERIC OPERATIONS ====================

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  // ==================== ACCOUNT LOCKOUT OPERATIONS ====================

  /**
   * Track failed login attempts
   * Key: failed_login:{identifier}
   * TTL: 15 minutes (resets after successful login)
   */
  async incrementFailedLogins(identifier: string): Promise<number> {
    const key = `failed_login:${identifier.toLowerCase()}`;
    const attempts = await this.redis.incr(key);

    if (attempts === 1) {
      // Set TTL on first attempt (reset after 15 minutes)
      await this.redis.expire(key, 900);
    }

    return attempts;
  }

  /**
   * Get current failed login attempts count
   */
  async getFailedLogins(identifier: string): Promise<number> {
    const key = `failed_login:${identifier.toLowerCase()}`;
    const attempts = await this.redis.get(key);
    return parseInt(attempts || '0');
  }

  /**
   * Reset failed login attempts (called on successful login)
   */
  async resetFailedLogins(identifier: string): Promise<void> {
    const key = `failed_login:${identifier.toLowerCase()}`;
    await this.redis.del(key);
  }

  /**
   * Lock an account temporarily
   * Key: account_locked:{identifier}
   * TTL: default 15 minutes (900 seconds)
   */
  async setAccountLockout(
    identifier: string,
    durationSeconds: number = 900,
  ): Promise<void> {
    const key = `account_locked:${identifier.toLowerCase()}`;
    await this.redis.setex(key, durationSeconds, '1');
  }

  /**
   * Check if an account is currently locked
   */
  async isAccountLocked(identifier: string): Promise<boolean> {
    const key = `account_locked:${identifier.toLowerCase()}`;
    const locked = await this.redis.get(key);
    return locked === '1';
  }

  /**
   * Get remaining lockout time in seconds
   */
  async getLockoutRemaining(identifier: string): Promise<number> {
    const key = `account_locked:${identifier.toLowerCase()}`;
    const ttl = await this.redis.ttl(key);
    return ttl > 0 ? ttl : 0;
  }
}
