# InspoGrid AI — Tracked Implementation Plan

**Last updated:** 2026-06-29  
**Owner:** Corey Brown  
**Repo:** https://github.com/itsbrown/inspogrid-ai  
**Overall progress:** ~15% of MVP · ~5% of V1

---

## How to use this doc

- Check boxes (`[x]`) as work completes. Add date + PR/commit in the **Done log** at the bottom.
- Do not start a phase until **exit criteria** for the prior phase are met.
- If scope changes, update this file in the same PR as the code.
- Status key: `[ ]` not started · `[~]` in progress · `[x]` done · `[-]` deferred/cancelled

---

## Progress dashboard

| Phase | Target | Status | Exit criteria |
|-------|--------|--------|---------------|
| **Scaffold** | Pre-week 1 | `[x]` Done | UI prototype runs in demo mode |
| **Phase 0** | Weeks 1–2 | `[~]` In progress | Auth + Supabase persistence E2E |
| **Phase 1** | Weeks 3–6 | `[ ]` Not started | UC-01 + UC-09 beta-ready |
| **Phase 2** | Weeks 7–10 | `[ ]` Not started | Stripe + 300 DPI PDF + AI filter |
| **Phase 3** | Months 4–6 | `[-]` Deferred | V2 growth features |

---

## Scaffold (complete)

### Web app
- [x] Next.js 14 + Tailwind + App Router (`web/`)
- [x] Landing page + waitlist API stub
- [x] Auth UI (login/signup) — Supabase-ready
- [x] Dashboard + project create/list
- [x] Project editor page
- [x] Manual upload zone (UC-09)
- [x] Grid editor with drag-reorder (@dnd-kit)
- [x] Grid presets: 4×6, 5×5, 8×10
- [x] Client-side jsPDF export (watermarked)
- [x] Demo mode via `localStorage` (`web/lib/store/local-store.ts`)

### Backend & infra
- [x] Supabase migration SQL (`supabase/migrations/001_initial_schema.sql`)
- [x] Supabase client helpers (browser + server + middleware)
- [x] Extension import API stub (`/api/extension/import`)
- [x] `.env.local.example`

### Extension
- [x] Manifest V3 scaffold
- [x] Pinterest content script + floating button
- [x] Background worker → import API
- [x] Popup settings (API URL + key)

### Quality & docs
- [x] Playwright E2E spec stubs (12 UCs — not aligned to UI yet)
- [x] App knowledge docs (`docs/APP_KNOWLEDGE/`)
- [x] Git repo + GitHub sync

---

## Phase 0 — Foundation (Weeks 1–2)

**Goal:** Replace demo mode with real auth and cloud persistence.  
**Effort:** ~10–12 dev days  
**Blockers:** Supabase project credentials

### 0.1 Supabase setup
- [ ] Create Supabase project (prod + staging) — **manual step**
- [ ] Run `001_initial_schema.sql` in SQL editor — **manual step**
- [x] Storage bucket + RLS in `003_storage_policies.sql`
- [x] Setup guide: `supabase/README.md`
- [ ] Copy `web/.env.local.example` → `web/.env.local` with real keys — **manual step**
- [ ] Verify auth email templates + redirect URLs — **manual step**

### 0.2 Schema hardening (migration `002`)
- [x] Add `image_assets.content_hash` for deduplication
- [x] Add `image_assets.thumb_path` + `full_path` columns
- [x] Add `source_connections.refresh_token`, `expires_at`
- [x] Add `usage_counters` table (user_id, month, imports, exports, ai_calls)
- [x] Document token encryption approach (Supabase Vault or app-level)

### 0.3 Data layer refactor
- [x] Create `web/lib/data/projects.ts` — Supabase CRUD
- [x] Create `web/lib/data/images.ts` — Supabase CRUD + storage upload
- [x] Create `web/lib/data/usage.ts` — tier limit checks
- [x] Abstract store interface (`resolveDataMode`) — demo fallback when no session
- [x] Migrate dashboard to data layer
- [x] Migrate project editor to data layer
- [x] Remove direct `local-store` imports from pages

### 0.4 Image upload pipeline
- [x] Upload files to Supabase Storage on manual import
- [x] Generate signed URLs for grid preview thumbnails
- [x] Store metadata in `image_assets` (title, sort_order, platform=manual)
- [x] Handle upload errors + size limits (10 MB/image, 50 images/project free)
- [x] Supabase path uses storage URLs (local demo still uses blob URLs)

### 0.5 Auth & route protection
- [x] Wire login/signup to Supabase Auth (email/password)
- [x] Auth callback route (`/auth/callback`)
- [x] Middleware: redirect unauthenticated users from `/dashboard`, `/projects/*`
- [x] Session persistence across refresh
- [x] Sign out flow (navbar)
- [ ] Profile row created on signup — verify after Supabase connected

### 0.6 CI & first green test
- [x] Add Playwright (`package.json` root + `web/`)
- [x] UC-09 E2E aligned to current UI (`tests/uc-09-manual-upload.spec.ts`)
- [x] GitHub Actions: lint + build + UC-09 (`.github/workflows/ci.yml`)
- [ ] Deploy staging to Vercel (preview + staging branch)

### Phase 0 exit criteria
- [ ] New user signs up → creates project → uploads images → refreshes → data persists (needs Supabase)
- [x] UC-09 Playwright test passes locally
- [ ] UC-09 passes in GitHub Actions CI
- [ ] Staging URL live for extension testing

---

## Phase 1 — MVP Core (Weeks 3–6)

**Goal:** Pinterest import + production-safe PDF path for beta users.  
**Effort:** ~18–22 dev days  
**Depends on:** Phase 0 complete

### 1.1 Legal & compliance (launch blockers)
- [ ] Privacy policy page (public URL, linked from app + extension)
- [ ] Terms of Service page
- [ ] Personal-use / platform TOS disclaimer in import flows
- [ ] Account deletion flow (GDPR baseline)

### 1.2 Pinterest — extension import (Approach B)
- [ ] Extension: authenticate user (popup OAuth to web app)
- [ ] Replace shared API key with per-user device token
- [ ] Extension popup: select target project before import
- [ ] Content script: handle Pinterest SPA navigation (re-inject on route change)
- [ ] Content script: scroll/paginate to capture > visible pins
- [ ] Extract highest-resolution image URLs available in DOM
- [ ] API: persist pins to `image_assets` for selected project
- [ ] API: enforce free-tier import limits via `usage_counters`
- [ ] UI: show import progress + count (`Imported N pins`)
- [ ] Error handling: rate limit, auth expired, empty board

### 1.3 Pinterest — official API (Approach A, parallel track)
- [ ] Register Pinterest developer app (Trial access)
- [ ] Implement OAuth 2.0 flow (scopes: `boards:read`, `pins:read`)
- [ ] API routes: list boards, list pins (paginated)
- [ ] Store tokens in `source_connections` (encrypted)
- [ ] UI: "Connect Pinterest" in project settings
- [ ] Submit Standard access upgrade (video demo + privacy policy)
- [ ] Migrate extension-only users to API where available

### 1.4 PDF pipeline (MVP quality)
- [ ] Image proxy API route for CORS-blocked remote URLs (`/api/images/proxy`)
- [ ] Multi-page PDF when images exceed grid capacity
- [ ] PDF filename convention: `{project-slug}-moodboard.pdf`
- [ ] Export job row in `export_jobs` (even if client-rendered initially)
- [ ] Free tier: watermark enforced server-side check on plan

### 1.5 Beta launch prep
- [ ] Onboarding flow (install extension → create project → import)
- [ ] Empty states + tooltips for first-time users
- [ ] Error monitoring (Sentry)
- [ ] Basic analytics (Plausible or PostHog)
- [ ] Recruit 20–50 beta testers (invite-only signup flag)
- [ ] Chrome Web Store extension submission (unlisted or public)

### 1.6 E2E test alignment
- [ ] UC-01: Pinterest import → 4×6 PDF (mocked API in CI)
- [ ] UC-09: manual upload full flow (already Phase 0)
- [ ] Add test fixtures for sample images

### Phase 1 exit criteria
- [ ] UC-01 + UC-09 pass end-to-end on staging with real accounts
- [ ] 20+ beta users can import Pinterest board and export PDF
- [ ] Privacy policy + ToS live
- [ ] Extension published (unlisted minimum)

---

## Phase 2 — V1 Monetization (Weeks 7–10)

**Goal:** Revenue-ready Pro tier with high-quality exports and AI filtering.  
**Effort:** ~20–25 dev days  
**Depends on:** Phase 1 beta validation

### 2.1 Stripe billing
- [ ] Stripe products: Pro ($12/mo, $99/yr), Team ($29/mo)
- [ ] Checkout session API route
- [ ] Customer Portal link in account settings
- [ ] Webhook handler: `checkout.session.completed`, `subscription.updated/deleted`
- [ ] Sync `profiles.plan` + `stripe_customer_id`
- [ ] Account settings page (plan, billing, usage)

### 2.2 Feature gating
- [ ] Free: 10–20 imports/mo, 4×6 grid only, watermarked PDF, no AI
- [ ] Pro: unlimited imports, all grid presets, no watermark, AI filter
- [ ] Team: branding removal, collaboration (stub for V2)
- [ ] Server-side enforcement on all gated API routes
- [ ] Upgrade prompts in UI at limit boundaries

### 2.3 Production PDF worker
- [ ] Puppeteer PDF worker on Railway or Render
- [ ] HTML/CSS templates: classic contact sheet, clean minimal
- [ ] True 300 DPI output (3300×2550 render for letter landscape)
- [ ] Multi-page with labels, source URLs, optional QR codes
- [ ] Job queue: `export_jobs` pending → processing → completed
- [ ] Client polls or Supabase Realtime for job status
- [ ] Pro-only: no watermark; Free: watermark applied in worker

### 2.4 Etsy connector
- [ ] Spike (1–2 days): confirm favorites API endpoint + scopes
- [ ] Etsy OAuth 2.0 PKCE flow
- [ ] Import favorites into project
- [ ] Platform badge on thumbnails (Pinterest / Etsy)
- [ ] Multi-source merge + dedup by `content_hash` (UC-02)

### 2.5 AI semantic filtering (UC-03)
- [ ] `ai_filter_jobs` table + API route
- [ ] Tier 1: metadata-only LLM filter (title, description, tags)
- [ ] Provider integration: Grok API (primary)
- [ ] UI: natural language query input + filtered result grid
- [ ] Usage caps per plan (free: 0, pro: N/month)
- [ ] Optional Tier 2: vision model / embeddings (pgvector spike)

### 2.6 E2E & hardening
- [ ] UC-02: Etsy + Pinterest merge (mocked)
- [ ] UC-03: AI filter (mocked LLM in CI)
- [ ] UC-04: film-strip template (after PDF worker templates)
- [ ] Load test: 200+ images in library (pagination/virtualization)

### Phase 2 exit criteria
- [ ] Paying user can subscribe via Stripe and immediately access Pro features
- [ ] 300 DPI PDF exports without watermark for Pro
- [ ] AI filter returns relevant subset from 100+ image library
- [ ] $1k MRR path validated (business plan milestone)

---

## Phase 3 — V2 Growth (Months 4–6)

**Status:** Deferred until Phase 2 metrics validate PMF.  
**Effort:** ~40–60 dev days

### 3.1 Platform expansion
- [ ] Instagram: spike feasibility (likely extension-only or manual)
- [ ] Additional grid templates (gallery wall, film-strip metadata)
- [ ] UC-07: variable frame size gallery wall planner
- [ ] UC-08: project version history

### 3.2 Collaboration & sharing
- [ ] Team tier: invite collaborators (read/write roles)
- [ ] UC-06: client read-only project view
- [ ] UC-11: shareable public project links
- [ ] Brand kit overlay (logo, colors) for Team tier

### 3.3 AI agent mode
- [ ] UC-10: natural language → import → filter → arrange → export
- [ ] Job orchestration (Inngest, Trigger.dev, or queue worker)
- [ ] Playwright automation in isolated worker (user-authorized only)
- [ ] Progress UI with step states

### 3.4 POD & integrations
- [ ] UC-11: Printful/Etsy asset prep + ZIP download
- [ ] Canva export integration (evaluate API)
- [ ] Performance: UC-12 (2000+ images, <30s export target)

### Phase 3 exit criteria
- [ ] $5k MRR milestone (business plan)
- [ ] 2+ platform connectors live
- [ ] Team tier used by ≥5 design professionals

---

## Open decisions

| # | Decision | Options | Recommendation | Resolved |
|---|----------|---------|----------------|----------|
| 1 | Pinterest launch strategy | API-only / extension-first / both | Extension-first + API in parallel | `[ ]` |
| 2 | MVP PDF engine | Client jsPDF / server Puppeteer now | jsPDF for beta; Puppeteer before Pro | `[ ]` |
| 3 | Monorepo tooling | Flat / Turborepo + pnpm workspaces | Add root workspace when extension shares types | `[ ]` |
| 4 | AI provider | Grok / Claude / both | Grok primary; Claude vision fallback | `[ ]` |
| 5 | Beta access | Open signup / invite-only | Invite-only for first 100–300 | `[ ]` |
| 6 | Image storage policy | URL-only / cache-on-import | URL-only until export (per business plan) | `[x]` |
| 7 | Product name | InspoGrid AI / alternatives | InspoGrid AI (current) | `[x]` |

---

## Risk register (active)

| Risk | L | I | Mitigation | Owner |
|------|---|---|------------|-------|
| Pinterest Standard API delay | M | H | Ship extension import first; apply Trial now | — |
| DOM selectors break on Pinterest redesign | H | M | Resilient selectors; migrate to API | — |
| CORS blocks client PDF for remote images | H | H | Image proxy in Phase 1 | — |
| Instagram API unavailable | H | M | Defer to Phase 3; manual upload | — |
| Scope creep across 12 UCs | H | H | This doc; phase gates | — |

*L = likelihood · I = impact*

---

## Effort summary

| Phase | Calendar | Dev days | Cumulative |
|-------|----------|----------|------------|
| Scaffold | Done | ~5 | 5 |
| Phase 0 | Weeks 1–2 | 10–12 | 15–17 |
| Phase 1 | Weeks 3–6 | 18–22 | 33–39 |
| Phase 2 | Weeks 7–10 | 20–25 | 53–64 |
| Phase 3 | Months 4–6 | 40–60 | 93–124 |

---

## Done log

Record completed items here (newest first).

| Date | Item | PR / commit |
|------|------|-------------|
| 2026-06-29 | Phase 0 foundation: data layer, auth, migrations 002/003, CI, UC-09 | — |
| 2026-06-29 | MVP scaffold (web, extension, schema, docs) | `98f5338` |
| 2026-06-29 | Git repo created + pushed to GitHub | `itsbrown/inspogrid-ai` |
| 2026-06-29 | Tracked implementation plan (this doc) | — |

---

## Related docs

- [Architecture](../architecture.md)
- [MVP scope](./mvp.md)
- Business plan: `Documents/InspoGrid_AI_Business_Plan_GTM_Tech_Stack.pdf`