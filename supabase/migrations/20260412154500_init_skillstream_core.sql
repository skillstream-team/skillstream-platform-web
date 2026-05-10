create extension if not exists "pgcrypto";
create extension if not exists "citext";

create schema if not exists app;

create type public.app_role as enum ('teacher', 'student', 'admin');
create type public.lesson_state as enum ('scheduled', 'live', 'completed', 'cancelled');
create type public.live_session_mode as enum ('free', 'paid');
create type public.purchase_status as enum ('pending', 'paid', 'refunded', 'cancelled');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  full_name text not null default '',
  role public.app_role not null default 'student',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  monthly_fee_gbp numeric(10,2) not null default 0,
  included_participant_minutes integer not null default 0,
  overage_per_participant_minute_gbp numeric(10,4) not null default 0,
  one_off_platform_fee_percent numeric(5,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_subscriptions (
  id uuid primary key default gen_random_uuid(),
  teacher_user_id uuid not null references public.profiles(id) on delete cascade,
  billing_plan_id uuid not null references public.billing_plans(id),
  status public.subscription_status not null default 'active',
  period_start timestamptz not null default now(),
  period_end timestamptz not null default (now() + interval '1 month'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_user_id)
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  overview text not null default '',
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role public.app_role not null check (member_role in ('teacher', 'student')),
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  state public.lesson_state not null default 'scheduled',
  created_by_user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_live_configs (
  lesson_id uuid primary key references public.lessons(id) on delete cascade,
  daily_room_url text not null,
  session_mode public.live_session_mode not null default 'free',
  ticket_price_gbp numeric(10,2) not null default 0,
  notes text not null default '',
  updated_by_user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint paid_sessions_require_price check (
    (session_mode = 'free' and ticket_price_gbp = 0)
    or (session_mode = 'paid' and ticket_price_gbp > 0)
  )
);

create table if not exists public.lesson_live_purchases (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  student_user_id uuid not null references public.profiles(id) on delete cascade,
  amount_gbp numeric(10,2) not null default 0,
  status public.purchase_status not null default 'pending',
  provider text,
  provider_reference text,
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, student_user_id)
);

create table if not exists public.live_attendance_events (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  daily_session_id text not null,
  joined_at timestamptz not null,
  left_at timestamptz,
  participant_minutes integer generated always as (
    case
      when left_at is null then null
      else greatest(1, ceil(extract(epoch from (left_at - joined_at)) / 60.0)::integer)
    end
  ) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_monthly_usage (
  teacher_user_id uuid not null references public.profiles(id) on delete cascade,
  usage_month date not null,
  participant_minutes integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (teacher_user_id, usage_month)
);

create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'profiles_set_updated_at') then
    create trigger profiles_set_updated_at before update on public.profiles for each row execute function app.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'billing_plans_set_updated_at') then
    create trigger billing_plans_set_updated_at before update on public.billing_plans for each row execute function app.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'teacher_subscriptions_set_updated_at') then
    create trigger teacher_subscriptions_set_updated_at before update on public.teacher_subscriptions for each row execute function app.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'classes_set_updated_at') then
    create trigger classes_set_updated_at before update on public.classes for each row execute function app.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'lessons_set_updated_at') then
    create trigger lessons_set_updated_at before update on public.lessons for each row execute function app.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'lesson_live_configs_set_updated_at') then
    create trigger lesson_live_configs_set_updated_at before update on public.lesson_live_configs for each row execute function app.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'lesson_live_purchases_set_updated_at') then
    create trigger lesson_live_purchases_set_updated_at before update on public.lesson_live_purchases for each row execute function app.set_updated_at();
  end if;
end $$;

create or replace function app.current_role()
returns public.app_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function app.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(app.current_role() = 'admin', false);
$$;

create or replace function app.is_teacher_of_class(target_class_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.class_members cm
    where cm.class_id = target_class_id
      and cm.user_id = auth.uid()
      and cm.member_role = 'teacher'
  );
$$;

create or replace function app.is_member_of_class(target_class_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.class_members cm
    where cm.class_id = target_class_id
      and cm.user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.billing_plans enable row level security;
alter table public.teacher_subscriptions enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_live_configs enable row level security;
alter table public.lesson_live_purchases enable row level security;
alter table public.live_attendance_events enable row level security;
alter table public.teacher_monthly_usage enable row level security;

create policy "profiles_read_self_or_admin"
on public.profiles for select
using (id = auth.uid() or app.is_admin());

create policy "profiles_update_self_or_admin"
on public.profiles for update
using (id = auth.uid() or app.is_admin())
with check (id = auth.uid() or app.is_admin());

create policy "billing_plans_read_all_authenticated"
on public.billing_plans for select
using (auth.uid() is not null);

create policy "teacher_subscriptions_read_owner_or_admin"
on public.teacher_subscriptions for select
using (teacher_user_id = auth.uid() or app.is_admin());

create policy "teacher_subscriptions_manage_admin"
on public.teacher_subscriptions for all
using (app.is_admin())
with check (app.is_admin());

create policy "classes_read_members_or_admin"
on public.classes for select
using (app.is_member_of_class(id) or app.is_admin());

create policy "classes_insert_teacher_or_admin"
on public.classes for insert
with check (
  (owner_user_id = auth.uid() and app.current_role() = 'teacher')
  or app.is_admin()
);

create policy "classes_update_teacher_or_admin"
on public.classes for update
using (app.is_teacher_of_class(id) or app.is_admin())
with check (app.is_teacher_of_class(id) or app.is_admin());

create policy "class_members_read_member_or_admin"
on public.class_members for select
using (user_id = auth.uid() or app.is_teacher_of_class(class_id) or app.is_admin());

create policy "class_members_manage_teacher_or_admin"
on public.class_members for all
using (app.is_teacher_of_class(class_id) or app.is_admin())
with check (app.is_teacher_of_class(class_id) or app.is_admin());

create policy "lessons_read_class_members_or_admin"
on public.lessons for select
using (app.is_member_of_class(class_id) or app.is_admin());

create policy "lessons_manage_teacher_or_admin"
on public.lessons for all
using (app.is_teacher_of_class(class_id) or app.is_admin())
with check (app.is_teacher_of_class(class_id) or app.is_admin());

create policy "lesson_live_configs_read_class_members_or_admin"
on public.lesson_live_configs for select
using (
  exists (
    select 1 from public.lessons l
    where l.id = lesson_id
      and (app.is_member_of_class(l.class_id) or app.is_admin())
  )
);

create policy "lesson_live_configs_manage_teacher_or_admin"
on public.lesson_live_configs for all
using (
  exists (
    select 1 from public.lessons l
    where l.id = lesson_id
      and (app.is_teacher_of_class(l.class_id) or app.is_admin())
  )
)
with check (
  exists (
    select 1 from public.lessons l
    where l.id = lesson_id
      and (app.is_teacher_of_class(l.class_id) or app.is_admin())
  )
);

create policy "lesson_live_purchases_read_owner_or_teacher_or_admin"
on public.lesson_live_purchases for select
using (
  student_user_id = auth.uid()
  or exists (
    select 1
    from public.lessons l
    where l.id = lesson_id
      and (app.is_teacher_of_class(l.class_id) or app.is_admin())
  )
);

create policy "lesson_live_purchases_insert_student_or_admin"
on public.lesson_live_purchases for insert
with check (student_user_id = auth.uid() or app.is_admin());

create policy "lesson_live_purchases_update_admin_only"
on public.lesson_live_purchases for update
using (app.is_admin())
with check (app.is_admin());

create policy "live_attendance_events_read_member_or_admin"
on public.live_attendance_events for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.lessons l
    where l.id = lesson_id
      and (app.is_teacher_of_class(l.class_id) or app.is_admin())
  )
);

create policy "live_attendance_events_insert_service_or_admin"
on public.live_attendance_events for insert
with check (app.is_admin());

create policy "teacher_monthly_usage_read_owner_or_admin"
on public.teacher_monthly_usage for select
using (teacher_user_id = auth.uid() or app.is_admin());

create policy "teacher_monthly_usage_manage_admin_only"
on public.teacher_monthly_usage for all
using (app.is_admin())
with check (app.is_admin());

insert into public.billing_plans (code, name, monthly_fee_gbp, included_participant_minutes, overage_per_participant_minute_gbp, one_off_platform_fee_percent)
values
  ('creator', 'Creator', 39, 10000, 0.0020, 8),
  ('studio', 'Studio', 89, 40000, 0.0020, 6),
  ('academy', 'Academy', 199, 150000, 0.0020, 5)
on conflict (code) do update
set
  name = excluded.name,
  monthly_fee_gbp = excluded.monthly_fee_gbp,
  included_participant_minutes = excluded.included_participant_minutes,
  overage_per_participant_minute_gbp = excluded.overage_per_participant_minute_gbp,
  one_off_platform_fee_percent = excluded.one_off_platform_fee_percent,
  is_active = true,
  updated_at = now();
