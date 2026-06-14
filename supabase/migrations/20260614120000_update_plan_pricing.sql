-- Add student and live-session capacity columns to billing_plans.
-- NULL max_students = unlimited (Academy tier).
ALTER TABLE public.billing_plans
  ADD COLUMN IF NOT EXISTS max_students integer,
  ADD COLUMN IF NOT EXISTS max_live_participants integer NOT NULL DEFAULT 200;

-- Creator: $29, 5 000 minutes, 10% tx fee, 100k AI tokens, 15 students, 5 per session
UPDATE public.billing_plans SET
  monthly_fee_gbp               = 29,
  included_participant_minutes  = 5000,
  one_off_platform_fee_percent  = 10,
  ai_monthly_token_limit        = 100000,
  max_students                  = 15,
  max_live_participants         = 5
WHERE code = 'creator';

-- Studio: $99, 40 000 minutes, 6% tx fee, 600k AI tokens, 100 students, 50 per session
UPDATE public.billing_plans SET
  monthly_fee_gbp               = 99,
  included_participant_minutes  = 40000,
  one_off_platform_fee_percent  = 6,
  ai_monthly_token_limit        = 600000,
  max_students                  = 100,
  max_live_participants         = 50
WHERE code = 'studio';

-- Academy: $249, 150 000 minutes, 5% tx fee, 2.5M AI tokens, unlimited students, 200 per session
UPDATE public.billing_plans SET
  monthly_fee_gbp               = 249,
  included_participant_minutes  = 150000,
  one_off_platform_fee_percent  = 5,
  ai_monthly_token_limit        = 2500000,
  max_students                  = NULL,
  max_live_participants         = 200
WHERE code = 'academy';
