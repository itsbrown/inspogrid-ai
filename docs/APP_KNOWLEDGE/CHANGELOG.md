# Changelog (knowledge updates)

Session-level log of durable learnings and doc changes. Not a product release changelog.

---

## 2026-06-30 (Supabase provisioned)

**Learned:**
- Supabase project `numdijyrzdqjizpvlnbs` created via CLI; migrations 001–003 pushed
- Auth: email confirmations disabled for dev; redirect URLs include `/auth/callback`
- Profile trigger works on signup; project RLS insert verified programmatically
- `web/.env.local` is gitignored and configured locally only

**Updated:**
- `supabase/config.toml`, `supabase/README.md`, `docs/APP_KNOWLEDGE/domains/tech-scope.md`

**Gaps:**
- Browser E2E with Supabase session not yet automated
- Vercel staging deploy still pending

---

## 2026-06-29 (Phase 0)

**Learned:**
- Unified data layer (`web/lib/data/`) auto-selects Supabase when configured + session exists, else localStorage
- Migrations 002/003 add usage_counters, image hashes, and storage RLS — must be run manually in Supabase
- UC-09 E2E passes in demo mode; CI workflow added at `.github/workflows/ci.yml`
- Middleware protects `/dashboard` and `/projects/*` when Supabase env is set

**Updated:**
- `web/lib/data/*`, `web/middleware.ts`, pages migrated off `local-store`
- `supabase/migrations/002_schema_hardening.sql`, `003_storage_policies.sql`, `supabase/README.md`
- `tests/uc-09-manual-upload.spec.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`
- `docs/APP_KNOWLEDGE/domains/tech-scope.md`

**Gaps:**
- Supabase project not yet provisioned by owner (blocks cloud persistence exit criteria)
- Vercel staging deploy not done
- Profile trigger verification pending Supabase connection

---

## 2026-06-29

**Learned:**
- Current codebase is ~15% of MVP: UI prototype with `localStorage`, no Supabase wired
- Critical path: Supabase persistence → extension auth → CORS-safe PDF → beta
- Pinterest has two viable paths: DOM extension (fast, fragile) + official API v5 (compliant, approval cycle)
- Client jsPDF cannot achieve true 300 DPI or bypass CORS for remote pin images
- E2E specs are aspirational and do not match built UI selectors
- Instagram personal saves likely unavailable via API — defer to V2/V3

**Updated:**
- `docs/APP_KNOWLEDGE/domains/tech-scope.md` (new — tracked implementation plan)
- `docs/APP_KNOWLEDGE/README.md` (doc index)
- `docs/APP_KNOWLEDGE/CHANGELOG.md` (this file)

**Gaps:**
- Pinterest Standard API approval timeline (external dependency)
- Etsy favorites endpoint confirmation (needs 1–2 day spike)
- Staging Supabase + Vercel not yet provisioned