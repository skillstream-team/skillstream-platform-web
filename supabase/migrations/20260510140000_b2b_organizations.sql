-- B2B LMS: Organizations and members

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  seat_limit int default 50,
  created_at timestamptz default now()
);

create table public.org_members (
  org_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  org_role text not null check (org_role in ('admin', 'instructor', 'learner')),
  joined_at timestamptz default now(),
  primary key (org_id, user_id)
);

alter table public.organizations enable row level security;
alter table public.org_members enable row level security;

create policy "org members can read their org"
  on public.organizations for select
  using (exists (
    select 1 from public.org_members
    where org_id = organizations.id and user_id = auth.uid()
  ));

create policy "org admins can insert orgs"
  on public.organizations for insert
  with check (true);

create policy "org admins can update their org"
  on public.organizations for update
  using (exists (
    select 1 from public.org_members
    where org_id = organizations.id and user_id = auth.uid() and org_role = 'admin'
  ));

create policy "platform admins see all orgs"
  on public.organizations for all
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy "org members can read membership"
  on public.org_members for select
  using (
    user_id = auth.uid()
    or org_id in (
      select org_id from public.org_members where user_id = auth.uid() and org_role in ('admin', 'instructor')
    )
  );

create policy "org admins can manage members"
  on public.org_members for insert
  with check (exists (
    select 1 from public.org_members m
    where m.org_id = org_members.org_id and m.user_id = auth.uid() and m.org_role = 'admin'
  ));

create policy "org admins can remove members"
  on public.org_members for delete
  using (exists (
    select 1 from public.org_members m
    where m.org_id = org_members.org_id and m.user_id = auth.uid() and m.org_role = 'admin'
  ));

create policy "platform admins see all members"
  on public.org_members for all
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));
