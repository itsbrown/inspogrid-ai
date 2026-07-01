# Vercel deployment

## Project settings

| Setting | Value |
|---------|-------|
| Root directory | `web` |
| Framework | Next.js |
| Node | 20.x |

## Required environment variables

Set in Vercel → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://numdijyrzdqjizpvlnbs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard → API>
NEXT_PUBLIC_APP_URL=https://<your-vercel-domain>.vercel.app
EXTENSION_API_KEY=<generate a secret>
```

## Supabase auth redirects

Add your Vercel URL to Supabase → Authentication → URL Configuration:

- Site URL: `https://<your-vercel-domain>.vercel.app`
- Redirect URLs: `https://<your-vercel-domain>.vercel.app/auth/callback`

Or push via `supabase/config.toml` additional_redirect_urls and `supabase config push`.

## Deploy from CLI

```bash
cd web
npx vercel --prod
```

## Deploy from GitHub

Connect https://github.com/itsbrown/inspogrid-ai in Vercel dashboard:

1. Import repository
2. Set root directory to `web`
3. Add env vars above
4. Deploy