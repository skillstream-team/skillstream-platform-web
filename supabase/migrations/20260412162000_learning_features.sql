create type public.message_role as enum ('teacher', 'student', 'system');
create type public.assignment_scope as enum ('class', 'individuals');
create type public.progress_tone as enum ('strong', 'steady', 'attention');

create table if not exists public.student_insights (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  homework_completion integer not null default 0 check (homework_completion >= 0 and homework_completion <= 100),
  note text not null default '',
  needs_attention boolean not null default false,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.class_assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  due_at timestamptz not null,
  assigned_to public.assignment_scope not null default 'class',
  completion_rate integer not null default 0 check (completion_rate >= 0 and completion_rate <= 100),
  submissions_pending_review integer not null default 0,
  created_by_user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.class_topic_insights (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  topic text not null,
  mastery integer not null default 0 check (mastery >= 0 and mastery <= 100),
  tone public.progress_tone not null default 'steady',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.class_messages (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  sender_user_id uuid references public.profiles(id),
  sender_display_name text not null default 'System',
  role public.message_role not null default 'system',
  body text not null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.class_activity_events (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  detail text not null,
  actor_user_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'student_insights_set_updated_at') then
    create trigger student_insights_set_updated_at before update on public.student_insights for each row execute function app.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'class_assignments_set_updated_at') then
    create trigger class_assignments_set_updated_at before update on public.class_assignments for each row execute function app.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'class_topic_insights_set_updated_at') then
    create trigger class_topic_insights_set_updated_at before update on public.class_topic_insights for each row execute function app.set_updated_at();
  end if;
end $$;

alter table public.student_insights enable row level security;
alter table public.class_assignments enable row level security;
alter table public.class_topic_insights enable row level security;
alter table public.class_messages enable row level security;
alter table public.class_activity_events enable row level security;

create policy "student_insights_read_self_teacher_admin"
on public.student_insights for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.class_members cm_self
    join public.class_members cm_student on cm_self.class_id = cm_student.class_id
    where cm_self.user_id = auth.uid()
      and cm_self.member_role = 'teacher'
      and cm_student.user_id = student_insights.user_id
  )
  or app.is_admin()
);

create policy "student_insights_manage_teacher_admin"
on public.student_insights for all
using (app.current_role() = 'teacher' or app.is_admin())
with check (app.current_role() = 'teacher' or app.is_admin());

create policy "class_assignments_read_class_members_or_admin"
on public.class_assignments for select
using (app.is_member_of_class(class_id) or app.is_admin());

create policy "class_assignments_manage_teacher_or_admin"
on public.class_assignments for all
using (app.is_teacher_of_class(class_id) or app.is_admin())
with check (app.is_teacher_of_class(class_id) or app.is_admin());

create policy "class_topic_insights_read_class_members_or_admin"
on public.class_topic_insights for select
using (app.is_member_of_class(class_id) or app.is_admin());

create policy "class_topic_insights_manage_teacher_or_admin"
on public.class_topic_insights for all
using (app.is_teacher_of_class(class_id) or app.is_admin())
with check (app.is_teacher_of_class(class_id) or app.is_admin());

create policy "class_messages_read_class_members_or_admin"
on public.class_messages for select
using (app.is_member_of_class(class_id) or app.is_admin());

create policy "class_messages_insert_class_members_or_admin"
on public.class_messages for insert
with check (app.is_member_of_class(class_id) or app.is_admin());

create policy "class_activity_events_read_class_members_or_admin"
on public.class_activity_events for select
using (app.is_member_of_class(class_id) or app.is_admin());

create policy "class_activity_events_insert_teacher_or_admin"
on public.class_activity_events for insert
with check (app.is_teacher_of_class(class_id) or app.is_admin());

create or replace function app.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text;
  normalized_role public.app_role;
begin
  meta_role := lower(coalesce(new.raw_user_meta_data->>'role', 'student'));
  normalized_role := case
    when meta_role = 'teacher' then 'teacher'::public.app_role
    when meta_role = 'admin' then 'admin'::public.app_role
    else 'student'::public.app_role
  end;

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

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_auth_user();
