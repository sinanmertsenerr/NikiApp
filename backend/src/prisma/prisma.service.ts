import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');

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

    // Log database warnings/errors
    this.$on('warn' as never, (e: any) => {
      this.logger.warn(e);
    });

    this.$on('error' as never, (e: any) => {
      this.logger.error(e);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');

      // Verify SSL connection in production
      if (process.env.NODE_ENV === 'production') {
        try {
          const result: any = await this.$queryRaw`SELECT version();`;
          this.logger.log(`Database version: ${result[0]?.version}`);
        } catch (error) {
          this.logger.warn('Could not verify database connection');
        }
      }
    } catch (error) {
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

    // Delete in correct order due to foreign key constraints
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
}
