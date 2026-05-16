-- Enable pg_cron and pg_net extensions (must be enabled in Supabase dashboard first)
-- pg_cron: https://supabase.com/docs/guides/database/extensions/pg_cron
-- pg_net:  https://supabase.com/docs/guides/database/extensions/pg_net

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Schedule ops-cron edge function: runs daily at 02:00 UTC
-- Handles expired invites cleanup, inactive session pruning, etc.
select cron.schedule(
  'ops-cron-daily',
  '0 2 * * *',
  $$
  select net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/ops-cron',
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'Authorization',  'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body    := '{}'::jsonb
  )
  $$
);

-- Schedule send-report edge function: runs every Monday at 07:00 UTC
-- Sends weekly completion summary emails to org admins
select cron.schedule(
  'send-report-weekly',
  '0 7 * * 1',
  $$
  select net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/send-report',
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'Authorization',  'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body    := '{}'::jsonb
  )
  $$
);
