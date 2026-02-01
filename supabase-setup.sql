-- ═══════════════════════════════════════════════════════════
-- STONE HQ — Database Setup
-- Run this in Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null default '',
  role text default '',
  team text default '',
  emoji text default '😊',
  avatar_url text,
  status text default 'available' check (status in ('available','busy','focus','meeting','away')),
  activity text default 'Online',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Messages table
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  sender_name text not null,
  channel text not null default 'geral',
  text text not null,
  created_at timestamptz default now()
);

-- 3. Enable RLS
alter table public.profiles enable row level security;
alter table public.messages enable row level security;

-- 4. RLS Policies - Profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 5. RLS Policies - Messages
create policy "Messages are viewable by everyone"
  on public.messages for select
  using (true);

create policy "Authenticated users can insert messages"
  on public.messages for insert
  with check (auth.uid() = user_id);

-- 6. Enable Realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.profiles;

-- 7. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop if exists then create trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 8. Updated_at auto-update
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- 9. Index for faster message queries
create index if not exists idx_messages_channel_created 
  on public.messages(channel, created_at desc);

create index if not exists idx_messages_created 
  on public.messages(created_at desc);
