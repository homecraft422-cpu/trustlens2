# TRUSTLENS2 — Architecture Guide

## Folder Structure

```
src/
├── app/                    # Next.js pages (App Router)
│   ├── analyze/            # Main upload page
│   ├── tools/              # All tool pages
│   │   ├── audio-check/
│   │   ├── fact-check/
│   │   ├── social-check/
│   │   ├── url-check/
│   │   ├── batch-process/
│   │   └── content-fingerprint/
│   ├── dashboard/          # Analytics dashboard
│   ├── api/                # API routes
│   │   └── v1/
│   │       ├── mock-analysis/  # Main analysis endpoint
│   │       └── fact-check/     # Fact check endpoint
│   └── ...
│
├── components/             # React components
│   ├── Header.tsx          # Site header
│   ├── Footer.tsx          # Site footer
│   └── ...
│
├── lib/                    # Core libraries
│   ├── core/               # Pure utility functions (NO side effects)
│   │   └── index.ts        # File helpers, score helpers, ID generators
│   ├── config.ts           # App configuration
│   ├── auth.ts             # Authentication
│   ├── detection/          # AI detection engine
│   ├── media/              # Media processing
│   └── services/           # Business logic
│
├── hooks/                  # Custom React hooks
│   └── index.ts            # useFileUpload, useClipboard, useMounted
│
├── types/                  # TypeScript types (SINGLE SOURCE OF TRUTH)
│   └── index.ts            # All shared types
│
├── constants/              # Constants & config
│   └── index.ts            # File limits, API routes, verdict configs
│
└── db/                     # Database (Drizzle ORM)
    ├── index.ts            # DB connection
    └── schema.ts           # Table schemas
```

## Rules for Safe Modification

### 1. NEVER DELETE these files:
- `src/types/index.ts` — All types live here
- `src/constants/index.ts` — All constants live here
- `src/lib/core/index.ts` — Core utilities
- `src/hooks/index.ts` — Core hooks
- `src/db/schema.ts` — Database schema

### 2. When adding a new page:
```
1. Create folder in src/app/tools/your-tool/
2. Add page.tsx with "use client"
3. Import Header from "@/components/Header"
4. Import Footer from "@/components/Footer"
5. Use hooks from "@/hooks" for upload/clipboard
6. Use constants from "@/constants" for API routes
7. Use types from "@/types" for TypeScript
```

### 3. When adding a new API route:
```
1. Create folder in src/app/api/v1/your-endpoint/
2. Add route.ts
3. Use NextRequest/NextResponse
4. Return proper error responses
```

### 4. When adding a new component:
```
1. Add to src/components/
2. Use "use client" directive
3. Import types from "@/types"
4. Use inline styles (no lucide-react)
5. Use emoji icons (no external icon libs)
```

### 5. When modifying database:
```
1. Add new table/column in src/db/schema.ts
2. Run: npm run db:generate
3. Run: npm run db:migrate
4. NEVER delete existing columns
```

## Import Aliases

```typescript
import { useFileUpload, useClipboard } from "@/hooks";
import type { AnalysisResult, Verdict } from "@/types";
import { API_ROUTES, VERDICT_CONFIG } from "@/constants";
import { formatBytes, generateId } from "@/lib/core";
```

## Safe Patterns

### File Upload (use the hook):
```typescript
const { file, preview, status, progress, error, result, selectFile, clearFile, analyze } = useFileUpload();
```

### Display Verdict:
```typescript
import { VERDICT_CONFIG } from "@/constants";
const config = VERDICT_CONFIG[result.verdict];
// config.label, config.emoji, config.bg, config.text
```

### Display Score:
```typescript
import { getScoreColor } from "@/constants";
<span style={{ color: getScoreColor(score) }}>{Math.round(score * 100)}%</span>
```

### Copy to Clipboard:
```typescript
const { copied, copy } = useClipboard();
<button onClick={() => copy(text)}>{copied ? "Copied!" : "Copy"}</button>
```

## What NOT to do:

❌ Don't import lucide-react (use emoji icons)
❌ Don't use external CSS files (use inline styles)
❌ Don't hardcode API URLs (use API_ROUTES)
❌ Don't hardcode file limits (use FILE_LIMITS)
❌ Don't delete type definitions
❌ Don't modify db/schema.ts without migration

## What TO do:

✅ Use hooks from @/hooks
✅ Use types from @/types
✅ Use constants from @/constants
✅ Use utilities from @/lib/core
✅ Use inline styles
✅ Use emoji icons
✅ Add new types to src/types/index.ts
✅ Add new constants to src/constants/index.ts
