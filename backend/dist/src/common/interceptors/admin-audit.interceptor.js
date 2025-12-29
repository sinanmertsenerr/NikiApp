"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let AdminAuditInterceptor = class AdminAuditInterceptor {
    logger = new common_1.Logger('AdminAudit');
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const { method, path, body, params, query } = request;
        if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
            return next.handle();
        }
        const startTime = Date.now();
        const timestamp = new Date().toISOString();
        this.logger.log(`[${timestamp}] ADMIN ACTION START | ` +
            `User: ${user.email} (${user.sub}) | ` +
            `${method} ${path}`);
        return next.handle().pipe((0, operators_1.tap)({
            next: (response) => {
                const duration = Date.now() - startTime;
                this.logger.log(`[${timestamp}] ADMIN ACTION SUCCESS | ` +
                    `User: ${user.email} (${user.sub}) | ` +
                    `${method} ${path} | ` +
                    `Duration: ${duration}ms | ` +
                    `Params: ${JSON.stringify(params)} | ` +
                    `Body: ${this.sanitizeBody(body)}`);
            },
            error: (error) => {
                const duration = Date.now() - startTime;
                this.logger.error(`[${timestamp}] ADMIN ACTION FAILED | ` +
                    `User: ${user.email} (${user.sub}) | ` +
                    `${method} ${path} | ` +
                    `Duration: ${duration}ms | ` +
                    `Error: ${error.message}`);
            },
        }));
    }
    sanitizeBody(body) {
        if (!body)
            return '{}';
        const sanitized = { ...body };
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
        const bodyString = JSON.stringify(sanitized);
        if (bodyString.length > 500) {
            return bodyString.substring(0, 500) + '... [TRUNCATED]';
        }
        return bodyString;
    }
};
exports.AdminAuditInterceptor = AdminAuditInterceptor;
exports.AdminAuditInterceptor = AdminAuditInterceptor = __decorate([
    (0, common_1.Injectable)()
], AdminAuditInterceptor);
//# sourceMappingURL=admin-audit.interceptor.js.map