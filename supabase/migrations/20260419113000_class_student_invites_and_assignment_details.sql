do $$
begin
  if not exists (select 1 from pg_type where typname = 'class_student_invite_status') then
    create type public.class_student_invite_status as enum ('pending', 'accepted', 'revoked');
  end if;
end $$;

create table if not exists public.class_student_invites (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  email citext not null,
  invite_code text not null unique,
  invite_link text not null,
  invited_by_user_id uuid not null references public.profiles(id),
  status public.class_student_invite_status not null default 'pending',
  accepted_user_id uuid references public.profiles(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_class_student_invites_class_id on public.class_student_invites (class_id);
create index if not exists idx_class_student_invites_email on public.class_student_invites (email);

alter table public.class_student_invites enable row level security;

create policy "class_student_invites_read_teacher_or_admin"
on public.class_student_invites for select
using (app.is_teacher_of_class(class_id) or app.is_admin());

create policy "class_student_invites_manage_teacher_or_admin"
on public.class_student_invites for all
using (app.is_teacher_of_class(class_id) or app.is_admin())
with check (app.is_teacher_of_class(class_id) or app.is_admin());

alter table public.class_assignments
  add column if not exists description text not null default '',
  add column if not exists resources jsonb not null default '[]'::jsonb;
