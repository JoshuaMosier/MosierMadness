-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table that extends Supabase auth.users
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text,
  last_name text,
  email text unique,
  is_admin boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create brackets table for user submissions
create table brackets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  year integer not null default extract(year from current_date),
  selections text[], -- Array of 63 selections
  is_submitted boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index brackets_user_year_idx
  on brackets (user_id, year);

create table tournament_seasons (
  entry_season_year integer primary key,
  display_season_year integer not null,
  stage text not null default 'archive' check (stage in ('archive', 'bracket-open', 'tournament-live', 'complete')),
  is_active boolean not null default false,
  archive_scoreboard_date date,
  first_round_dates date[] not null default '{}',
  ticker_rounds jsonb not null default '[]'::jsonb,
  first_four_config jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index tournament_seasons_single_active_idx
  on tournament_seasons (is_active)
  where is_active = true;

create table people (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  display_name text not null,
  canonical_first_name text,
  canonical_last_name text,
  linked_profile_id uuid unique,
  bio text,
  is_family boolean default false not null,
  is_active_recently boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint people_linked_profile_id_fkey
    foreign key (linked_profile_id) references profiles(id) on delete set null
);

create index people_display_name_idx
  on people (display_name);

create table person_aliases (
  id uuid primary key default uuid_generate_v4(),
  person_id uuid not null,
  alias_name text not null,
  normalized_alias text not null,
  source text not null default 'manual',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint person_aliases_person_id_fkey
    foreign key (person_id) references people(id) on delete cascade
);

create unique index person_aliases_person_alias_idx
  on person_aliases (person_id, normalized_alias);

create index person_aliases_normalized_alias_idx
  on person_aliases (normalized_alias);

create table historical_seasons (
  year integer primary key,
  status text not null default 'completed' check (status in ('completed', 'cancelled', 'planned')),
  label text,
  notes text,
  winner_person_id uuid,
  winning_score integer,
  field_size integer,
  source text not null default 'manual',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint historical_seasons_winner_person_id_fkey
    foreign key (winner_person_id) references people(id) on delete set null
);

create table season_results (
  id uuid primary key default uuid_generate_v4(),
  year integer not null,
  person_id uuid not null,
  final_rank integer not null,
  total_points integer,
  correct_games integer,
  round1_points integer,
  round2_points integer,
  round3_points integer,
  round4_points integer,
  round5_points integer,
  round6_points integer,
  source_display_name text,
  source_standard_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint season_results_year_fkey
    foreign key (year) references historical_seasons(year) on delete cascade,
  constraint season_results_person_id_fkey
    foreign key (person_id) references people(id) on delete cascade
);

create unique index season_results_year_person_idx
  on season_results (year, person_id);

create index season_results_person_year_idx
  on season_results (person_id, year desc);

create index season_results_year_rank_idx
  on season_results (year, final_rank);

create table archived_seasons (
  year integer primary key,
  first_round_teams jsonb not null default '[]'::jsonb,
  master_bracket text[] not null default '{}',
  canonical_team_map jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint archived_seasons_year_fkey
    foreign key (year) references historical_seasons(year) on delete cascade
);

create table archived_brackets (
  id uuid primary key default uuid_generate_v4(),
  year integer not null,
  person_id uuid not null,
  linked_bracket_id uuid,
  selections text[] not null default '{}',
  source text not null default 'manual',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint archived_brackets_year_fkey
    foreign key (year) references archived_seasons(year) on delete cascade,
  constraint archived_brackets_person_id_fkey
    foreign key (person_id) references people(id) on delete cascade,
  constraint archived_brackets_linked_bracket_id_fkey
    foreign key (linked_bracket_id) references brackets(id) on delete set null
);

create unique index archived_brackets_year_person_idx
  on archived_brackets (year, person_id);

create view historical_profile_link_candidates as
select
  people.id as person_id,
  people.slug,
  people.display_name,
  people.canonical_first_name,
  people.canonical_last_name,
  profiles.id as profile_id,
  profiles.first_name,
  profiles.last_name,
  profiles.email
from people
join profiles
  on lower(coalesce(people.canonical_first_name, '')) = lower(coalesce(profiles.first_name, ''))
 and lower(coalesce(people.canonical_last_name, '')) = lower(coalesce(profiles.last_name, ''))
where people.linked_profile_id is null;

-- Set up RLS (Row Level Security)
alter table profiles enable row level security;
alter table brackets enable row level security;
alter table tournament_seasons enable row level security;
alter table people enable row level security;
alter table person_aliases enable row level security;
alter table historical_seasons enable row level security;
alter table season_results enable row level security;
alter table archived_seasons enable row level security;
alter table archived_brackets enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Tournament seasons are viewable by everyone"
  on tournament_seasons for select
  using (true);

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

create policy "People are viewable by everyone"
  on people for select
  using (true);

create policy "Admins can insert people"
  on people for insert
  with check (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can update people"
  on people for update
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can delete people"
  on people for delete
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Person aliases are viewable by everyone"
  on person_aliases for select
  using (true);

create policy "Admins can insert person aliases"
  on person_aliases for insert
  with check (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can update person aliases"
  on person_aliases for update
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can delete person aliases"
  on person_aliases for delete
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Historical seasons are viewable by everyone"
  on historical_seasons for select
  using (true);

create policy "Admins can insert historical seasons"
  on historical_seasons for insert
  with check (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can update historical seasons"
  on historical_seasons for update
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can delete historical seasons"
  on historical_seasons for delete
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Season results are viewable by everyone"
  on season_results for select
  using (true);

create policy "Admins can insert season results"
  on season_results for insert
  with check (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can update season results"
  on season_results for update
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can delete season results"
  on season_results for delete
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Archived seasons are viewable by everyone"
  on archived_seasons for select
  using (true);

create policy "Admins can insert archived seasons"
  on archived_seasons for insert
  with check (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can update archived seasons"
  on archived_seasons for update
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can delete archived seasons"
  on archived_seasons for delete
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Archived brackets are viewable by everyone"
  on archived_brackets for select
  using (true);

create policy "Admins can insert archived brackets"
  on archived_brackets for insert
  with check (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can update archived brackets"
  on archived_brackets for update
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create policy "Admins can delete archived brackets"
  on archived_brackets for delete
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

-- Brackets policies
create policy "Brackets are viewable by everyone"
  on brackets for select
  using (true);

create policy "Users can insert their own brackets"
  on brackets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own brackets"
  on brackets for update
  using (auth.uid() = user_id);

-- Function to create profile on signup
create or replace function create_profile_for_user()
returns trigger as $$
begin
  insert into profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure create_profile_for_user();

-- Function to create empty bracket for new user
create or replace function create_empty_bracket_for_user()
returns trigger as $$
begin
  insert into brackets (user_id, selections, is_submitted)
  values (
    new.id,
    array_fill(null::text, array[63]),
    false
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create empty bracket on profile creation
create trigger on_profile_created
  after insert on profiles
  for each row execute procedure create_empty_bracket_for_user();