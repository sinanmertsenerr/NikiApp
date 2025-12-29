import { HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';
export declare class HealthController {
    private health;
    private db;
    constructor(health: HealthCheckService, db: PrismaHealthIndicator);
    check(): Promise<HealthCheckResult>;
}
