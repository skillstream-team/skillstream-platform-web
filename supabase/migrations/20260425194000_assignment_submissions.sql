do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'assignment_submission_status'
      and n.nspname = 'public'
  ) then
    create type public.assignment_submission_status as enum ('submitted', 'graded');
  end if;
end $$;

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.class_assignments(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_user_id uuid not null references public.profiles(id) on delete cascade,
  submission_note text not null default '',
  file_path text not null,
  submitted_at timestamptz not null default now(),
  status public.assignment_submission_status not null default 'submitted',
  grade_score integer check (grade_score is null or (grade_score >= 0 and grade_score <= 100)),
  feedback text not null default '',
  graded_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_user_id)
);

create index if not exists idx_assignment_submissions_assignment
  on public.assignment_submissions (assignment_id, submitted_at desc);
create index if not exists idx_assignment_submissions_class
  on public.assignment_submissions (class_id, submitted_at desc);
create index if not exists idx_assignment_submissions_student
  on public.assignment_submissions (student_user_id, submitted_at desc);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'assignment_submissions_set_updated_at') then
    create trigger assignment_submissions_set_updated_at
      before update on public.assignment_submissions
      for each row execute function app.set_updated_at();
  end if;
end $$;

create or replace function app.refresh_assignment_metrics(p_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_id uuid;
  v_total_students integer := 0;
  v_submitted_count integer := 0;
  v_pending_reviews integer := 0;
  v_completion integer := 0;
begin
  select class_id into v_class_id
  from public.class_assignments
  where id = p_assignment_id;

  if v_class_id is null then
    return;
  end if;

  select count(*) into v_total_students
  from public.class_members cm
  where cm.class_id = v_class_id
    and cm.member_role = 'student';

  select count(*) into v_submitted_count
  from public.assignment_submissions s
  where s.assignment_id = p_assignment_id;

  select count(*) into v_pending_reviews
  from public.assignment_submissions s
  where s.assignment_id = p_assignment_id
    and s.status <> 'graded';

  if v_total_students > 0 then
    v_completion := round((v_submitted_count::numeric / v_total_students::numeric) * 100)::integer;
  else
    v_completion := 0;
  end if;

  update public.class_assignments
  set
    completion_rate = greatest(0, least(100, v_completion)),
    submissions_pending_review = greatest(0, v_pending_reviews),
    updated_at = now()
  where id = p_assignment_id;
end;
$$;

create or replace function app.assignment_submissions_refresh_metrics()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform app.refresh_assignment_metrics(old.assignment_id);
  else
    perform app.refresh_assignment_metrics(new.assignment_id);
  end if;
  return null;
end;
$$;

drop trigger if exists assignment_submissions_refresh_metrics on public.assignment_submissions;
create trigger assignment_submissions_refresh_metrics
after insert or update or delete on public.assignment_submissions
for each row execute function app.assignment_submissions_refresh_metrics();

alter table public.assignment_submissions enable row level security;

drop policy if exists "assignment_submissions_read_member_or_admin" on public.assignment_submissions;
create policy "assignment_submissions_read_member_or_admin"
on public.assignment_submissions for select
using (
  app.is_admin()
  or app.is_teacher_of_class(class_id)
  or student_user_id = auth.uid()
);

drop policy if exists "assignment_submissions_insert_student_or_admin" on public.assignment_submissions;
create policy "assignment_submissions_insert_student_or_admin"
on public.assignment_submissions for insert
with check (
  app.is_admin()
  or (
    student_user_id = auth.uid()
    and exists (
      select 1
      from public.class_members cm
      where cm.class_id = assignment_submissions.class_id
        and cm.user_id = auth.uid()
        and cm.member_role = 'student'
    )
  )
);

drop policy if exists "assignment_submissions_update_student_teacher_or_admin" on public.assignment_submissions;
create policy "assignment_submissions_update_student_teacher_or_admin"
on public.assignment_submissions for update
using (
  app.is_admin()
  or app.is_teacher_of_class(class_id)
  or student_user_id = auth.uid()
)
with check (
  app.is_admin()
  or app.is_teacher_of_class(class_id)
  or student_user_id = auth.uid()
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assignment-submissions',
  'assignment-submissions',
  false,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "assignment_submissions_bucket_select_members_or_admin" on storage.objects;
drop policy if exists "assignment_submissions_bucket_insert_owner_or_admin" on storage.objects;
drop policy if exists "assignment_submissions_bucket_update_owner_teacher_or_admin" on storage.objects;
drop policy if exists "assignment_submissions_bucket_delete_owner_teacher_or_admin" on storage.objects;

create policy "assignment_submissions_bucket_select_members_or_admin"
on storage.objects for select
using (
  bucket_id = 'assignment-submissions'
  and (
    app.is_admin()
    or (
      split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
      and app.is_teacher_of_class(split_part(name, '/', 1)::uuid)
    )
    or split_part(name, '/', 3) = auth.uid()::text
  )
);

create policy "assignment_submissions_bucket_insert_owner_or_admin"
on storage.objects for insert
with check (
  bucket_id = 'assignment-submissions'
  and (
    app.is_admin()
    or (
      split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
      and split_part(name, '/', 3) = auth.uid()::text
      and exists (
        select 1
        from public.class_members cm
        where cm.class_id = split_part(name, '/', 1)::uuid
          and cm.user_id = auth.uid()
          and cm.member_role = 'student'
      )
    )
  )
);

create policy "assignment_submissions_bucket_update_owner_teacher_or_admin"
on storage.objects for update
using (
  bucket_id = 'assignment-submissions'
  and (
    app.is_admin()
    or (
      split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
      and app.is_teacher_of_class(split_part(name, '/', 1)::uuid)
    )
    or split_part(name, '/', 3) = auth.uid()::text
  )
)
with check (
  bucket_id = 'assignment-submissions'
  and (
    app.is_admin()
    or (
      split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
      and app.is_teacher_of_class(split_part(name, '/', 1)::uuid)
    )
    or split_part(name, '/', 3) = auth.uid()::text
  )
);

create policy "assignment_submissions_bucket_delete_owner_teacher_or_admin"
on storage.objects for delete
using (
  bucket_id = 'assignment-submissions'
  and (
    app.is_admin()
    or (
      split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
      and app.is_teacher_of_class(split_part(name, '/', 1)::uuid)
    )
    or split_part(name, '/', 3) = auth.uid()::text
  )
);

do $$
declare
  assignment_row record;
begin
  for assignment_row in select id from public.class_assignments loop
    perform app.refresh_assignment_metrics(assignment_row.id);
  end loop;
end $$;
