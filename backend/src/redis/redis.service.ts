import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

export interface VerificationData {
  code: string;
  attempts: number;
  createdAt: number;
}

// Key prefixes for better organization
const KEY_PREFIX = {
  EMAIL_VERIFY: 'niki:email_verify',
  EMAIL_RESEND_COOLDOWN: 'niki:email_resend_cooldown',
  PASSWORD_RESET: 'niki:password_reset',
  PASSWORD_RESET_COOLDOWN: 'niki:password_reset_cooldown',
  FAILED_LOGIN: 'niki:failed_login',
  ACCOUNT_LOCKED: 'niki:account_locked',
  SESSION: 'niki:session',
  RATE_LIMIT: 'niki:rate_limit',
  JWT_BLACKLIST: 'niki:jwt_blacklist',
} as const;

// Lua script for atomic increment with max check
const ATOMIC_INCREMENT_SCRIPT = `
  local key = KEYS[1]
  local max = tonumber(ARGV[1])
  local ttl = tonumber(ARGV[2])

  local current = redis.call('GET', key)
  if not current then
    redis.call('SETEX', key, ttl, 1)
    return 1
  end

  local count = tonumber(current)
  if count >= max then
    return -1
  end

  local newCount = redis.call('INCR', key)
  redis.call('EXPIRE', key, ttl)
  return newCount
`;

// Lua script for atomic verification with attempt tracking
const VERIFY_CODE_SCRIPT = `
  local key = KEYS[1]
  local inputCode = ARGV[1]
  local maxAttempts = tonumber(ARGV[2])
  local ttl = tonumber(ARGV[3])

  local data = redis.call('GET', key)
  if not data then
    return cjson.encode({status = 'NOT_FOUND'})
  end

  local parsed = cjson.decode(data)

  if parsed.attempts >= maxAttempts then
    redis.call('DEL', key)
    return cjson.encode({status = 'MAX_ATTEMPTS'})
  end

  if parsed.code == inputCode then
    redis.call('DEL', key)
    return cjson.encode({status = 'SUCCESS'})
  end

  parsed.attempts = parsed.attempts + 1
  redis.call('SETEX', key, ttl, cjson.encode(parsed))
  return cjson.encode({status = 'INVALID', remainingAttempts = maxAttempts - parsed.attempts})
`;

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;

  constructor(@InjectRedis() private readonly redis: Redis) {
    this.setupEventHandlers();
    this.loadScripts();
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Redis connected');
    });

    this.redis.on('ready', () => {
      this.isConnected = true;
      this.logger.log('Redis ready');
    });

    this.redis.on('error', (error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });

    this.redis.on('close', () => {
      this.isConnected = false;
      this.logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      this.logger.log('Redis reconnecting...');
    });
  }

  private async loadScripts(): Promise<void> {
    try {
      // Pre-load Lua scripts for better performance
      await this.redis.script('LOAD', ATOMIC_INCREMENT_SCRIPT);
      await this.redis.script('LOAD', VERIFY_CODE_SCRIPT);
    } catch (error) {
      this.logger.warn(`Failed to preload Lua scripts: ${error.message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
      this.logger.log('Redis connection closed gracefully');
    } catch (error) {
      this.logger.error(`Error closing Redis connection: ${error.message}`);
    }
  }

  // ==================== HEALTH CHECK ====================

  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async getConnectionStatus(): Promise<{
    connected: boolean;
    latencyMs: number | null;
  }> {
    const start = Date.now();
    try {
      await this.redis.ping();
      return {
        connected: true,
        latencyMs: Date.now() - start,
      };
    } catch {
      return {
        connected: false,
        latencyMs: null,
      };
    }
  }

  // ==================== VERIFICATION CODE OPERATIONS ====================

  private buildKey(prefix: string, identifier: string): string {
    // Sanitize identifier to prevent key injection
    const sanitized = identifier.replace(/[^a-zA-Z0-9@._-]/g, '');
    return `${prefix}:${sanitized}`;
  }

  /**
   * Store email verification code
   * Key: niki:email_verify:{userId}
   * TTL: 15 minutes (900 seconds)
   */
  async setVerificationCode(
    userId: string,
    code: string,
    ttlSeconds: number = 900,
  ): Promise<void> {
    const key = this.buildKey(KEY_PREFIX.EMAIL_VERIFY, userId);
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
    const key = this.buildKey(KEY_PREFIX.EMAIL_VERIFY, userId);
    const data = await this.redis.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as VerificationData;
    } catch {
      await this.redis.del(key);
      return null;
    }
  }

  /**
   * Atomically verify code and track attempts
   * Returns: { valid: boolean, remainingAttempts?: number, error?: string }
   */
  async verifyCodeAtomic(
    userId: string,
    inputCode: string,
    maxAttempts: number = 5,
    ttlSeconds: number = 900,
  ): Promise<{
    valid: boolean;
    remainingAttempts?: number;
    error?: 'NOT_FOUND' | 'MAX_ATTEMPTS' | 'INVALID';
  }> {
    const key = this.buildKey(KEY_PREFIX.EMAIL_VERIFY, userId);

    try {
      const result = await this.redis.eval(
        VERIFY_CODE_SCRIPT,
        1,
        key,
        inputCode,
        maxAttempts.toString(),
        ttlSeconds.toString(),
      );

      const parsed = JSON.parse(result as string);

      switch (parsed.status) {
        case 'SUCCESS':
          return { valid: true };
        case 'NOT_FOUND':
          return { valid: false, error: 'NOT_FOUND' };
        case 'MAX_ATTEMPTS':
          return { valid: false, error: 'MAX_ATTEMPTS' };
        case 'INVALID':
          return {
            valid: false,
            error: 'INVALID',
            remainingAttempts: parsed.remainingAttempts,
          };
        default:
          return { valid: false, error: 'NOT_FOUND' };
      }
    } catch (error) {
      this.logger.error(`verifyCodeAtomic error: ${error.message}`);
      // Fallback to non-atomic version
      return this.verifyCodeFallback(userId, inputCode, maxAttempts, ttlSeconds);
    }
  }

  /**
   * Fallback verification (non-atomic, for Redis versions without Lua support)
   */
  private async verifyCodeFallback(
    userId: string,
    inputCode: string,
    maxAttempts: number,
    ttlSeconds: number,
  ): Promise<{
    valid: boolean;
    remainingAttempts?: number;
    error?: 'NOT_FOUND' | 'MAX_ATTEMPTS' | 'INVALID';
  }> {
    const data = await this.getVerificationCode(userId);

    if (!data) {
      return { valid: false, error: 'NOT_FOUND' };
    }

    if (data.attempts >= maxAttempts) {
      await this.deleteVerificationCode(userId);
      return { valid: false, error: 'MAX_ATTEMPTS' };
    }

    if (data.code === inputCode) {
      await this.deleteVerificationCode(userId);
      return { valid: true };
    }

    await this.incrementVerificationAttempts(userId, ttlSeconds);
    return {
      valid: false,
      error: 'INVALID',
      remainingAttempts: maxAttempts - data.attempts - 1,
    };
  }

  /**
   * Increment verification attempts atomically
   */
  async incrementVerificationAttempts(
    userId: string,
    ttlSeconds: number = 900,
  ): Promise<number> {
    const key = this.buildKey(KEY_PREFIX.EMAIL_VERIFY, userId);
    const data = await this.getVerificationCode(userId);
    if (!data) return -1;

    data.attempts += 1;

    // Use pipeline for atomic operation
    const pipeline = this.redis.pipeline();
    pipeline.setex(key, ttlSeconds, JSON.stringify(data));
    await pipeline.exec();

    return data.attempts;
  }

  /**
   * Delete verification code (after successful verification)
   */
  async deleteVerificationCode(userId: string): Promise<void> {
    const key = this.buildKey(KEY_PREFIX.EMAIL_VERIFY, userId);
    await this.redis.del(key);
  }

  // ==================== RESEND COOLDOWN OPERATIONS ====================

  /**
   * Set resend cooldown atomically (prevents spam)
   * Key: niki:email_resend_cooldown:{userId}
   * TTL: 60 seconds
   */
  async setResendCooldown(
    userId: string,
    ttlSeconds: number = 60,
  ): Promise<void> {
    const key = this.buildKey(KEY_PREFIX.EMAIL_RESEND_COOLDOWN, userId);
    await this.redis.setex(key, ttlSeconds, '1');
  }

  /**
   * Get resend cooldown remaining time
   */
  async getResendCooldown(userId: string): Promise<number> {
    const key = this.buildKey(KEY_PREFIX.EMAIL_RESEND_COOLDOWN, userId);
    const ttl = await this.redis.ttl(key);
    return ttl > 0 ? ttl : 0;
  }

  /**
   * Check if resend cooldown exists
   */
  async hasResendCooldown(userId: string): Promise<boolean> {
    const key = this.buildKey(KEY_PREFIX.EMAIL_RESEND_COOLDOWN, userId);
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  // ==================== PASSWORD RESET OPERATIONS ====================

  /**
   * Store password reset code
   * Key: niki:password_reset:{email}
   * TTL: 15 minutes (900 seconds)
   */
  async setPasswordResetCode(
    email: string,
    code: string,
    ttlSeconds: number = 900,
  ): Promise<void> {
    const key = this.buildKey(KEY_PREFIX.PASSWORD_RESET, email.toLowerCase());
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
    const key = this.buildKey(KEY_PREFIX.PASSWORD_RESET, email.toLowerCase());
    const data = await this.redis.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as VerificationData;
    } catch {
      await this.redis.del(key);
      return null;
    }
  }

  /**
   * Atomically verify password reset code
   */
  async verifyPasswordResetCodeAtomic(
    email: string,
    inputCode: string,
    maxAttempts: number = 5,
    ttlSeconds: number = 900,
  ): Promise<{
    valid: boolean;
    remainingAttempts?: number;
    error?: 'NOT_FOUND' | 'MAX_ATTEMPTS' | 'INVALID';
  }> {
    const key = this.buildKey(KEY_PREFIX.PASSWORD_RESET, email.toLowerCase());

    try {
      const result = await this.redis.eval(
        VERIFY_CODE_SCRIPT,
        1,
        key,
        inputCode,
        maxAttempts.toString(),
        ttlSeconds.toString(),
      );

      const parsed = JSON.parse(result as string);

      switch (parsed.status) {
        case 'SUCCESS':
          return { valid: true };
        case 'NOT_FOUND':
          return { valid: false, error: 'NOT_FOUND' };
        case 'MAX_ATTEMPTS':
          return { valid: false, error: 'MAX_ATTEMPTS' };
        case 'INVALID':
          return {
            valid: false,
            error: 'INVALID',
            remainingAttempts: parsed.remainingAttempts,
          };
        default:
          return { valid: false, error: 'NOT_FOUND' };
      }
    } catch (error) {
      this.logger.error(`verifyPasswordResetCodeAtomic error: ${error.message}`);
      // Fallback
      return this.verifyPasswordResetCodeFallback(email, inputCode, maxAttempts, ttlSeconds);
    }
  }

  private async verifyPasswordResetCodeFallback(
    email: string,
    inputCode: string,
    maxAttempts: number,
    ttlSeconds: number,
  ): Promise<{
    valid: boolean;
    remainingAttempts?: number;
    error?: 'NOT_FOUND' | 'MAX_ATTEMPTS' | 'INVALID';
  }> {
    const data = await this.getPasswordResetCode(email);

    if (!data) {
      return { valid: false, error: 'NOT_FOUND' };
    }

    if (data.attempts >= maxAttempts) {
      await this.deletePasswordResetCode(email);
      return { valid: false, error: 'MAX_ATTEMPTS' };
    }

    if (data.code === inputCode) {
      await this.deletePasswordResetCode(email);
      return { valid: true };
    }

    await this.incrementPasswordResetAttempts(email, ttlSeconds);
    return {
      valid: false,
      error: 'INVALID',
      remainingAttempts: maxAttempts - data.attempts - 1,
    };
  }

  /**
   * Increment password reset attempts
   */
  async incrementPasswordResetAttempts(
    email: string,
    ttlSeconds: number = 900,
  ): Promise<number> {
    const key = this.buildKey(KEY_PREFIX.PASSWORD_RESET, email.toLowerCase());
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
    const key = this.buildKey(KEY_PREFIX.PASSWORD_RESET, email.toLowerCase());
    await this.redis.del(key);
  }

  /**
   * Set password reset cooldown (prevents spam)
   * Key: niki:password_reset_cooldown:{email}
   * TTL: 60 seconds
   */
  async setPasswordResetCooldown(
    email: string,
    ttlSeconds: number = 60,
  ): Promise<void> {
    const key = this.buildKey(KEY_PREFIX.PASSWORD_RESET_COOLDOWN, email.toLowerCase());
    await this.redis.setex(key, ttlSeconds, '1');
  }

  /**
   * Get password reset cooldown remaining time
   */
  async getPasswordResetCooldown(email: string): Promise<number> {
    const key = this.buildKey(KEY_PREFIX.PASSWORD_RESET_COOLDOWN, email.toLowerCase());
    const ttl = await this.redis.ttl(key);
    return ttl > 0 ? ttl : 0;
  }

  // ==================== ACCOUNT LOCKOUT OPERATIONS ====================

  /**
   * Atomically increment failed login attempts with auto-lockout
   * Returns: { attempts: number, locked: boolean, lockoutRemaining?: number }
   */
  async incrementFailedLoginsAtomic(
    identifier: string,
    maxAttempts: number = 5,
    lockoutDuration: number = 900,
    windowDuration: number = 900,
  ): Promise<{
    attempts: number;
    locked: boolean;
    lockoutRemaining?: number;
  }> {
    const failedKey = this.buildKey(KEY_PREFIX.FAILED_LOGIN, identifier.toLowerCase());
    const lockedKey = this.buildKey(KEY_PREFIX.ACCOUNT_LOCKED, identifier.toLowerCase());

    // Check if already locked
    const isLocked = await this.redis.get(lockedKey);
    if (isLocked) {
      const remaining = await this.redis.ttl(lockedKey);
      return {
        attempts: maxAttempts,
        locked: true,
        lockoutRemaining: remaining > 0 ? remaining : 0,
      };
    }

    // Atomic increment
    const attempts = await this.redis.incr(failedKey);

    if (attempts === 1) {
      // First attempt - set window TTL
      await this.redis.expire(failedKey, windowDuration);
    }

    if (attempts >= maxAttempts) {
      // Lock the account
      const pipeline = this.redis.pipeline();
      pipeline.setex(lockedKey, lockoutDuration, '1');
      pipeline.del(failedKey);
      await pipeline.exec();

      return {
        attempts,
        locked: true,
        lockoutRemaining: lockoutDuration,
      };
    }

    return {
      attempts,
      locked: false,
    };
  }

  /**
   * Track failed login attempts (legacy - use incrementFailedLoginsAtomic instead)
   */
  async incrementFailedLogins(identifier: string): Promise<number> {
    const key = this.buildKey(KEY_PREFIX.FAILED_LOGIN, identifier.toLowerCase());
    const attempts = await this.redis.incr(key);

    if (attempts === 1) {
      await this.redis.expire(key, 900);
    }

    return attempts;
  }

  /**
   * Get current failed login attempts count
   */
  async getFailedLogins(identifier: string): Promise<number> {
    const key = this.buildKey(KEY_PREFIX.FAILED_LOGIN, identifier.toLowerCase());
    const attempts = await this.redis.get(key);
    return parseInt(attempts || '0');
  }

  /**
   * Reset failed login attempts (called on successful login)
   */
  async resetFailedLogins(identifier: string): Promise<void> {
    const key = this.buildKey(KEY_PREFIX.FAILED_LOGIN, identifier.toLowerCase());
    await this.redis.del(key);
  }

  /**
   * Lock an account temporarily
   * Key: niki:account_locked:{identifier}
   * TTL: default 15 minutes (900 seconds)
   */
  async setAccountLockout(
    identifier: string,
    durationSeconds: number = 900,
  ): Promise<void> {
    const key = this.buildKey(KEY_PREFIX.ACCOUNT_LOCKED, identifier.toLowerCase());
    await this.redis.setex(key, durationSeconds, '1');
  }

  /**
   * Check if an account is currently locked
   */
  async isAccountLocked(identifier: string): Promise<boolean> {
    const key = this.buildKey(KEY_PREFIX.ACCOUNT_LOCKED, identifier.toLowerCase());
    const locked = await this.redis.get(key);
    return locked === '1';
  }

  /**
   * Get remaining lockout time in seconds
   */
  async getLockoutRemaining(identifier: string): Promise<number> {
    const key = this.buildKey(KEY_PREFIX.ACCOUNT_LOCKED, identifier.toLowerCase());
    const ttl = await this.redis.ttl(key);
    return ttl > 0 ? ttl : 0;
  }

  /**
   * Unlock an account manually (admin action)
   */
  async unlockAccount(identifier: string): Promise<void> {
    const lockedKey = this.buildKey(KEY_PREFIX.ACCOUNT_LOCKED, identifier.toLowerCase());
    const failedKey = this.buildKey(KEY_PREFIX.FAILED_LOGIN, identifier.toLowerCase());

    const pipeline = this.redis.pipeline();
    pipeline.del(lockedKey);
    pipeline.del(failedKey);
    await pipeline.exec();
  }

  // ==================== RATE LIMITING ====================

  /**
   * Generic rate limiter using sliding window
   * Returns: { allowed: boolean, remaining: number, resetIn: number }
   */
  async checkRateLimit(
    action: string,
    identifier: string,
    maxRequests: number,
    windowSeconds: number,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetIn: number;
  }> {
    const key = this.buildKey(
      KEY_PREFIX.RATE_LIMIT,
      `${action}:${identifier.toLowerCase()}`,
    );
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    const pipeline = this.redis.pipeline();

    // Remove old entries
    pipeline.zremrangebyscore(key, '-inf', windowStart);

    // Count current requests
    pipeline.zcard(key);

    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiry
    pipeline.expire(key, windowSeconds);

    const results = await pipeline.exec();

    const currentCount = (results?.[1]?.[1] as number) || 0;
    const allowed = currentCount < maxRequests;

    // Get TTL for reset time
    const ttl = await this.redis.ttl(key);

    return {
      allowed,
      remaining: Math.max(0, maxRequests - currentCount - 1),
      resetIn: ttl > 0 ? ttl : windowSeconds,
    };
  }

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Store user session data
   */
  async setSession(
    sessionId: string,
    data: Record<string, any>,
    ttlSeconds: number = 86400, // 24 hours default
  ): Promise<void> {
    const key = this.buildKey(KEY_PREFIX.SESSION, sessionId);
    await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
  }

  /**
   * Get user session data
   */
  async getSession(sessionId: string): Promise<Record<string, any> | null> {
    const key = this.buildKey(KEY_PREFIX.SESSION, sessionId);
    const data = await this.redis.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Delete user session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const key = this.buildKey(KEY_PREFIX.SESSION, sessionId);
    await this.redis.del(key);
  }

  /**
   * Extend session TTL
   */
  async extendSession(sessionId: string, ttlSeconds: number): Promise<boolean> {
    const key = this.buildKey(KEY_PREFIX.SESSION, sessionId);
    const result = await this.redis.expire(key, ttlSeconds);
    return result === 1;
  }

  // ==================== GENERIC OPERATIONS ====================

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const prefixedKey = `niki:${key}`;
    if (ttlSeconds) {
      await this.redis.setex(prefixedKey, ttlSeconds, value);
    } else {
      await this.redis.set(prefixedKey, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(`niki:${key}`);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(`niki:${key}`);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(`niki:${key}`);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(`niki:${key}`);
  }

  /**
   * Delete multiple keys by pattern (use with caution!)
   */
  async deleteByPattern(pattern: string): Promise<number> {
    const keys = await this.redis.keys(`niki:${pattern}`);
    if (keys.length === 0) return 0;

    const pipeline = this.redis.pipeline();
    keys.forEach((key) => pipeline.del(key));
    await pipeline.exec();

    return keys.length;
  }

  /**
   * Get Redis info for monitoring
   */
  async getInfo(): Promise<Record<string, string>> {
    const info = await this.redis.info();
    const parsed: Record<string, string> = {};

    info.split('\n').forEach((line) => {
      const [key, value] = line.split(':');
      if (key && value) {
        parsed[key.trim()] = value.trim();
      }
    });

    return parsed;
  }

  // ==================== JWT BLACKLIST OPERATIONS ====================

  /**
   * Add a JWT token to the blacklist
   * Token will be blacklisted until its original expiration time
   * @param jti - JWT ID (unique identifier from token)
   * @param expiresInSeconds - Time until token would naturally expire
   */
  async blacklistToken(jti: string, expiresInSeconds: number): Promise<void> {
    const key = this.buildKey(KEY_PREFIX.JWT_BLACKLIST, jti);
    // Store until token would naturally expire (no need to keep longer)
    await this.redis.setex(key, expiresInSeconds, '1');
    this.logger.log(`Token blacklisted: ${jti.substring(0, 8)}...`);
  }

  /**
   * Check if a JWT token is blacklisted
   * @param jti - JWT ID to check
   * @returns true if blacklisted, false otherwise
   */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const key = this.buildKey(KEY_PREFIX.JWT_BLACKLIST, jti);
    const result = await this.redis.exists(key);
    return result === 1;
  }

  /**
   * Blacklist all tokens for a user (force logout from all devices)
   * Uses a user-specific blacklist timestamp
   * @param userId - User ID to blacklist all tokens for
   * @param expiresInSeconds - How long to maintain the blacklist (should match max token lifetime)
   */
  async blacklistAllUserTokens(
    userId: string,
    expiresInSeconds: number = 86400, // 24 hours default
  ): Promise<void> {
    const key = this.buildKey(KEY_PREFIX.JWT_BLACKLIST, `user:${userId}`);
    const timestamp = Date.now();
    await this.redis.setex(key, expiresInSeconds, timestamp.toString());
    this.logger.log(`All tokens blacklisted for user: ${userId}`);
  }

  /**
   * Get the timestamp when all user tokens were blacklisted
   * Tokens issued before this timestamp should be rejected
   * @param userId - User ID to check
   * @returns Timestamp or null if no blacklist
   */
  async getUserTokenBlacklistTime(userId: string): Promise<number | null> {
    const key = this.buildKey(KEY_PREFIX.JWT_BLACKLIST, `user:${userId}`);
    const timestamp = await this.redis.get(key);
    return timestamp ? parseInt(timestamp) : null;
  }

  /**
   * Remove user from token blacklist (allow old tokens again - use carefully!)
   */
  async removeUserTokenBlacklist(userId: string): Promise<void> {
    const key = this.buildKey(KEY_PREFIX.JWT_BLACKLIST, `user:${userId}`);
    await this.redis.del(key);
  }
}
