import { Module, Global, Logger } from '@nestjs/common';
import { RedisModule as NestRedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [
    NestRedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        const host = configService.get('REDIS_HOST', 'localhost');
        const port = configService.get('REDIS_PORT', 6379);
        const password = configService.get('REDIS_PASSWORD', '');
        const db = configService.get('REDIS_DB', 0);

        logger.log(`Connecting to Redis at ${host}:${port}`);

        return {
          type: 'single',
          url: password
            ? `redis://:${password}@${host}:${port}/${db}`
            : `redis://${host}:${port}/${db}`,
          options: {
            // Connection
            connectTimeout: 10000,
            commandTimeout: 5000,

            // Retry strategy
            retryStrategy: (times: number) => {
              if (times > 10) {
                logger.error('Redis: Max retry attempts reached');
                return null; // Stop retrying
              }
              const delay = Math.min(times * 500, 5000);
              logger.warn(`Redis: Retrying connection in ${delay}ms (attempt ${times})`);
              return delay;
            },

            // Reconnect on error
            reconnectOnError: (err: Error) => {
              const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
              const shouldReconnect = targetErrors.some((e) =>
                err.message.includes(e),
              );
              if (shouldReconnect) {
                logger.warn(`Redis: Reconnecting due to error: ${err.message}`);
              }
              return shouldReconnect;
            },

            // Keep alive
            keepAlive: 30000,

            // Disable offline queue to fail fast
            enableOfflineQueue: true,
            maxRetriesPerRequest: 3,

            // TLS support (for production)
            ...(configService.get('REDIS_TLS') === 'true' && {
              tls: {
                rejectUnauthorized: false,
              },
            }),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [RedisService],
  exports: [RedisService, NestRedisModule],
})
export class RedisModule {}
