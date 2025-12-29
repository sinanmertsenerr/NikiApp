import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, VerifyEmailDto, ResendVerificationDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        success: boolean;
        data: {
            userId: string;
            email: string;
            emailVerified: boolean;
            message: string;
        };
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        success: boolean;
        data: import("../common").AuthResponse;
    }>;
    resendVerification(dto: ResendVerificationDto): Promise<{
        success: boolean;
        data: {
            message: string;
            resendAvailableIn: number;
        };
    }>;
    login(dto: LoginDto): Promise<{
        success: boolean;
        data: import("../common").AuthResponse;
    }>;
    refresh(dto: RefreshTokenDto, user: any): Promise<{
        success: boolean;
        data: {
            tokens: import("../common").AuthTokens;
        };
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
    logout(userId: string, body: {
        refreshToken?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    me(userId: string): Promise<{
        success: boolean;
        data: {
            user: {
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
            };
        };
    }>;
}
