create table user_profiles (
  id uuid references auth.users primary key,
  name text,
  age int,
  gender text,
  voice_preference text check (voice_preference in ('male','female')),
  goal text,
  created_at timestamp default now()
);

create table interview_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  domain text,
  transcript jsonb,
  feedback_summary text,
  created_at timestamp default now()
);

create table gd_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  topic text,
  duration_minutes numeric,
  transcript jsonb,
  created_at timestamp default now()
);

create table test_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  category text,
  questions_answered int,
  correct_count int,
  created_at timestamp default now()
);

create table activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  log_date date default current_date,
  module text,
  effort_percent numeric,
  created_at timestamp default now()
);

-- Enable RLS
alter table user_profiles enable row level security;
alter table interview_sessions enable row level security;
alter table gd_sessions enable row level security;
alter table test_results enable row level security;
alter table activity_logs enable row level security;

-- Create Policies
create policy "Users can manage their own profile" on user_profiles
  for all using (auth.uid() = id);

create policy "Users can manage their own interview sessions" on interview_sessions
  for all using (auth.uid() = user_id);

create policy "Users can manage their own gd sessions" on gd_sessions
  for all using (auth.uid() = user_id);

create policy "Users can manage their own test results" on test_results
  for all using (auth.uid() = user_id);

create policy "Users can manage their own activity logs" on activity_logs
  for all using (auth.uid() = user_id);
