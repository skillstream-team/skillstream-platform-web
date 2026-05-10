-- Admin data hardening: constraints, transition guards, and pagination-friendly indexes.

alter table public.admin_reports
  add constraint admin_reports_name_not_blank check (length(trim(name)) > 0);

alter table public.admin_broadcasts
  add constraint admin_broadcasts_subject_not_blank check (length(trim(subject)) > 0),
  add constraint admin_broadcasts_body_not_blank check (length(trim(body)) > 0);

create or replace function app.enforce_admin_alert_transition()
returns trigger
language plpgsql
as $$
begin
  -- Disallow reopening resolved alerts via direct update.
  if old.status = 'resolved' and new.status = 'open' then
    raise exception 'Resolved alerts cannot be reopened directly';
  end if;

  if new.status = 'resolved' and new.resolved_at is null then
    new.resolved_at := now();
  end if;

  if new.status = 'open' then
    new.resolved_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists admin_alerts_transition_guard on public.admin_alerts;
create trigger admin_alerts_transition_guard
  before update on public.admin_alerts
  for each row execute function app.enforce_admin_alert_transition();

create index if not exists idx_admin_reports_generated_at on public.admin_reports (generated_at desc);
create index if not exists idx_admin_broadcasts_sent_at on public.admin_broadcasts (sent_at desc);
create index if not exists idx_admin_alerts_created_at on public.admin_alerts (created_at desc);
create index if not exists idx_admin_audit_events_created_at on public.admin_audit_events (created_at desc);
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_class_members_user_role on public.class_members (user_id, member_role);
