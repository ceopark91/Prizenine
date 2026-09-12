create table if not exists public.jobs (
  id uuid primary key,
  url text not null,
  status text not null default 'pending',
  stage text not null default 'RECEIVED',
  product_number text,
  product jsonb not null default '{}'::jsonb,
  research jsonb not null default '{}'::jsonb,
  reviews jsonb not null default '{}'::jsonb,
  script jsonb not null default '{}'::jsonb,
  review jsonb not null default '{}'::jsonb,
  generation jsonb not null default '{}'::jsonb,
  video_url text,
  duration_sec numeric,
  error text,
  revision integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jobs enable row level security;
drop policy if exists "public read jobs" on public.jobs;
create policy "public read jobs" on public.jobs for select using (true);
drop policy if exists "public insert jobs" on public.jobs;
create policy "public insert jobs" on public.jobs for insert with check (true);
drop policy if exists "public update jobs" on public.jobs;
create policy "public update jobs" on public.jobs for update using (true) with check (true);

alter publication supabase_realtime add table public.jobs;

create index if not exists jobs_updated_at_idx on public.jobs(updated_at desc);
create index if not exists jobs_status_stage_idx on public.jobs(status, stage);

create table if not exists public.products (
  id uuid primary key,
  number text,
  category text,
  title text not null,
  description text,
  image text,
  link text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "products_read" on public.products for select to anon, authenticated using (true);
create policy "products_insert" on public.products for insert to anon, authenticated with check (true);
create policy "products_update" on public.products for update to anon, authenticated using (true) with check (true);
create policy "products_delete" on public.products for delete to anon, authenticated using (true);
create index if not exists products_number_idx on public.products(number);
