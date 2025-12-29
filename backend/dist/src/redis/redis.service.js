"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("@nestjs-modules/ioredis");
const ioredis_2 = __importDefault(require("ioredis"));
let RedisService = class RedisService {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    async setVerificationCode(userId, code, ttlSeconds = 900) {
        const key = `email_verify:${userId}`;
        const data = {
            code,
            attempts: 0,
            createdAt: Date.now(),
        };
        await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
    }
    async getVerificationCode(userId) {
        const key = `email_verify:${userId}`;
        const data = await this.redis.get(key);
        if (!data)
            return null;
        return JSON.parse(data);
    }
    async incrementVerificationAttempts(userId, ttlSeconds = 900) {
        const key = `email_verify:${userId}`;
        const data = await this.getVerificationCode(userId);
        if (!data)
            return -1;
        data.attempts += 1;
        await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
        return data.attempts;
    }
    async deleteVerificationCode(userId) {
        const key = `email_verify:${userId}`;
        await this.redis.del(key);
    }
    async setResendCooldown(userId, ttlSeconds = 60) {
        const key = `email_resend_cooldown:${userId}`;
        await this.redis.setex(key, ttlSeconds, '1');
    }
    async getResendCooldown(userId) {
        const key = `email_resend_cooldown:${userId}`;
        const ttl = await this.redis.ttl(key);
        return ttl > 0 ? ttl : 0;
    }
    async hasResendCooldown(userId) {
        const key = `email_resend_cooldown:${userId}`;
        const exists = await this.redis.exists(key);
        return exists === 1;
    }
    async setPasswordResetCode(email, code, ttlSeconds = 900) {
        const key = `password_reset:${email.toLowerCase()}`;
        const data = {
            code,
            attempts: 0,
            createdAt: Date.now(),
        };
        await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
    }
    async getPasswordResetCode(email) {
        const key = `password_reset:${email.toLowerCase()}`;
        const data = await this.redis.get(key);
        if (!data)
            return null;
        return JSON.parse(data);
    }
    async incrementPasswordResetAttempts(email, ttlSeconds = 900) {
        const key = `password_reset:${email.toLowerCase()}`;
        const data = await this.getPasswordResetCode(email);
        if (!data)
            return -1;
        data.attempts += 1;
        await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
        return data.attempts;
    }
    async deletePasswordResetCode(email) {
        const key = `password_reset:${email.toLowerCase()}`;
        await this.redis.del(key);
    }
    async setPasswordResetCooldown(email, ttlSeconds = 60) {
        const key = `password_reset_cooldown:${email.toLowerCase()}`;
        await this.redis.setex(key, ttlSeconds, '1');
    }
    async getPasswordResetCooldown(email) {
        const key = `password_reset_cooldown:${email.toLowerCase()}`;
        const ttl = await this.redis.ttl(key);
        return ttl > 0 ? ttl : 0;
    }
    async set(key, value, ttlSeconds) {
        if (ttlSeconds) {
            await this.redis.setex(key, ttlSeconds, value);
        }
        else {
            await this.redis.set(key, value);
        }
    }
    async get(key) {
        return this.redis.get(key);
    }
    async del(key) {
        await this.redis.del(key);
    }
    async exists(key) {
        const result = await this.redis.exists(key);
        return result === 1;
    }
    async ttl(key) {
        return this.redis.ttl(key);
    }
    async incrementFailedLogins(identifier) {
        const key = `failed_login:${identifier.toLowerCase()}`;
        const attempts = await this.redis.incr(key);
        if (attempts === 1) {
            await this.redis.expire(key, 900);
        }
        return attempts;
    }
    async getFailedLogins(identifier) {
        const key = `failed_login:${identifier.toLowerCase()}`;
        const attempts = await this.redis.get(key);
        return parseInt(attempts || '0');
    }
    async resetFailedLogins(identifier) {
        const key = `failed_login:${identifier.toLowerCase()}`;
        await this.redis.del(key);
    }
    async setAccountLockout(identifier, durationSeconds = 900) {
        const key = `account_locked:${identifier.toLowerCase()}`;
        await this.redis.setex(key, durationSeconds, '1');
    }
    async isAccountLocked(identifier) {
        const key = `account_locked:${identifier.toLowerCase()}`;
        const locked = await this.redis.get(key);
        return locked === '1';
    }
    async getLockoutRemaining(identifier) {
        const key = `account_locked:${identifier.toLowerCase()}`;
        const ttl = await this.redis.ttl(key);
        return ttl > 0 ? ttl : 0;
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, ioredis_1.InjectRedis)()),
    __metadata("design:paramtypes", [ioredis_2.default])
], RedisService);
//# sourceMappingURL=redis.service.js.map