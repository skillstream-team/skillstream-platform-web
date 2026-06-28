-- Add 'manager' to the org_members role constraint and a manager_user_id column
-- so team reporting relationships can be persisted.

-- 1. Drop and recreate the check constraint to include 'manager'.
ALTER TABLE public.org_members
  DROP CONSTRAINT IF EXISTS org_members_org_role_check;

ALTER TABLE public.org_members
  ADD CONSTRAINT org_members_org_role_check
  CHECK (org_role IN ('admin', 'instructor', 'learner', 'manager'));

-- 2. Add a nullable manager_user_id column so each member can record who manages them.
ALTER TABLE public.org_members
  ADD COLUMN IF NOT EXISTS manager_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
