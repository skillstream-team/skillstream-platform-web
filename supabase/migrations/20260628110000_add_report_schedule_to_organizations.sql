-- Add report scheduling columns to organizations so the OrgReportsPage
-- schedule settings can be persisted to the database.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS report_schedule_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS report_schedule_frequency text NOT NULL DEFAULT 'weekly'
    CHECK (report_schedule_frequency IN ('weekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS report_schedule_email text NOT NULL DEFAULT '';
