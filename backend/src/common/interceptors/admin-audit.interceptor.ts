import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Admin Audit Interceptor
 * Logs all admin actions for security audit trail
 */
@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
    private readonly logger = new Logger('AdminAudit');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const { method, path, body, params, query } = request;

        // Only log for admin users
        if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
            return next.handle();
        }

        const startTime = Date.now();
        const timestamp = new Date().toISOString();

        // Log request start
        this.logger.log(
            `[${timestamp}] ADMIN ACTION START | ` +
            `User: ${user.email} (${user.sub}) | ` +
            `${method} ${path}`
        );

        return next.handle().pipe(
            tap({
                next: (response) => {
                    const duration = Date.now() - startTime;
                    this.logger.log(
                        `[${timestamp}] ADMIN ACTION SUCCESS | ` +
                        `User: ${user.email} (${user.sub}) | ` +
                        `${method} ${path} | ` +
                        `Duration: ${duration}ms | ` +
                        `Params: ${JSON.stringify(params)} | ` +
                        `Body: ${this.sanitizeBody(body)}`
                    );
                },
                error: (error) => {
                    const duration = Date.now() - startTime;
                    this.logger.error(
                        `[${timestamp}] ADMIN ACTION FAILED | ` +
                        `User: ${user.email} (${user.sub}) | ` +
                        `${method} ${path} | ` +
                        `Duration: ${duration}ms | ` +
                        `Error: ${error.message}`
                    );
                },
            }),
        );
    }

    /**
     * Sanitize body to remove sensitive data before logging
     */
    private sanitizeBody(body: any): string {
        if (!body) return '{}';

        const sanitized = { ...body };

        // Remove sensitive fields
        const sensitiveFields = [
            'password',
            'passwordHash',
            'token',
            'refreshToken',
            'accessToken',
            'secret',
            'apiKey',
            'creditCard',
            'cvv',
        ];

        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }

        // Limit body size in logs
        const bodyString = JSON.stringify(sanitized);
        if (bodyString.length > 500) {
            return bodyString.substring(0, 500) + '... [TRUNCATED]';
        }

        return bodyString;
    }
}
