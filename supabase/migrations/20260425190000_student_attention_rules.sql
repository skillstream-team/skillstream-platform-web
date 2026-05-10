create or replace function app.compute_student_needs_attention(
  p_progress integer,
  p_homework_completion integer,
  p_last_activity_at timestamptz,
  p_created_at timestamptz
)
returns boolean
language plpgsql
stable
as $$
declare
  v_progress integer := greatest(0, least(100, coalesce(p_progress, 0)));
  v_homework integer := greatest(0, least(100, coalesce(p_homework_completion, 0)));
  v_created_at timestamptz := coalesce(p_created_at, now());
  v_is_new_student boolean := v_created_at >= (now() - interval '14 days');
  v_is_inactive boolean := (
    p_last_activity_at is not null
    and p_last_activity_at < (now() - interval '10 days')
  );
  v_has_stale_onboarding boolean := (
    p_last_activity_at is null
    and v_created_at < (now() - interval '14 days')
  );
  v_risk_points integer := 0;
begin
  -- New learners are given a short onboarding window before risk checks.
  if v_is_new_student and p_last_activity_at is null then
    return false;
  end if;

  if v_progress < 65 then
    v_risk_points := v_risk_points + 1;
  end if;
  if v_homework < 65 then
    v_risk_points := v_risk_points + 1;
  end if;
  if v_is_inactive then
    v_risk_points := v_risk_points + 1;
  end if;

  -- Immediate intervention threshold for severe underperformance.
  if v_progress < 40 or v_homework < 40 then
    return true;
  end if;

  -- Stale onboarding + weak academics should prompt follow-up.
  if v_has_stale_onboarding and (v_progress < 70 or v_homework < 70) then
    return true;
  end if;

  -- Standard threshold: at least two risk signals.
  return v_risk_points >= 2;
end;
$$;

create or replace function app.student_insights_apply_attention_rule()
returns trigger
language plpgsql
as $$
begin
  new.needs_attention := app.compute_student_needs_attention(
    new.progress,
    new.homework_completion,
    new.last_activity_at,
    new.created_at
  );
  return new;
end;
$$;

drop trigger if exists student_insights_apply_attention_rule on public.student_insights;
create trigger student_insights_apply_attention_rule
before insert or update on public.student_insights
for each row execute function app.student_insights_apply_attention_rule();

update public.student_insights si
set needs_attention = app.compute_student_needs_attention(
  si.progress,
  si.homework_completion,
  si.last_activity_at,
  si.created_at
);
