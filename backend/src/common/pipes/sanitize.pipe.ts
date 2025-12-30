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

        // Check if it's a plain object (not a class instance like Date, etc.)
        if (Object.getPrototypeOf(obj) !== Object.prototype && Object.getPrototypeOf(obj) !== null) {
            return obj; // Return non-plain objects as-is
        }

        const sanitized: any = {};

        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
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
