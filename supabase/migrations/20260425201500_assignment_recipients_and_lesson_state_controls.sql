create table if not exists public.assignment_recipients (
  assignment_id uuid not null references public.class_assignments(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (assignment_id, student_user_id)
);

create index if not exists idx_assignment_recipients_class on public.assignment_recipients (class_id, assignment_id);

alter table public.assignment_recipients enable row level security;

drop policy if exists "assignment_recipients_read_class_members_or_admin" on public.assignment_recipients;
create policy "assignment_recipients_read_class_members_or_admin"
on public.assignment_recipients for select
using (app.is_member_of_class(class_id) or app.is_admin());

drop policy if exists "assignment_recipients_manage_teacher_or_admin" on public.assignment_recipients;
create policy "assignment_recipients_manage_teacher_or_admin"
on public.assignment_recipients for all
using (app.is_teacher_of_class(class_id) or app.is_admin())
with check (app.is_teacher_of_class(class_id) or app.is_admin());

create or replace function app.assignment_recipients_validate_student_membership()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.class_members cm
    where cm.class_id = new.class_id
      and cm.user_id = new.student_user_id
      and cm.member_role = 'student'
  ) then
    raise exception 'Recipient must be a student in this class';
  end if;
  return new;
end;
$$;

drop trigger if exists assignment_recipients_validate_student_membership on public.assignment_recipients;
create trigger assignment_recipients_validate_student_membership
before insert or update on public.assignment_recipients
for each row execute function app.assignment_recipients_validate_student_membership();
