"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const serve_static_1 = require("@nestjs/serve-static");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const core_1 = require("@nestjs/core");
const path_1 = require("path");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_1 = require("./prisma");
const redis_1 = require("./redis");
const auth_1 = require("./auth");
const wheel_1 = require("./wheel");
const menu_1 = require("./menu");
const users_1 = require("./users");
const campaigns_1 = require("./campaigns");
const wallet_1 = require("./wallet");
const email_1 = require("./email");
const notification_1 = require("./notification");
const upload_module_1 = require("./upload/upload.module");
const events_1 = require("./events");
const groups_module_1 = require("./groups/groups.module");
const raffles_1 = require("./raffles");
const health_module_1 = require("./health/health.module");
const guards_1 = require("./auth/guards");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 10,
                }]),
            schedule_1.ScheduleModule.forRoot(),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(process.cwd(), 'uploads'),
                serveRoot: '/uploads',
                serveStaticOptions: {
                    index: false,
                },
            }),
            prisma_1.PrismaModule,
            redis_1.RedisModule,
            email_1.EmailModule,
            notification_1.NotificationModule,
            auth_1.AuthModule,
            wheel_1.WheelModule,
            menu_1.MenuModule,
            users_1.UsersModule,
            campaigns_1.CampaignsModule,
            wallet_1.WalletModule,
            upload_module_1.UploadModule,
            events_1.EventsModule,
            groups_module_1.GroupsModule,
            raffles_1.RafflesModule,
            health_module_1.HealthModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: guards_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map