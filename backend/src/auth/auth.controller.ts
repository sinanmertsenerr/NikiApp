import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ResendVerificationDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';
import { JwtAuthGuard, JwtRefreshGuard } from './guards';
import { Public, CurrentUser } from '../common/decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // ==================== REGISTER ====================

  @Public()
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 attempts per 5 minutes
  @Post('register')
  @ApiOperation({ summary: 'Register new customer' })
  @ApiResponse({
    status: 201,
    description: 'User registered, verification code sent',
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ==================== VERIFY EMAIL ====================

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with 6-digit code' })
  @ApiResponse({
    status: 200,
    description: 'Email verified, tokens returned',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(dto);
    return {
      success: true,
      data: result,
    };
  }

  // ==================== RESEND VERIFICATION ====================

  @Public()
  @Throttle({ default: { limit: 3, ttl: 180000 } }) // 3 attempts per 3 minutes
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification code' })
  @ApiResponse({
    status: 200,
    description: 'New verification code sent',
  })
  @ApiResponse({ status: 429, description: 'Cooldown period active' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  // ==================== LOGIN ====================

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, tokens returned',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials or email not verified' })
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return {
      success: true,
      data: result,
    };
  }

  // ==================== REFRESH TOKEN ====================

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'New tokens returned',
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @CurrentUser() user: any,
  ) {
    const tokens = await this.authService.refreshToken(
      user.id,
      dto.refreshToken,
    );
    return {
      success: true,
      data: { tokens },
    };
  }

  // ==================== FORGOT PASSWORD ====================

  @Public()
  @Throttle({ default: { limit: 3, ttl: 180000 } }) // 3 attempts per 3 minutes
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset code' })
  @ApiResponse({
    status: 200,
    description: 'Reset code sent if email exists',
  })
  @ApiResponse({ status: 429, description: 'Cooldown period active' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // ==================== RESET PASSWORD ====================

  @Public()
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 attempts per 5 minutes
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with code' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ==================== LOGOUT ====================

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout user (current device or all devices)' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
  })
  async logout(
    @CurrentUser('id') userId: string,
    @Body() body: { refreshToken?: string; logoutAll?: boolean },
  ) {
    return this.authService.logout(userId, body.refreshToken, body.logoutAll);
  }

  // ==================== LOGOUT ALL DEVICES ====================

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({
    status: 200,
    description: 'Logged out from all devices',
  })
  async logoutAll(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId, undefined, true);
  }

  // ==================== GET CURRENT USER ====================

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({
    status: 200,
    description: 'Current user data returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@CurrentUser('id') userId: string) {
    const user = await this.authService.getCurrentUser(userId);
    return {
      success: true,
      data: { user },
    };
  }
}
