# InspoGrid AI

Unified multi-source inspiration aggregator with print-ready contact-sheet mood boards.

## Project structure

```
├── web/                 # Next.js 14 web app (MVP)
├── extension/           # Chrome extension (Pinterest import)
├── supabase/            # Database migrations
├── tests/               # Playwright E2E specs
└── Documents/           # Business plan PDF
```

## Quick start (demo mode)

Works immediately without Supabase — uses browser localStorage.

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000 → **Start a mood board** → upload images → export PDF.

## Production setup

1. Create a [Supabase](https://supabase.com) project
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor
3. Copy `web/.env.local.example` → `web/.env.local` and fill in keys
4. Create a `project-images` storage bucket (private) in Supabase

## MVP features (built)

- [x] Landing page + waitlist API
- [x] Auth pages (Supabase-ready, demo fallback)
- [x] Dashboard + project CRUD (localStorage demo)
- [x] Manual image upload (UC-09)
- [x] Drag-and-drop grid editor (4×6, 5×5, 8×10 presets)
- [x] Watermarked PDF export via jsPDF
- [x] Chrome extension scaffold + import API endpoint
- [x] Supabase schema migration

## Next (V1)

- Wire Supabase persistence (replace localStorage)
- Pinterest extension → project linking
- Etsy OAuth connector
- AI semantic filtering (Grok/Claude)
- Stripe billing
- Server-side 300 DPI PDF (Puppeteer)

## E2E tests

```bash
cd web && npm install --save-dev @playwright/test
npx playwright install
# from repo root:
npx playwright test tests/inspogrid-e2e.spec.ts
```

## Chrome extension

See [extension/README.md](extension/README.md).