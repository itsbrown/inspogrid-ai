# Changelog (knowledge updates)

Session-level log of durable learnings and doc changes. Not a product release changelog.

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