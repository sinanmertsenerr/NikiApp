import { createHash } from 'crypto';

// Store only a SHA-256 hash of the refresh token at rest, so a read-only DB leak
// does not expose immediately-usable long-lived refresh tokens. The token itself
// is a signed JWT (verified by passport before lookup); the hash is just the DB
// selector. sha256 keeps the unique-index lookup O(1).
export const hashRefreshToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
