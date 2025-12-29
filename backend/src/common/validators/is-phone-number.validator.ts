import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { isValidPhoneNumber, parsePhoneNumber, CountryCode } from 'libphonenumber-js';

/**
 * Phone Number Validator using Google's libphonenumber
 * Validates E.164 format phone numbers (e.g., +905551234567)
 */
@ValidatorConstraint({ async: false })
export class IsPhoneNumberConstraint implements ValidatorConstraintInterface {
  validate(phoneNumber: string, args: ValidationArguments): boolean {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return false;
    }

    // Must start with +
    if (!phoneNumber.startsWith('+')) {
      return false;
    }

    // Validate using libphonenumber
    try {
      return isValidPhoneNumber(phoneNumber);
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Geçerli bir telefon numarası giriniz (örn: +905551234567)';
  }
}

/**
 * Custom decorator for phone number validation
 * @param validationOptions - Optional validation options
 *
 * @example
 * ```typescript
 * @IsPhoneNumber()
 * phone: string;
 * ```
 */
export function IsPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPhoneNumberConstraint,
    });
  };
}

/**
 * Utility function to normalize phone number to E.164 format
 * @param phoneNumber - Phone number in any format
 * @param defaultCountry - Default country code if not provided in number
 * @returns Normalized E.164 format or null if invalid
 *
 * @example
 * ```typescript
 * normalizePhoneNumber('5551234567', 'TR') // Returns: +905551234567
 * normalizePhoneNumber('+905551234567')    // Returns: +905551234567
 * normalizePhoneNumber('invalid')          // Returns: null
 * ```
 */
export function normalizePhoneNumber(
  phoneNumber: string,
  defaultCountry?: CountryCode,
): string | null {
  try {
    const parsed = parsePhoneNumber(phoneNumber, defaultCountry);
    if (parsed && parsed.isValid()) {
      return parsed.format('E.164');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Utility function to get phone number details
 * @param phoneNumber - Phone number in E.164 format
 * @returns Phone number details or null if invalid
 */
export function getPhoneNumberInfo(phoneNumber: string): {
  country: CountryCode | undefined;
  countryCallingCode: string;
  nationalNumber: string;
  isValid: boolean;
} | null {
  try {
    const parsed = parsePhoneNumber(phoneNumber);
    if (!parsed) return null;

    return {
      country: parsed.country,
      countryCallingCode: parsed.countryCallingCode,
      nationalNumber: parsed.nationalNumber,
      isValid: parsed.isValid(),
    };
  } catch {
    return null;
  }
}
