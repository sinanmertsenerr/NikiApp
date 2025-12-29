import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { RedisModule } from './redis';
import { AuthModule } from './auth';
import { WheelModule } from './wheel';
import { MenuModule } from './menu';
import { UsersModule } from './users';
import { CampaignsModule } from './campaigns';
import { WalletModule } from './wallet';
import { EmailModule } from './email';
import { NotificationModule } from './notification';
import { UploadModule } from './upload/upload.module';
import { EventsModule } from './events';
import { GroupsModule } from './groups/groups.module';
import { RafflesModule } from './raffles';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './auth/guards';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 10, // 10 requests per minute (global default)
    }]),

    // Task Scheduling (for cleanup jobs)
    ScheduleModule.forRoot(),

    // Serve static files (uploaded images)
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
      },
    }),

    // Database
    PrismaModule,

    // Cache
    RedisModule,

    // Email
    EmailModule,

    // Push Notifications
    NotificationModule,

    // Feature Modules
    AuthModule,
    WheelModule,
    MenuModule,
    UsersModule,
    CampaignsModule,
    WalletModule,
    UploadModule,
    EventsModule,
    GroupsModule,
    RafflesModule,
    HealthModule,
    // OrdersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global JWT Guard - all routes protected by default
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global Throttler Guard - rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
