-- Explicitly grant table access to authenticated and anon roles
grant usage on schema public to anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;

grant select, insert, update, delete on public.org_members to authenticated;
grant select on public.organizations to authenticated;
