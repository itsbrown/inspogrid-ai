# Vercel deployment

## Recommended: Dashboard import (GitHub)

1. Go to [vercel.com/new](https://vercel.com/new) → Import `itsbrown/inspogrid-ai`
2. **Root Directory:** `web` ← required (not `./`)
3. **Framework:** Next.js
4. Add environment variables (Production and Preview):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://numdijyrzdqjizpvlnbs.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase → Settings → API |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (after first deploy) |
| `EXTENSION_API_KEY` | Any secret string |

5. Click **Deploy**

### Common failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| Build can't find Next.js | Root directory is `./` | Set root to `web` |
| Auth redirect fails on prod | Supabase URLs not updated | Add Vercel URL + `/auth/callback` in Supabase auth settings |
| `NEXT_PUBLIC_APP_URL` empty | Set after first deploy | Add URL in Vercel env vars, redeploy |

## CLI deploy (Option A)

```bash
npx vercel login    # opens browser — must complete within ~10 min
./scripts/deploy-vercel.sh
```

CLI login times out if the browser step isn't completed. Dashboard import avoids this.

## Supabase auth redirects (after deploy)

Supabase → Authentication → URL Configuration:

- **Site URL:** `https://<your-vercel-domain>.vercel.app`
- **Redirect URLs:** `https://<your-vercel-domain>.vercel.app/auth/callback`

Or add to `supabase/config.toml` `additional_redirect_urls` and run `supabase config push`.

## GitHub Actions deploy (optional)

Workflow: `.github/workflows/deploy-vercel.yml` (manual trigger only)

Required repo secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, plus the four env vars above.

**Note:** GitHub does not allow `secrets` in job-level `if` conditions — workflow uses `workflow_dispatch` only.