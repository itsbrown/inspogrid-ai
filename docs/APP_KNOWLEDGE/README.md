# InspoGrid AI — App Knowledge

## Product

InspoGrid AI turns scattered saved inspiration (Pinterest, Etsy, manual uploads) into print-ready contact-sheet PDF mood boards.

## Doc index

| Topic | File |
|-------|------|
| Architecture & stack | [architecture.md](./architecture.md) |
| MVP scope & phases | [domains/mvp.md](./domains/mvp.md) |

## Repo layout

- `web/` — Next.js 14 App Router frontend
- `extension/` — Chrome MV3 extension (Pinterest)
- `supabase/migrations/` — Postgres schema
- `tests/` — Playwright E2E specs

## Demo vs production

Without `NEXT_PUBLIC_SUPABASE_*` env vars, the app runs in **demo mode** using `localStorage` (`web/lib/store/local-store.ts`). Configure Supabase to enable auth and cloud persistence.