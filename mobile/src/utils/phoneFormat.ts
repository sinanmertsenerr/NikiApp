/**
 * Phone number formatting utilities
 * Formats Turkish phone numbers to: 0 (5XX) XXX XX XX
 */

/**
 * Format a phone number to Turkish display format
 * Input: Any format (05551234567, +905551234567, 5551234567, etc.)
 * Output: 0 (555) 123 45 67
 */
export const formatPhoneNumber = (phone: string | undefined | null): string => {
    if (!phone) return '';

    // Remove all non-digit characters
    const digits = String(phone).replace(/\D/g, '');

    // Get last 10 digits (removes country code if present)
    const last10 = digits.slice(-10);

    // Ensure we have 10 digits
    if (last10.length !== 10) {
        return phone; // Return original if not valid
    }

    // Format: 0 (5XX) XXX XX XX
    const areaCode = last10.substring(0, 3);   // 555
    const part1 = last10.substring(3, 6);       // 123
    const part2 = last10.substring(6, 8);       // 45
    const part3 = last10.substring(8, 10);      // 67

    return `0 (${areaCode}) ${part1} ${part2} ${part3}`;
};

/**
 * Display phone or fallback to email
 * Returns formatted phone if available, otherwise email
 */
export const formatPhoneOrEmail = (phone: string | undefined | null, email: string): string => {
    if (phone) {
        return formatPhoneNumber(phone);
    }
    return email;
};
