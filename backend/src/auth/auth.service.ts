import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma';
import { RedisService } from '../redis';
import { EmailService } from '../email';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';
import { AuthResponse, AuthTokens, TokenPayload } from '../common/interfaces';

@Injectable()
export class AuthService {
  private readonly VERIFICATION_CODE_TTL: number;
  private readonly RESEND_COOLDOWN: number;
  private readonly MAX_VERIFICATION_ATTEMPTS: number;
  private readonly JWT_EXPIRES_IN: string;
  private readonly JWT_REFRESH_EXPIRES_IN: string;
  private readonly PASSWORD_RESET_TTL: number = 900; // 15 minutes
  private readonly logger = new Logger('AuthService');

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private emailService: EmailService,
  ) {
    this.VERIFICATION_CODE_TTL = this.configService.get<number>(
      'VERIFICATION_CODE_TTL',
      900,
    );
    this.RESEND_COOLDOWN = this.configService.get<number>(
      'RESEND_COOLDOWN',
      60,
    );
    this.MAX_VERIFICATION_ATTEMPTS = this.configService.get<number>(
      'MAX_VERIFICATION_ATTEMPTS',
      5,
    );
    this.JWT_EXPIRES_IN = this.configService.get<string>(
      'JWT_EXPIRES_IN',
      '1h',
    );
    this.JWT_REFRESH_EXPIRES_IN = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
  }

  // ==================== REGISTER ====================

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      this.logger.warn(`Registration attempt with existing email: ${dto.email}`);
      throw new ConflictException('Bu email adresi zaten kayıtlı');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Check if this is the first user - make them super_admin
    const userCount = await this.prisma.user.count();
    const isFirstUser = userCount === 0;

    // Create user (phone verified via Firebase, email unverified)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        phoneVerified: dto.phoneVerified || false,
        phoneVerifiedAt: dto.phoneVerified ? new Date() : null,
        emailVerified: false,
        kvkkAccepted: dto.kvkkAccepted,
        kvkkAcceptedAt: dto.kvkkAccepted ? new Date() : null,
        role: isFirstUser ? 'super_admin' : 'customer',
      },
    });

    if (isFirstUser) {
      this.logger.log(`First user registered as super_admin: ${user.email} (ID: ${user.id})`);
    }

    // Generate and send verification code
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

  // ==================== VERIFY EMAIL ====================

  async verifyEmail(dto: VerifyEmailDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase();

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email zaten doğrulanmış');
    }

    // Get verification data from Redis
    const verifyData = await this.redisService.getVerificationCode(user.id);

    if (!verifyData) {
      throw new BadRequestException(
        'Doğrulama kodu süresi doldu veya bulunamadı. Yeni kod gönderin.',
      );
    }

    // Check attempts
    if (verifyData.attempts >= this.MAX_VERIFICATION_ATTEMPTS) {
      await this.redisService.deleteVerificationCode(user.id);
      throw new BadRequestException(
        'Çok fazla yanlış deneme. Lütfen yeni kod isteyin.',
      );
    }

    // Validate code
    if (dto.code !== verifyData.code) {
      const newAttempts = await this.redisService.incrementVerificationAttempts(
        user.id,
        this.VERIFICATION_CODE_TTL,
      );

      const remainingAttempts = this.MAX_VERIFICATION_ATTEMPTS - newAttempts;

      throw new BadRequestException({
        code: 'INVALID_VERIFICATION_CODE',
        message: 'Geçersiz doğrulama kodu',
        remainingAttempts,
      });
    }

    // Code is valid - verify user and create wallet/loyalty in transaction
    const verifiedUser = await this.prisma.$transaction(async (tx) => {
      // Update user
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      // Create both wallets (IEU and NIKI) with QR codes
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

      // Create loyalty points record
      await tx.loyaltyPoints.create({
        data: {
          userId: user.id,
          totalPoints: 0,
          redeemedPoints: 0,
        },
      });

      return updated;
    });

    // Delete Redis verification key
    await this.redisService.deleteVerificationCode(user.id);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(verifiedUser.email, verifiedUser.firstName);

    this.logger.log(`Email verified successfully: ${verifiedUser.email} (ID: ${verifiedUser.id})`);

    // Generate tokens
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

  // ==================== RESEND VERIFICATION ====================

  async resendVerification(dto: ResendVerificationDto) {
    const email = dto.email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email zaten doğrulanmış');
    }

    // Check cooldown
    const cooldown = await this.redisService.getResendCooldown(user.id);
    if (cooldown > 0) {
      throw new BadRequestException({
        code: 'RESEND_COOLDOWN',
        message: `Lütfen ${cooldown} saniye bekleyin`,
        retryAfter: cooldown,
      });
    }

    // Send new code
    await this.sendVerificationCode(user.id, user.email, user.firstName);

    return {
      success: true,
      data: {
        message: 'Yeni doğrulama kodu gönderildi',
        resendAvailableIn: this.RESEND_COOLDOWN,
      },
    };
  }

  // ==================== LOGIN ====================

  async login(dto: LoginDto): Promise<AuthResponse> {
    const identifier = dto.identifier.toLowerCase();

    // Check if account is locked
    const isLocked = await this.redisService.isAccountLocked(identifier);
    if (isLocked) {
      const remaining = await this.redisService.getLockoutRemaining(identifier);
      const minutes = Math.ceil(remaining / 60);

      this.logger.warn(`Login attempt on locked account: ${identifier}`);

      throw new UnauthorizedException({
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

      // Increment failed attempts for unknown identifiers
      const attempts = await this.redisService.incrementFailedLogins(identifier);
      if (attempts >= 5) {
        await this.redisService.setAccountLockout(identifier, 900); // 15 minutes
        this.logger.warn(`Account locked due to multiple failed attempts: ${identifier}`);
      }

      throw new UnauthorizedException('Email veya şifre hatalı');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`Failed login attempt - invalid password: ${user.email} (ID: ${user.id})`);

      // Increment failed attempts
      const attempts = await this.redisService.incrementFailedLogins(identifier);

      if (attempts >= 5) {
        await this.redisService.setAccountLockout(identifier, 900); // 15 minutes
        this.logger.warn(`Account locked due to multiple failed attempts: ${user.email} (ID: ${user.id})`);

        throw new UnauthorizedException({
          code: 'ACCOUNT_LOCKED',
          message: 'Çok fazla yanlış deneme. Hesap 15 dakika kilitlendi.',
        });
      }

      const remaining = 5 - attempts;
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: `Email veya şifre hatalı. ${remaining} deneme hakkınız kaldı.`,
        attemptsRemaining: remaining,
      });
    }

    // Check if phone is verified (phone is now the primary verification method)
    if (!user.phoneVerified) {
      this.logger.warn(`Login attempt with unverified phone: ${user.email} (ID: ${user.id})`);
      throw new UnauthorizedException({
        code: 'PHONE_NOT_VERIFIED',
        message: 'Lütfen önce telefon numaranızı doğrulayın',
        userId: user.id,
      });
    }

    // Check if account is active
    if (!user.isActive) {
      this.logger.warn(`Login attempt with inactive account: ${user.email} (ID: ${user.id})`);
      throw new UnauthorizedException('Hesabınız devre dışı bırakılmış');
    }

    // IMPORTANT: Reset failed attempts on successful login
    await this.redisService.resetFailedLogins(identifier);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
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

  // ==================== REFRESH TOKEN ====================

  async refreshToken(userId: string, refreshToken: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Geçersiz token');
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({
      where: { token: refreshToken },
    });

    // Generate new tokens
    return this.generateTokens(user);
  }

  // ==================== LOGOUT ====================

  async logout(userId: string, refreshToken?: string, logoutAll: boolean = false) {
    if (logoutAll) {
      // Logout from all devices - blacklist all tokens issued before now
      // This will invalidate all access tokens immediately
      const accessTokenTTL = this.parseExpiresIn(this.JWT_EXPIRES_IN);
      await this.redisService.blacklistAllUserTokens(userId, accessTokenTTL + 60); // +60 for safety margin

      // Delete all refresh tokens from database
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });

      this.logger.log(`User logged out from all devices: ${userId}`);
      return { success: true, message: 'Tüm cihazlardan çıkış yapıldı' };
    }

    if (refreshToken) {
      // Delete specific refresh token
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    } else {
      // Delete all refresh tokens for user
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }

    // Blacklist all existing access tokens for this user
    // This ensures immediate invalidation even for short-lived access tokens
    const accessTokenTTL = this.parseExpiresIn(this.JWT_EXPIRES_IN);
    await this.redisService.blacklistAllUserTokens(userId, accessTokenTTL + 60);

    this.logger.log(`User logged out: ${userId}`);
    return { success: true, message: 'Çıkış yapıldı' };
  }

  // ==================== GET CURRENT USER ====================

  async getCurrentUser(userId: string) {
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
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Get IEU wallet for backward compatibility
    const ieuWallet = user.wallets?.find((w: any) => w.walletType === 'IEU');

    return {
      ...user,
      // Legacy format
      wallet: ieuWallet ? {
        nikiCredits: ieuWallet.balance?.toString() || '0',
        qrCode: ieuWallet.qrCode,
      } : null,
      availablePoints: user.loyaltyPoints
        ? user.loyaltyPoints.totalPoints - user.loyaltyPoints.redeemedPoints
        : 0,
    };
  }

  // ==================== FORGOT PASSWORD ====================

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return {
        success: true,
        data: {
          message: 'Eğer bu email adresi kayıtlıysa, şifre sıfırlama kodu gönderildi',
        },
      };
    }

    // Check cooldown
    const cooldown = await this.redisService.getPasswordResetCooldown(email);
    if (cooldown > 0) {
      throw new BadRequestException({
        code: 'RESET_COOLDOWN',
        message: `Lütfen ${cooldown} saniye bekleyin`,
        retryAfter: cooldown,
      });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis
    await this.redisService.setPasswordResetCode(email, code, this.PASSWORD_RESET_TTL);

    // Set cooldown
    await this.redisService.setPasswordResetCooldown(email, this.RESEND_COOLDOWN);

    // Send email
    await this.emailService.sendPasswordResetCode(email, code, user.firstName);

    this.logger.log(`Password reset code sent to: ${email} (ID: ${user.id})`);

    return {
      success: true,
      data: {
        message: 'Şifre sıfırlama kodu email adresinize gönderildi',
      },
    };
  }

  // ==================== RESET PASSWORD ====================

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Geçersiz veya süresi dolmuş kod');
    }

    // Get reset data from Redis
    const resetData = await this.redisService.getPasswordResetCode(email);

    if (!resetData) {
      throw new BadRequestException(
        'Şifre sıfırlama kodu süresi doldu veya bulunamadı. Yeni kod isteyin.',
      );
    }

    // Check attempts
    if (resetData.attempts >= this.MAX_VERIFICATION_ATTEMPTS) {
      await this.redisService.deletePasswordResetCode(email);
      throw new BadRequestException(
        'Çok fazla yanlış deneme. Lütfen yeni kod isteyin.',
      );
    }

    // Validate code
    if (dto.code !== resetData.code) {
      const newAttempts = await this.redisService.incrementPasswordResetAttempts(
        email,
        this.PASSWORD_RESET_TTL,
      );

      const remainingAttempts = this.MAX_VERIFICATION_ATTEMPTS - newAttempts;

      throw new BadRequestException({
        code: 'INVALID_RESET_CODE',
        message: 'Geçersiz sıfırlama kodu',
        remainingAttempts,
      });
    }

    // Code is valid - update password
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Delete reset code from Redis
    await this.redisService.deletePasswordResetCode(email);

    // Invalidate all refresh tokens (force re-login on all devices)
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

  // ==================== HELPER METHODS ====================

  private async sendVerificationCode(
    userId: string,
    email: string,
    firstName: string,
  ): Promise<void> {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis
    await this.redisService.setVerificationCode(
      userId,
      code,
      this.VERIFICATION_CODE_TTL,
    );

    // Set resend cooldown
    await this.redisService.setResendCooldown(userId, this.RESEND_COOLDOWN);

    // Send email
    await this.emailService.sendVerificationCode(email, code, firstName);
  }

  private async generateTokens(user: { id: string; email: string; role: any }): Promise<AuthTokens> {
    // Generate unique JWT ID for blacklisting support
    const jti = uuidv4();

    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti, // JWT ID for token revocation
    };

    const accessToken = this.jwtService.sign(payload as any, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.JWT_EXPIRES_IN,
    } as any);

    const refreshToken = this.jwtService.sign({ ...payload, jti: uuidv4() } as any, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    } as any);

    // Calculate expiration date for refresh token
    const refreshExpiresAt = new Date();
    const daysMatch = this.JWT_REFRESH_EXPIRES_IN.match(/(\d+)d/);
    if (daysMatch) {
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + parseInt(daysMatch[1]));
    }

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: refreshExpiresAt,
      },
    });

    // Parse access token expiration for response
    const expiresIn = this.parseExpiresIn(this.JWT_EXPIRES_IN);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  private generateQRCode(walletType: string, userId: string): string {
    const shortId = userId.substring(0, 8).toUpperCase();
    const checksum = uuidv4().substring(0, 4).toUpperCase();
    return `${walletType}-${shortId}-${checksum}`;
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/(\d+)([smhd])/);
    if (!match) return 900; // default 15 minutes

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

  // ==================== AUTOMATED CLEANUP ====================

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens() {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });

      if (result.count > 0) {
        this.logger.log(`[Cleanup] Deleted ${result.count} expired refresh tokens`);
      }
    } catch (error) {
      this.logger.error(`[Cleanup] Failed to delete expired tokens: ${error.message}`);
    }
  }
}
