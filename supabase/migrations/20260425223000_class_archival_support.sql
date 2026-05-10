alter table if exists public.classes
add column if not exists archived_at timestamptz null;

create index if not exists idx_classes_archived_at on public.classes (archived_at);
