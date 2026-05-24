-- Dodo Payments IDs on subscriptions
ALTER TABLE public.teacher_subscriptions
  ADD COLUMN IF NOT EXISTS dodo_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS dodo_customer_id TEXT;

-- Dodo IDs on one-off lesson purchases
ALTER TABLE public.lesson_live_purchases
  ADD COLUMN IF NOT EXISTS dodo_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS dodo_checkout_id TEXT;

-- Reusable Dodo customer ID per profile
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dodo_customer_id TEXT;
