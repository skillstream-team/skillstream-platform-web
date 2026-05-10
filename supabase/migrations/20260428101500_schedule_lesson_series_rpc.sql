create or replace function public.schedule_lesson_series(
  p_class_id uuid,
  p_title text,
  p_first_scheduled_at timestamptz,
  p_duration_minutes integer default 60,
  p_occurrences integer default 1
)
returns table(lesson_id uuid)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_admin boolean := false;
  v_is_teacher boolean := false;
  v_count integer := greatest(1, least(24, coalesce(p_occurrences, 1)));
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select exists (
    select 1
    from public.profiles p
    where p.id = v_user_id
      and p.role = 'admin'
  ) into v_is_admin;

  select exists (
    select 1
    from public.class_members cm
    where cm.class_id = p_class_id
      and cm.user_id = v_user_id
      and cm.member_role = 'teacher'
  ) into v_is_teacher;

  if not v_is_admin and not v_is_teacher then
    raise exception 'Only teachers can schedule this class';
  end if;

  if p_title is null or length(trim(p_title)) = 0 then
    raise exception 'Lesson title is required';
  end if;

  if p_duration_minutes is null or p_duration_minutes <= 0 then
    raise exception 'Duration must be greater than zero';
  end if;

  if p_first_scheduled_at is null or p_first_scheduled_at <= now() then
    raise exception 'Lesson time must be in the future';
  end if;

  return query
  insert into public.lessons (
    class_id,
    title,
    scheduled_at,
    duration_minutes,
    state,
    created_by_user_id
  )
  select
    p_class_id,
    case when v_count > 1 then p_title || ' (Week ' || gs.idx::text || ')' else p_title end,
    p_first_scheduled_at + ((gs.idx - 1) * interval '7 days'),
    p_duration_minutes,
    'scheduled'::public.lesson_state,
    v_user_id
  from generate_series(1, v_count) as gs(idx)
  returning id;
end;
$$;

grant execute on function public.schedule_lesson_series(uuid, text, timestamptz, integer, integer) to authenticated;
