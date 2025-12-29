"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const bcrypt = __importStar(require("bcrypt"));
const uuid_1 = require("uuid");
const prisma_1 = require("../prisma");
const redis_1 = require("../redis");
const email_1 = require("../email");
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    redisService;
    emailService;
    VERIFICATION_CODE_TTL;
    RESEND_COOLDOWN;
    MAX_VERIFICATION_ATTEMPTS;
    JWT_EXPIRES_IN;
    JWT_REFRESH_EXPIRES_IN;
    PASSWORD_RESET_TTL = 900;
    logger = new common_1.Logger('AuthService');
    constructor(prisma, jwtService, configService, redisService, emailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.redisService = redisService;
        this.emailService = emailService;
        this.VERIFICATION_CODE_TTL = this.configService.get('VERIFICATION_CODE_TTL', 900);
        this.RESEND_COOLDOWN = this.configService.get('RESEND_COOLDOWN', 60);
        this.MAX_VERIFICATION_ATTEMPTS = this.configService.get('MAX_VERIFICATION_ATTEMPTS', 5);
        this.JWT_EXPIRES_IN = this.configService.get('JWT_EXPIRES_IN', '1h');
        this.JWT_REFRESH_EXPIRES_IN = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
    }
    async register(dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (existingUser) {
            this.logger.warn(`Registration attempt with existing email: ${dto.email}`);
            throw new common_1.ConflictException('Bu email adresi zaten kayıtlı');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: dto.phone,
                emailVerified: false,
            },
        });
        await this.sendVerificationCode(user.id, user.email, user.firstName);
        this.logger.log(`New user registered: ${user.email} (ID: ${user.id})`);
        return {
            success: true,
            data: {
                userId: user.id,
                email: user.email,
                emailVerified: false,
                message: 'Doğrulama kodu email adresinize gönderildi',
            },
        };
    }
    async verifyEmail(dto) {
        const email = dto.email.toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.NotFoundException('Kullanıcı bulunamadı');
        }
        if (user.emailVerified) {
            throw new common_1.BadRequestException('Email zaten doğrulanmış');
        }
        const verifyData = await this.redisService.getVerificationCode(user.id);
        if (!verifyData) {
            throw new common_1.BadRequestException('Doğrulama kodu süresi doldu veya bulunamadı. Yeni kod gönderin.');
        }
        if (verifyData.attempts >= this.MAX_VERIFICATION_ATTEMPTS) {
            await this.redisService.deleteVerificationCode(user.id);
            throw new common_1.BadRequestException('Çok fazla yanlış deneme. Lütfen yeni kod isteyin.');
        }
        if (dto.code !== verifyData.code) {
            const newAttempts = await this.redisService.incrementVerificationAttempts(user.id, this.VERIFICATION_CODE_TTL);
            const remainingAttempts = this.MAX_VERIFICATION_ATTEMPTS - newAttempts;
            throw new common_1.BadRequestException({
                code: 'INVALID_VERIFICATION_CODE',
                message: 'Geçersiz doğrulama kodu',
                remainingAttempts,
            });
        }
        const verifiedUser = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.user.update({
                where: { id: user.id },
                data: {
                    emailVerified: true,
                    emailVerifiedAt: new Date(),
                },
            });
            const ieuQrCode = this.generateQRCode('IEU', user.id);
            const nikiQrCode = this.generateQRCode('NIKI', user.id);
            await tx.wallet.createMany({
                data: [
                    {
                        userId: user.id,
                        walletType: 'IEU',
                        balance: 0,
                        qrCode: ieuQrCode,
                    },
                    {
                        userId: user.id,
                        walletType: 'NIKI',
                        balance: 0,
                        qrCode: nikiQrCode,
                    },
                ],
            });
            await tx.loyaltyPoints.create({
                data: {
                    userId: user.id,
                    totalPoints: 0,
                    redeemedPoints: 0,
                },
            });
            return updated;
        });
        await this.redisService.deleteVerificationCode(user.id);
        await this.emailService.sendWelcomeEmail(verifiedUser.email, verifiedUser.firstName);
        this.logger.log(`Email verified successfully: ${verifiedUser.email} (ID: ${verifiedUser.id})`);
        const tokens = await this.generateTokens(verifiedUser);
        return {
            user: {
                id: verifiedUser.id,
                email: verifiedUser.email,
                firstName: verifiedUser.firstName,
                lastName: verifiedUser.lastName,
                role: verifiedUser.role,
                emailVerified: true,
                isActive: verifiedUser.isActive,
            },
            tokens,
        };
    }
    async resendVerification(dto) {
        const email = dto.email.toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.NotFoundException('Kullanıcı bulunamadı');
        }
        if (user.emailVerified) {
            throw new common_1.BadRequestException('Email zaten doğrulanmış');
        }
        const cooldown = await this.redisService.getResendCooldown(user.id);
        if (cooldown > 0) {
            throw new common_1.BadRequestException({
                code: 'RESEND_COOLDOWN',
                message: `Lütfen ${cooldown} saniye bekleyin`,
                retryAfter: cooldown,
            });
        }
        await this.sendVerificationCode(user.id, user.email, user.firstName);
        return {
            success: true,
            data: {
                message: 'Yeni doğrulama kodu gönderildi',
                resendAvailableIn: this.RESEND_COOLDOWN,
            },
        };
    }
    async login(dto) {
        const identifier = dto.identifier.toLowerCase();
        const isLocked = await this.redisService.isAccountLocked(identifier);
        if (isLocked) {
            const remaining = await this.redisService.getLockoutRemaining(identifier);
            const minutes = Math.ceil(remaining / 60);
            this.logger.warn(`Login attempt on locked account: ${identifier}`);
            throw new common_1.UnauthorizedException({
                code: 'ACCOUNT_LOCKED',
                message: `Hesap geçici olarak kilitlendi. ${minutes} dakika sonra tekrar deneyin.`,
                retryAfter: remaining,
            });
        }
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { phone: identifier }
                ]
            },
        });
        if (!user) {
            this.logger.warn(`Failed login attempt - user not found: ${identifier}`);
            const attempts = await this.redisService.incrementFailedLogins(identifier);
            if (attempts >= 5) {
                await this.redisService.setAccountLockout(identifier, 900);
                this.logger.warn(`Account locked due to multiple failed attempts: ${identifier}`);
            }
            throw new common_1.UnauthorizedException('Email veya şifre hatalı');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            this.logger.warn(`Failed login attempt - invalid password: ${user.email} (ID: ${user.id})`);
            const attempts = await this.redisService.incrementFailedLogins(identifier);
            if (attempts >= 5) {
                await this.redisService.setAccountLockout(identifier, 900);
                this.logger.warn(`Account locked due to multiple failed attempts: ${user.email} (ID: ${user.id})`);
                throw new common_1.UnauthorizedException({
                    code: 'ACCOUNT_LOCKED',
                    message: 'Çok fazla yanlış deneme. Hesap 15 dakika kilitlendi.',
                });
            }
            const remaining = 5 - attempts;
            throw new common_1.UnauthorizedException({
                code: 'INVALID_CREDENTIALS',
                message: `Email veya şifre hatalı. ${remaining} deneme hakkınız kaldı.`,
                attemptsRemaining: remaining,
            });
        }
        if (!user.emailVerified) {
            this.logger.warn(`Login attempt with unverified email: ${user.email} (ID: ${user.id})`);
            throw new common_1.UnauthorizedException({
                code: 'EMAIL_NOT_VERIFIED',
                message: 'Lütfen önce email adresinizi doğrulayın',
                userId: user.id,
            });
        }
        if (!user.isActive) {
            this.logger.warn(`Login attempt with inactive account: ${user.email} (ID: ${user.id})`);
            throw new common_1.UnauthorizedException('Hesabınız devre dışı bırakılmış');
        }
        await this.redisService.resetFailedLogins(identifier);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const tokens = await this.generateTokens(user);
        this.logger.log(`Successful login: ${user.email} (ID: ${user.id}, Role: ${user.role})`);
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                emailVerified: user.emailVerified,
                isActive: user.isActive,
            },
            tokens,
        };
    }
    async refreshToken(userId, refreshToken) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Geçersiz token');
        }
        await this.prisma.refreshToken.delete({
            where: { token: refreshToken },
        });
        return this.generateTokens(user);
    }
    async logout(userId, refreshToken) {
        if (refreshToken) {
            await this.prisma.refreshToken.deleteMany({
                where: { token: refreshToken },
            });
        }
        else {
            await this.prisma.refreshToken.deleteMany({
                where: { userId },
            });
        }
        return { success: true, message: 'Çıkış yapıldı' };
    }
    async getCurrentUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                bio: true,
                phone: true,
                avatarUrl: true,
                role: true,
                language: true,
                theme: true,
                selectedBrand: true,
                emailVerified: true,
                isActive: true,
                createdAt: true,
                wallets: {
                    select: {
                        walletType: true,
                        balance: true,
                        qrCode: true,
                    },
                },
                loyaltyPoints: {
                    select: {
                        totalPoints: true,
                        redeemedPoints: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Kullanıcı bulunamadı');
        }
        const ieuWallet = user.wallets?.find((w) => w.walletType === 'IEU');
        return {
            ...user,
            wallet: ieuWallet ? {
                nikiCredits: ieuWallet.balance?.toString() || '0',
                qrCode: ieuWallet.qrCode,
            } : null,
            availablePoints: user.loyaltyPoints
                ? user.loyaltyPoints.totalPoints - user.loyaltyPoints.redeemedPoints
                : 0,
        };
    }
    async forgotPassword(dto) {
        const email = dto.email.toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return {
                success: true,
                data: {
                    message: 'Eğer bu email adresi kayıtlıysa, şifre sıfırlama kodu gönderildi',
                },
            };
        }
        const cooldown = await this.redisService.getPasswordResetCooldown(email);
        if (cooldown > 0) {
            throw new common_1.BadRequestException({
                code: 'RESET_COOLDOWN',
                message: `Lütfen ${cooldown} saniye bekleyin`,
                retryAfter: cooldown,
            });
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await this.redisService.setPasswordResetCode(email, code, this.PASSWORD_RESET_TTL);
        await this.redisService.setPasswordResetCooldown(email, this.RESEND_COOLDOWN);
        await this.emailService.sendPasswordResetCode(email, code, user.firstName);
        this.logger.log(`Password reset code sent to: ${email} (ID: ${user.id})`);
        return {
            success: true,
            data: {
                message: 'Şifre sıfırlama kodu email adresinize gönderildi',
            },
        };
    }
    async resetPassword(dto) {
        const email = dto.email.toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.BadRequestException('Geçersiz veya süresi dolmuş kod');
        }
        const resetData = await this.redisService.getPasswordResetCode(email);
        if (!resetData) {
            throw new common_1.BadRequestException('Şifre sıfırlama kodu süresi doldu veya bulunamadı. Yeni kod isteyin.');
        }
        if (resetData.attempts >= this.MAX_VERIFICATION_ATTEMPTS) {
            await this.redisService.deletePasswordResetCode(email);
            throw new common_1.BadRequestException('Çok fazla yanlış deneme. Lütfen yeni kod isteyin.');
        }
        if (dto.code !== resetData.code) {
            const newAttempts = await this.redisService.incrementPasswordResetAttempts(email, this.PASSWORD_RESET_TTL);
            const remainingAttempts = this.MAX_VERIFICATION_ATTEMPTS - newAttempts;
            throw new common_1.BadRequestException({
                code: 'INVALID_RESET_CODE',
                message: 'Geçersiz sıfırlama kodu',
                remainingAttempts,
            });
        }
        const passwordHash = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });
        await this.redisService.deletePasswordResetCode(email);
        await this.prisma.refreshToken.deleteMany({
            where: { userId: user.id },
        });
        this.logger.log(`Password reset successful: ${user.email} (ID: ${user.id})`);
        return {
            success: true,
            data: {
                message: 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.',
            },
        };
    }
    async sendVerificationCode(userId, email, firstName) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await this.redisService.setVerificationCode(userId, code, this.VERIFICATION_CODE_TTL);
        await this.redisService.setResendCooldown(userId, this.RESEND_COOLDOWN);
        await this.emailService.sendVerificationCode(email, code, firstName);
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.JWT_EXPIRES_IN,
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.JWT_REFRESH_EXPIRES_IN,
        });
        const refreshExpiresAt = new Date();
        const daysMatch = this.JWT_REFRESH_EXPIRES_IN.match(/(\d+)d/);
        if (daysMatch) {
            refreshExpiresAt.setDate(refreshExpiresAt.getDate() + parseInt(daysMatch[1]));
        }
        await this.prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                expiresAt: refreshExpiresAt,
            },
        });
        const expiresIn = this.parseExpiresIn(this.JWT_EXPIRES_IN);
        return {
            accessToken,
            refreshToken,
            expiresIn,
        };
    }
    generateQRCode(walletType, userId) {
        const shortId = userId.substring(0, 8).toUpperCase();
        const checksum = (0, uuid_1.v4)().substring(0, 4).toUpperCase();
        return `${walletType}-${shortId}-${checksum}`;
    }
    parseExpiresIn(expiresIn) {
        const match = expiresIn.match(/(\d+)([smhd])/);
        if (!match)
            return 900;
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 3600;
            case 'd':
                return value * 86400;
            default:
                return 900;
        }
    }
    async cleanupExpiredTokens() {
        try {
            const result = await this.prisma.refreshToken.deleteMany({
                where: { expiresAt: { lt: new Date() } },
            });
            if (result.count > 0) {
                this.logger.log(`[Cleanup] Deleted ${result.count} expired refresh tokens`);
            }
        }
        catch (error) {
            this.logger.error(`[Cleanup] Failed to delete expired tokens: ${error.message}`);
        }
    }
};
exports.AuthService = AuthService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthService.prototype, "cleanupExpiredTokens", null);
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        redis_1.RedisService,
        email_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map