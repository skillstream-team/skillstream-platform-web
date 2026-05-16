-- B2B LMS: Enrollments, lesson completions, and certificates

create table public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  enrolled_at timestamptz default now(),
  deadline_at timestamptz,
  completed_at timestamptz,
  unique (course_id, user_id, org_id)
);

create table public.lesson_completions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.course_lessons(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  enrollment_id uuid references public.course_enrollments(id) on delete cascade,
  completed_at timestamptz default now(),
  quiz_score int,
  unique (lesson_id, user_id)
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references public.course_enrollments(id) on delete cascade unique,
  issued_at timestamptz default now(),
  certificate_url text
);

-- Auto-complete enrollment and issue certificate when all lessons are done
create or replace function public.check_course_completion()
returns trigger language plpgsql security definer as $$
declare
  v_total int;
  v_completed int;
  v_enroll_id uuid;
begin
  v_enroll_id := new.enrollment_id;

  select count(cl.id) into v_total
  from public.course_lessons cl
  join public.course_modules cm on cm.id = cl.module_id
  join public.courses c on c.id = cm.course_id
  join public.course_enrollments ce on ce.course_id = c.id
  where ce.id = v_enroll_id;

  select count(*) into v_completed
  from public.lesson_completions
  where enrollment_id = v_enroll_id;

  if v_total > 0 and v_completed >= v_total then
    update public.course_enrollments
    set completed_at = now()
    where id = v_enroll_id and completed_at is null;

    insert into public.certificates (enrollment_id)
    values (v_enroll_id)
    on conflict (enrollment_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_lesson_completed
  after insert on public.lesson_completions
  for each row execute function public.check_course_completion();

-- Storage bucket for certificates
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do nothing;

-- RLS

alter table public.course_enrollments enable row level security;
alter table public.lesson_completions enable row level security;
alter table public.certificates enable row level security;

create policy "learners see own enrollments; admins see org enrollments"
  on public.course_enrollments for select
  using (
    user_id = auth.uid()
    or org_id in (
      select org_id from public.org_members
      where user_id = auth.uid() and org_role in ('admin', 'instructor')
    )
    or exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

create policy "org admins and instructors can enroll learners"
  on public.course_enrollments for insert
  with check (
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid() and org_role in ('admin', 'instructor')
    )
    or exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

create policy "org admins can remove enrollments"
  on public.course_enrollments for delete
  using (
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid() and org_role = 'admin'
    )
  );

create policy "learners can track own completions"
  on public.lesson_completions for select
  using (
    user_id = auth.uid()
    or enrollment_id in (
      select id from public.course_enrollments
      where org_id in (
        select org_id from public.org_members
        where user_id = auth.uid() and org_role in ('admin', 'instructor')
      )
    )
  );

create policy "learners can mark lessons complete"
  on public.lesson_completions for insert
  with check (user_id = auth.uid());

create policy "learners see own certificates"
  on public.certificates for select
  using (
    enrollment_id in (
      select id from public.course_enrollments where user_id = auth.uid()
    )
    or enrollment_id in (
      select ce.id from public.course_enrollments ce
      where ce.org_id in (
        select org_id from public.org_members
        where user_id = auth.uid() and org_role in ('admin', 'instructor')
      )
    )
  );

-- Storage policy for certificates bucket
create policy "learners can read own certificates"
  on storage.objects for select
  using (
    bucket_id = 'certificates'
    and auth.uid() is not null
  );

create policy "service role can write certificates"
  on storage.objects for insert
  with check (bucket_id = 'certificates');
