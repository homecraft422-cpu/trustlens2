# 🚀 Vercel Setup — TrustLens Production Checklist

Your live site is **trustlens2.vercel.app**. Analysis works out of the box with
the built-in local engine, and the report you just generated now always opens:
the upload API embeds the finished report in its response, the client caches it,
and the result page renders from that cache even when a later request lands on a
different server instance (previously this intermittently showed "Result Not
Found" in the last report). The settings below make the site fully **reliable
and persistent**:

---

## 1. DATABASE_URL (most important for persistence)

Without it, the app uses a per-instance fallback store. The embedded-report fix
means a freshly generated report still opens, but without a shared database you
will still see:

- ❌ History / "My Reports" not persisting across instances
- ❌ Reports not surviving a page refresh or being opened from another device
- ❌ Guest quotas resetting randomly
- ❌ Accounts and their history not persisting

**Fix (5 minutes, free):**

1. Create a free Postgres database at https://neon.tech (or use Supabase/Vercel Postgres)
2. Copy the connection string (looks like `postgresql://user:password@host/db?sslmode=require`)
3. In Vercel → your project → **Settings → Environment Variables** → add:
   ```
   DATABASE_URL=postgresql://...
   ```
4. Run the migration once (in this repo, after `npm install`):
   ```bash
   DATABASE_URL="postgresql://..." npm run db:migrate
   ```
5. Redeploy (Vercel → Deployments → Redeploy)

## 2. AUTH_SECRET

Without it, sessions/password hashes are tied to an insecure default.

```bash
openssl rand -base64 32
```

Add the output to Vercel env vars as `AUTH_SECRET`.

## 3. Email (so magic-link signup actually delivers)

Default is `console` (login links only appear in server logs — useless in
production). Pick one in Vercel env vars:

- **Resend (easiest, free tier):**
  ```
  EMAIL_PROVIDER=resend
  RESEND_API_KEY=re_xxxx
  EMAIL_FROM=TrustLens <no-reply@yourdomain.com>
  ```
- **Your own SMTP:**
  ```
  EMAIL_PROVIDER=smtp
  SMTP_HOST=smtp.yourmail.com
  SMTP_PORT=587
  SMTP_USER=...
  SMTP_PASSWORD=...
  SMTP_SECURE=false
  ```

## 4. (Optional) Neural detection providers

Without these, TrustLens uses the built-in local heuristic engine — real,
deterministic metadata/statistical analysis, but no deep-learning models.

| Variable | Provider | Modalities |
|---|---|---|
| `HIVE_API_KEY` | Hive AI | image, video, audio |
| `SIGHTENGINE_API_USER` + `SIGHTENGINE_API_SECRET` | Sightengine | image, video |

When any provider key is present, set `DETECTION_MODE=production` to enable it.

## 5. (Optional) Adsterra ads

Already wired in `src/lib/ads.ts`. Master switch: `NEXT_PUBLIC_ADS_ENABLED=true`
(automatically on in production). Add your ads.txt line from the Adsterra
dashboard to `ads.txt`.

---

### Quick sanity check after setup

Visit `https://trustlens2.vercel.app/api/health` — it should show
`"database": {"ok": true}` and `"auth": {"secretConfigured": true}`.
