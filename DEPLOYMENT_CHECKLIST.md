# Deployment Checklist

Step-by-step guide to make sign-in and the dashboard work on your live site.

Merging the code is not enough on its own: the app needs a database and a
secret that only you can provide. This takes about 10 minutes.

---

## Step 1 — Get a free PostgreSQL database (Neon)

Neon has a free tier and is the quickest option.

1. Go to **https://neon.tech** and sign up (GitHub login works).
2. Click **Create project**. Any name, e.g. `trustlens`.
3. Pick the region closest to your users (for India: Singapore or Frankfurt).
4. On the project dashboard, find **Connection string** and click **Copy**.

You get something like:

```
postgresql://neondb_owner:AbC123xyz@ep-cool-name-12345.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

Keep this safe — it contains a password. Make sure it ends with
`?sslmode=require`.

> Supabase and Vercel Postgres work exactly the same way. On Supabase use
> **Settings → Database → Connection string → URI**.

---

## Step 2 — Generate AUTH_SECRET

This signs sessions and password hashes. It must be random and must never
change afterwards.

```bash
openssl rand -base64 32
```

Example output (**do not use this one — generate your own**):

```
N1rNS42BclTUHOCl0OLvw7hWsqiAtzxQX4Vkh4oBEdo=
```

⚠️ If you change this later, every user is signed out and every existing
password stops working. Set it once and leave it alone.

---

## Step 3 — Add the environment variables

### On Vercel

1. Open your project → **Settings** → **Environment Variables**.
2. Add each variable below. Tick **Production**, **Preview** and
   **Development** for all of them.

| Name | Value |
| --- | --- |
| `DATABASE_URL` | the Neon string from Step 1 |
| `AUTH_SECRET` | the value from Step 2 |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` (your real site URL, no trailing slash) |
| `EMAIL_PROVIDER` | `resend` |
| `EMAIL_FROM` | `TrustLens <no-reply@your-domain.com>` |
| `RESEND_API_KEY` | from Step 5 (add it now or later) |

3. Click **Save**.

> Environment variables only apply to **new** deployments. After saving, go
> to **Deployments** → latest → **⋯** → **Redeploy**.

### On another host (Railway, Render, Fly, VPS)

Set the same variables in that platform's environment/secrets settings, or
in a `.env` file on the server that is not committed to Git.

---

## Step 4 — Create the tables (run once)

Your database is empty right now. The tables must be created once.

On your own computer, in the project folder:

```bash
# Paste YOUR Neon connection string in the quotes
DATABASE_URL="postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require" npm run db:migrate
```

Expected output:

```
[✓] migrations applied successfully!
```

Then confirm it worked:

```bash
DATABASE_URL="postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require" npm run db:check
```

Expected output:

```
✅ Connected: PostgreSQL 17.x
✅ Schema present (10 tables)
✅ users table readable (0 accounts)
🎉 Database is ready.
```

Notes:
- Run this **once per database**. Re-running is harmless — already-applied
  migrations are skipped.
- Use the **same** connection string you put in Vercel, otherwise you will
  migrate the wrong database.
- If you use a `.env` file locally with the production URL, you can just run
  `npm run db:migrate` without the prefix.

---

## Step 5 — Email delivery (for magic links)

Without this, sign-in links are only printed to the server log and never
reach anyone's inbox.

1. Sign up at **https://resend.com** (free tier: 3,000 emails/month).
2. **Domains** → **Add Domain** → enter your domain.
3. Resend shows DNS records (SPF, DKIM). Add them at your domain registrar
   (GoDaddy, Namecheap, Cloudflare, etc.), then click **Verify**.
4. **API Keys** → **Create API Key** → copy it (starts with `re_`).
5. Put it in `RESEND_API_KEY` on Vercel and redeploy.

Important: `EMAIL_FROM` must use the domain you verified. If you verified
`example.com`, then `no-reply@example.com` works but `no-reply@gmail.com`
will be rejected.

> **Testing without a domain?** Resend allows sending to *your own*
> registered email using `onboarding@resend.dev` as the sender. Fine for a
> quick test, not for real users.

### Gmail instead of Resend

```
EMAIL_PROVIDER=smtp
EMAIL_FROM=Your Name <you@gmail.com>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_SECURE=false
```

Gmail needs an **App Password** (Google Account → Security → 2-Step
Verification → App passwords), not your normal password.

---

## Step 6 — Verify it worked

Open in your browser:

```
https://your-domain.com/api/health
```

**Correct:**

```json
{
  "ok": true,
  "database": { "ok": true, "driver": "postgresql", "durable": true, "latencyMs": 23 },
  "auth": { "secretConfigured": true },
  "email": { "provider": "resend" }
}
```

**Still broken:**

```json
{
  "ok": false,
  "database": { "driver": "fallback", "durable": false, "warning": "DATABASE_URL is not configured..." }
}
```

`"driver": "fallback"` means `DATABASE_URL` is not reaching the app — check
for typos, confirm you ticked the Production environment, and confirm you
redeployed after saving.

Then do a real test:

1. Create an account on `/signup`.
2. Check the email arrives, click the link — it should sign you in.
3. Open `/dashboard` — it should load.
4. Sign out and sign back in with your password.
5. Redeploy the site, then reload `/dashboard` — **you should still be
   signed in.** This is the proof that persistence is working.

---

## Common problems

| What you see | Cause | Fix |
| --- | --- | --- |
| `/api/health` shows `"driver": "fallback"` | `DATABASE_URL` not reaching the app | Check spelling, tick Production, redeploy |
| `relation "users" does not exist` | Step 4 not done | Run `npm run db:migrate` |
| Everyone signed out after each deploy | `AUTH_SECRET` missing or changing | Set a fixed value in env vars |
| "Check your password" though it is correct | `AUTH_SECRET` changed after signup | Restore the old secret, or have users re-register |
| No email arrives | `RESEND_API_KEY` missing or domain unverified | Complete Step 5; check Resend → Logs |
| Email rejected (403 / 422) | `EMAIL_FROM` domain not verified | Use an address on your verified domain |
| Magic link opens `localhost` | `NEXT_PUBLIC_APP_URL` wrong | Set it to your real https URL |
| `password authentication failed` | Wrong DB password | Re-copy the connection string from Neon |
| Connection timeout | IP not allowed | Neon allows all by default; on other hosts allow `0.0.0.0/0` |

---

## Optional: demo data

Adds sample reports and a `demo@trustlens.ai` / `password123` account, which
powers the demo button on the sign-in page:

```bash
DATABASE_URL="your-connection-string" npm run db:seed
```

Skip this for a real production site, or delete the demo user afterwards.

---

## Quick reference

```bash
npm run db:migrate   # create tables (once per database)
npm run db:check     # diagnose connection / schema / AUTH_SECRET
npm run db:seed      # optional demo data
npm run db:studio    # browse the database in a GUI
```

Minimum required environment variables:

```env
DATABASE_URL=postgresql://...?sslmode=require
AUTH_SECRET=<openssl rand -base64 32>
NEXT_PUBLIC_APP_URL=https://your-domain.com
EMAIL_PROVIDER=resend
EMAIL_FROM=TrustLens <no-reply@your-domain.com>
RESEND_API_KEY=re_...
```
