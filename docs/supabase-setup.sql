-- Lexie site: shared like counter + private visit counter.
-- Run this once in Supabase SQL Editor (dashboard -> SQL Editor -> New query -> paste -> Run).

-- Likes: one row per work, holds the shared count everyone sees.
create table if not exists work_likes (
  slug text primary key,
  like_count integer not null default 0
);
alter table work_likes enable row level security;
-- No policies added on purpose: the anon key gets zero direct table access.
-- All reads/writes go through the SECURITY DEFINER functions below.

-- Visits: one row per site visit. Private - only you can read it
-- (via Table Editor or SQL Editor), never exposed to the public site.
create table if not exists site_visits (
  id bigserial primary key,
  visited_at timestamptz not null default now()
);
alter table site_visits enable row level security;

-- Increment a work's like count (upserts the row), returns the new total.
create or replace function increment_like(work_slug text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into work_likes (slug, like_count)
  values (work_slug, 1)
  on conflict (slug) do update set like_count = work_likes.like_count + 1
  returning like_count into new_count;
  return new_count;
end;
$$;

-- Decrement a work's like count (floored at 0), returns the new total.
create or replace function decrement_like(work_slug text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update work_likes
  set like_count = greatest(like_count - 1, 0)
  where slug = work_slug
  returning like_count into new_count;
  return coalesce(new_count, 0);
end;
$$;

-- Public read of all like counts (for rendering counts on the gallery).
create or replace function get_like_counts()
returns table(slug text, like_count integer)
language sql
security definer
set search_path = public
as $$
  select slug, like_count from work_likes;
$$;

-- Log one visit. Insert-only from the site's side - there is no function
-- that lets the public read site_visits back.
create or replace function log_visit()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into site_visits default values;
end;
$$;

grant execute on function increment_like(text) to anon, authenticated;
grant execute on function decrement_like(text) to anon, authenticated;
grant execute on function get_like_counts() to anon, authenticated;
grant execute on function log_visit() to anon, authenticated;
