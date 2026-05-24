-- Token limits per plan
ALTER TABLE public.billing_plans
  ADD COLUMN IF NOT EXISTS ai_monthly_token_limit integer NOT NULL DEFAULT 0;

UPDATE public.billing_plans SET ai_monthly_token_limit = 150000 WHERE code = 'creator';
UPDATE public.billing_plans SET ai_monthly_token_limit = 600000 WHERE code = 'studio';
UPDATE public.billing_plans SET ai_monthly_token_limit = 2500000 WHERE code = 'academy';

-- Usage tracking
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature text NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_usage_logs_read_own_or_admin" ON public.ai_usage_logs FOR SELECT
  USING (user_id = auth.uid() OR app.is_admin());

-- Session recaps stored on lessons
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS ai_recap text;
