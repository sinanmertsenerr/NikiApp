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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtRefreshStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const prisma_1 = require("../../prisma");
let JwtRefreshStrategy = class JwtRefreshStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt-refresh') {
    configService;
    prisma;
    constructor(configService, prisma) {
        const secret = configService.get('JWT_REFRESH_SECRET');
        if (!secret) {
            throw new Error('JWT_REFRESH_SECRET must be defined');
        }
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromBodyField('refreshToken'),
            ignoreExpiration: false,
            secretOrKey: secret,
            passReqToCallback: true,
        });
        this.configService = configService;
        this.prisma = prisma;
    }
    async validate(req, payload) {
        const refreshToken = req.body.refreshToken;
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
            throw new common_1.UnauthorizedException('Kullanıcı bulunamadı');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Hesabınız devre dışı bırakılmış');
        }
        const tokenRecord = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });
        if (!tokenRecord) {
            throw new common_1.UnauthorizedException('Geçersiz refresh token');
        }
        if (tokenRecord.expiresAt < new Date()) {
            await this.prisma.refreshToken.delete({
                where: { id: tokenRecord.id },
            });
            throw new common_1.UnauthorizedException('Refresh token süresi dolmuş');
        }
        return { ...user, refreshToken };
    }
};
exports.JwtRefreshStrategy = JwtRefreshStrategy;
exports.JwtRefreshStrategy = JwtRefreshStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_1.PrismaService])
], JwtRefreshStrategy);
//# sourceMappingURL=jwt-refresh.strategy.js.map