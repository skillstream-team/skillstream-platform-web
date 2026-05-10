do $$
begin
  if not exists (select 1 from pg_type where typname = 'teacher_invite_status') then
    create type public.teacher_invite_status as enum ('pending', 'claimed', 'revoked');
  end if;
end $$;

create table if not exists public.teacher_invites (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  invite_code text not null unique,
  status public.teacher_invite_status not null default 'pending',
  expires_at timestamptz,
  claimed_at timestamptz,
  claimed_user_id uuid references public.profiles(id),
  created_by_user_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.teacher_invites enable row level security;

create policy "teacher_invites_admin_only"
on public.teacher_invites for all
using (app.is_admin())
with check (app.is_admin());

create or replace function public.validate_teacher_invite(p_email text, p_code text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.teacher_invites ti
    where lower(ti.email::text) = lower(p_email)
      and ti.invite_code = p_code
      and ti.status = 'pending'
      and (ti.expires_at is null or ti.expires_at > now())
  );
$$;

grant execute on function public.validate_teacher_invite(text, text) to anon, authenticated;

create or replace function app.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text;
  invite_code_meta text;
  normalized_role public.app_role;
begin
  meta_role := lower(coalesce(new.raw_user_meta_data->>'role', 'student'));
  invite_code_meta := coalesce(new.raw_user_meta_data->>'teacher_invite_code', '');

  normalized_role := 'student'::public.app_role;

  if meta_role = 'teacher' then
    if not exists (
      select 1
      from public.teacher_invites ti
      where lower(ti.email::text) = lower(new.email)
        and ti.invite_code = invite_code_meta
        and ti.status = 'pending'
        and (ti.expires_at is null or ti.expires_at > now())
    ) then
      raise exception 'Teacher invite is invalid or expired';
    end if;

    normalized_role := 'teacher'::public.app_role;

    update public.teacher_invites
    set
      status = 'claimed',
      claimed_at = now(),
      claimed_user_id = new.id
    where lower(email::text) = lower(new.email)
      and invite_code = invite_code_meta
      and status = 'pending';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    normalized_role
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      role = excluded.role,
      updated_at = now();

  if normalized_role = 'student' then
    insert into public.student_insights (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create table if not exists public.request_rate_limits (
  key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null default 0
);

create or replace function public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  now_ts timestamptz := now();
  current_row public.request_rate_limits%rowtype;
begin
  if p_key is null or length(trim(p_key)) = 0 then
    return false;
  end if;
  if p_limit <= 0 then
    return false;
  end if;
  if p_window_seconds <= 0 then
    return false;
  end if;

  select * into current_row from public.request_rate_limits where key = p_key for update;

  if not found then
    insert into public.request_rate_limits (key, window_started_at, request_count)
    values (p_key, now_ts, 1);
    return true;
  end if;

  if current_row.window_started_at + make_interval(secs => p_window_seconds) <= now_ts then
    update public.request_rate_limits
    set window_started_at = now_ts, request_count = 1
    where key = p_key;
    return true;
  end if;

  if current_row.request_count >= p_limit then
    return false;
  end if;

  update public.request_rate_limits
  set request_count = request_count + 1
  where key = p_key;
  return true;
end;
$$;

grant execute on function public.check_rate_limit(text, integer, integer) to anon, authenticated;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  class_id uuid references public.classes(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_created_at on public.analytics_events (created_at desc);
create index if not exists idx_analytics_events_type on public.analytics_events (event_type);
create index if not exists idx_analytics_events_actor on public.analytics_events (actor_user_id);

alter table public.analytics_events enable row level security;

create policy "analytics_events_insert_authenticated"
on public.analytics_events for insert
with check (auth.uid() is not null and actor_user_id = auth.uid());

create policy "analytics_events_select_admin_only"
on public.analytics_events for select
using (app.is_admin());

create table if not exists public.analytics_daily_kpis (
  metric_date date not null,
  metric_key text not null,
  metric_value numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (metric_date, metric_key)
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'analytics_daily_kpis_set_updated_at') then
    create trigger analytics_daily_kpis_set_updated_at before update on public.analytics_daily_kpis for each row execute function app.set_updated_at();
  end if;
end $$;

alter table public.analytics_daily_kpis enable row level security;

create policy "analytics_daily_kpis_admin_only"
on public.analytics_daily_kpis for all
using (app.is_admin())
with check (app.is_admin());

create or replace function public.rollup_analytics_day(p_day date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  day_start timestamptz := p_day::timestamptz;
  day_end timestamptz := (p_day + 1)::timestamptz;
begin
  insert into public.analytics_daily_kpis (metric_date, metric_key, metric_value)
  values
    (p_day, 'events_total', (
      select count(*)::numeric from public.analytics_events where created_at >= day_start and created_at < day_end
    )),
    (p_day, 'active_users', (
      select count(distinct actor_user_id)::numeric from public.analytics_events where created_at >= day_start and created_at < day_end and actor_user_id is not null
    ))
  on conflict (metric_date, metric_key) do update
  set metric_value = excluded.metric_value,
      updated_at = now();
end;
$$;

grant execute on function public.rollup_analytics_day(date) to authenticated;

create or replace function public.admin_metrics()
returns table(id text, label text, value text, note text)
language sql
security definer
set search_path = public
stable
as $$
  select * from (
    select
      'teachers'::text as id,
      'Active teachers'::text as label,
      (select count(*)::text from profiles p left join admin_user_statuses s on s.user_id = p.id where p.role = 'teacher' and coalesce(s.status, 'active') <> 'paused') as value,
      (select count(*)::text || ' total' from profiles p where p.role = 'teacher') as note
    union all
    select
      'students',
      'Active students',
      (select count(*)::text from profiles p left join admin_user_statuses s on s.user_id = p.id where p.role = 'student' and coalesce(s.status, 'active') <> 'paused'),
      (select count(*)::text || ' total' from profiles p where p.role = 'student')
    union all
    select
      'lessons',
      'Lessons delivered',
      (select count(*)::text from lessons),
      'All-time total'
    union all
    select
      'engagement',
      'Avg learner progress',
      (select coalesce(round(avg(progress))::text || '%', '0%') from student_insights),
      'Based on student insights'
  ) t
  where app.is_admin();
$$;

grant execute on function public.admin_metrics() to authenticated;

create or replace function public.admin_list_users(
  p_query text default '',
  p_role text default null,
  p_status text default null,
  p_limit integer default 200,
  p_offset integer default 0
)
returns table(
  id uuid,
  name text,
  email text,
  role text,
  status text,
  classes_count integer,
  last_active_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  with base as (
    select
      p.id,
      coalesce(p.full_name, split_part(p.email::text, '@', 1)) as name,
      p.email::text as email,
      case when p.role = 'teacher' then 'TEACHER' else 'STUDENT' end as role,
      coalesce(aus.status::text, 'active') as status,
      coalesce(aus.last_active_at, now()) as last_active_at
    from profiles p
    left join admin_user_statuses aus on aus.user_id = p.id
    where app.is_admin()
      and p.role in ('teacher', 'student')
      and (
        p_query is null
        or length(trim(p_query)) = 0
        or lower(coalesce(p.full_name, '') || ' ' || p.email::text) like '%' || lower(trim(p_query)) || '%'
      )
      and (
        p_role is null
        or (
          case when p.role = 'teacher' then 'TEACHER' else 'STUDENT' end
        ) = upper(p_role)
      )
      and (p_status is null or coalesce(aus.status::text, 'active') = lower(p_status))
  )
  select
    b.id,
    b.name,
    b.email,
    b.role,
    b.status,
    coalesce(c.classes_count, 0) as classes_count,
    b.last_active_at
  from base b
  left join (
    select cm.user_id, count(*)::integer as classes_count
    from class_members cm
    group by cm.user_id
  ) c on c.user_id = b.id
  order by b.last_active_at desc, b.name asc
  limit greatest(1, least(coalesce(p_limit, 200), 500))
  offset greatest(0, coalesce(p_offset, 0));
$$;

grant execute on function public.admin_list_users(text, text, text, integer, integer) to authenticated;

create table if not exists public.background_job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  status text not null check (status in ('started', 'success', 'failed')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_background_job_runs_created_at on public.background_job_runs (created_at desc);

alter table public.background_job_runs enable row level security;

create policy "background_job_runs_admin_only"
on public.background_job_runs for all
using (app.is_admin())
with check (app.is_admin());
