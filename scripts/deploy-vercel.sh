#!/usr/bin/env bash
# One-time: npx vercel login
# Then from repo root:
set -euo pipefail

cd "$(dirname "$0")/../web"

if [[ ! -f .env.local ]]; then
  echo "Missing web/.env.local — copy from .env.local.example and fill in Supabase keys."
  exit 1
fi

# shellcheck disable=SC1091
source <(grep -v '^#' .env.local | sed 's/^/export /')

if [[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]; then
  echo "NEXT_PUBLIC_SUPABASE_URL not set in .env.local"
  exit 1
fi

echo "Deploying InspoGrid AI to Vercel (production)..."
npx vercel --prod \
  --env "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL" \
  --env "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --env "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-}" \
  --env "EXTENSION_API_KEY=${EXTENSION_API_KEY:-}"

echo ""
echo "After deploy, add your Vercel URL to Supabase auth redirects:"
echo "  https://supabase.com/dashboard/project/numdijyrzdqjizpvlnbs/auth/url-configuration"