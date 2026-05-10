revoke execute on function public.request_teacher_invite_code(text) from anon, authenticated;

create or replace function app.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text;
  invite_code_meta text;
  normalized_role public.app_role;
  invite_row record;
begin
  meta_role := lower(coalesce(new.raw_user_meta_data->>'role', 'student'));
  invite_code_meta := coalesce(new.raw_user_meta_data->>'teacher_invite_code', '');

  normalized_role := 'student'::public.app_role;

  if meta_role = 'teacher' then
    if not exists (
      select 1
      from public.teacher_invites ti
      where lower(ti.email::text) = lower(new.email)
        and ti.invite_code = invite_code_meta
        and ti.status = 'pending'
        and (ti.expires_at is null or ti.expires_at > now())
    ) then
      raise exception 'Teacher invite is invalid or expired';
    end if;

    normalized_role := 'teacher'::public.app_role;

    update public.teacher_invites
    set
      status = 'claimed',
      claimed_at = now(),
      claimed_user_id = new.id
    where lower(email::text) = lower(new.email)
      and invite_code = invite_code_meta
      and status = 'pending';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    normalized_role
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      role = excluded.role,
      updated_at = now();

  if normalized_role = 'student' then
    insert into public.student_insights (user_id)
    values (new.id)
    on conflict (user_id) do nothing;

    for invite_row in
      update public.class_student_invites csi
      set
        status = 'accepted',
        accepted_user_id = new.id,
        accepted_at = now()
      where lower(csi.email::text) = lower(new.email)
        and csi.status = 'pending'
      returning csi.class_id
    loop
      insert into public.class_members (class_id, user_id, member_role)
      values (invite_row.class_id, new.id, 'student')
      on conflict (class_id, user_id) do nothing;
    end loop;
  end if;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;
