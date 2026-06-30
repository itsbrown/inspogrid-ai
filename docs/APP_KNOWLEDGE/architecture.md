# Architecture

## Stack

| Layer | Technology |
|-------|------------|
| Web app | Next.js 14, Tailwind, App Router |
| Database / Auth | Supabase (Postgres + RLS) |
| PDF (MVP) | jsPDF client-side, watermarked |
| PDF (V1) | Puppeteer server-side, 300 DPI |
| Extension | Chrome Manifest V3 |
| AI (V1) | Grok or Claude API |

## Core entities

- `profiles` — user plan (free/pro/team)
- `projects` — mood boards with `grid_settings` JSON
- `image_assets` — per-image metadata + storage path
- `source_connections` — OAuth tokens per platform
- `export_jobs` — async PDF generation queue

## Key flows

1. **UC-09 Manual upload** — `ImageUploadZone` → `local-store` → `GridEditor` → `export-contact-sheet.ts`
2. **UC-01 Pinterest** — extension content script → `/api/extension/import` → (V1: Supabase)
3. **UC-03 AI filter** — V1, not yet implemented

## Secrets

OAuth tokens (`source_connections.access_token`, `refresh_token`) must be encrypted at the application layer before insert, or stored via Supabase Vault. Never log token values.

## File ownership

| Area | Path |
|------|------|
| Grid presets | `web/lib/grid-presets.ts` |
| PDF export | `web/lib/pdf/export-contact-sheet.ts` |
| Data layer (unified) | `web/lib/data/` |
| Demo persistence | `web/lib/store/local-store.ts` |
| Project editor | `web/app/projects/[id]/page.tsx` |
| Extension | `extension/content-scripts/pinterest.js` |