// A thrown error that carries the backend's structured fields (code, status)
// alongside a user-friendly message. Lets screens branch on a stable error code
// (e.g. 'PHONE_NOT_VERIFIED') instead of matching on a localized message string.
export class AppError extends Error {
  code?: string;
  status?: number;
  details?: unknown;

  constructor(message: string, opts?: { code?: string; status?: number; details?: unknown }) {
    super(message);
    this.name = 'AppError';
    this.code = opts?.code;
    this.status = opts?.status;
    this.details = opts?.details;
  }
}
