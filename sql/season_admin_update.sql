alter table profiles
  add column if not exists is_admin boolean default false not null;

create unique index if not exists brackets_user_year_idx
  on brackets (user_id, year);

create table if not exists tournament_seasons (
  entry_season_year integer primary key,
  display_season_year integer not null,
  stage text not null default 'archive' check (stage in ('archive', 'bracket-open', 'tournament-live', 'complete')),
  is_active boolean not null default false,
  archive_scoreboard_date date,
  first_round_dates date[] not null default '{}',
  ticker_rounds jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table tournament_seasons enable row level security;

create unique index if not exists tournament_seasons_single_active_idx
  on tournament_seasons (is_active)
  where is_active = true;

drop policy if exists "Tournament seasons are viewable by everyone" on tournament_seasons;
create policy "Tournament seasons are viewable by everyone"
  on tournament_seasons for select
  using (true);

drop policy if exists "Admins can insert tournament seasons" on tournament_seasons;
create policy "Admins can insert tournament seasons"
  on tournament_seasons for insert
  with check (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

drop policy if exists "Admins can update tournament seasons" on tournament_seasons;
create policy "Admins can update tournament seasons"
  on tournament_seasons for update
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

drop policy if exists "Admins can delete tournament seasons" on tournament_seasons;
create policy "Admins can delete tournament seasons"
  on tournament_seasons for delete
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );
