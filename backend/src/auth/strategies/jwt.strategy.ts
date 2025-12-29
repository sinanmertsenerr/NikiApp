import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma';
import { RedisService } from '../../redis';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
  jti?: string; // JWT ID for blacklisting
  iat?: number; // issued at timestamp
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET must be defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    // Check if specific token is blacklisted (by jti)
    if (payload.jti) {
      const isBlacklisted = await this.redisService.isTokenBlacklisted(payload.jti);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token geçersiz kılınmış');
      }
    }

    // Check if all user tokens are blacklisted (force logout all devices)
    const blacklistTime = await this.redisService.getUserTokenBlacklistTime(payload.sub);
    if (blacklistTime && payload.iat) {
      // Token was issued before the blacklist timestamp
      const tokenIssuedAt = payload.iat * 1000; // Convert to milliseconds
      if (tokenIssuedAt < blacklistTime) {
        throw new UnauthorizedException('Oturum sonlandırıldı, lütfen tekrar giriş yapın');
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Hesabınız devre dışı bırakılmış');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Email adresinizi doğrulayın');
    }

    return user;
  }
}
