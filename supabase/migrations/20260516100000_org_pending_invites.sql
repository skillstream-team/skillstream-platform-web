-- Pending org invites: created when an admin invites an email that has no SkillStream account yet.
-- The on_new_profile_accept_pending_invites trigger auto-accepts them when the user registers.

create table public.org_pending_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  email text not null,
  org_role text not null check (org_role in ('admin', 'instructor', 'learner', 'manager')),
  invited_at timestamptz default now(),
  unique (org_id, email)
);

alter table public.org_pending_invites enable row level security;

create policy "org admins can manage pending invites"
  on public.org_pending_invites for all
  using (exists (
    select 1 from public.org_members
    where org_id = org_pending_invites.org_id
      and user_id = auth.uid()
      and org_role = 'admin'
  ));

-- Auto-accept pending invites when a new profile is created (i.e. user registers)
create or replace function public.accept_pending_org_invites()
returns trigger language plpgsql security definer as $$
begin
  insert into public.org_members (org_id, user_id, org_role)
  select opi.org_id, new.id, opi.org_role
  from public.org_pending_invites opi
  where lower(opi.email) = lower(new.email)
  on conflict (org_id, user_id) do nothing;

  delete from public.org_pending_invites
  where lower(email) = lower(new.email);

  return new;
end;
$$;

create trigger on_new_profile_accept_pending_invites
  after insert on public.profiles
  for each row execute function public.accept_pending_org_invites();
