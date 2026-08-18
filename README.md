# TRUSTLENS — Evidence-first AI content verification

A Next.js 16 web app that lets anyone upload images, videos, audio, claims
or links and get a transparent, evidence-based authenticity report.

The app combines:

- A built-in **local heuristic engine** (real EXIF/metadata, statistical
  analysis of image/audio/video bytes, C2PA manifest detection) that runs
  with **no API keys** and is deterministic — same file → same report.
- Optional **neural detection providers** (Hive AI, Sightengine) that plug
  in when real paid API keys are configured in `.env`.
- **Real third-party APIs** for the auxiliary tools: Google Fact Check
  Tools, Wikipedia (free fallback), the IANA RDAP WHOIS-style registry,
  and YouTube oEmbed for real video metadata.
- **Honest reserves**: when no source can verify a claim or fetch a URL,
  it is reported as `unverified` or `not reachable` instead of guessing.

## Quickstart

```bash
npm install
cp .env.example .env
# Fill in AUTH_SECRET and any provider keys you have (the app boots fine
# without them, on a per-instance file store).
npm run db:migrate        # only if DATABASE_URL is set
npm run dev               # http://localhost:3000
```

## Environment variables (real API keys needed)

| Service                | Variable(s)                              | Cost        | Required? |
|------------------------|------------------------------------------|-------------|-----------|
| PostgreSQL             | `DATABASE_URL`                           | Free tier OK| Recommended (serverless fallback otherwise) |
| Magic-link emails      | `RESEND_API_KEY` or SMTP env             | Free tier OK| Recommended for auth |
| Google Fact Check API  | `GOOGLE_FACTCHECK_API_KEY`               | Free        | Optional — enables real professional ratings in the Fact Checker |
| Hive AI detection      | `HIVE_API_KEY`                           | Paid        | Optional — unlocks neural image/video detection |
| Sightengine detection  | `SIGHTENGINE_API_USER` + `SIGHTENGINE_API_SECRET` | Paid | Optional — neural moderation |
| Google AdSense         | `NEXT_PUBLIC_ADSENSE_CLIENT` + ads.txt   | Free        | Optional — visit `/api/health`, then `/ads.txt` to verify |

Without keys, the app still works: the local heuristic engine provides
real signal-based reports for any upload, Google Fact Check calls fall
back to Wikipedia, RDAP works without keys, and YouTube oEmbed works
without auth.

## Routes

### Public (indexable)
- `/` — homepage with FAQs + JSON-LD
- `/analyze` — upload & analyse any image/video/audio
- `/pricing`, `/about`, `/contact`, `/blog`, `/blog/[slug]`
- `/tools/audio-check`, `/tools/fact-check`, `/tools/social-check`,
  `/tools/url-check`, `/tools/batch-process`, `/tools/content-fingerprint`
- `/privacy`, `/terms`, `/cookies`, `/disclaimer`, `/acceptable-use`,
  `/refund-policy`, `/data-rights`, `/security`, `/accessibility`

### Authenticated
- `/login`, `/signup`, `/dashboard`, `/settings`, `/reports`,
  `/result/[id]`, `/report/[publicId]`

### Admin
- `/admin`

### APIs
- `POST /api/v1/analyses` — upload + analyse a file
- `GET  /api/v1/analyses/:id` — poll status
- `GET  /api/v1/usage` — quota
- `GET  /api/v1/dashboard` — dashboard data
- `POST /api/v1/fact-check` — fact-check a claim (real API + Wikipedia fallback)
- `POST /api/v1/url-check` — server-side URL analysis (RDAP + page + security)
- `POST /api/v1/social-check` — social-media post check (YouTube oEmbed + page)
- `POST /api/v1/contact` — contact form
- `POST /api/auth/signup`, `/api/auth/login`,
  `POST /api/auth/magic-link/request|verify`, `POST /api/auth/logout`
- `GET  /api/health` — deployment diagnostics
- `GET  /robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`

## Deployment

See `VERCEL_SETUP.md` for production deployment notes (Vercel-friendly).
Security headers, CSP, robots, sitemap, OGP and JSON-LD are all configured
out of the box — point a domain at this app and it is AdSense-ready as
soon as you've pasted your real publisher ID into `.env` and `ads.txt`.

## Security

- HTTPS-graded CSP with explicit allow-lists for ad networks.
- Strict transport security, frame-ancestors, referrer-policy.
- Server actions/uploads are rate-limited per IP with sane budgets.
- Path-traversal and SQLi patterns are blocked at the edge middleware.
- Passwords are hashed with **scrypt** (`N=16384, r=8, p=1`) and a
  per-user 16-byte salt. Legacy `SHA-256 + secret` hashes are verified
  for existing users and transparently upgraded on next sign-in.
- Stripped control characters from contact form messages; outgoing HTML
  emails escape all user content.

## License

Private — © TrustLens.
