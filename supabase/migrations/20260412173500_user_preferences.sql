create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  message_alerts boolean not null default true,
  homework_alerts boolean not null default true,
  weekly_reminder boolean not null default false,
  ai_helper boolean not null default true,
  private_workspace boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'user_preferences_set_updated_at') then
    create trigger user_preferences_set_updated_at before update on public.user_preferences for each row execute function app.set_updated_at();
  end if;
end $$;

alter table public.user_preferences enable row level security;

create policy "user_preferences_read_self_or_admin"
on public.user_preferences for select
using (user_id = auth.uid() or app.is_admin());

create policy "user_preferences_insert_self_or_admin"
on public.user_preferences for insert
with check (user_id = auth.uid() or app.is_admin());

create policy "user_preferences_update_self_or_admin"
on public.user_preferences for update
using (user_id = auth.uid() or app.is_admin())
with check (user_id = auth.uid() or app.is_admin());

create or replace function app.ensure_default_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created_preferences on public.profiles;
create trigger on_profile_created_preferences
  after insert on public.profiles
  for each row execute function app.ensure_default_preferences();
