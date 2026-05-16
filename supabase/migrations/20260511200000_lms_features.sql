-- Extended org settings: branding, SSO, reminders
alter table public.organizations
  add column if not exists sso_provider text,
  add column if not exists sso_idp_url text,
  add column if not exists sso_entity_id text,
  add column if not exists sso_certificate text,
  add column if not exists reminders_enabled boolean default false,
  add column if not exists reminder_days_before int default 3;

-- Member custom fields
alter table public.org_members
  add column if not exists job_title text,
  add column if not exists department text;

-- Skills on courses
alter table public.courses
  add column if not exists skills text[] default '{}';

-- Course ratings (one per enrollment, submitted after completion)
create table if not exists public.course_ratings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  enrollment_id uuid references public.course_enrollments(id) on delete cascade unique,
  user_id uuid references public.profiles(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

alter table public.course_ratings enable row level security;

create policy "learners can manage own ratings"
  on public.course_ratings for all
  using (user_id = auth.uid());

create policy "org members can read ratings for their org"
  on public.course_ratings for select
  using (org_id in (
    select org_id from public.org_members where user_id = auth.uid()
  ));
