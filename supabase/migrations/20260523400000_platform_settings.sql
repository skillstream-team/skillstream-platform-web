-- Platform-wide key/value settings controlled by admins.
-- Initial use: platformCurrency (ISO 4217 code, e.g. 'USD').
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the default currency as USD
INSERT INTO public.platform_settings (key, value)
VALUES ('platformCurrency', 'USD')
ON CONFLICT (key) DO NOTHING;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_platform_settings()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_platform_settings();

-- RLS: everyone can read (currency display is public), only admins can write
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_settings: public read"
  ON public.platform_settings FOR SELECT USING (true);

CREATE POLICY "platform_settings: admin write"
  ON public.platform_settings FOR ALL USING (app.is_admin());
