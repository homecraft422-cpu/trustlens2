# Authentication Setup: Password + Email Magic Links

## Sign-in methods

1. **Email link (magic link)** — enter an email, open the one-time link, get signed in. New emails are registered as free users after verification.
2. **Password login** — classic email + password.

The sign-up page sends an email verification link instead of starting an unverified session.

## PostgreSQL is required

TrustLens stores accounts, sessions, magic-link tokens, analyses and usage counters in PostgreSQL. A shared database is not optional in production:

- A magic link created by one server instance must verify on **any** instance.
- A session created by one request must be readable by the next.
- Logout must genuinely revoke a session everywhere.

Without `DATABASE_URL`, the app falls back to a per-instance file store. Sign-in still works (session and magic-link tokens are HMAC-signed so they validate anywhere), but **analyses, reports and usage counters are not shared between instances and can disappear.** Treat the fallback as development-only.

## Required environment variables

```env
# REQUIRED: persistent PostgreSQL database
DATABASE_URL=postgresql://user:password@host:5432/trustlens?sslmode=require

# REQUIRED: stable random secret. Generate with: openssl rand -base64 32
# Changing this invalidates every session and every stored password hash.
AUTH_SECRET=long-random-secret

# REQUIRED for correct links in emails
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Email delivery: "resend" or "smtp" in production
EMAIL_PROVIDER=resend
EMAIL_FROM=TrustLens <no-reply@yourdomain.com>
RESEND_API_KEY=re_xxx
```

SMTP instead of Resend:

```env
EMAIL_PROVIDER=smtp
EMAIL_FROM=TrustLens <you@yourdomain.com>
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_SECURE=false
```

## First-time setup

```bash
# 1. Create .env and apply migrations (interactive helper)
npm run db:setup

# — or do it manually —
npm run db:migrate     # create the schema
npm run db:check       # verify connection + schema + AUTH_SECRET
npm run db:seed        # optional: demo data + demo@trustlens.ai / password123
```

`npm run db:check` is the fastest way to diagnose a broken deployment. It reports the exact problem — unreachable host, wrong credentials, missing tables, or an unset `AUTH_SECRET`.

### Getting a database

Any managed PostgreSQL works. Common choices:

- **Neon** — https://neon.tech (serverless, generous free tier)
- **Supabase** — https://supabase.com
- **Vercel Postgres** — from the Vercel dashboard

Copy the connection string into `DATABASE_URL`. Most hosted providers require `?sslmode=require`.

### Deploying on Vercel

1. Project → Settings → Environment Variables → add the variables above.
2. Run the migration once against the production database:
   ```bash
   DATABASE_URL='postgresql://…' npm run db:migrate
   ```
3. Redeploy.

## Verifying a deployment

`GET /api/health` reports live status without needing log access:

```json
{
  "ok": true,
  "database": { "ok": true, "driver": "postgresql", "durable": true, "latencyMs": 12 },
  "auth": { "secretConfigured": true },
  "email": { "provider": "resend" }
}
```

It returns **503** when the database is unreachable, or when production is running on the non-durable fallback store. `driver: "fallback"` means `DATABASE_URL` is missing or not a PostgreSQL URL.

## Local development

`EMAIL_PROVIDER=console` needs no email provider: the magic link is printed to the server console and returned as `devPreviewUrl`, which the login/signup pages show as an "Open dev sign-in link" button.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| "Sign-in is temporarily unavailable" on password login | `DATABASE_URL` points at an unreachable/misconfigured PostgreSQL server, so the login query throws | Fix `DATABASE_URL` (see below). As a safety net the app now auto-falls-back to its local store for that request, so sign-in still works. |
| "Your email provider rejected the message (422)" on email link | The `EMAIL_FROM` sender domain is not verified in your email provider (e.g. Resend) | Verify the domain in the provider dashboard, or use a verified sender address. If sending still fails, the app now returns the one-time link directly so you can still sign in. |
| "Check your password" for a correct password | `AUTH_SECRET` changed, or no shared database | Restore the original secret, or reset the password. Set `DATABASE_URL`. |
| Magic link opens `localhost` | `NEXT_PUBLIC_APP_URL` wrong | Set it to your real domain. The link now falls back to the request host. |
| "This account has no password" | Account was created via magic link | Sign in with the Email link tab. |
| Signed out after every deploy | Fallback store (per-instance, wiped on deploy) | Set `DATABASE_URL`. |
| Dashboard shows zeros after redeploy | Analyses were in the fallback store | Set `DATABASE_URL`; those rows are not recoverable. |
| `/api/health` returns `driver: "fallback"` | `DATABASE_URL` unset/invalid | Must start with `postgresql://` or `postgres://`. |

## Security notes

- Magic links expire in 15 minutes, are single-use, and are stored only as SHA-256 hashes.
- Requesting a new link invalidates previous unconsumed links for that email.
- Cookies are HTTP-only, `Secure` in production, and `SameSite=Lax`.
- Password verification uses a constant-time comparison and does not reveal whether an email is registered.
- Sessions are revoked server-side on logout when PostgreSQL is configured.
