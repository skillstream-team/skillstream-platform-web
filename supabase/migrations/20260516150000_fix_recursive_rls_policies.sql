-- Fix org_members recursive SELECT policy by using a SECURITY DEFINER function
create or replace function app.is_org_admin_or_instructor(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.org_members
    where org_id = target_org_id and user_id = auth.uid() and org_role in ('admin', 'instructor')
  );
$$;

drop policy if exists "org members can read membership" on public.org_members;

create policy "org members can read membership"
  on public.org_members for select
  using (
    user_id = auth.uid()
    or app.is_org_admin_or_instructor(org_id)
  );
