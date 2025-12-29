# Production Deployment Security Checklist

## Pre-Deployment Verification ✅

### Code Security
- [ ] All HIGH npm vulnerabilities fixed (`npm audit` shows acceptable risks only)
- [ ] Strong JWT secrets generated (64+ character random hex)
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- [ ] `.env` file is in `.gitignore` (verify: `git status .env` shows nothing)
- [ ] NO sensitive data in Git history
- [ ] Environment variables documented in `.env.example`

### Application Security
- [ ] HTTPS enforcement enabled (`NODE_ENV=production` in `.env`)
- [ ] CORS whitelist configured with production domain
- [ ] Rate limiting active (test with `curl` loop)
- [ ] Account lockout functional (test 5 failed logins)
- [ ] Password policy enforced (test weak password registration)

### Database Security
- [ ] PostgreSQL uses SSL connection (`?sslmode=require` in DATABASE_URL)
- [ ] Database user has minimal permissions (not superuser)
- [ ] Redis requires password authentication
- [ ] Database backups configured (daily minimum)
- [ ] Backup restoration tested at least once

---

## Infrastructure Setup 🚀

### Reverse Proxy / WAF
- [ ] Deploy behind Cloudflare (free tier acceptable)
  - Enable WAF (Web Application Firewall)
  - Enable Bot Fight Mode
  - Configure rate limiting (secondary to app-level)
- [ ] OR deploy behind Nginx with ModSecurity
- [ ] OR use AWS WAF if on AWS

### SSL/TLS
- [ ] Valid SSL certificate installed (Let's Encrypt or commercial)
- [ ] Certificate auto-renewal configured
- [ ] TLS 1.2 minimum (TLS 1.3 preferred)
- [ ] HTTP to HTTPS redirect at reverse proxy level
- [ ] HSTS header enabled (already done by Helmet ✅)

### Server Hardening
- [ ] Firewall configured (only ports 443, 80, 22 open)
- [ ] SSH key-based authentication only (disable password login)
- [ ] Server software updated (`apt update && apt upgrade`)
- [ ] Fail2ban or similar installed for SSH protection
- [ ] Log rotation configured

---

## Monitoring & Alerting 📊

### Application Monitoring
- [ ] Sentry DSN configured (if using Sentry)
- [ ] Error alert threshold set (email/SMS on critical errors)
- [ ] Uptime monitoring (UptimeRobot, Pingdom, or Datadog)
  - Monitor: `/api/v1/health` endpoint
  - Alert on downtime > 2 minutes
- [ ] Log aggregation configured (CloudWatch, Loggly, or Papertrail)

### Security Monitoring
- [ ] Monitor failed login attempts (Sentry or custom alerts)
- [ ] Monitor rate limit violations (429 responses)
- [ ] Monitor CORS rejections (unusual traffic patterns)
- [ ] Disk space alerts configured (< 15% free)

### Log Management
- [ ] Log retention policy set (30 days minimum)
- [ ] Sensitive data NOT logged (passwords, tokens)
- [ ] Access logs enabled
- [ ] Error logs enabled with stack traces

---

## Post-Deployment Testing 🧪

### Security Validation
- [ ] **HTTPS Test**: Navigate to `http://your-domain.com` (should 301 to HTTPS)
- [ ] **CORS Test**: Try request from unauthorized origin
  ```bash
  curl -H "Origin: http://evil.com" \
    -X OPTIONS https://your-domain.com/api/v1/auth/login -v
  ```
  Expected: CORS error or missing `Access-Control-Allow-Origin`

- [ ] **Rate Limit Test**: Exceed login attempts
  ```bash
  for i in {1..10}; do
    curl -X POST https://your-domain.com/api/v1/auth/login \
      -H "Content-Type: application/json" \
      -d '{"identifier":"test@test.com","password":"wrong"}' &
  done
  ```
  Expected: HTTP 429 after 5 attempts

- [ ] **Account Lockout Test**: 5 failed logins
  Expected: "Hesap geçici olarak kilitlendi" message

- [ ] **CSP Headers Test**: Check security headers
  ```bash
  curl -I https://your-domain.com/api/v1/
  ```
  Expected headers:
  - `Content-Security-Policy: default-src 'self'...`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security: max-age=...`

### Functional Testing
- [ ] User registration works
- [ ] Email verification works
- [ ] Login works
- [ ] Password reset works
- [ ] Wallet transactions work
- [ ] QR code scanning works
- [ ] Mobile app connects successfully

---

## Secrets Management 🔐

### Development vs Production
- [ ] Development uses `.env.development`
- [ ] Production uses `.env.production` or secrets manager
- [ ] No `.env` file in Docker image (use runtime injection)

### Recommended: Use Cloud Secrets Manager
- **AWS Secrets Manager**: Good for AWS deployments
- **Google Cloud Secret Manager**: Good for GCP
- **HashiCorp Vault**: Platform-agnostic, enterprise-grade
- **Azure Key Vault**: Good for Azure deployments

### Secret Rotation Schedule
- [ ] JWT secrets rotated every 90 days (or if compromised)
- [ ] Database passwords rotated every 90 days
- [ ] API keys rotated every 90 days
- [ ] Document rotation procedure

---

## Compliance & Documentation 📋

### Documentation
- [ ] API documentation up-to-date (Swagger)
- [ ] Security policy documented
- [ ] Incident response plan created
- [ ] Data retention policy defined
- [ ] Privacy policy published (if handling EU data, GDPR compliant)

### Backups
- [ ] Database backup tested (restore to staging)
- [ ] Application code in version control
- [ ] Environment variables documented
- [ ] Infrastructure as Code (optional but recommended)

---

## Monthly Maintenance Schedule 📅

### Week 1
- [ ] Review security logs for anomalies
- [ ] Check for new npm vulnerabilities (`npm audit`)
- [ ] Review Sentry/error logs

### Week 2
- [ ] Update dependencies (`npm update` on staging first)
- [ ] Test backup restoration
- [ ] Review uptime metrics

### Week 3
- [ ] Check disk space and database size
- [ ] Archive old logs
- [ ] Review rate limit metrics

### Week 4
- [ ] Review user feedback for security concerns
- [ ] Plan next month's security improvements
- [ ] Document any security incidents

---

## Emergency Contacts 🚨

### Security Incident Response
1. **Detect**: Monitor alerts, user reports
2. **Contain**: Disable affected endpoints if needed
3. **Investigate**: Check logs, identify attack vector
4. **Remediate**: Deploy fix, rotate secrets if needed
5. **Document**: Post-mortem report

### Key Contacts
- **DevOps Lead**: [Name/Email]
- **Security Lead**: [Name/Email]
- **Database Admin**: [Name/Email]
- **On-Call Engineer**: [Phone Number]

---

## Optional (Advanced) 🏆

### Security Enhancements
- [ ] Implement API request signing (HMAC)
- [ ] Add data integrity checksums
- [ ] SSL pinning for mobile app
- [ ] Implement CAPTCHA for public endpoints
- [ ] Add geolocation-based access restrictions

### Testing
- [ ] Run OWASP ZAP automated scan
- [ ] Conduct manual penetration testing
- [ ] Set up bug bounty program
- [ ] Perform load testing (simulate DDoS)

### Compliance
- [ ] SOC 2 audit (if enterprise customers)
- [ ] ISO 27001 certification (if required)
- [ ] PCI DSS compliance (if handling card data)
- [ ] GDPR compliance (if EU users)

---

**Last Updated**: 2025-12-29  
**Next Review**: [Set quarterly review date]
