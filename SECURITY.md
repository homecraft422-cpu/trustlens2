# 🔒 TrustLens2 Security Guide

## Security Measures Implemented

### 1. ✅ Secrets Protection
- All secrets stored in environment variables
- `.env` file in `.gitignore`
- `.env.example` provided with empty values
- No secrets in frontend code
- No secrets in API responses

### 2. ✅ Rate Limiting
- Auth endpoints: 5 requests per 15 minutes
- General API: 60 requests per minute
- Analysis endpoints: 10 requests per minute
- File uploads: 5 requests per minute
- Fact check: 20 requests per minute
- 429 status with Retry-After header

### 3. ✅ Input Validation
- Zod schemas for all inputs
- Server-side validation on all endpoints
- File type validation (MIME + extension)
- File size limits enforced
- SQL injection prevention
- XSS prevention

### 4. ✅ Authentication Security
- Passwords hashed with bcrypt
- JWT tokens with expiry
- Secure session management
- Account lockout after failed attempts
- httpOnly cookies for tokens

### 5. ✅ Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Content-Security-Policy
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

### 6. ✅ CORS Configuration
- Specific origins only (no wildcard)
- Credentials support
- Preflight handling

### 7. ✅ Error Handling
- No stack traces in production
- Generic error messages for users
- Detailed logging server-side
- Unique error IDs for tracking

### 8. ✅ File Upload Security
- MIME type validation
- File size limits
- UUID filenames (no original names)
- Files stored outside web root
- No executable permissions

### 9. ✅ Database Security
- Parameterized queries (ORM)
- No raw SQL interpolation
- Input sanitization
- Connection pooling

### 10. ✅ API Security
- Authentication required for sensitive routes
- Ownership verification
- Role-based access control
- Request size limits

---

## Security Files

```
src/lib/security/
├── index.ts          # Main security exports
├── rate-limit.ts     # Rate limiting middleware
├── validation.ts     # Input validation with Zod
├── headers.ts        # Security headers & CORS
└── error-handler.ts  # Secure error handling

src/scripts/
└── security-audit.ts # Security audit script
```

---

## Running Security Audit

```bash
# Run security audit
npm run security:audit

# Or manually
npx tsx src/scripts/security-audit.ts
```

---

## Security Checklist

### Before Deployment

- [ ] All secrets in environment variables
- [ ] `.env` not in Git
- [ ] `.env.example` has all variables listed
- [ ] Debug mode off in production
- [ ] Rate limiting active
- [ ] CORS restricted to known origins
- [ ] Security headers enabled
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak internals
- [ ] File uploads validated
- [ ] Database not publicly exposed
- [ ] HTTPS enforced
- [ ] Logging configured
- [ ] Monitoring set up

### Regular Maintenance

- [ ] Rotate API keys quarterly
- [ ] Update dependencies monthly
- [ ] Review access logs weekly
- [ ] Run security audit before each deploy
- [ ] Monitor for suspicious activity
- [ ] Backup database regularly

---

## Common Security Issues & Fixes

### Issue: Hardcoded API Key
```typescript
// ❌ BAD
const apiKey = "sk-1234567890abcdef";

// ✅ GOOD
const apiKey = process.env.API_KEY;
```

### Issue: No Input Validation
```typescript
// ❌ BAD
const email = req.body.email;

// ✅ GOOD
const result = emailSchema.safeParse(req.body.email);
if (!result.success) {
  return res.status(400).json({ error: "Invalid email" });
}
const email = result.data;
```

### Issue: SQL Injection
```typescript
// ❌ BAD
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ GOOD
const user = await db.select().from(users).where(eq(users.email, email));
```

### Issue: Leaking Stack Trace
```typescript
// ❌ BAD
catch (error) {
  return res.status(500).json({ error: error.stack });
}

// ✅ GOOD
catch (error) {
  console.error("Error:", error);
  return res.status(500).json({ error: "Something went wrong" });
}
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Database connection string |
| `AUTH_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `DETECTION_MODE` | No | "mock" or "production" |
| `HIVE_API_KEY` | No | Hive AI API key |
| `SIGHTENGINE_API_USER` | No | Sightengine user |
| `SIGHTENGINE_API_SECRET` | No | Sightengine secret |

---

## Reporting Security Issues

If you find a security vulnerability:

1. **DO NOT** open a public issue
2. Email: security@trustlens.com
3. Include steps to reproduce
4. Wait for response before disclosing

---

## Security Tools

- **npm audit**: Check for vulnerable dependencies
- **Snyk**: Automated security scanning
- **OWASP ZAP**: Web application security testing
- **Sentry**: Error tracking and monitoring

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
