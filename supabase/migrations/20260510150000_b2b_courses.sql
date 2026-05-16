-- B2B LMS: Courses, modules, and lessons

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  created_by_user_id uuid references public.profiles(id),
  title text not null,
  description text,
  thumbnail_url text,
  is_published boolean default false,
  is_marketplace boolean default false,
  estimated_minutes int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  position int not null,
  created_at timestamptz default now()
);

create table public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.course_modules(id) on delete cascade,
  title text not null,
  kind text not null check (kind in ('video', 'text', 'quiz', 'live')),
  position int not null,
  content_body text,
  video_url text,
  duration_minutes int,
  quiz_questions jsonb,
  quiz_pass_score int default 80,
  created_at timestamptz default now()
);

alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.course_lessons enable row level security;

-- Marketplace courses are readable by any authenticated user
-- Org courses are readable by org members
create policy "read own org or marketplace courses"
  on public.courses for select
  using (
    is_marketplace = true
    or org_id in (
      select org_id from public.org_members where user_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

create policy "instructors and admins can write courses"
  on public.courses for insert
  with check (
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid() and org_role in ('admin', 'instructor')
    )
    or exists (
      select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin')
    )
  );

create policy "course creator can update"
  on public.courses for update
  using (
    created_by_user_id = auth.uid()
    or org_id in (
      select org_id from public.org_members
      where user_id = auth.uid() and org_role in ('admin', 'instructor')
    )
    or exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

create policy "course creator can delete"
  on public.courses for delete
  using (
    created_by_user_id = auth.uid()
    or org_id in (
      select org_id from public.org_members
      where user_id = auth.uid() and org_role = 'admin'
    )
    or exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Modules and lessons inherit access from parent course
create policy "read modules of accessible courses"
  on public.course_modules for select
  using (
    course_id in (select id from public.courses)
  );

create policy "write modules for course creators"
  on public.course_modules for all
  using (
    course_id in (
      select id from public.courses
      where created_by_user_id = auth.uid()
      or org_id in (
        select org_id from public.org_members
        where user_id = auth.uid() and org_role in ('admin', 'instructor')
      )
    )
  );

create policy "read lessons of accessible modules"
  on public.course_lessons for select
  using (
    module_id in (select id from public.course_modules)
  );

create policy "write lessons for course creators"
  on public.course_lessons for all
  using (
    module_id in (
      select cm.id from public.course_modules cm
      join public.courses c on c.id = cm.course_id
      where c.created_by_user_id = auth.uid()
      or c.org_id in (
        select org_id from public.org_members
        where user_id = auth.uid() and org_role in ('admin', 'instructor')
      )
    )
  );

-- Keep updated_at current
create or replace function public.set_course_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger courses_updated_at
  before update on public.courses
  for each row execute function public.set_course_updated_at();
