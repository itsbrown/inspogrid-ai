-- InspoGrid AI MVP Schema
-- Run in Supabase SQL Editor or via supabase db push

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Projects (Mood Boards)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  grid_settings jsonb not null default '{"preset":"contact-4x6","rows":4,"cols":6,"dpi":300,"showLabels":true,"showSource":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Users can CRUD own projects"
  on public.projects for all using (auth.uid() = user_id);

-- Source connections (Pinterest, Etsy, Instagram)
create table if not exists public.source_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('pinterest', 'etsy', 'instagram', 'manual')),
  access_token text,
  board_ids text[] default '{}',
  last_synced timestamptz,
  created_at timestamptz not null default now()
);

alter table public.source_connections enable row level security;

create policy "Users can CRUD own connections"
  on public.source_connections for all using (auth.uid() = user_id);

-- Image assets
create table if not exists public.image_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  source_url text,
  storage_path text,
  title text,
  description text,
  tags text[] default '{}',
  platform text not null default 'manual' check (platform in ('pinterest', 'etsy', 'instagram', 'manual')),
  saved_at timestamptz,
  selected boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.image_assets enable row level security;

create policy "Users can CRUD own images"
  on public.image_assets for all using (auth.uid() = user_id);

-- Export jobs
create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  pdf_url text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.export_jobs enable row level security;

create policy "Users can CRUD own export jobs"
  on public.export_jobs for all using (auth.uid() = user_id);

-- Waitlist
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

create policy "Anyone can join waitlist"
  on public.waitlist for insert with check (true);

-- Storage bucket for uploaded images (create in Supabase dashboard)
-- insert into storage.buckets (id, name, public) values ('project-images', 'project-images', false);

create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_image_assets_project_id on public.image_assets(project_id);
create index if not exists idx_image_assets_user_id on public.image_assets(user_id);