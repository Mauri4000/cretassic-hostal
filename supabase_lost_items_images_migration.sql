-- ── Migration: add images[] column to lost_items ─────────────────────────────
-- Run in Supabase SQL Editor (bastille-hotel project)

alter table public.lost_items
  add column if not exists images text[] default '{}';

-- Migrate existing single image_url into the new array
update public.lost_items
  set images = array[image_url]
  where image_url is not null
    and (images is null or array_length(images, 1) is null);
