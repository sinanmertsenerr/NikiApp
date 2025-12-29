import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize Pipe - XSS Protection
 * Sanitizes all string inputs to prevent Cross-Site Scripting attacks
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
        if (typeof value === 'string') {
            return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] }); // Strip all HTML
        }

        if (typeof value === 'object' && value !== null) {
            return this.sanitizeObject(value);
        }

        return value;
    }

    private sanitizeObject(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeValue(item));
        }

        const sanitized: any = {};

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                sanitized[key] = this.sanitizeValue(obj[key]);
            }
        }

        return sanitized;
    }

    private sanitizeValue(value: any): any {
        if (typeof value === 'string') {
            return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
        } else if (typeof value === 'object' && value !== null) {
            return this.sanitizeObject(value);
        }
        return value;
    }
}
