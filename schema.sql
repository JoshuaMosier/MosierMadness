-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table that extends Supabase auth.users
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text,
  last_name text,
  email text unique,
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

-- Set up RLS (Row Level Security)
alter table profiles enable row level security;
alter table brackets enable row level security;

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