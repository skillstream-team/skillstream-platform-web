create or replace function public.request_teacher_invite_code(
  p_email text
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
  existing_row public.teacher_invites%rowtype;
  created_row public.teacher_invites%rowtype;
  generated_code text;
begin
  normalized_email := lower(trim(coalesce(p_email, '')));
  if normalized_email = '' then
    raise exception 'Email is required';
  end if;

  if normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Email format is invalid';
  end if;

  update public.teacher_invites ti
  set status = 'revoked'
  where lower(ti.email::text) = normalized_email
    and ti.status = 'pending'
    and ti.expires_at is not null
    and ti.expires_at < now();

  select ti.*
  into existing_row
  from public.teacher_invites ti
  where lower(ti.email::text) = normalized_email
    and ti.status = 'pending'
    and (ti.expires_at is null or ti.expires_at >= now())
  order by ti.created_at desc
  limit 1;

  if existing_row.id is not null then
    return query
    select
      existing_row.id,
      existing_row.email::text,
      existing_row.invite_code,
      existing_row.status::text,
      existing_row.expires_at,
      existing_row.created_at;
    return;
  end if;

  generated_code := upper(substr(md5(random()::text || clock_timestamp()::text || normalized_email), 1, 24));

  insert into public.teacher_invites (email, invite_code, status, expires_at, created_by_user_id)
  values (normalized_email, generated_code, 'pending', now() + interval '14 days', null)
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

grant execute on function public.request_teacher_invite_code(text) to anon, authenticated;
