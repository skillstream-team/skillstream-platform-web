update public.teacher_invites
set expires_at = created_at + interval '14 days'
where status = 'pending'
  and expires_at is null;

create or replace function public.admin_create_teacher_invite(
  p_email text,
  p_expires_at timestamptz default null
)
returns table(
  id uuid,
  email text,
  invite_code text,
  status text,
  expires_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  generated_code text;
  effective_expires_at timestamptz;
  created_row public.teacher_invites%rowtype;
begin
  if not app.is_admin() then
    raise exception 'Only admins can create teacher invites';
  end if;

  normalized_email := lower(trim(coalesce(p_email, '')));
  if normalized_email = '' then
    raise exception 'Invite email is required';
  end if;

  if normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Invite email format is invalid';
  end if;

  effective_expires_at := coalesce(p_expires_at, now() + interval '14 days');

  update public.teacher_invites
  set status = 'revoked'
  where lower(email::text) = normalized_email
    and status = 'pending';

  generated_code := upper(substr(md5(random()::text || clock_timestamp()::text || normalized_email), 1, 24));

  insert into public.teacher_invites (email, invite_code, status, expires_at, created_by_user_id)
  values (normalized_email, generated_code, 'pending', effective_expires_at, auth.uid())
  returning * into created_row;

  return query
  select
    created_row.id,
    created_row.email::text,
    created_row.invite_code,
    created_row.status::text,
    created_row.expires_at,
    created_row.created_at;
end;
$$;
