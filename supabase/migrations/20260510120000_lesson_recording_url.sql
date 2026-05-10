-- Add recording_url column to lessons table
-- Stores the Daily.co download link after a teacher records a session.
alter table public.lessons
  add column if not exists recording_url text;
