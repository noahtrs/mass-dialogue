-- Migration: Create post_votes table for server-side vote tracking
-- This prevents duplicate voting by tracking session_id + post_id combinations

create table if not exists post_votes (
  id uuid default gen_random_uuid() primary key,
  session_id uuid not null,
  post_id bigint not null references messages(id) on delete cascade,
  created_at timestamp with time zone default now() not null,
  unique (session_id, post_id)
);

-- Create an index for fast lookups
create index if not exists post_votes_session_post_idx on post_votes (session_id, post_id);
create index if not exists post_votes_post_id_idx on post_votes (post_id);