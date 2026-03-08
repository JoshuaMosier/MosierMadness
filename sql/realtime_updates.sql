-- Notification table for Supabase Realtime push updates.
-- Server UPSERTs the row when the tournament snapshot cache refreshes;
-- clients subscribe to Postgres Changes on this table to trigger
-- SvelteKit invalidateAll() instead of polling.

create table if not exists realtime_updates (
  scope text primary key,
  updated_at timestamptz not null default now()
);

alter table realtime_updates enable row level security;

create policy "Anyone can read realtime_updates"
  on realtime_updates for select
  using (true);

create policy "Anyone can update realtime_updates"
  on realtime_updates for update
  using (true);

-- Enable Supabase Realtime for this table
alter publication supabase_realtime add table realtime_updates;

-- Seed the single notification row
insert into realtime_updates (scope)
values ('tournament')
on conflict (scope) do nothing;
