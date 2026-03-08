-- Game scores table (one row per user, tracks basketball mini-game stats)
create table game_scores (
  user_id uuid references profiles(id) on delete cascade primary key,
  high_score integer not null default 0,
  total_points integer not null default 0,
  games_played integer not null default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table game_scores enable row level security;

-- Public read for leaderboard display
create policy "Game scores are viewable by everyone"
  on game_scores for select
  using (true);

-- Authenticated users can insert their own row
create policy "Users can insert their own game score"
  on game_scores for insert
  with check (auth.uid() = user_id);

-- Authenticated users can update their own row
create policy "Users can update their own game score"
  on game_scores for update
  using (auth.uid() = user_id);
