-- InspoGrid AI Phase 0: schema hardening

-- Image deduplication + multi-resolution paths
alter table public.image_assets
  add column if not exists content_hash text,
  add column if not exists thumb_path text,
  add column if not exists full_path text;

create index if not exists idx_image_assets_content_hash
  on public.image_assets(user_id, content_hash)
  where content_hash is not null;

-- OAuth token lifecycle
alter table public.source_connections
  add column if not exists refresh_token text,
  add column if not exists expires_at timestamptz;

-- Usage tracking for tier limits
create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month text not null, -- YYYY-MM
  imports integer not null default 0,
  exports integer not null default 0,
  ai_calls integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

alter table public.usage_counters enable row level security;

create policy "Users can view own usage"
  on public.usage_counters for select using (auth.uid() = user_id);

create policy "Users can upsert own usage"
  on public.usage_counters for insert with check (auth.uid() = user_id);

create policy "Users can update own usage"
  on public.usage_counters for update using (auth.uid() = user_id);

create index if not exists idx_usage_counters_user_month
  on public.usage_counters(user_id, month);

-- Token encryption: store OAuth tokens via Supabase Vault or encrypt at app layer
-- before insert. See docs/APP_KNOWLEDGE/architecture.md#secrets