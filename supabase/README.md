# Supabase setup (Phase 0)

## Project (provisioned)

| Field | Value |
|-------|-------|
| Name | InspoGrid AI |
| Ref | `numdijyrzdqjizpvlnbs` |
| URL | https://numdijyrzdqjizpvlnbs.supabase.co |
| Dashboard | https://supabase.com/dashboard/project/numdijyrzdqjizpvlnbs |
| Region | us-east-1 |
| Migrations | 001–003 applied via `supabase db push` |

DB password (local only): `supabase/.db-password.local` (gitignored)

## 1. Create project (already done)

1. Go to [supabase.com](https://supabase.com) → New project
2. Note **Project URL** and **anon public key**

## 2. Run migrations (in order)

In **SQL Editor**, run each file:

1. `migrations/001_initial_schema.sql`
2. `migrations/002_schema_hardening.sql`
3. `migrations/003_storage_policies.sql`

## 3. Configure auth redirects

Authentication → URL configuration:

- Site URL: `http://localhost:3000` (or your Vercel URL)
- Redirect URLs: `http://localhost:3000/auth/callback`, `https://your-app.vercel.app/auth/callback`

## 4. Web app env

```bash
cp web/.env.local.example web/.env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 5. Verify

```bash
cd web && npm run dev
```

Sign up → create project → upload images → refresh → data should persist.