# Environment Variables - Security Configuration

## Development (.env)

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/niki_coffee?schema=public"

# JWT Secrets (DEVELOPMENT ONLY - CHANGE IN PRODUCTION!)
JWT_SECRET="dev-secret-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production"
JWT_REFRESH_EXPIRES_IN="7d"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""  # Optional in dev

# Email (Development mode - logs to console)
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM_NAME="Niki Coffee"
SMTP_FROM_EMAIL="noreply@nikicoffe.local"

# Application
APP_NAME="Niki Coffee"
APP_PORT=3000
NODE_ENV="development"

# CORS - Development
FRONTEND_URL="http://localhost:19006"
PRODUCTION_APP_URL=""

# Security
HTTPS_ONLY="false"  # Set to "true" in production

# Email Verification
VERIFICATION_CODE_TTL=900  # 15 minutes
RESEND_COOLDOWN=60  # 1 minute
MAX_VERIFICATION_ATTEMPTS=5

# Monitoring (Optional)
SENTRY_DSN=""  # Leave empty in development
```

---

## Production (.env.production)

```bash
# Database - Use SSL connection
DATABASE_URL="postgresql://username:password@production-host:5432/niki_coffee?schema=public&sslmode=require"

# JWT Secrets - GENERATE STRONG SECRETS!
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET="REPLACE_WITH_64_CHAR_RANDOM_HEX_1"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="REPLACE_WITH_64_CHAR_RANDOM_HEX_2"
JWT_REFRESH_EXPIRES_IN="7d"

# Redis - Require password
REDIS_HOST="production-redis-host"
REDIS_PORT=6379
REDIS_PASSWORD="strong-redis-password"

# Email (Production SMTP)
SMTP_HOST="smtp.gmail.com"  # or your SMTP provider
SMTP_PORT=465
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM_NAME="Niki Coffee"
SMTP_FROM_EMAIL="noreply@yourdomain.com"

# Application
APP_NAME="Niki Coffee"
APP_PORT=3000
NODE_ENV="production"

# CORS - Production domains
FRONTEND_URL="https://your-production-domain.com"
PRODUCTION_APP_URL="https://your-production-domain.com"

# Security
HTTPS_ONLY="true"  # CRITICAL: Force HTTPS

# Email Verification
VERIFICATION_CODE_TTL=900
RESEND_COOLDOWN=60
MAX_VERIFICATION_ATTEMPTS=5

# Monitoring
SENTRY_DSN="https://your-project-id@o4507076471349248.ingest.us.sentry.io/1234567"  # Your actual Sentry DSN
```

---

## Security Best Practices

### 1. Secret Generation

**Generate strong secrets**:
```bash
# For JWT_SECRET and JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Example output:
# a3f5c9b2e8d1f4a7c6b3e2d8f1a4c7b9e6d3f8a1c4b7e9d2f5a8c1b4e7d9f2a5

# Use DIFFERENT secrets for JWT_SECRET and JWT_REFRESH_SECRET!
```

### 2. Environment File Security

**Never commit `.env` to Git**:
```bash
# Verify .env is gitignored
git status .env  # Should show nothing

# If it shows up:
echo ".env" >> .gitignore
git rm --cached .env  # Remove from Git if accidentally committed
```

**File permissions** (Linux/Mac):
```bash
chmod 600 .env  # Only owner can read/write
```

### 3. Secrets Manager (Recommended for Production)

Instead of `.env` files, use a secrets manager:

**AWS Secrets Manager**:
```typescript
// Example integration (future enhancement)
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });
const secret = await client.send(
  new GetSecretValueCommand({ SecretId: 'niki-coffee/production' })
);
```

**Google Cloud Secret Manager**:
```typescript
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();
const [version] = await client.accessSecretVersion({
  name: 'projects/PROJECT_ID/secrets/niki-coffee-secrets/versions/latest',
});
```

### 4. Secret Rotation

**Rotate secrets every 90 days**:

1. Generate new secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
2. Update `.env` or secrets manager
3. Restart application
4. Verify all services still work
5. Revoke old refresh tokens (if rotating JWT secrets):
   ```sql
   DELETE FROM refresh_tokens WHERE created_at < NOW() - INTERVAL '7 days';
   ```

---

## Environment Variables by Category

### Required Variables

These **MUST** be set in production:

```bash
DATABASE_URL          # PostgreSQL connection string with SSL
JWT_SECRET            # 64-char random hex
JWT_REFRESH_SECRET    # Different 64-char random hex
REDIS_HOST            # Redis server address
NODE_ENV="production" # Enables production mode
HTTPS_ONLY="true"     # Forces HTTPS redirect
```

### Recommended Variables

These **SHOULD** be set for full functionality:

```bash
SMTP_HOST             # Email delivery
SMTP_PORT
SMTP_USER
SMTP_PASS
SENTRY_DSN            # Error monitoring
FRONTEND_URL          # CORS whitelist
PRODUCTION_APP_URL    # CORS whitelist
```

### Optional Variables

These **MAY** be customized:

```bash
APP_PORT              # Default: 3000
JWT_EXPIRES_IN        # Default: 15m
JWT_REFRESH_EXPIRES_IN  # Default: 7d
VERIFICATION_CODE_TTL  # Default: 900 (15 min)
RESEND_COOLDOWN       # Default: 60 (1 min)
```

---

## Validation Checklist

Before deploying to production, verify:

- [ ] All `REPLACE_WITH_...` placeholders replaced with actual values
- [ ] JWT_SECRET and JWT_REFRESH_SECRET are DIFFERENT
- [ ] Both secrets are at least 64 characters
- [ ] DATABASE_URL includes `sslmode=require`
- [ ] REDIS_PASSWORD is set (not empty)
- [ ] NODE_ENV="production"
- [ ] HTTPS_ONLY="true"
- [ ] FRONTEND_URL and PRODUCTION_APP_URL point to production domain
- [ ] SENTRY_DSN is configured (optional but recommended)
- [ ] `.env` file is in `.gitignore`
- [ ] File permissions are restrictive (`chmod 600 .env`)

---

## Troubleshooting

### Issue: "Invalid JWT signature"
**Cause**: JWT_SECRET was changed after tokens were issued  
**Fix**: Users must re-login. Old refresh tokens are invalid.

### Issue: "CORS error in production"
**Cause**: FRONTEND_URL doesn't match client origin  
**Fix**: Update FRONTEND_URL and PRODUCTION_APP_URL to match your deployed domain

### Issue: "Database SSL required"
**Cause**: DATABASE_URL missing `sslmode=require`  
**Fix**: Add `?sslmode=require` to connection string

### Issue: "Redis connection refused"
**Cause**: REDIS_HOST or REDIS_PASSWORD incorrect  
**Fix**: Verify Redis credentials and network access

---

**Security Note**: Treat this file as a template. NEVER share production `.env` files. Store them securely and restrict access.
