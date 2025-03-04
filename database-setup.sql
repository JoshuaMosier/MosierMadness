-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create brackets table for new bracket entries
CREATE TABLE brackets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  selections JSONB NOT NULL DEFAULT '[]',
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year)
);

-- Create entries table for bracket entries
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  round1 TEXT NOT NULL DEFAULT '""',
  round2 TEXT NOT NULL DEFAULT '""',
  round3 TEXT NOT NULL DEFAULT '""',
  round4 TEXT NOT NULL DEFAULT '""',
  round5 TEXT NOT NULL DEFAULT '""',
  round6 TEXT NOT NULL DEFAULT '""',
  round7 TEXT NOT NULL DEFAULT '""',
  score INTEGER NOT NULL DEFAULT 0,
  r64_score INTEGER NOT NULL DEFAULT 0,
  r32_score INTEGER NOT NULL DEFAULT 0,
  s16_score INTEGER NOT NULL DEFAULT 0,
  e8_score INTEGER NOT NULL DEFAULT 0,
  f4_score INTEGER NOT NULL DEFAULT 0,
  ncg_score INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  correct_games INTEGER NOT NULL DEFAULT 0,
  potential_score INTEGER NOT NULL DEFAULT 192,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create eliminated_teams table
CREATE TABLE eliminated_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name TEXT NOT NULL UNIQUE,
  eliminated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for entries table
CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for brackets table
CREATE TRIGGER update_brackets_updated_at
  BEFORE UPDATE ON brackets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE eliminated_teams ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read all users
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Entries are viewable by everyone
CREATE POLICY "Entries are viewable by everyone" ON entries
  FOR SELECT USING (true);

-- Users can update their own entries
CREATE POLICY "Users can update own entries" ON entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own entries
CREATE POLICY "Users can insert own entries" ON entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Brackets are viewable by everyone
CREATE POLICY "Brackets are viewable by everyone" ON brackets
  FOR SELECT USING (true);

-- Users can update their own brackets
CREATE POLICY "Users can update own brackets" ON brackets
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own brackets
CREATE POLICY "Users can insert own brackets" ON brackets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Eliminated teams are viewable by everyone
CREATE POLICY "Eliminated teams are viewable by everyone" ON eliminated_teams
  FOR SELECT USING (true);

-- Only admins can modify eliminated teams
CREATE POLICY "Only admins can modify eliminated teams" ON eliminated_teams
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM users WHERE email IN ('josh.r.mosier@gmail.com')
  ));

-- Create indexes
CREATE INDEX entries_user_id_idx ON entries(user_id);
CREATE INDEX entries_score_idx ON entries(score DESC);
CREATE INDEX brackets_user_id_idx ON brackets(user_id);
CREATE INDEX brackets_score_idx ON brackets(score DESC);
CREATE INDEX brackets_year_idx ON brackets(year);
CREATE INDEX eliminated_teams_name_idx ON eliminated_teams(team_name); 