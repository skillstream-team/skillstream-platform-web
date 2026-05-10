create type public.admin_user_status as enum ('active', 'paused', 'needs_attention');
create type public.admin_broadcast_channel as enum ('email', 'in_app');
create type public.admin_broadcast_audience as enum ('all', 'teachers', 'students');
create type public.admin_alert_severity as enum ('high', 'medium', 'low');
create type public.admin_alert_status as enum ('open', 'resolved');

create table if not exists public.admin_feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null default '',
  enabled boolean not null default false,
  rollout public.admin_broadcast_audience not null default 'all',
  updated_by_user_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_reports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  kpi text not null default '',
  generated_by_user_id uuid references public.profiles(id),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_broadcasts (
  id uuid primary key default gen_random_uuid(),
  channel public.admin_broadcast_channel not null,
  audience public.admin_broadcast_audience not null,
  subject text not null,
  body text not null,
  status text not null check (status in ('draft', 'sent')),
  sent_by_user_id uuid references public.profiles(id),
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  severity public.admin_alert_severity not null default 'medium',
  status public.admin_alert_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id),
  actor_display_name text not null default 'Admin',
  action text not null,
  target text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_user_statuses (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status public.admin_user_status not null default 'active',
  last_active_at timestamptz not null default now(),
  updated_by_user_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'admin_feature_flags_set_updated_at') then
    create trigger admin_feature_flags_set_updated_at before update on public.admin_feature_flags for each row execute function app.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'admin_user_statuses_set_updated_at') then
    create trigger admin_user_statuses_set_updated_at before update on public.admin_user_statuses for each row execute function app.set_updated_at();
  end if;
end $$;

alter table public.admin_feature_flags enable row level security;
alter table public.admin_reports enable row level security;
alter table public.admin_broadcasts enable row level security;
alter table public.admin_alerts enable row level security;
alter table public.admin_audit_events enable row level security;
alter table public.admin_user_statuses enable row level security;

create policy "admin_feature_flags_admin_only"
on public.admin_feature_flags for all
using (app.is_admin())
with check (app.is_admin());

create policy "admin_reports_admin_only"
on public.admin_reports for all
using (app.is_admin())
with check (app.is_admin());

create policy "admin_broadcasts_admin_only"
on public.admin_broadcasts for all
using (app.is_admin())
with check (app.is_admin());

create policy "admin_alerts_admin_only"
on public.admin_alerts for all
using (app.is_admin())
with check (app.is_admin());

create policy "admin_audit_events_admin_only"
on public.admin_audit_events for all
using (app.is_admin())
with check (app.is_admin());

create policy "admin_user_statuses_admin_only"
on public.admin_user_statuses for all
using (app.is_admin())
with check (app.is_admin());

insert into public.admin_feature_flags (key, name, description, enabled, rollout)
values
  ('live_office_hours', 'Live office hours', 'Allow teachers to open drop-in live sessions.', true, 'teachers'),
  ('study_assist', 'Study assist suggestions', 'Show AI-generated study prompts in dashboard context.', true, 'students'),
  ('weekly_digest', 'Weekly digest emails', 'Send weekly progress digests to learners and teachers.', false, 'all')
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description,
  enabled = excluded.enabled,
  rollout = excluded.rollout,
  updated_at = now();
