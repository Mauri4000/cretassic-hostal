-- ── Lost & Found table ────────────────────────────────────────────────────────
-- Run this in Supabase SQL Editor (bastille-hotel project)

create table if not exists public.lost_items (
  id              uuid        default gen_random_uuid() primary key,
  description     text        not null,
  image_url       text,
  found_date      date        not null default current_date,
  found_by        text,
  location_found  text,
  status          text        not null default 'pendiente'
                              check (status in ('pendiente', 'reclamado', 'descartado')),
  guest_name      text,
  notes           text,
  created_at      timestamptz default now()
);

-- RLS
alter table public.lost_items enable row level security;

create policy "Staff can read lost items"
  on public.lost_items for select
  to authenticated using (true);

create policy "Staff can insert lost items"
  on public.lost_items for insert
  to authenticated with check (true);

create policy "Staff can update lost items"
  on public.lost_items for update
  to authenticated using (true);

create policy "Staff can delete lost items"
  on public.lost_items for delete
  to authenticated using (true);

grant select, insert, update, delete on public.lost_items to authenticated;
grant all on public.lost_items to service_role;

-- Note: photos are stored in the existing 'vitrina-images' bucket (prefix: lost-)
