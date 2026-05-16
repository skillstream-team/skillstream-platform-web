-- ─── Course enhancements ──────────────────────────────────────────────────
alter table public.courses
  add column if not exists category text,
  add column if not exists difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced'));

-- ─── Mandatory flag on enrollments ────────────────────────────────────────
alter table public.course_enrollments
  add column if not exists is_mandatory boolean not null default false;

-- ─── Teams ────────────────────────────────────────────────────────────────
create table public.org_teams (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references public.organizations(id) on delete cascade,
  name        text not null,
  created_at  timestamptz default now()
);

create table public.org_team_members (
  team_id  uuid references public.org_teams(id) on delete cascade,
  user_id  uuid references public.profiles(id) on delete cascade,
  primary key (team_id, user_id)
);

-- ─── Learning Paths ───────────────────────────────────────────────────────
create table public.learning_paths (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid references public.organizations(id) on delete cascade,
  title               text not null,
  description         text,
  is_published        boolean not null default false,
  created_by_user_id  uuid references public.profiles(id),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create table public.learning_path_courses (
  id         uuid primary key default gen_random_uuid(),
  path_id    uuid references public.learning_paths(id) on delete cascade,
  course_id  uuid references public.courses(id) on delete cascade,
  position   int not null,
  unique (path_id, course_id)
);

create table public.learning_path_enrollments (
  id           uuid primary key default gen_random_uuid(),
  path_id      uuid references public.learning_paths(id) on delete cascade,
  user_id      uuid references public.profiles(id) on delete cascade,
  org_id       uuid references public.organizations(id) on delete cascade,
  enrolled_at  timestamptz default now(),
  completed_at timestamptz,
  unique (path_id, user_id, org_id)
);

-- ─── Announcements ────────────────────────────────────────────────────────
create table public.org_announcements (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid references public.organizations(id) on delete cascade,
  title               text not null,
  body                text not null,
  is_active           boolean not null default true,
  created_by_user_id  uuid references public.profiles(id),
  created_at          timestamptz default now(),
  expires_at          timestamptz
);

-- ─── RLS ──────────────────────────────────────────────────────────────────
alter table public.org_teams enable row level security;
alter table public.org_team_members enable row level security;
alter table public.learning_paths enable row level security;
alter table public.learning_path_courses enable row level security;
alter table public.learning_path_enrollments enable row level security;
alter table public.org_announcements enable row level security;

-- Teams
create policy "org members read teams"
  on public.org_teams for select
  using (org_id in (select org_id from public.org_members where user_id = auth.uid()));

create policy "org admins manage teams"
  on public.org_teams for all
  using (org_id in (select org_id from public.org_members where user_id = auth.uid() and org_role in ('admin','instructor')));

create policy "org members read team members"
  on public.org_team_members for select
  using (team_id in (select id from public.org_teams where org_id in (
    select org_id from public.org_members where user_id = auth.uid()
  )));

create policy "org admins manage team members"
  on public.org_team_members for all
  using (team_id in (select id from public.org_teams where org_id in (
    select org_id from public.org_members where user_id = auth.uid() and org_role in ('admin','instructor')
  )));

-- Learning paths
create policy "org members read paths"
  on public.learning_paths for select
  using (org_id in (select org_id from public.org_members where user_id = auth.uid()));

create policy "org admins manage paths"
  on public.learning_paths for all
  using (org_id in (select org_id from public.org_members where user_id = auth.uid() and org_role in ('admin','instructor')));

create policy "org members read path courses"
  on public.learning_path_courses for select
  using (path_id in (select id from public.learning_paths where org_id in (
    select org_id from public.org_members where user_id = auth.uid()
  )));

create policy "org admins manage path courses"
  on public.learning_path_courses for all
  using (path_id in (select id from public.learning_paths where org_id in (
    select org_id from public.org_members where user_id = auth.uid() and org_role in ('admin','instructor')
  )));

create policy "learners see own path enrollments"
  on public.learning_path_enrollments for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.org_members
      where org_id = learning_path_enrollments.org_id and user_id = auth.uid() and org_role in ('admin','instructor')
    )
  );

create policy "admins create path enrollments"
  on public.learning_path_enrollments for insert
  with check (exists (
    select 1 from public.org_members
    where org_id = learning_path_enrollments.org_id and user_id = auth.uid() and org_role in ('admin','instructor')
  ));

-- Announcements
create policy "org members read announcements"
  on public.org_announcements for select
  using (org_id in (select org_id from public.org_members where user_id = auth.uid()));

create policy "org admins manage announcements"
  on public.org_announcements for all
  using (org_id in (select org_id from public.org_members where user_id = auth.uid() and org_role in ('admin','instructor')));
