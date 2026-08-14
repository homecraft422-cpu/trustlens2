# Authentication Setup: Password + Email Magic Links

## What changed

Sign-in now supports two methods:

1. **Email link (magic link)** — enter email, open the one-time link, get signed in. New emails are automatically registered as free users after verification.
2. **Password login** — existing password flow remains available.

The sign-up page now sends an email verification link instead of auto-starting an unverified session.

## Why the old "check your password" error happened on Vercel

Without `DATABASE_URL`, the app used `.data/trustlens-store.json`. That file is local to each serverless function invocation/container and is not a durable database. As a result:

- a signup could write on one instance;
- the next login request could be handled by another instance that had never seen that user;
- password hashes could also change if `AUTH_SECRET` was missing/inconsistent.

This made login fail with `INVALID_CREDENTIALS` even when the password was correct.

## Required production environment variables

Set these in Vercel → Project → Settings → Environment Variables:

```env
# REQUIRED: persistent PostgreSQL database
DATABASE_URL=postgresql://user:password@host:5432/trustlens?sslmode=require

# REQUIRED: stable random secret. Generate with: openssl rand -base64 32
AUTH_SECRET=long-random-secret

# REQUIRED for email links
NEXT_PUBLIC_APP_URL=https://trustlens2.vercel.app

# Choose "resend" or "smtp" in production
EMAIL_PROVIDER=resend
EMAIL_FROM=TrustLens <no-reply@yourdomain.com>
RESEND_API_KEY=re_xxx
```

For SMTP instead of Resend:

```env
EMAIL_PROVIDER=smtp
EMAIL_FROM=TrustLens <you@yourdomain.com>
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_SECURE=false
```

## Database migration

After setting `DATABASE_URL`, run:

```bash
npm run db:migrate
```

This applies the new fields/tables:

- `users.email_verified_at`
- `verification_tokens`

If you need to apply the SQL manually, use:

```sql
\i drizzle/0001_email_verification_magic_links.sql
```

## Local testing

The default `EMAIL_PROVIDER=console` does not require an email provider. It logs the magic link to the server console and also returns it as `devPreviewUrl`, which the login/signup UI displays as an "Open dev sign-in link" button.

## Security notes

- Magic links expire in 15 minutes.
- Each token is single-use and stored only as a SHA-256 hash.
- Requesting a new link invalidates previous unconsumed links for that email.
- Cookies remain HTTP-only, secure in production, and `SameSite=Lax`.
