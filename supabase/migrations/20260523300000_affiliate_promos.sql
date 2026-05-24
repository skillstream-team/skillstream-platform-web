-- ─────────────────────────────────────────────────────────────
-- Affiliate codes — one per teacher, auto-generated on insert
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_codes (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_user_id           UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code                      TEXT        NOT NULL UNIQUE,
  discount_percent_referrer NUMERIC(5,2) NOT NULL DEFAULT 10,  -- % off for referring teacher
  discount_percent_referee  NUMERIC(5,2) NOT NULL DEFAULT 15,  -- % off for new teacher's first month
  total_referrals           INT         NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code_id    UUID        NOT NULL REFERENCES public.affiliate_codes(id) ON DELETE CASCADE,
  referred_user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status               TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'rewarded')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referred_user_id)
);

-- ─────────────────────────────────────────────────────────────
-- Promo codes — admin-created discount codes
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code                 TEXT        NOT NULL UNIQUE,
  description          TEXT,
  discount_percent     NUMERIC(5,2) NOT NULL,
  max_uses             INT,
  used_count           INT         NOT NULL DEFAULT 0,
  valid_from           TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until          TIMESTAMPTZ,
  is_active            BOOLEAN     NOT NULL DEFAULT true,
  applies_to           TEXT        NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'creator', 'studio', 'academy')),
  created_by_user_id   UUID        REFERENCES auth.users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.affiliate_codes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes          ENABLE ROW LEVEL SECURITY;

-- Teachers can read their own affiliate code
CREATE POLICY "affiliate_codes_read_own"
  ON public.affiliate_codes FOR SELECT
  USING (auth.uid() = teacher_user_id);

-- Admin can read all
CREATE POLICY "affiliate_codes_read_admin"
  ON public.affiliate_codes FOR SELECT
  USING (app.is_admin());

-- Admin can insert/update affiliate codes
CREATE POLICY "affiliate_codes_write_admin"
  ON public.affiliate_codes FOR ALL
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

-- Teachers can read their own referrals
CREATE POLICY "affiliate_referrals_read_own"
  ON public.affiliate_referrals FOR SELECT
  USING (
    affiliate_code_id IN (
      SELECT id FROM public.affiliate_codes WHERE teacher_user_id = auth.uid()
    )
  );

CREATE POLICY "affiliate_referrals_read_admin"
  ON public.affiliate_referrals FOR SELECT
  USING (app.is_admin());

CREATE POLICY "affiliate_referrals_write_admin"
  ON public.affiliate_referrals FOR ALL
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

-- Promo codes: anyone authenticated can read active codes (for checkout validation)
CREATE POLICY "promo_codes_read_active"
  ON public.promo_codes FOR SELECT
  USING (is_active = true AND auth.role() = 'authenticated');

CREATE POLICY "promo_codes_admin"
  ON public.promo_codes FOR ALL
  USING (app.is_admin())
  WITH CHECK (app.is_admin());
