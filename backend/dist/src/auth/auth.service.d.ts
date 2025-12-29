import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma';
import { RedisService } from '../redis';
import { EmailService } from '../email';
import { RegisterDto, LoginDto, VerifyEmailDto, ResendVerificationDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { AuthResponse, AuthTokens } from '../common/interfaces';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private redisService;
    private emailService;
    private readonly VERIFICATION_CODE_TTL;
    private readonly RESEND_COOLDOWN;
    private readonly MAX_VERIFICATION_ATTEMPTS;
    private readonly JWT_EXPIRES_IN;
    private readonly JWT_REFRESH_EXPIRES_IN;
    private readonly PASSWORD_RESET_TTL;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, redisService: RedisService, emailService: EmailService);
    register(dto: RegisterDto): Promise<{
        success: boolean;
        data: {
            userId: string;
            email: string;
            emailVerified: boolean;
            message: string;
        };
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<AuthResponse>;
    resendVerification(dto: ResendVerificationDto): Promise<{
        success: boolean;
        data: {
            message: string;
            resendAvailableIn: number;
        };
    }>;
    login(dto: LoginDto): Promise<AuthResponse>;
    refreshToken(userId: string, refreshToken: string): Promise<AuthTokens>;
    logout(userId: string, refreshToken?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getCurrentUser(userId: string): Promise<{
        wallet: {
            nikiCredits: string;
            qrCode: string;
        } | null;
        availablePoints: number;
        id: string;
        isActive: boolean;
        createdAt: Date;
        email: string;
        firstName: string;
        lastName: string;
        bio: string | null;
        phone: string | null;
        avatarUrl: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        language: import("@prisma/client").$Enums.Language;
        theme: import("@prisma/client").$Enums.Theme;
        selectedBrand: import("@prisma/client").$Enums.Brand;
        emailVerified: boolean;
        wallets: {
            walletType: import("@prisma/client").$Enums.WalletType;
            balance: import("@prisma/client/runtime/library").Decimal;
            qrCode: string;
        }[];
        loyaltyPoints: {
            totalPoints: number;
            redeemedPoints: number;
        } | null;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    private sendVerificationCode;
    private generateTokens;
    private generateQRCode;
    private parseExpiresIn;
    cleanupExpiredTokens(): Promise<void>;
}
