create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  channel public.admin_broadcast_channel not null default 'in_app',
  is_read boolean not null default false,
  read_at timestamptz,
  broadcast_id uuid references public.admin_broadcasts(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_notifications_user_created_at
on public.user_notifications (user_id, created_at desc);

alter table public.user_notifications enable row level security;

drop policy if exists "user_notifications_read_own_or_admin" on public.user_notifications;
create policy "user_notifications_read_own_or_admin"
on public.user_notifications for select
using (user_id = auth.uid() or app.is_admin());

drop policy if exists "user_notifications_update_own_or_admin" on public.user_notifications;
create policy "user_notifications_update_own_or_admin"
on public.user_notifications for update
using (user_id = auth.uid() or app.is_admin())
with check (user_id = auth.uid() or app.is_admin());

drop policy if exists "user_notifications_insert_admin_only" on public.user_notifications;
create policy "user_notifications_insert_admin_only"
on public.user_notifications for insert
with check (app.is_admin());

create or replace function public.admin_dispatch_broadcast(
  p_channel public.admin_broadcast_channel,
  p_audience public.admin_broadcast_audience,
  p_subject text,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_broadcast_id uuid;
  v_admin_id uuid := auth.uid();
begin
  if not app.is_admin() then
    raise exception 'Only admins can dispatch broadcasts';
  end if;

  if p_subject is null or length(trim(p_subject)) = 0 then
    raise exception 'Subject is required';
  end if;
  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'Message body is required';
  end if;

  insert into public.admin_broadcasts (
    channel,
    audience,
    subject,
    body,
    status,
    sent_by_user_id
  )
  values (
    p_channel,
    p_audience,
    trim(p_subject),
    trim(p_body),
    'sent',
    v_admin_id
  )
  returning id into v_broadcast_id;

  if p_channel = 'in_app' then
    insert into public.user_notifications (user_id, title, body, channel, broadcast_id)
    select
      p.id,
      trim(p_subject),
      trim(p_body),
      p_channel,
      v_broadcast_id
    from public.profiles p
    where
      (p_audience = 'all' and p.role in ('teacher', 'student'))
      or (p_audience = 'teachers' and p.role = 'teacher')
      or (p_audience = 'students' and p.role = 'student');
  end if;

  insert into public.admin_audit_events (actor_user_id, actor_display_name, action, target)
  values (
    v_admin_id,
    coalesce((select full_name from public.profiles where id = v_admin_id), 'Admin'),
    'Sent broadcast',
    trim(p_subject)
  );

  return v_broadcast_id;
end;
$$;

grant execute on function public.admin_dispatch_broadcast(public.admin_broadcast_channel, public.admin_broadcast_audience, text, text)
to authenticated;

