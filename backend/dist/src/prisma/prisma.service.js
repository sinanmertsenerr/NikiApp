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
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger('PrismaService');
    constructor() {
        super({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
            log: [
                { level: 'warn', emit: 'event' },
                { level: 'error', emit: 'event' },
            ],
        });
        this.$on('warn', (e) => {
            this.logger.warn(e);
        });
        this.$on('error', (e) => {
            this.logger.error(e);
        });
    }
    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('✅ Database connected successfully');
            if (process.env.NODE_ENV === 'production') {
                try {
                    const result = await this.$queryRaw `SELECT version();`;
                    this.logger.log(`Database version: ${result[0]?.version}`);
                }
                catch (error) {
                    this.logger.warn('Could not verify database connection');
                }
            }
        }
        catch (error) {
            this.logger.error(`❌ Database connection failed: ${error.message}`);
            throw error;
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Database disconnected');
    }
    async cleanDatabase() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('cleanDatabase is not allowed in production');
        }
        const models = [
            'wheelSpin',
            'userBadge',
            'userCampaign',
            'order',
            'transaction',
            'product',
            'category',
            'campaign',
            'badge',
            'loyaltyPoints',
            'wallet',
            'refreshToken',
            'user',
        ];
        for (const model of models) {
            await this[model].deleteMany();
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map